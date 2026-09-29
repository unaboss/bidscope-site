import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, getCategories, previewRelevance, signup } from '@/api'
import { CategoryPicker } from '@/components/onboarding/category-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { Taxonomy } from '@/types'

const PROVINCES: readonly string[] = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

/** CIDB classes shown when a construction/electrical category is selected. */
const CIDB_CLASSES: ReadonlyArray<{ readonly code: string, readonly label: string }> = [
    { code: 'GB', label: 'GB — General building' },
    { code: 'CE', label: 'CE — Civil engineering' },
    { code: 'SQ', label: 'SQ — Specialist (non-structural)' },
    { code: 'ME', label: 'ME — Mechanical' },
    { code: 'EP', label: 'EP — Electrical (engineering)' },
    { code: 'EB', label: 'EB — Electrical (building)' },
    { code: 'SO', label: 'SO — Specialist (structural)' },
    { code: 'SF', label: 'SF — Specialist (functional)' },
    { code: 'SK', label: 'SK — Specialist (trade)' },
]

const CONSTRUCTION_BUCKETS = new Set(['CW', 'EE'])

const FIRST_MONTH_DISCOUNT = 0.8

type Step = 'contact' | 'company' | 'offer' | 'result'

interface SignupSummary
{
    readonly qualified: number
    readonly total: number
    readonly trialEndsAt?: string
    readonly activationSent?: boolean
}

interface CompanyState
{
    companyName: string
    categories: string[]
    cidbGrades: Record<string, string>
    provinces: string[]
}

const CONTACT = { name: '', email: '', phone: '', password: '' }
const COMPANY: CompanyState = { companyName: '', categories: [], cidbGrades: {}, provinces: [] }

function toggle(list: readonly string[], value: string): string[]
{
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/** Rands per month for a province count (0 = nationwide → all provinces). */
function priceForProvinces(count: number): number
{
    if (count === 1)
    {
        return 399
    }

    if (count >= 2 && count <= 4)
    {
        return 599
    }

    return 799
}

/** Converts the string grade inputs into the numeric record the API expects. */
function parseCidbGrades(input: Record<string, string>): Record<string, number>
{
    const grades: Record<string, number> = {}

    for (const [code, value] of Object.entries(input))
    {
        const grade = Number(value)

        if (value.trim() !== '' && Number.isFinite(grade) && grade >= 0) {
            grades[code] = Math.trunc(grade)
        }
    }

    return grades
}

/** A labelled set of toggle chips backed by a string[] value. */
function ChipGroup(props: {
    readonly label: string
    readonly options: ReadonlyArray<{ readonly value: string, readonly text: string }>
    readonly selected: readonly string[]
    readonly onToggle: (value: string) => void
})
{
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">{props.label}</legend>
            <div className="flex flex-wrap gap-2">
                {props.options.map((option) => {
                    const active = props.selected.includes(option.value)

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => props.onToggle(option.value)}
                            className={cn(
                                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                                active
                                    ? 'border-navy bg-navy text-cream'
                                    : 'border-line bg-panel text-ink/70 hover:bg-ink/5',
                            )}
                        >
                            {option.text}
                        </button>
                    )
                })}
            </div>
        </fieldset>
    )
}

