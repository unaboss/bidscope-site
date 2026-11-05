import { AuthLayout } from '@/features/auth/components/auth-layout'
import { AuthField } from '@/features/auth/components/auth-field'
import {
    UserIcon,
    EnvelopeSimpleIcon,
    LockKeyIcon,
    PhoneIcon,
    ArrowRightIcon,
    BuildingsIcon,
    CertificateIcon,
    FileTextIcon,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, getCategories, previewRelevance, signup } from '@/shared/api'
import { AuthMultiSelect } from '@/features/auth/components/auth-multi-select'
import { CsdUpload } from '@/features/profile/components/csd-upload'
import { Button } from '@/shared/ui/button'
import { CIDB_CLASSES, CONSTRUCTION_BUCKETS, parseCidbGrades, PROVINCES } from '@/features/profile/profile'
import { MAX_PROVINCES, monthlyTotalCents, TIER_NAMES, tierForProvinces } from '@/features/billing/pricing'
import type { Taxonomy } from '@/shared/types'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'

type Step = 'contact' | 'company' | 'offer' | 'result'

interface SignupSummary {
    readonly qualified: number
    readonly total: number
    readonly trialEndsAt?: string
    readonly activationSent?: boolean
}

interface CompanyState {
    companyName: string
    categories: string[]
    cidbGrades: Record<string, string>
    provinces: string[]
}

const CONTACT = { firstName: '', lastName: '', email: '', phone: '', password: '' }
const COMPANY: CompanyState = { companyName: '', categories: [], cidbGrades: {}, provinces: [] }

