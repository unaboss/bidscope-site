import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, signup } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { SERVICE_LABELS } from '@/lib/service-lines'
import { cn } from '@/lib/utils'

const PROVINCES: readonly string[] = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

/** Selectable service lines; `OT` ("Other") is not a real specialisation. */
const SERVICE_LINE_CODES: readonly string[] = Object.keys(SERVICE_LABELS).filter((code) => code !== 'OT')

type Step = 'contact' | 'company' | 'result'

interface SignupSummary
{
    readonly qualified: number
    readonly total: number
    readonly trialEndsAt?: string
    readonly activationSent?: boolean
}

const CONTACT = { name: '', email: '', phone: '', password: '' }
const COMPANY = { companyName: '', serviceLines: [] as string[], provinces: [] as string[] }

function toggle(list: readonly string[], value: string): string[]
{
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
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
    const [company, setCompany] = useState({ ...COMPANY })
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [summary, setSummary] = useState<SignupSummary | null>(null)

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
        if (company.companyName.trim().length < 2) {
            setError('Please enter your company name.')
            return
        }

        if (company.serviceLines.length === 0) {
            setError('Choose at least one service line.')
            return
        }

        setError('')
        setSubmitting(true)

        try {
            const result = await signup({
                name: contact.name.trim(),
                email: contact.email.trim(),
                phone: contact.phone.trim(),
                password: contact.password,
                companyName: company.companyName.trim(),
                serviceLines: company.serviceLines,
                provinces: company.provinces,
                cidbGrades: {},
            })

            setSummary(result)
            setStep('result')
        } catch (caught) {
            if (caught instanceof ApiError && caught.status === 409) {
                setError('That email is already registered. If it is yours, contact support@northtech.africa.')
            } else if (caught instanceof ApiError && caught.status === 400) {
                setError('Please check your details and try again.')
            } else {
                setError('Something went wrong. Please try again in a moment.')
            }
        } finally {
            setSubmitting(false)
        }
    }

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
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50">
                    Free trial · step {step === 'contact' ? '1' : step === 'company' ? '2' : '3'} of 3
                </p>

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
                        <p className="mt-2 text-sm text-ink/60">This drives which tenders we surface for you.</p>

                        <div className="mt-8 flex flex-col gap-6">
                            <Field label="Company name" htmlFor="companyName" required>
                                <Input id="companyName" value={company.companyName} onChange={(event) => setCompany({ ...company, companyName: event.target.value })} autoComplete="organization" />
                            </Field>

                            <ChipGroup
                                label="Service lines"
                                options={SERVICE_LINE_CODES.map((code) => ({ value: code, text: SERVICE_LABELS[code] ?? code }))}
                                selected={company.serviceLines}
                                onToggle={(value) => setCompany({ ...company, serviceLines: toggle(company.serviceLines, value) })}
                            />

                            <ChipGroup
                                label="Provinces (leave empty for nationwide)"
                                options={PROVINCES.map((province) => ({ value: province, text: province }))}
                                selected={company.provinces}
                                onToggle={(value) => setCompany({ ...company, provinces: toggle(company.provinces, value) })}
                            />
                        </div>
                    </section>
                )}

                {step === 'result' && summary !== null && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">
                            You qualify for {summary.qualified} live {summary.qualified === 1 ? 'tender' : 'tenders'}.
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/60">
                            Out of {summary.total} currently open across our sources, matched to
                            your service lines and provinces.
                        </p>
                        <p className="mt-6 rounded-lg border border-line bg-panel px-4 py-3 text-sm leading-relaxed">
                            {summary.activationSent === false
                                ? 'We could not send your activation email. Please try again shortly, or contact support@northtech.africa.'
                                : <>We&rsquo;ve emailed an activation link to <strong>{contact.email}</strong>. Open it to verify your email and set your password, then sign in.</>}
                        </p>
                        {summary.trialEndsAt !== undefined && (
                            <p className="mt-3 text-sm text-ink/60">
                                Your free trial runs until <strong>{summary.trialEndsAt}</strong>. R0 today.
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
