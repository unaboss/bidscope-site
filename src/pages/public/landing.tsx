import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, requestDiscountCode, type PricingTier } from '@/api'
import { isPromoTier, PROMO_MONTHS, PROMO_PERCENT, type Billing } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { BUTTON_GOLD, BUTTON_OUTLINE, EYEBROW, FOCUS, formatRands, GOLD_TEXT, INPUT, PANEL, PANEL_HOVER } from './brand'
import { AdPlayer } from './intro'
import { codeLooksValid, normaliseCode, PlanPanel, todayCentsFor } from './plan-panel'

interface NavLink
{
    readonly label: string
    readonly href: string
}

const NAV_LINKS: readonly NavLink[] = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
]

interface Stat
{
    readonly value: number
    readonly prefix?: string
    readonly suffix?: string
    readonly label: string
}

const STATS: readonly Stat[] = [
    { value: 9, label: 'Provinces' },
    { value: 134, label: 'Municipalities' },
    { value: 430, suffix: '+', label: 'Organisations' },
    { value: 30, suffix: '+', label: 'Clients' },
]

interface FaqItem
{
    readonly question: string
    readonly answer: string
}

const FAQS: readonly FaqItem[] = [
    {
        question: 'Which sources does it cover?',
        answer: 'eTenders plus state-owned-enterprise and municipal sources, pulled into one feed so you are not checking a dozen sites by hand.',
    },
    {
        question: 'How does it decide what fits my business?',
        answer: 'You tell it your service lines, operating provinces and CIDB grades. Every live tender is ranked against that profile, so the top of your feed is the work you actually qualify for.',
    },
    {
        question: 'Do you need my CIDB grading?',
        answer: 'It helps. Adding your CIDB grades sharpens the ranking and unlocks opportunity optimisation — scoring adjacent work just outside your current lines that you could grow into.',
    },
    {
        question: 'How long is the free trial?',
        answer: 'Seven days, full access, no card required to start. You will see exactly how many live tenders you qualify for before you pay anything.',
    },
    {
        question: 'Can I cancel anytime?',
        answer: 'Yes. There is no lock-in contract — cancel from your account settings whenever you like and you will not be billed again.',
    },
    {
        question: 'How does the 50% discount work?',
        answer: 'Tap "No code yet? Email it to me" on the plan card and we send you a discount code. On Growth and Pro it halves your monthly price for your first six months, then the standard price applies. The code works with the email it was sent to, on monthly billing.',
    },
    {
        question: 'What is the difference between the plans?',
        answer: 'Starter is the ranked feed with AI summaries for one province. Growth adds the working tools: bookmarks, the deadline calendar, email alerts, price estimates, buyer profiles, the tender map and requirement checks, for up to four provinces. Pro is Growth across all nine provinces. Extra provinces on Starter or Growth are R100 a month each.',
    },
    {
        question: 'Is there a yearly option?',
        answer: 'Yes. Pay yearly and you get twelve months for the price of ten.',
    },
]

/** One line on what each plan includes, under the hero card's price. */
const PLAN_SUMMARIES: Readonly<Record<PricingTier, string>> = {
    single: 'Ranked feed and AI summaries for one province.',
    mid: 'Adds alerts, the calendar, price estimates and buyer profiles. Up to 4 provinces.',
    all: 'Everything in Growth, across all nine provinces.',
}

/** The intro's "— by North Tech —" rule, reused as a section divider. */
function GoldRule({ label }: { readonly label: string })
{
    return (
        <div className="flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-10 bg-[#B08D57]/35" />
            <span className={EYEBROW}>{label}</span>
            <span aria-hidden="true" className="h-px w-10 bg-[#B08D57]/35" />
        </div>
    )
}

interface SectionHeadingProps
{
    readonly eyebrow: string
    readonly title: string
    readonly detail?: string
}

function SectionHeading({ eyebrow, title, detail }: SectionHeadingProps)
{
    return (
        <div className="text-center">
            <GoldRule label={eyebrow} />
            <h2 className={cn('mt-3 font-serif text-2xl font-semibold tracking-tight sm:mt-4 sm:text-4xl', GOLD_TEXT)}>{title}</h2>
            {detail && (
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#E9DFC6]/55 sm:mt-4 sm:text-base">{detail}</p>
            )}
        </div>
    )
}