/** Rands per month for a province count (0 = nationwide → all provinces). */
export function JoinPage() {
    const [params] = useSearchParams()
    const requested = params.get('tier')
    const selectedTier = requested === 'single' || requested === 'mid' || requested === 'all' ? requested : undefined
    const [step, setStep] = useState<Step>('contact')
    const [contact, setContact] = useState({ ...CONTACT })
    const [confirmPassword, setConfirmPassword] = useState('')
    const [company, setCompany] = useState<CompanyState>({ ...COMPANY })
    const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null)
    const [preview, setPreview] = useState<{ readonly qualified: number; readonly total: number } | null>(null)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [summary, setSummary] = useState<SignupSummary | null>(null)
    const navigate = useNavigate()
    const previousStep = useRef(step)
    const stepOrder = ['contact', 'company', 'offer', 'result']
    const direction = useMemo(() => stepOrder.indexOf(step) >= stepOrder.indexOf(previousStep.current) ? 1 : -1, [step])
    const contentRef = useSubtleReveal<HTMLElement>(step, { duration: 0.3, x: 16 * direction })

    useEffect(() => {
        if (previousStep.current === step) return
        previousStep.current = step
        const heading = contentRef.current?.querySelector('h1')
        if (heading) {
            heading.tabIndex = -1
            heading.focus()
        }
    }, [step])

    useEffect(() => {
        const controller = new AbortController()

        getCategories(controller.signal)
            .then(setTaxonomy)
            .catch(() => undefined)

        return () => controller.abort()
    }, [])

    const showCidb = useMemo(() => {
        const buckets = new Set<string>()

        for (const label of company.categories) {
            const category = taxonomy?.categories.find((entry) => entry.label === label)

            if (category !== undefined) {
                buckets.add(category.bucket)
            }
        }

        return [...buckets].some((bucket) => CONSTRUCTION_BUCKETS.has(bucket))
    }, [company.categories, taxonomy])

    function submitContact(): void {
        if ([contact.firstName.trim(), contact.lastName.trim()].filter(Boolean).join(' ').length < 2) {
            setError('Please enter your name.')
        } else if (!contact.email.includes('@')) {
            setError('Please enter a valid email address.')
        } else if (contact.password.length < 10) {
            setError('Choose a password of at least 10 characters.')
        } else if (contact.password !== confirmPassword) {
            setError('Your passwords do not match.')
        } else {
            setError('')
            setStep('company')
        }
    }

    async function submitCompany(): Promise<void> {
        if (selectedTier && selectedTier !== 'all' && (company.provinces.length === 0 || company.provinces.length > MAX_PROVINCES[selectedTier])) {
            setError(`Choose 1 to ${MAX_PROVINCES[selectedTier]} provinces for ${TIER_NAMES[selectedTier]}, or go back to choose another plan.`)
            return
        }
        if (company.companyName.trim().length < 2) {
            setError('Please enter your company name.')
            return
        }

        if (company.categories.length === 0) {
            setError('Choose at least one category.')
            return
        }

        setError('')
        setSubmitting(true)

        try {
            const result = await previewRelevance({
                serviceLines: [],
                categories: company.categories,
                provinces: company.provinces,
            })

            setPreview(result)
            setStep('offer')
        } catch {
            setError('Could not check your tenders just now. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    async function submitOffer(pay: boolean): Promise<void> {
        setError('')
        setSubmitting(true)

        try {
            const result = await signup({
                name: [contact.firstName.trim(), contact.lastName.trim()].filter(Boolean).join(' '),
                email: contact.email.trim(),
                phone: contact.phone.trim(),
                password: contact.password,
                companyName: company.companyName.trim(),
                serviceLines: [],
                categories: company.categories,
                provinces: company.provinces,
                cidbGrades: parseCidbGrades(company.cidbGrades),
            })

            if (pay && result.checkoutToken !== undefined) {
                navigate(`/checkout?token=${encodeURIComponent(result.checkoutToken)}&tier=${tier}`)
                return
            }

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

    const tier = selectedTier ?? tierForProvinces(company.provinces.length)
    const price = monthlyTotalCents(tier, company.provinces.length) / 100
    const provinceScope =
        company.provinces.length === 0
            ? 'nationwide'
            : `${company.provinces.length} province${company.provinces.length === 1 ? '' : 's'}`

    return (
        <AuthLayout businessStep={step === 'company'}>
            <main className="join-content" ref={contentRef} aria-busy={submitting}>
                {step !== 'result' && (
                    <p className="auth-progress">
                        Step {step === 'contact' ? '1' : step === 'company' ? '2' : '3'} of 3
                    </p>
                )}

                {step === 'contact' && (
                    <form
                        id="signup-contact"
                        onSubmit={(event) => {
                            event.preventDefault()
                            submitContact()
                        }}
                    >
                        <h1>Create your account</h1>
                        {selectedTier && <p className="auth-description">{TIER_NAMES[selectedTier]} selected. <a href={'/start?tier=' + selectedTier}>Change plan</a></p>}
                        <p className="auth-description">
                            Register in three steps: create your account, add your business details, then review your
                            plan.
                        </p>
                        <div className="auth-fields">
                            <div className="auth-name-row">
                                <AuthField
                                    label="First name"
                                    icon={UserIcon}
                                    id="first-name"
                                    error={error === 'Please enter your name.' ? error : undefined}
                                    required
                                    value={contact.firstName}
                                    onChange={(event) => setContact({ ...contact, firstName: event.target.value })}
                                    autoComplete="given-name"
                                />
                                <AuthField
                                    label="Last name (optional)"
                                    placeholder="Last name"
                                    icon={UserIcon}
                                    id="last-name"
                                    value={contact.lastName}
                                    onChange={(event) => setContact({ ...contact, lastName: event.target.value })}
                                    autoComplete="family-name"
                                />
                            </div>
                            <AuthField
                                label="Email address"
                                icon={EnvelopeSimpleIcon}
                                id="email"
                                error={error === 'Please enter a valid email address.' ? error : undefined}
                                type="email"
                                required
                                value={contact.email}
                                onChange={(event) => setContact({ ...contact, email: event.target.value })}
                                autoComplete="email"
                            />
                            <AuthField
                                label="Password"
                                icon={LockKeyIcon}
                                id="password"
                                hint="At least 10 characters. Make it unique to this account."
                                error={error === 'Choose a password of at least 10 characters.' ? error : undefined}
                                type="password"
                                minLength={10}
                                required
                                value={contact.password}
                                onChange={(event) => setContact({ ...contact, password: event.target.value })}
                                autoComplete="new-password"
                            />
                            <AuthField
                                label="Confirm password"
                                icon={LockKeyIcon}
                                id="confirm-password"
                                error={error === 'Your passwords do not match.' ? error : undefined}
                                type="password"
                                minLength={10}
                                required
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                            />
                            <AuthField
                                label="Phone (optional)"
                                icon={PhoneIcon}
                                id="phone"
                                type="tel"
                                value={contact.phone}
                                onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                                autoComplete="tel"
                            />
                        </div>
                    </form>
                )}

                {step === 'company' && (
                    <section className="auth-business-form">
                        <h1>Tell us about your business</h1>
                        <p className="auth-description">A few details help us find the right tenders for you.</p>

                        <div className="auth-business-fields">
                            <div className="auth-csd-card">
                                <span className="auth-csd-icon">
                                    <FileTextIcon size={30} />
                                </span>
                                <div className="auth-csd-copy">
                                    <h2>Have a CSD report?</h2>
                                    <p>Upload it to fill in your company details automatically.</p>
                                </div>
                                <CsdUpload
                                    compact
                                    taxonomy={taxonomy}
                                    note="Your CSD and tax status are saved when you upload this report on your Profile page after signing in."
                                    onApply={(applied) => {
                                        setError('')
                                        setCompany({
                                            ...company,
                                            companyName: applied.report.legalName,
                                            categories: [...new Set([...company.categories, ...applied.categories])],
                                        })
                                    }}
                                />
                            </div>

                            <div className="auth-manual-divider">
                                <span>or enter manually</span>
                            </div>
                            <AuthField
                                label="Company name"
                                placeholder="e.g. Mthetho Construction (Pty) Ltd"
                                icon={BuildingsIcon}
                                required
                                id="companyName"
                                error={error === 'Please enter your company name.' ? error : undefined}
                                value={company.companyName}
                                onChange={(event) => {
                                    setError('')
                                    setCompany({ ...company, companyName: event.target.value })
                                }}
                                autoComplete="organization"
                            />

                            <div className="auth-business-selects">
                                <AuthMultiSelect
                                    label="Business categories"
                                    required
                                    options={taxonomy?.categories.map((category) => category.label) ?? []}
                                    value={company.categories}
                                    disabled={taxonomy === null}
                                    placeholder={taxonomy === null ? 'Loading categories…' : 'Select categories'}
                                    onChange={(categories) => {
                                        setError('')
                                        setCompany({ ...company, categories })
                                    }}
                                />
                                <AuthMultiSelect
                                    label="Operating provinces"
                                    options={PROVINCES}
                                    value={company.provinces}
                                    placeholder="All provinces"
                                    hint="Leave empty for nationwide coverage."
                                    onChange={(provinces) => {
                                        setError('')
                                        setCompany({ ...company, provinces })
                                    }}
                                />
                            </div>
                            {taxonomy === null && (
                                <p className="auth-field-hint" role="status">
                                    Categories are loading. If they don’t appear, refresh to try again.
                                </p>
                            )}

                            {showCidb && (
                                <fieldset className="flex flex-col gap-3">
                                    <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                                        CIDB grades (optional)
                                    </legend>
                                    <p className="text-xs text-ink/50">
                                        Add your grade per class — it sharpens the contract-value estimates for building
                                        and civil work.
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {CIDB_CLASSES.map((entry) => (
                                            <AuthField
                                                key={entry.code}
                                                label={entry.label}
                                                icon={CertificateIcon}
                                                id={`cidb-${entry.code}`}
                                                type="number"
                                                min={0}
                                                max={9}
                                                value={company.cidbGrades[entry.code] ?? ''}
                                                onChange={(event) =>
                                                    setCompany({
                                                        ...company,
                                                        cidbGrades: {
                                                            ...company.cidbGrades,
                                                            [entry.code]: event.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    </section>
                )}

                {step === 'offer' && preview !== null && (
                    <section className="mt-6">
                        <h1 className="text-3xl font-semibold">
                            You qualify for {preview.qualified} live {preview.qualified === 1 ? 'tender' : 'tenders'}.
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-ink/60">
                            Out of {preview.total} open right now across our sources, matched to your categories and
                            provinces.
                        </p>

                        <div className="mt-8 rounded-xl border border-line bg-panel p-5 shadow-panel">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Your offer</p>
                            <p className="mt-2 text-2xl font-semibold">
                                R{price}
                                <span className="text-base font-normal text-ink/50">/month</span>
                            </p>
                            <p className="mt-1 text-sm text-ink/60">
                                {TIER_NAMES[tier]} plan ({provinceScope}). Cancel anytime.
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
                            {summary.activationSent === false ? (
                                'We could not send your activation email. Please try again shortly, or contact support@northtech.africa.'
                            ) : (
                                <>
                                    We&rsquo;ve emailed an activation link to <strong>{contact.email}</strong>. Open it
                                    to verify your email and set your password, then sign in.
                                </>
                            )}
                        </p>
                        {summary.trialEndsAt !== undefined && (
                            <p className="mt-3 text-sm text-ink/60">
                                Your free trial runs until <strong>{summary.trialEndsAt}</strong>. R0 today.
                            </p>
                        )}
                    </section>
                )}

                {error !== '' && (
                    <p role="alert" id="signup-error" className="auth-error">
                        {error}
                    </p>
                )}

                <div className="join-actions flex items-center gap-3">
                    {step === 'contact' && (
                        <Button className="auth-primary" type="submit" form="signup-contact">
                            Continue <ArrowRightIcon size={19} />
                        </Button>
                    )}
                    {step === 'company' && (
                        <>
                            <Button
                                variant="secondary"
                                disabled={submitting}
                                onClick={() => {
                                    setError('')
                                    setStep('contact')
                                }}
                            >
                                Back
                            </Button>
                            <Button onClick={() => void submitCompany()} disabled={submitting} aria-busy={submitting}>
                                {submitting ? 'Checking…' : 'Continue to matches'} <ArrowRightIcon size={20} />
                            </Button>
                        </>
                    )}
                    {step === 'offer' && preview !== null && (
                        <div className="flex w-full flex-col gap-3">
                            <Button
                                className="w-full"
                                onClick={() => void submitOffer(true)}
                                disabled={submitting}
                                aria-busy={submitting}
                            >
                                {submitting ? 'Setting up…' : `Subscribe now — R${price}`}
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => void submitOffer(false)}
                                disabled={submitting}
                                aria-busy={submitting}
                            >
                                Start my free week instead
                            </Button>
                            <Button
                                variant="secondary"
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                    setError('')
                                    setStep('company')
                                }}
                            >
                                Back
                            </Button>
                        </div>
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
                {step === 'contact' && (
                    <p className="auth-footer">
                        Already have an account? <a href="/login">Log in</a>
                    </p>
                )}
            </main>
        </AuthLayout>
    )
}
