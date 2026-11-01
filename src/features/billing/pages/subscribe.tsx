import { LockKeyIcon } from '@phosphor-icons/react'
import { SiteHeader } from '@/features/marketing/components/site-header'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, confirmPublicCheckout, requestDiscountCode, startSubscribe, type PricingTier, type SubscribeCheckout } from '@/shared/api'
import { PROVINCES } from '@/features/profile/profile'
import {
    addonProvinces,
    INCLUDED_PROVINCES,
    isPricingTier,
    isPromoTier,
    MAX_PROVINCES,
    PROMO_MONTHS,
    PROMO_PERCENT,
    PROVINCE_ADDON_CENTS,
    TIER_NAMES,
} from '@/features/billing/pricing'
import { cn } from '@/shared/lib/utils'
import { BUTTON_GOLD, BUTTON_OUTLINE, EYEBROW, FOCUS, formatRands, GOLD_TEXT, INPUT, PANEL } from '../../marketing/components/brand'
import { codeLooksValid, FieldLabel, normaliseCode, PlanIncludes, PriceBlock, TierToggle, todayCentsFor } from '../components/plan-panel'

type Step = 'preview' | 'login' | 'pay' | 'confirming' | 'done'

const TOKEN_KEY = 'bidscope.checkoutToken'
const PAYSTACK_SCRIPT = 'https://js.paystack.co/v2/inline.js'

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

const STEPS = ['How it works', 'Login', 'Payment'] as const

function Progress({ current }: { readonly current: number })
{
    return (
        <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Progress">
            {STEPS.map((label, index) => (
                <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span
                        aria-current={index === current ? 'step' : undefined}
                        className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[9px]',
                            index < current && 'border-[#075037] bg-[#075037] text-[#fdfcfb]',
                            index === current && 'border-[#075037] text-[#075037]',
                            index > current && 'border-[#14251d]/20 text-[#14251d]/35',
                        )}
                    >
                        {index < current ? '✓' : index + 1}
                    </span>
                    <span className={cn('truncate font-mono text-[10px] uppercase tracking-[0.14em]', index === current ? 'text-[#14251d]' : 'text-[#14251d]/40')}>
                        {label}
                    </span>
                    {index < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-4 bg-[#B08D57]/30 sm:w-8" />}
                </li>
            ))}
        </ol>
    )
}

interface PreviewProps
{
    readonly tier: PricingTier
    readonly promo: boolean
    readonly email: string
    readonly onContinue: () => void
}

