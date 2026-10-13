import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, confirmPublicCheckout, requestDiscountCode, startSubscribe, type PricingTier, type SubscribeCheckout } from '@/api'
import { PROVINCES } from '@/lib/profile'
import {
    addonProvinces,
    annualCents,
    INCLUDED_PROVINCES,
    isBilling,
    isPricingTier,
    isPromoTier,
    MAX_PROVINCES,
    monthlyTotalCents,
    PROMO_MONTHS,
    PROMO_PERCENT,
    promoCents,
    PROVINCE_ADDON_CENTS,
    TIER_NAMES,
    type Billing,
} from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { BUTTON_GOLD, BUTTON_OUTLINE, EYEBROW, FOCUS, formatRands, GOLD_TEXT, INPUT, PANEL } from './brand'

type Step = 'preview' | 'pay' | 'confirming' | 'done'

const TOKEN_KEY = 'bidscope.checkoutToken'
const PAYSTACK_SCRIPT = 'https://js.paystack.co/v2/inline.js'

/** The shape of a typed code once normalised (see worker/lib/discount-code.ts). */
const CODE_PATTERN = /^BID50-[0-9A-Z]{8}$/

function normaliseCode(raw: string): string
{
    return raw.trim().toUpperCase().replace(/\s+/g, '')
}

interface PaystackTransaction
{
    readonly reference: string
}

interface PaystackPopup
{
    resumeTransaction(accessCode: string, callbacks: {
        onSuccess: (transaction: PaystackTransaction) => void
        onCancel: () => void
        onError?: (error: unknown) => void
    }): void
}

declare global
{
    interface Window
    {
        PaystackPop?: new () => PaystackPopup
    }
}

/** Loads Paystack's popup script once; resolves null when it cannot load. */
function loadPaystack(): Promise<(new () => PaystackPopup) | null>
{
    if (window.PaystackPop !== undefined)
    {
        return Promise.resolve(window.PaystackPop)
    }

    return new Promise((resolve) =>
    {
        const script = document.createElement('script')

        script.src = PAYSTACK_SCRIPT
        script.async = true
        script.onload = () => resolve(window.PaystackPop ?? null)
        script.onerror = () => resolve(null)
        document.head.appendChild(script)
    })
}

function readStoredToken(): string | undefined
{
    try
    {
        return sessionStorage.getItem(TOKEN_KEY) ?? undefined
    }
    catch
    {
        return undefined
    }
}

function storeToken(token: string | null): void
{
    try
    {
        if (token === null)
        {
            sessionStorage.removeItem(TOKEN_KEY)
        }
        else
        {
            sessionStorage.setItem(TOKEN_KEY, token)
        }
    }
    catch
    {
        // Private mode: the popup path keeps the token in memory anyway.
    }
}

function provinceLimit(tier: PricingTier): { readonly min: number, readonly max: number }
{
    return tier === 'all' ? { min: 0, max: 0 } : { min: 1, max: MAX_PROVINCES[tier] }
}

/** What is charged today for a plan, billing period, province count and code. */
function todayCentsFor(tier: PricingTier, billing: Billing, count: number, promo: boolean): number
{
    if (billing === 'annual')
    {
        return annualCents(tier, count)
    }

    return promo ? promoCents(tier, count) : monthlyTotalCents(tier, count)
}

function SiteHeader()
{
    return (
        <header className="relative border-b border-[#B08D57]/15">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
                <Link to="/pricing" className={cn('flex items-center gap-3 rounded-sm', FOCUS)}>
                    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-base font-semibold text-[#D9B97E]">B</span>
                    <span className={cn('font-serif text-lg font-semibold tracking-tight', GOLD_TEXT)}>Bidscope</span>
                </Link>
                <a href="/login" className={cn('rounded-sm font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/55 hover:text-[#D9B97E]', FOCUS)}>
                    Sign in
                </a>
            </div>
        </header>
    )
}

const STEPS = ['How it works', 'Login & payment', 'Pick your work'] as const

function Progress({ current }: { readonly current: number })
{
    return (
        <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progress">
            {STEPS.map((label, index) => (
                <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span
                        aria-current={index === current ? 'step' : undefined}
                        className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]',
                            index < current && 'border-[#D9B97E] bg-[#D9B97E] text-[#06140F]',
                            index === current && 'border-[#D9B97E] text-[#D9B97E]',
                            index > current && 'border-[#E9DFC6]/20 text-[#E9DFC6]/35',
                        )}
                    >
                        {index < current ? '✓' : index + 1}
                    </span>
                    <span className={cn('truncate font-mono text-[10px] uppercase tracking-[0.14em]', index === current ? 'text-[#E9DFC6]' : 'text-[#E9DFC6]/40', index !== current && 'hidden sm:inline')}>
                        {label}
                    </span>
                    {index < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-[#B08D57]/30 sm:w-8" />}
                </li>
            ))}
        </ol>
    )
}