function BurgerIcon({ open }: { readonly open: boolean })
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            {open ? (
                <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            ) : (
                <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            )}
        </svg>
    )
}

function SiteNav()
{
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const menuId = 'primary-nav-menu'

    useEffect(() =>
    {
        if (!open)
        {
            return
        }

        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key === 'Escape')
            {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', onKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () =>
        {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open])

    const closeMenu = useCallback(() =>
    {
        setOpen(false)
    }, [])

    return (
        <header className="sticky top-0 z-40 border-b border-[#B08D57]/15 bg-[#06140F]/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 sm:py-4">
                <a href="#top" className={cn('flex items-center gap-3 rounded-sm', FOCUS)}>
                    <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-sm font-semibold text-[#D9B97E] sm:h-9 sm:w-9 sm:text-base"
                    >
                        B
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className={cn('font-serif text-base font-semibold tracking-tight sm:text-lg', GOLD_TEXT)}>Bidscope</span>
                        <span className="hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.24em] text-[#B08D57]/70 sm:block">
                            by North Tech
                        </span>
                    </span>
                </a>

                <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={cn('rounded-sm font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/55 transition-colors hover:text-[#D9B97E]', FOCUS)}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3 sm:gap-5">
                    <a
                        href="/login"
                        className={cn('whitespace-nowrap rounded-sm font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/55 transition-colors hover:text-[#D9B97E]', FOCUS)}
                    >
                        Sign in
                    </a>
                    <button type="button" onClick={() => navigate('/join')} className={cn(BUTTON_OUTLINE, 'hidden h-9 px-4 sm:inline-flex')}>
                        Start free trial
                    </button>
                </div>

                <button
                    type="button"
                    className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md text-[#D9B97E] hover:bg-[#B08D57]/10 lg:hidden', FOCUS)}
                    aria-expanded={open}
                    aria-controls={menuId}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    onClick={() => setOpen((value) => !value)}
                >
                    <BurgerIcon open={open} />
                </button>
            </div>

            {open && (
                <div id={menuId} className="border-t border-[#B08D57]/15 bg-[#06140F] px-6 pb-6 pt-2 lg:hidden">
                    <nav aria-label="Primary" className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={closeMenu}
                                className={cn('rounded-md px-2 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/70 hover:bg-[#B08D57]/10 hover:text-[#D9B97E]', FOCUS)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href="/login"
                            onClick={closeMenu}
                            className={cn('rounded-md px-2 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/70 hover:bg-[#B08D57]/10 hover:text-[#D9B97E]', FOCUS)}
                        >
                            Sign in
                        </a>
                        <button
                            type="button"
                            className={cn('mt-2 h-11 w-full', BUTTON_GOLD)}
                            onClick={() =>
                            {
                                closeMenu()
                                navigate('/join')
                            }}
                        >
                            Start free trial
                        </button>
                    </nav>
                </div>
            )}
        </header>
    )
}

function usePrefersReducedMotion(): boolean
{
    const [reduced, setReduced] = useState(false)

    useEffect(() =>
    {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(query.matches)

        const onChange = () => setReduced(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])

    return reduced
}

const STAT_COUNT_DURATION_MS = 1400

function formatStatValue(value: number): string
{
    return value.toLocaleString('en-US')
}

function useCountUp(target: number, active: boolean, reducedMotion: boolean): number
{
    const [value, setValue] = useState(() => (reducedMotion ? target : 0))

    useEffect(() =>
    {
        if (reducedMotion)
        {
            setValue(target)
            return
        }

        if (!active)
        {
            return
        }

        let frame: number
        const start = performance.now()

        const tick = (now: number) =>
        {
            const progress = Math.min((now - start) / STAT_COUNT_DURATION_MS, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(target * eased))

            if (progress < 1)
            {
                frame = requestAnimationFrame(tick)
            }
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [active, reducedMotion, target])

    return value
}

interface StatCardProps
{
    readonly stat: Stat
    readonly active: boolean
    readonly reducedMotion: boolean
}

function StatCard({ stat, active, reducedMotion }: StatCardProps)
{
    const count = useCountUp(stat.value, active, reducedMotion)

    return (
        <div className="px-3 py-4 text-center sm:px-4 sm:py-6">
            <dd className={cn('font-serif text-2xl font-semibold tracking-tight sm:text-5xl', GOLD_TEXT)}>
                {stat.prefix ?? ''}
                {formatStatValue(count)}
                {stat.suffix ?? ''}
            </dd>
            <dt className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#E9DFC6]/45 sm:mt-2 sm:text-[10px]">
                {stat.label}
            </dt>
        </div>
    )
}

function StatsBand()
{
    const reducedMotion = usePrefersReducedMotion()
    const [active, setActive] = useState(false)
    const containerRef = useRef<HTMLDListElement>(null)

    useEffect(() =>
    {
        if (active || reducedMotion)
        {
            return
        }

        const node = containerRef.current
        if (!node)
        {
            return
        }

        const observer = new IntersectionObserver((entries) =>
        {
            for (const entry of entries)
            {
                if (entry.isIntersecting)
                {
                    setActive(true)
                    observer.disconnect()
                    break
                }
            }
        }, { threshold: 0.3 })

        observer.observe(node)
        return () => observer.disconnect()
    }, [active, reducedMotion])

    return (
        <dl
            ref={containerRef}
            className="mx-auto mt-8 grid max-w-4xl grid-cols-2 sm:mt-14 divide-[#B08D57]/15 border-y border-[#B08D57]/15 sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-[#B08D57]/15 sm:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-[#B08D57]/15 sm:[&>*:nth-child(odd)]:border-r-0"
        >
            {STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} active={active} reducedMotion={reducedMotion} />
            ))}
        </dl>
    )
}

interface StepCardProps
{
    readonly step: string
    readonly title: string
    readonly detail: string
}

function StepCard({ step, title, detail }: StepCardProps)
{
    return (
        <div className={cn('flex gap-4 p-5 sm:block sm:p-7', PANEL, PANEL_HOVER)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-base font-semibold text-[#D9B97E] sm:h-11 sm:w-11 sm:text-lg">
                {step}
            </span>
            <div>
                <h3 className="font-serif text-lg font-semibold leading-snug text-[#E9DFC6] sm:mt-6 sm:text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E9DFC6]/55 sm:mt-3 sm:text-[15px]">{detail}</p>
            </div>
        </div>
    )
}

type CodeState = 'idle' | 'sending' | 'sent' | 'error'

interface FaqRowProps
{
    readonly item: FaqItem
    readonly index: number
}

function FaqRow({ item, index }: FaqRowProps)
{
    const panelId = `faq-panel-${index}`
    const buttonId = `faq-button-${index}`
    const [open, setOpen] = useState(index === 0)

    return (
        <div className="border-b border-[#B08D57]/15 py-4 sm:py-5">
            <h3>
                <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((value) => !value)}
                    className={cn('flex w-full items-center justify-between gap-4 rounded-sm text-left', FOCUS)}
                >
                    <span className="font-serif text-base font-semibold text-[#E9DFC6] sm:text-lg">{item.question}</span>
                    <span aria-hidden="true" className="font-mono text-lg text-[#B08D57]">{open ? '−' : '+'}</span>
                </button>
            </h3>
            {open && (
                <p id={panelId} role="region" aria-labelledby={buttonId} className="mt-2 text-sm leading-relaxed text-[#E9DFC6]/60 sm:mt-3 sm:text-[15px]">
                    {item.answer}
                </p>
            )}
        </div>
    )
}

function PlayIcon()
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
        </svg>
    )
}

interface HeroPlanProps
{
    readonly onSubscribe: (choice: { tier: PricingTier, billing: Billing, code: string, email: string }) => void
    readonly onTrial: () => void
    readonly onPreview: () => void
}

/**
 * The hero's plan picker: the same panel as the payment page, so a visitor
 * picks a plan, sees the price (with their 50% code) and goes straight on.
 */
function HeroPlan({ onSubscribe, onTrial, onPreview }: HeroPlanProps)
{
    const [tier, setTier] = useState<PricingTier>('mid')
    const [billing, setBilling] = useState<Billing>('monthly')
    const [code, setCode] = useState('')
    const [asking, setAsking] = useState(false)
    const [email, setEmail] = useState('')
    const [sendState, setSendState] = useState<CodeState>('idle')
    const [error, setError] = useState('')

    const promo = billing === 'monthly' && isPromoTier(tier) && codeLooksValid(code)
    const count = tier === 'all' ? 0 : 1
    const today = todayCentsFor(tier, billing, count, promo)

    async function send(): Promise<void>
    {
        if (!email.includes('@'))
        {
            setSendState('error')
            setError('Please enter a valid email address.')
            return
        }

        setSendState('sending')
        setError('')

        try
        {
            await requestDiscountCode(email.trim(), tier)
            setSendState('sent')
        }
        catch (caught)
        {
            setSendState('error')
            setError(caught instanceof ApiError && caught.status === 429
                ? 'Too many requests. Please try again in a little while.'
                : 'We could not send the code just now. Please try again.')
        }
    }

    const codeHelp = promo ? (
        <p className="mt-2 text-[12px] text-[#9FD3B0]">✓ Code added: {PROMO_PERCENT}% off for {PROMO_MONTHS} months.</p>
    ) : sendState === 'sent' ? (
        <p role="status" className="mt-2 text-[12px] text-[#E9DFC6]/60">Sent to {email}. Paste it above, or open the email&rsquo;s button.</p>
    ) : asking ? (
        <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
                <label htmlFor="hero-code-email" className="sr-only">Email address</label>
                <input
                    id="hero-code-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.co.za"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={cn(INPUT, 'h-10 text-[14px]')}
                />
                <button type="button" onClick={() => void send()} disabled={sendState === 'sending'} className={cn('h-10 shrink-0 px-4', BUTTON_OUTLINE)}>
                    {sendState === 'sending' ? 'Sending…' : 'Send'}
                </button>
            </div>
            {sendState === 'error' && <p role="alert" className="text-[12px] text-[#F2A38A]">{error}</p>}
        </div>
    ) : (
        <button type="button" onClick={() => setAsking(true)} className={cn('mt-2 text-left text-[12px] text-[#D9B97E] underline-offset-2 hover:underline', FOCUS)}>
            No code yet? Email it to me
        </button>
    )

    return (
        <PlanPanel
            tier={tier}
            billing={billing}
            count={count}
            promo={promo}
            code={code}
            codeId="hero-code"
            compact
            header={(
                <button type="button" onClick={onPreview} className={cn('h-9 w-full gap-2', BUTTON_OUTLINE)}>
                    <PlayIcon />
                    Preview the app
                </button>
            )}
            onTierChange={setTier}
            onBillingChange={setBilling}
            onCodeChange={setCode}
            codeHelp={codeHelp}
            note={<p className="-mt-1 text-[12px] leading-relaxed text-[#E9DFC6]/45">{PLAN_SUMMARIES[tier]}</p>}
            footer={(
                <div className="flex flex-col gap-2.5 border-t border-[#B08D57]/20 pt-3">
                    <button
                        type="button"
                        onClick={() => onSubscribe({ tier, billing, code: promo ? normaliseCode(code) : '', email: email.trim() })}
                        className={cn('h-11 w-full', BUTTON_GOLD)}
                    >
                        Subscribe · {formatRands(today)} today
                    </button>
                    <p className="text-center text-[12px] text-[#E9DFC6]/45">
                        Prefer to try first?{' '}
                        <button type="button" onClick={onTrial} className={cn('underline underline-offset-2 hover:text-[#D9B97E]', FOCUS)}>Start a free week</button>
                    </p>
                </div>
            )}
        />
    )
}

export function LandingPage()
{
    const navigate = useNavigate()
    const [previewing, setPreviewing] = useState(false)
    const closePreview = useCallback(() => setPreviewing(false), [])

    function startFromHero(choice: { tier: PricingTier, billing: Billing, code: string, email: string }): void
    {
        const query = new URLSearchParams({ tier: choice.tier, billing: choice.billing })

        if (choice.code !== '')
        {
            query.set('code', choice.code)
        }

        if (choice.email.includes('@'))
        {
            query.set('email', choice.email)
        }

        navigate(`/subscribe?${query.toString()}`)
    }

    return (
        <div id="top" className="relative min-h-dvh overflow-x-clip bg-[#06140F] text-[#E9DFC6]">
            {/* The intro's lamplight: a warm green glow behind the hero, falling off into near-black. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_55%_45%_at_50%_22%,rgba(22,66,50,0.6),rgba(6,20,15,0)_70%),radial-gradient(ellipse_30%_20%_at_50%_22%,rgba(176,141,87,0.08),rgba(6,20,15,0)_70%)]"
            />

            <SiteNav />

            <main className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-6 sm:pb-24">
                <section className="pt-6 sm:pt-8">
                    <div className="grid items-center gap-7 lg:grid-cols-[1fr_23rem] lg:gap-16">
                        <div className="text-center lg:text-left">
                            <p className={EYEBROW}>Tender intelligence</p>
                            <h1 className="mt-3 font-serif text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[#E9DFC6] sm:mt-5 sm:text-5xl sm:leading-[1.08] lg:text-[3.25rem]">
                                Every South African tender that <span className={GOLD_TEXT}>actually fits</span> your business.
                            </h1>
                            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#E9DFC6]/55 sm:mt-5 sm:text-lg lg:mx-0">
                                Ranked in one feed, with reminders before briefings and closing dates.
                            </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm lg:max-w-none">
                            <HeroPlan onSubscribe={startFromHero} onTrial={() => navigate('/join')} onPreview={() => setPreviewing(true)} />
                        </div>
                    </div>

                    <p className="mx-auto mt-10 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#E9DFC6]/40 sm:mt-12 sm:text-[10px]">
                        Built for South African SMEs &middot; eTenders + SOE + municipal sources
                    </p>

                    <StatsBand />
                </section>

                <section id="how-it-works" className="mt-16 scroll-mt-20 sm:mt-28 sm:scroll-mt-24">
                    <SectionHeading
                        eyebrow="How it works"
                        title="Three steps to your first shortlist"
                        detail="Between signing up and your first shortlisted tender."
                    />
                    <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:mt-12 sm:gap-5 lg:max-w-none lg:grid-cols-3">
                        <StepCard
                            step="1"
                            title="Tell us your service lines & provinces"
                            detail="Add what you do, where you operate and your CIDB grades — it takes a few minutes."
                        />
                        <StepCard
                            step="2"
                            title="We rank every live tender against your profile"
                            detail="eTenders, SOE and municipal sources are pulled into one feed and scored against your business."
                        />
                        <StepCard
                            step="3"
                            title="Get alerted before it closes"
                            detail="Bookmark what you're chasing and get reminders for briefings and closing dates."
                        />
                    </div>
                </section>

                <section id="faq" className="mt-16 scroll-mt-20 sm:mt-28 sm:scroll-mt-24">
                    <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
                    <div className="mx-auto mt-6 max-w-2xl border-t border-[#B08D57]/15 sm:mt-10">
                        {FAQS.map((item, index) => (
                            <FaqRow key={item.question} item={item} index={index} />
                        ))}
                    </div>
                </section>

                <section className="relative mt-16 overflow-hidden rounded-2xl border border-[#B08D57]/25 bg-[#081A13] px-5 py-10 text-center sm:mt-28 sm:px-6 sm:py-16">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(22,66,50,0.7),rgba(8,26,19,0)_70%)]"
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-xl border border-[#B08D57]/10" />
                    <div className="relative">
                        <span
                            aria-hidden="true"
                            className="mx-auto hidden h-12 w-12 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-lg font-semibold text-[#D9B97E] sm:flex"
                        >
                            B
                        </span>
                        <h2 className={cn('font-serif text-2xl font-semibold tracking-tight sm:mt-6 sm:text-4xl', GOLD_TEXT)}>Try Bidscope free for a week</h2>
                        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[#E9DFC6]/55 sm:mt-4 sm:text-base">
                            Answer a few questions about your business and see exactly how many
                            live tenders you qualify for — before you pay anything.
                        </p>
                        <div className="mt-6 flex justify-center sm:mt-9">
                            <button type="button" onClick={() => navigate('/join')} className={cn('h-11 px-8 sm:h-12 sm:px-10', BUTTON_GOLD)}>
                                Start 1-week free trial
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative border-t border-[#B08D57]/15">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 font-mono sm:px-6 sm:py-8 text-[10px] uppercase tracking-[0.18em] text-[#E9DFC6]/40 sm:flex-row">
                    <span>North Tech Africa (Pty) Ltd</span>
                    <div className="flex items-center gap-5">
                        <a href="https://northtech.africa/privacy" className="transition-colors hover:text-[#D9B97E]">Privacy</a>
                        <a href="/login" className="transition-colors hover:text-[#D9B97E]">Sign in</a>
                    </div>
                </div>
            </footer>

            {previewing && <AdPlayer onDone={closePreview} closeLabel="Close" titleCard={false} />}
        </div>
    )
}