export function JoinPage()
{
    const [step, setStep] = useState<Step>('contact')
    const [contact, setContact] = useState({ ...CONTACT })
    const [company, setCompany] = useState<CompanyState>({ ...COMPANY })
    const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null)
    const [preview, setPreview] = useState<{ readonly qualified: number, readonly total: number } | null>(null)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [summary, setSummary] = useState<SignupSummary | null>(null)

    useEffect(() =>
    {
        const controller = new AbortController()

        getCategories(controller.signal).then(setTaxonomy).catch(() => undefined)

        return () => controller.abort()
    }, [])

    const showCidb = useMemo(() =>
    {
        const buckets = new Set<string>()

        for (const label of company.categories)
        {
            const category = taxonomy?.categories.find((entry) => entry.label === label)

            if (category !== undefined)
            {
                buckets.add(category.bucket)
            }
        }

        return [...buckets].some((bucket) => CONSTRUCTION_BUCKETS.has(bucket))
    }, [company.categories, taxonomy])

    function submitContact(): void
    {
        if (contact.name.trim().length < 2) {
            setError('Please enter your name.')
        } else if (!contact.email.includes('@')) {
            setError('Please enter a valid email address.')
        } else if (contact.password.length < 10) {
            setError('Choose a password of at least 10 characters.')
        } else {
            setError('')
            setStep('company')
        }
    }

    async function submitCompany(): Promise<void>
    {
        if (company.companyName.trim().length < 2)
        {
            setError('Please enter your company name.')
            return
        }

        if (company.categories.length === 0)
        {
            setError('Choose at least one category.')
            return
        }

        setError('')
        setSubmitting(true)

        try
        {
            const result = await previewRelevance({
                serviceLines: [],
                categories: company.categories,
                provinces: company.provinces,
            })

            setPreview(result)
            setStep('offer')
        }
        catch
        {
            setError('Could not check your tenders just now. Please try again.')
        }
        finally
        {
            setSubmitting(false)
        }
    }

    async function submitOffer(): Promise<void>
    {
        setError('')
        setSubmitting(true)

        try
        {
            const result = await signup({
                name: contact.name.trim(),
                email: contact.email.trim(),
                phone: contact.phone.trim(),
                password: contact.password,
                companyName: company.companyName.trim(),
                serviceLines: [],
                categories: company.categories,
                provinces: company.provinces,
                cidbGrades: parseCidbGrades(company.cidbGrades),
            })

            setSummary(result)
            setStep('result')
        }
        catch (caught)
        {
            if (caught instanceof ApiError && caught.status === 409) {
                setError('That email is already registered. If it is yours, contact support@northtech.africa.')
            } else if (caught instanceof ApiError && caught.status === 400) {
                setError('Please check your details and try again.')
            } else {
                setError('Something went wrong. Please try again in a moment.')
            }
        }
        finally
        {
            setSubmitting(false)
        }
    }

    const price = priceForProvinces(company.provinces.length)
    const firstMonth = (price * FIRST_MONTH_DISCOUNT).toFixed(2)
    const provinceScope = company.provinces.length === 0
        ? 'nationwide'
        : `${company.provinces.length} province${company.provinces.length === 1 ? '' : 's'}`

    return (
        <div className="min-h-dvh bg-cream text-ink">
            <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
                <Link to="/" className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">
                    North Tech
                </Link>
                <a href="/login" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 hover:text-ink">
                    Sign in
                </a>
            </header>

            <main className="mx-auto max-w-xl px-6 pb-24">
                {step !== 'result' && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50">
                        Free trial · step {step === 'contact' ? '1' : step === 'company' ? '2' : '3'} of 3
                    </p>
                )}

                {step === 'contact' && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">Your contact details</h1>
                        <p className="mt-2 text-sm text-ink/60">We use these to set up your account and send trial updates.</p>

                        <div className="mt-8 flex flex-col gap-4">
                            <Field label="Full name" htmlFor="name" required>
                                <Input id="name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} autoComplete="name" />
                            </Field>
                            <Field label="Email" htmlFor="email" required>
                                <Input id="email" type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} autoComplete="email" />
                            </Field>
                            <Field label="Phone" htmlFor="phone" hint="Optional.">
                                <Input id="phone" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} autoComplete="tel" />
                            </Field>
                            <Field label="Password" htmlFor="password" required hint="At least 10 characters.">
                                <Input id="password" type="password" value={contact.password} onChange={(event) => setContact({ ...contact, password: event.target.value })} autoComplete="new-password" />
                            </Field>
                        </div>
                    </section>
                )}

                {step === 'company' && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">Your company</h1>
                        <p className="mt-2 text-sm text-ink/60">Pick the kinds of work you do — this drives which tenders we surface.</p>

                        <div className="mt-8 flex flex-col gap-6">
                            <Field label="Company name" htmlFor="companyName" required>
                                <Input id="companyName" value={company.companyName} onChange={(event) => setCompany({ ...company, companyName: event.target.value })} autoComplete="organization" />
                            </Field>

                            <CategoryPicker
                                taxonomy={taxonomy}
                                value={company.categories}
                                onChange={(categories) => setCompany({ ...company, categories })}
                            />

                            {showCidb && (
                                <fieldset className="flex flex-col gap-3">
                                    <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">CIDB grades (optional)</legend>
                                    <p className="text-xs text-ink/50">Add your grade per class — it sharpens the contract-value estimates for building and civil work.</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {CIDB_CLASSES.map((entry) => (
                                            <Field key={entry.code} label={entry.label} htmlFor={`cidb-${entry.code}`}>
                                                <Input
                                                    id={`cidb-${entry.code}`}
                                                    type="number"
                                                    min={0}
                                                    max={9}
                                                    value={company.cidbGrades[entry.code] ?? ''}
                                                    onChange={(event) => setCompany({ ...company, cidbGrades: { ...company.cidbGrades, [entry.code]: event.target.value } })}
                                                />
                                            </Field>
                                        ))}
                                    </div>
                                </fieldset>
                            )}

                            <ChipGroup
                                label="Provinces (leave empty for nationwide)"
                                options={PROVINCES.map((province) => ({ value: province, text: province }))}
                                selected={company.provinces}
                                onToggle={(value) => setCompany({ ...company, provinces: toggle(company.provinces, value) })}
                            />
                        </div>
                    </section>
                )}

                {step === 'offer' && preview !== null && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">
                            You qualify for {preview.qualified} live {preview.qualified === 1 ? 'tender' : 'tenders'}.
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/60">
                            Out of {preview.total} open right now across our sources, matched to your categories and provinces.
                        </p>

                        <div className="mt-8 rounded-xl border border-line bg-panel p-5 shadow-panel">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Your offer</p>
                            <p className="mt-2 text-2xl font-semibold">
                                R{firstMonth}<span className="text-base font-normal text-ink/50"> for your first month</span>
                            </p>
                            <p className="mt-1 text-sm text-ink/60">
                                Then R{price}/month ({provinceScope}). <strong>20% off</strong> your first month is applied automatically.
                            </p>
                            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink/70">
                                <li>· 7 days free — no card needed today</li>
                                <li>· Every new tender matched to your work, emailed</li>
                                <li>· Cancel anytime during the trial</li>
                            </ul>
                        </div>
                    </section>
                )}

                {step === 'result' && summary !== null && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">You&rsquo;re in — check your email.</h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/60">
                            Your trial has {summary.qualified} matched tenders waiting.
                        </p>
                        <p className="mt-6 rounded-lg border border-line bg-panel px-4 py-3 text-sm leading-relaxed">
                            {summary.activationSent === false
                                ? 'We could not send your activation email. Please try again shortly, or contact support@northtech.africa.'
                                : <>We&rsquo;ve emailed an activation link to <strong>{contact.email}</strong>. Open it to verify your email and set your password, then sign in.</>}
                        </p>
                        {summary.trialEndsAt !== undefined && (
                            <p className="mt-3 text-sm text-ink/60">
                                Your free trial runs until <strong>{summary.trialEndsAt}</strong>. R0 today, then 20% off your first month.
                            </p>
                        )}
                    </section>
                )}

                {error !== '' && (
                    <p role="alert" className="mt-6 text-sm text-wax">{error}</p>
                )}

                <div className="mt-8 flex items-center gap-3">
                    {step === 'contact' && <Button onClick={submitContact}>Continue</Button>}
                    {step === 'company' && (
                        <>
                            <Button variant="secondary" onClick={() => setStep('contact')}>Back</Button>
                            <Button onClick={() => void submitCompany()} disabled={submitting}>
                                {submitting ? 'Checking…' : 'See my tenders'}
                            </Button>
                        </>
                    )}
                    {step === 'offer' && preview !== null && (
                        <>
                            <Button variant="secondary" onClick={() => setStep('company')}>Back</Button>
                            <Button onClick={() => void submitOffer()} disabled={submitting}>
                                {submitting ? 'Setting up…' : 'Start my free week'}
                            </Button>
                        </>
                    )}
                    {step === 'result' && summary !== null && (
                        <a
                            href="/login"
                            className="inline-flex h-10 items-center justify-center rounded-md bg-navy px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cream transition-colors hover:bg-navy/90"
                        >
                            Go to sign in
                        </a>
                    )}
                </div>
            </main>
        </div>
    )
}