interface PriceBlockProps
{
    readonly tier: PricingTier
    readonly billing: Billing
    readonly count: number
    readonly promo: boolean
}

/** The price due today, with the full price struck through while a discount applies. */
function PriceBlock({ tier, billing, count, promo }: PriceBlockProps)
{
    const monthly = monthlyTotalCents(tier, count)
    const full = formatRands(monthly)
    const today = todayCentsFor(tier, billing, count, promo)
    const struck = billing === 'annual' ? formatRands(monthly * 12) : promo ? full : null

    return (
        <div>
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                {struck !== null && <s className="font-serif text-xl font-semibold text-[#E9DFC6]/40 decoration-[#D9B97E]/80 decoration-2">{struck}</s>}
                <span className={cn('font-serif text-4xl font-semibold tracking-tight', GOLD_TEXT)}>{formatRands(today)}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E9DFC6]/45">today</span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#E9DFC6]/60">
                {billing === 'annual'
                    ? <>Twelve months for the price of ten ({full}/month), renewing yearly. Cancel anytime.</>
                    : promo
                        ? <>{PROMO_PERCENT}% off for {PROMO_MONTHS} months ({formatRands(today)}/month), then {full}/month. Cancel anytime.</>
                        : <>{full}/month, billed monthly. Cancel anytime.</>}
            </p>
        </div>
    )
}

interface PreviewProps
{
    readonly tier: PricingTier
    readonly billing: Billing
    readonly promo: boolean
    readonly email: string
    readonly onContinue: () => void
}