/** Step 1: the three steps, the price and the way on, all on one screen. */
function SetupPreview({ tier, promo, email, onContinue }: PreviewProps)
{
    const items = [
        { title: 'Create your login', detail: 'Your email and a password. That is your account.' },
        { title: 'Pay by card', detail: `In Paystack's secure window.${promo ? ` Your ${PROMO_PERCENT}% code comes off first.` : ''}` },
        { title: 'Pick your work', detail: 'Choose your tender categories and your matched feed fills in.' },
    ]

    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div className="mx-auto w-full max-w-md lg:max-w-none">
                <p className={EYEBROW}>{TIER_NAMES[tier]}{promo ? ` · ${PROMO_PERCENT}% off` : ''}</p>
                <h1 className="mt-2 font-serif text-[1.65rem] font-semibold leading-tight text-[#14251d] sm:text-3xl">
                    Three steps and you&rsquo;re <span className={GOLD_TEXT}>in</span>.
                </h1>

                <ol className="mt-4 space-y-3">
                    {items.map((item, index) => (
                        <li key={item.title} className="flex gap-3.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-sm font-semibold text-[#075037]">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-serif text-base font-semibold text-[#14251d]">{item.title}</p>
                                <p className="text-[13px] leading-snug text-[#14251d]/55">{item.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="mt-4 rounded-xl border border-[#B08D57]/20 bg-[#ffffff]/60 px-4 py-2.5">
                    <PriceBlock tier={tier} count={tier === 'all' ? 0 : 1} promo={promo} compact />
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
                    <button type="button" onClick={onContinue} className={cn('h-11', BUTTON_GOLD)}>
                        Continue
                    </button>
                    <Link to="/pricing" className={cn('h-11 px-4', BUTTON_OUTLINE)}>Change plan</Link>
                </div>
            </div>

            {/* The "login preview": what the sign-in looks like, then the app it opens. Wide screens only. */}
            <div aria-hidden="true" className="relative hidden lg:block">
                <div className="overflow-hidden rounded-xl border border-[#B08D57]/25 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center gap-1.5 border-b border-[#B08D57]/15 bg-[#ffffff] px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-[#14251d]/20" />
                        <span className="h-2 w-2 rounded-full bg-[#14251d]/20" />
                        <span className="h-2 w-2 rounded-full bg-[#14251d]/20" />
                        <span className="ml-3 truncate font-mono text-[10px] text-[#14251d]/35">bidscope.co.za/profile</span>
                    </div>
                    <img src="/shots/setup-profile.webp" alt="" className="block w-full" />
                </div>
                <div className={cn('absolute -bottom-6 -left-6 w-[58%] p-4', PANEL, 'bg-[#ffffff]')}>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#B08D57]">Your login</p>
                    <div className="mt-3 space-y-2">
                        <div className="truncate rounded-md border border-[#B08D57]/25 bg-[#fdfcfb] px-2.5 py-2 text-[12px] text-[#14251d]/80">{email !== '' ? email : 'you@company.co.za'}</div>
                        <div className="rounded-md border border-[#B08D57]/25 bg-[#fdfcfb] px-2.5 py-2 text-[12px] tracking-[0.3em] text-[#14251d]/60">••••••••••</div>
                        <div className="rounded-md bg-gradient-to-b from-[#075037] to-[#B08D57] py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#fdfcfb]">Proceed to payment</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CardBadge({ label }: { readonly label: string })
{
    return <span className="rounded border border-[#14251d]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#14251d]/60">{label}</span>
}



/**
 * Subscribe in three screens: how it works, the login (with a plan switch), then
 * payment (card first, then the plan's details, provinces and code). Paying
 * creates the account and opens Paystack's popup, so a visitor goes from a
 * pricing card to a paid, signed-in account with as few fields as possible.
 */
export function SubscribePage()
{
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const reference = params.get('reference') ?? params.get('trxref') ?? ''
    const initialTier = params.get('tier')

    const [step, setStep] = useState<Step>(reference !== '' ? 'confirming' : 'preview')
    const [tier, setTier] = useState<PricingTier>(isPricingTier(initialTier) ? initialTier : 'mid')
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

    const codeIsWellFormed = codeLooksValid(code)
    const promo = isPromoTier(tier) && codeIsWellFormed
    const limit = provinceLimit(tier)
    const count = tier === 'all' ? 0 : provinces.length
    const extras = addonProvinces(tier, count)
    const todayCents = todayCentsFor(tier, Math.max(count, tier === 'all' ? 0 : 1), promo)

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

        return `Provinces · ${included} included, +R${PROVINCE_ADDON_CENTS / 100}/month each · ${provinces.length} of ${MAX_PROVINCES[tier]}`
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

    function goTo(next: Step): void
    {
        setError('')
        setStep(next)
    }

    function validateLogin(): string
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

        return ''
    }

    function toPayment(event: React.FormEvent): void
    {
        event.preventDefault()

        const problem = validateLogin()

        if (problem !== '')
        {
            setError(problem)
            return
        }

        goTo('pay')
    }

    function validatePayment(): string
    {
        if (provinces.length < limit.min)
        {
            return 'Choose the province you work in.'
        }

        if (code.trim() !== '' && !codeIsWellFormed)
        {
            return 'That discount code does not look right. It starts with BID50-.'
        }

        return ''
    }

    async function pay(event: React.FormEvent): Promise<void>
    {
        event.preventDefault()

        const loginProblem = validateLogin()

        if (loginProblem !== '')
        {
            setStep('login')
            setError(loginProblem)
            return
        }

        const problem = validatePayment()

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
                billing: 'monthly',
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
        <div className="relative min-h-dvh overflow-x-clip bg-[#fdfcfb] text-[#14251d]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[min(700px,100%)] bg-[radial-gradient(ellipse_55%_45%_at_50%_10%,rgba(22,66,50,0.55),rgba(6,20,15,0)_70%)]"
            />
            <SiteHeader />

            <main className="relative mx-auto max-w-5xl px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
                {(step === 'preview' || step === 'login' || step === 'pay') && (
                    <Progress current={step === 'preview' ? 0 : step === 'login' ? 1 : 2} />
                )}

                {step === 'preview' && (
                    <div className="mt-5 sm:mt-6">
                        <SetupPreview tier={tier} promo={promo} email={email} onContinue={() => goTo('login')} />
                    </div>
                )}

                {step === 'login' && (
                    <form onSubmit={toPayment} noValidate className="mx-auto mt-5 w-full max-w-sm sm:mt-6">
                        <h1 className="font-serif text-xl font-semibold leading-tight text-[#14251d]">Create your login</h1>
                        <div className={cn('mt-3 flex flex-col gap-3 p-4 sm:p-5', PANEL)}>
                            <div>
                                <FieldLabel htmlFor="sub-email">Email</FieldLabel>
                                <input id="sub-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={cn(INPUT, 'h-10 lg:h-9')} />
                            </div>
                            <div>
                                <FieldLabel htmlFor="sub-password">Password (10+ characters)</FieldLabel>
                                <div className="relative">
                                    <input
                                        id="sub-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className={cn(INPUT, 'h-10 pr-16 lg:h-9')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#075037]/80 hover:text-[#075037]', FOCUS)}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <FieldLabel htmlFor="sub-company">Company name</FieldLabel>
                                <input id="sub-company" autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={cn(INPUT, 'h-10 lg:h-9')} />
                            </div>
                        </div>

                        <div className="mx-auto mt-3 max-w-[17rem]">
                            <TierToggle tier={tier} onChange={changeTier} pill />
                            <p className="mt-1.5 text-center text-[12px] text-[#14251d]/50">{TIER_NAMES[tier]} · {formatRands(todayCents)}/month</p>
                        </div>

                        {error !== '' && <p role="alert" className="mt-3 text-center text-sm text-[#F2A38A]">{error}</p>}

                        <button type="submit" className={cn('mt-3 h-11 w-full lg:h-10', BUTTON_GOLD)}>Proceed to payment</button>
                    </form>
                )}

                {step === 'pay' && (
                    <form onSubmit={(event) => void pay(event)} noValidate className="mx-auto mt-5 grid w-full max-w-md gap-3 sm:mt-6 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-x-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-3">
                                <h1 className="font-serif text-xl font-semibold leading-tight text-[#14251d]">Payment</h1>
                                <button type="button" onClick={() => goTo('login')} className={cn('rounded-sm font-mono text-[10px] uppercase tracking-[0.16em] text-[#075037]/80 hover:text-[#0d1723]', FOCUS)}>
                                    ← Login
                                </button>
                            </div>

                            <section aria-label="Payment method" className={cn('px-4 py-3', PANEL)}>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-[#14251d]/85"><LockKeyIcon /> Card</span>
                                    <span className="flex gap-1.5"><CardBadge label="Visa" /><CardBadge label="Mastercard" /></span>
                                </div>
                                <p className="mt-1 text-[12px] leading-snug text-[#14251d]/50">
                                    Paystack&rsquo;s secure window opens when you tap Pay. We never see your card number.
                                </p>
                            </section>

                            <div className="hidden flex-col gap-3 lg:flex">
                                {error !== '' && <p role="alert" className="text-sm text-[#F2A38A]">{error}</p>}
                                <button type="submit" disabled={busy} className={cn('h-11 w-full', BUTTON_GOLD)}>
                                    {busy ? 'Opening secure payment…' : `Pay ${formatRands(todayCents)}`}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <TierToggle tier={tier} onChange={changeTier} pill />

                            <section aria-label={`${TIER_NAMES[tier]} plan`} className={cn('flex flex-col gap-3 p-4', PANEL)}>
                                <PriceBlock tier={tier} count={Math.max(count, tier === 'all' ? 0 : 1)} promo={promo} compact />
                                <PlanIncludes tier={tier} listClassName="lg:grid lg:grid-cols-2 lg:gap-x-4" />

                                {tier !== 'all' && (
                                    <fieldset>
                                        <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#14251d]/55">{provinceHint}</legend>
                                        <div className="flex flex-wrap gap-1.5">
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
                                                            'rounded-full border px-2.5 py-0.5 text-[12px] transition-colors disabled:opacity-35',
                                                            selected
                                                                ? 'border-[#075037] bg-[#075037] font-semibold text-[#fdfcfb]'
                                                                : 'border-[#B08D57]/30 text-[#14251d]/75 hover:border-[#075037]/70',
                                                            FOCUS,
                                                        )}
                                                    >
                                                        {province}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {extras > 0 && (
                                            <p className="mt-1.5 text-[12px] text-[#14251d]/55">Includes {extras} extra province{extras === 1 ? '' : 's'} at R{PROVINCE_ADDON_CENTS / 100}/month each.</p>
                                        )}
                                    </fieldset>
                                )}

                                {isPromoTier(tier) && (
                                    <div>
                                        <label htmlFor="sub-code" className="sr-only">Discount code</label>
                                        <input
                                            id="sub-code"
                                            value={code}
                                            onChange={(event) => setCode(event.target.value)}
                                            placeholder="Discount code (BID50-…)"
                                            autoCapitalize="characters"
                                            spellCheck={false}
                                            className={cn(INPUT, 'h-9 font-mono text-[14px] uppercase tracking-[0.1em]')}
                                        />
                                        {promo ? (
                                            <p className="mt-1.5 text-[12px] text-[#9FD3B0]">✓ {PROMO_PERCENT}% off for {PROMO_MONTHS} months. Checked against your email when you pay.</p>
                                        ) : codeSent ? (
                                            <p className="mt-1.5 text-[12px] text-[#14251d]/60">Sent to {email}. Paste it above.</p>
                                        ) : (
                                            <button type="button" onClick={() => void sendCode()} className={cn('mt-1.5 text-left text-[12px] text-[#075037] underline-offset-2 hover:underline', FOCUS)}>
                                                No code yet? Email it to me
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="flex flex-col gap-3 lg:hidden">
                            {error !== '' && <p role="alert" className="text-center text-sm text-[#F2A38A]">{error}</p>}
                            <button type="submit" disabled={busy} className={cn('h-12 w-full', BUTTON_GOLD)}>
                                {busy ? 'Opening secure payment…' : `Pay ${formatRands(todayCents)}`}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'confirming' && (
                    <section className="mx-auto mt-16 max-w-lg text-center">
                        <h1 className="font-serif text-3xl font-semibold text-[#14251d]">Confirming your payment…</h1>
                        <p className="mt-3 text-sm text-[#14251d]/55">Hold on a moment while we check with Paystack and sign you in.</p>
                    </section>
                )}

                {step === 'done' && (
                    <section className="mx-auto mt-16 max-w-lg text-center">
                        {error === '' ? (
                            <>
                                <h1 className={cn('font-serif text-3xl font-semibold', GOLD_TEXT)}>Payment received.</h1>
                                <p className="mt-3 text-[15px] leading-relaxed text-[#14251d]/65">{doneMessage}</p>
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