/** Step 1: a preview of the login and setup, so nothing after "Pay" is a surprise. */
function SetupPreview({ tier, billing, promo, email, onContinue }: PreviewProps)
{
    const items = [
        { title: 'Create your login', detail: 'Your email and a password. That is your account; there is no separate sign-up form.' },
        { title: 'Pay by card', detail: `Card details go into Paystack's secure window on the same page.${promo ? ` Your ${PROMO_PERCENT}% code is applied before you pay.` : ''}` },
        { title: 'Pick your work', detail: 'You land in Bidscope signed in. Choose your tender categories (or upload your CSD report) and your matched feed fills in.' },
    ]

    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
                <p className={EYEBROW}>{TIER_NAMES[tier]}{billing === 'annual' ? ' · yearly, 2 months free' : promo ? ` · ${PROMO_PERCENT}% off` : ''}</p>
                <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#E9DFC6] sm:text-4xl">
                    Three steps and you&rsquo;re <span className={GOLD_TEXT}>in</span>.
                </h1>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#E9DFC6]/60">
                    Here is everything that happens after you tap continue. It takes about two minutes.
                </p>

                <ol className="mt-8 space-y-5">
                    {items.map((item, index) => (
                        <li key={item.title} className="flex gap-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-base font-semibold text-[#D9B97E]">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-serif text-lg font-semibold text-[#E9DFC6]">{item.title}</p>
                                <p className="mt-0.5 text-sm leading-relaxed text-[#E9DFC6]/55">{item.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="mt-8 rounded-xl border border-[#B08D57]/20 bg-[#0B1F18]/60 p-4">
                    <PriceBlock tier={tier} billing={billing} count={tier === 'all' ? 0 : 1} promo={promo} />
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button type="button" onClick={onContinue} className={cn('h-12 px-8', BUTTON_GOLD)}>
                        Continue to payment
                    </button>
                    <Link to="/pricing#pricing" className={cn('h-12 px-6', BUTTON_OUTLINE)}>Change plan</Link>
                </div>
            </div>

            {/* The "login preview": what the sign-in looks like, then the app it opens. */}
            <div aria-hidden="true" className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="overflow-hidden rounded-xl border border-[#B08D57]/25 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-1.5 border-b border-[#B08D57]/15 bg-[#0B1F18] px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-[#E9DFC6]/20" />
                        <span className="h-2 w-2 rounded-full bg-[#E9DFC6]/20" />
                        <span className="h-2 w-2 rounded-full bg-[#E9DFC6]/20" />
                        <span className="ml-3 truncate font-mono text-[10px] text-[#E9DFC6]/35">bidscope.co.za/profile</span>
                    </div>
                    <img src="/shots/setup-profile.webp" alt="" className="block w-full" />
                </div>
                <div className={cn('absolute -bottom-8 -left-2 w-[62%] p-4 sm:-left-6', PANEL, 'bg-[#0B1F18]')}>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#B08D57]">Your login</p>
                    <div className="mt-3 space-y-2">
                        <div className="truncate rounded-md border border-[#B08D57]/25 bg-[#06140F] px-2.5 py-2 text-[12px] text-[#E9DFC6]/80">{email !== '' ? email : 'you@company.co.za'}</div>
                        <div className="rounded-md border border-[#B08D57]/25 bg-[#06140F] px-2.5 py-2 text-[12px] tracking-[0.3em] text-[#E9DFC6]/60">••••••••••</div>
                        <div className="rounded-md bg-gradient-to-b from-[#D9B97E] to-[#B08D57] py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#06140F]">Pay &amp; sign in</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CardBadge({ label }: { readonly label: string })
{
    return <span className="rounded border border-[#E9DFC6]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#E9DFC6]/60">{label}</span>
}

function LockIcon()
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    )
}

function SectionTitle({ number, title }: { readonly number: number, readonly title: string })
{
    return (
        <h2 className="flex items-center gap-3 font-serif text-lg font-semibold text-[#E9DFC6]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#B08D57]/45 font-mono text-[10px] text-[#D9B97E]">{number}</span>
            {title}
        </h2>
    )
}

function Label({ htmlFor, children }: { readonly htmlFor: string, readonly children: React.ReactNode })
{
    return <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[#E9DFC6]/55">{children}</label>
}

/**
 * Subscribe: a setup preview, then one payment gate holding the login details
 * and the card step (Paystack's popup), so a visitor goes from a pricing card to
 * a paid, signed-in account with as few fields as possible.
 */
export function SubscribePage()
{
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const reference = params.get('reference') ?? params.get('trxref') ?? ''
    const initialTier = params.get('tier')

    const [step, setStep] = useState<Step>(reference !== '' ? 'confirming' : 'preview')
    const [tier, setTier] = useState<PricingTier>(isPricingTier(initialTier) ? initialTier : 'mid')
    const initialBilling = params.get('billing')
    const [billing, setBilling] = useState<Billing>(isBilling(initialBilling) ? initialBilling : 'monthly')
    const [email, setEmail] = useState(params.get('email') ?? '')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [companyName, setCompanyName] = useState('')
    const [provinces, setProvinces] = useState<string[]>([])
    const [code, setCode] = useState(params.get('code') ?? '')
    const [codeSent, setCodeSent] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [doneMessage, setDoneMessage] = useState('')

    const codeLooksValid = CODE_PATTERN.test(normaliseCode(code))
    const promo = billing === 'monthly' && isPromoTier(tier) && codeLooksValid
    // On the preview a promo-tier visitor without a code yet still sees the promo price they are after.
    const previewPromo = billing === 'monthly' && isPromoTier(tier) && (codeLooksValid || code === '')
    const limit = provinceLimit(tier)
    const count = tier === 'all' ? 0 : provinces.length
    const extras = addonProvinces(tier, count)
    const todayCents = todayCentsFor(tier, billing, Math.max(count, tier === 'all' ? 0 : 1), promo)

    useEffect(() =>
    {
        window.scrollTo(0, 0)
    }, [step])

    // Back from Paystack's hosted page (the popup fallback): confirm the charge.
    useEffect(() =>
    {
        if (reference === '')
        {
            return
        }

        void finish(reference, readStoredToken())
    }, [reference])

    const provinceHint = useMemo(() =>
    {
        if (tier === 'all')
        {
            return ''
        }

        const included = INCLUDED_PROVINCES[tier]

        return `Your provinces: ${included === 1 ? '1 included' : `${included} included`}, +R${PROVINCE_ADDON_CENTS / 100}/month each after that (${provinces.length} of ${MAX_PROVINCES[tier]} max).`
    }, [tier, provinces.length])

    function changeTier(next: PricingTier): void
    {
        setTier(next)
        setProvinces((current) => current.slice(0, provinceLimit(next).max))
    }

    function toggleProvince(province: string): void
    {
        setProvinces((current) =>
        {
            if (current.includes(province))
            {
                return current.filter((item) => item !== province)
            }

            return current.length >= limit.max ? current : [...current, province]
        })
    }

    async function finish(ref: string, token: string | undefined): Promise<void>
    {
        setStep('confirming')
        setError('')

        try
        {
            const result = await confirmPublicCheckout(ref, token)

            storeToken(null)

            if (result.signedIn === true)
            {
                // A full load swaps the signed-out funnel for the app.
                window.location.assign('/profile?welcome=1')
                return
            }

            setDoneMessage('Your subscription is active. We have emailed you a link to activate your login; open it, then sign in and pick your work.')
            setStep('done')
        }
        catch
        {
            setError('We could not confirm your payment. If you were charged, contact support@northtech.africa.')
            setStep('done')
        }
    }

    async function sendCode(): Promise<void>
    {
        if (!email.includes('@'))
        {
            setError('Enter your email first, then we can send the code to it.')
            return
        }

        setError('')

        try
        {
            await requestDiscountCode(email.trim(), tier)
            setCodeSent(true)
        }
        catch
        {
            setError('We could not send the code just now. Please try again.')
        }
    }

    function validate(): string
    {
        if (!email.includes('@'))
        {
            return 'Please enter a valid email address.'
        }

        if (password.length < 10)
        {
            return 'Choose a password of at least 10 characters.'
        }

        if (companyName.trim().length < 2)
        {
            return 'Please enter your company name.'
        }

        if (provinces.length < limit.min)
        {
            return 'Choose the province you work in.'
        }

        if (code.trim() !== '' && !codeLooksValid)
        {
            return 'That discount code does not look right. It starts with BID50-.'
        }

        return ''
    }

    async function pay(event: React.FormEvent): Promise<void>
    {
        event.preventDefault()

        const problem = validate()

        if (problem !== '')
        {
            setError(problem)
            return
        }

        setBusy(true)
        setError('')

        let checkout: SubscribeCheckout

        try
        {
            checkout = await startSubscribe({
                email: email.trim(),
                password,
                companyName: companyName.trim(),
                tier,
                billing,
                provinces: tier === 'all' ? [] : provinces,
                code: code.trim() === '' ? undefined : normaliseCode(code),
            })
        }
        catch (caught)
        {
            setBusy(false)

            if (caught instanceof ApiError && caught.status === 409)
            {
                setError('That email already has an account. Sign in instead.')
            }
            else if (caught instanceof ApiError && caught.status === 503)
            {
                setError('Subscriptions are not open just yet. You can start a free trial instead.')
            }
            else
            {
                setError(caught instanceof ApiError ? caught.message : 'Could not start checkout. Please try again.')
            }

            return
        }

        const Paystack = checkout.accessCode === '' ? null : await loadPaystack()

        if (Paystack === null)
        {
            // No popup: Paystack's hosted page, which returns here with a reference.
            storeToken(checkout.checkoutToken)
            window.location.assign(checkout.authorizationUrl)
            return
        }

        new Paystack().resumeTransaction(checkout.accessCode, {
            onSuccess: (transaction) => void finish(transaction.reference || checkout.reference, checkout.checkoutToken),
            onCancel: () =>
            {
                setBusy(false)
                setError('Payment was cancelled. Your details are saved; tap Pay to try again.')
            },
            onError: () =>
            {
                storeToken(checkout.checkoutToken)
                window.location.assign(checkout.authorizationUrl)
            },
        })
    }

    return (
        <div className="relative min-h-dvh overflow-x-clip bg-[#06140F] text-[#E9DFC6]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(ellipse_55%_45%_at_50%_10%,rgba(22,66,50,0.55),rgba(6,20,15,0)_70%)]"
            />
            <SiteHeader />

            <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
                {(step === 'preview' || step === 'pay') && <Progress current={step === 'preview' ? 0 : 1} />}

                {step === 'preview' && (
                    <div className="mt-10">
                        <SetupPreview tier={tier} billing={billing} promo={previewPromo} email={email} onContinue={() => setStep('pay')} />
                    </div>
                )}

                {step === 'pay' && (
                    <form onSubmit={(event) => void pay(event)} noValidate className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
                        <div className="flex flex-col gap-6 lg:order-1">
                            <div>
                                <h1 className="font-serif text-3xl font-semibold leading-tight text-[#E9DFC6]">Login and payment</h1>
                                <p className="mt-2 text-sm text-[#E9DFC6]/55">One form. You will be signed in as soon as the payment goes through.</p>
                            </div>

                            <section className={cn('flex flex-col gap-4 p-5 sm:p-6', PANEL)}>
                                <SectionTitle number={1} title="Login details" />
                                <div>
                                    <Label htmlFor="sub-email">Email</Label>
                                    <input id="sub-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT} />
                                </div>
                                <div>
                                    <Label htmlFor="sub-password">Password (10+ characters)</Label>
                                    <div className="relative">
                                        <input
                                            id="sub-password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className={cn(INPUT, 'pr-16')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#D9B97E]/80 hover:text-[#D9B97E]', FOCUS)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="sub-company">Company name</Label>
                                    <input id="sub-company" autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={INPUT} />
                                </div>

                                {tier !== 'all' && (
                                    <fieldset className="mt-1">
                                        <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#E9DFC6]/55">{provinceHint}</legend>
                                        <div className="flex flex-wrap gap-2">
                                            {PROVINCES.map((province) =>
                                            {
                                                const selected = provinces.includes(province)
                                                const full = !selected && provinces.length >= limit.max

                                                return (
                                                    <button
                                                        key={province}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        disabled={full}
                                                        onClick={() => toggleProvince(province)}
                                                        className={cn(
                                                            'rounded-full border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-35',
                                                            selected
                                                                ? 'border-[#D9B97E] bg-[#D9B97E] font-semibold text-[#06140F]'
                                                                : 'border-[#B08D57]/30 text-[#E9DFC6]/75 hover:border-[#D9B97E]/70',
                                                            FOCUS,
                                                        )}
                                                    >
                                                        {province}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </fieldset>
                                )}
                            </section>

                            <section className={cn('flex flex-col gap-4 p-5 sm:p-6', PANEL)}>
                                <SectionTitle number={2} title="Card details" />
                                <div className="rounded-lg border border-[#B08D57]/25 bg-[#06140F]/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 text-sm text-[#E9DFC6]/80"><LockIcon /> Secure card payment</span>
                                        <span className="flex gap-1.5"><CardBadge label="Visa" /><CardBadge label="Mastercard" /></span>
                                    </div>
                                    <p className="mt-3 text-[12px] leading-relaxed text-[#E9DFC6]/50">
                                        <strong className="text-[#E9DFC6]/80">You enter your card after tapping Pay below</strong>, in Paystack&rsquo;s secure window that opens on this page. We never see or store your card number.
                                    </p>
                                </div>

                                {error !== '' && <p role="alert" className="text-sm text-[#F2A38A]">{error}</p>}

                                <button type="submit" disabled={busy} className={cn('h-12 w-full', BUTTON_GOLD)}>
                                    {busy ? 'Opening secure payment…' : `Pay ${formatRands(todayCents)} and start`}
                                </button>
                                <p className="text-center text-[12px] text-[#E9DFC6]/40">
                                    Cancel anytime. Prefer to try first? <Link to="/join" className="underline hover:text-[#D9B97E]">Start a free trial</Link>.
                                </p>
                            </section>
                        </div>

                        <aside className={cn('order-first flex flex-col gap-5 p-5 sm:p-6 lg:sticky lg:top-6 lg:order-2', PANEL, 'border-[#D9B97E]/35')}>
                            <div>
                                <p className={EYEBROW}>Your plan</p>
                                <div role="radiogroup" aria-label="Plan" className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg border border-[#B08D57]/20 bg-[#06140F]/60 p-1">
                                    {(['single', 'mid', 'all'] as const).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            role="radio"
                                            aria-checked={tier === option}
                                            onClick={() => changeTier(option)}
                                            className={cn(
                                                'rounded-md px-1 py-2 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.08em] transition-colors',
                                                tier === option ? 'bg-[#D9B97E] font-bold text-[#06140F]' : 'text-[#E9DFC6]/60 hover:text-[#D9B97E]',
                                                FOCUS,
                                            )}
                                        >
                                            {TIER_NAMES[option]}
                                            {billing === 'monthly' && isPromoTier(option) && <span className="block text-[9px] opacity-80">{PROMO_PERCENT}% off</span>}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 font-serif text-xl font-semibold text-[#E9DFC6]">{TIER_NAMES[tier]}</p>
                            </div>

                            <div role="radiogroup" aria-label="Billing" className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#B08D57]/20 bg-[#06140F]/60 p-1">
                                {(['monthly', 'annual'] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        role="radio"
                                        aria-checked={billing === option}
                                        onClick={() => setBilling(option)}
                                        className={cn(
                                            'rounded-md px-1 py-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                                            billing === option ? 'bg-[#D9B97E] font-bold text-[#06140F]' : 'text-[#E9DFC6]/60 hover:text-[#D9B97E]',
                                            FOCUS,
                                        )}
                                    >
                                        {option === 'monthly' ? 'Monthly' : 'Yearly · 2 free'}
                                    </button>
                                ))}
                            </div>

                            <PriceBlock tier={tier} billing={billing} count={Math.max(count, tier === 'all' ? 0 : 1)} promo={promo} />

                            {extras > 0 && (
                                <p className="-mt-2 text-[12px] text-[#E9DFC6]/55">Includes {extras} extra province{extras === 1 ? '' : 's'} at R{PROVINCE_ADDON_CENTS / 100}/month each.</p>
                            )}

                            {isPromoTier(tier) && billing === 'monthly' && (
                                <div>
                                    <Label htmlFor="sub-code">Discount code</Label>
                                    <input
                                        id="sub-code"
                                        value={code}
                                        onChange={(event) => setCode(event.target.value)}
                                        placeholder="BID50-XXXXXXXX"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        className={cn(INPUT, 'font-mono uppercase tracking-[0.1em]')}
                                    />
                                    {promo ? (
                                        <p className="mt-2 text-[12px] text-[#9FD3B0]">✓ Code added: {PROMO_PERCENT}% off for {PROMO_MONTHS} months. It is checked against your email when you pay.</p>
                                    ) : codeSent ? (
                                        <p className="mt-2 text-[12px] text-[#E9DFC6]/60">Sent to {email}. Paste it above, or open the email&rsquo;s button to come back with it filled in.</p>
                                    ) : (
                                        <button type="button" onClick={() => void sendCode()} className={cn('mt-2 text-left text-[12px] text-[#D9B97E] underline-offset-2 hover:underline', FOCUS)}>
                                            No code yet? Email it to me
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-[#B08D57]/20 pt-4">
                                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/55">Due today</span>
                                <span className="font-serif text-2xl font-semibold text-[#F0D9A4]">{formatRands(todayCents)}</span>
                            </div>
                        </aside>
                    </form>
                )}

                {step === 'confirming' && (
                    <section className="mx-auto mt-16 max-w-lg text-center">
                        <h1 className="font-serif text-3xl font-semibold text-[#E9DFC6]">Confirming your payment…</h1>
                        <p className="mt-3 text-sm text-[#E9DFC6]/55">Hold on a moment while we check with Paystack and sign you in.</p>
                    </section>
                )}

                {step === 'done' && (
                    <section className="mx-auto mt-16 max-w-lg text-center">
                        {error === '' ? (
                            <>
                                <h1 className={cn('font-serif text-3xl font-semibold', GOLD_TEXT)}>Payment received.</h1>
                                <p className="mt-3 text-[15px] leading-relaxed text-[#E9DFC6]/65">{doneMessage}</p>
                            </>
                        ) : (
                            <p role="alert" className="text-[15px] text-[#F2A38A]">{error}</p>
                        )}
                        <button type="button" onClick={() => navigate('/pricing')} className={cn('mt-8 h-11 px-6', BUTTON_OUTLINE)}>
                            Back to Bidscope
                        </button>
                    </section>
                )}
            </main>
        </div>
    )
}
