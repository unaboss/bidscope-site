import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLink
{
    readonly label: string
    readonly href: string
}

const NAV_LINKS: readonly NavLink[] = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
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

interface PricingPlan
{
    readonly name: string
    readonly price: string
    readonly detail: string
    readonly features: readonly string[]
    readonly featured?: boolean
}

const PLANS: readonly PricingPlan[] = [
    {
        name: 'One province',
        price: 'R399',
        detail: 'Operating in a single province',
        features: ['Full tender feed & search', 'For-You ranked deck', 'Bookmarks & calendar'],
    },
    {
        name: 'Two to four provinces',
        price: 'R599',
        detail: 'Operating across two to four provinces',
        features: ['Everything in one province', 'Buyer profiles & value estimates', 'Opportunity optimisation', 'Priority email alerts'],
        featured: true,
    },
    {
        name: 'All provinces',
        price: 'R799',
        detail: 'Operating nationwide',
        features: ['Everything in two to four provinces', 'National coverage across all sources', 'Unlimited service lines', 'Unlimited bookmarks'],
    },
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
        question: 'What does the plan price depend on?',
        answer: 'Only how many provinces you operate in — one, two-to-four, or all provinces. Every plan includes the full feature set.',
    },
]

/**
 * The intro screen's palette, carried through the rest of the site: near-black
 * green, brass gold and a warm parchment ink.
 */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06140F]'

const GOLD_TEXT = 'bg-gradient-to-b from-[#F0D9A4] via-[#C9A464] to-[#8A6A3F] bg-clip-text text-transparent'

const PANEL = 'rounded-xl border border-[#B08D57]/20 bg-[#0B1F18]/70 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]'
const PANEL_HOVER = 'transition-colors hover:border-[#B08D57]/40'

const BUTTON_BASE = 'inline-flex items-center justify-center rounded-md font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors'
const BUTTON_GOLD = `${BUTTON_BASE} bg-gradient-to-b from-[#D9B97E] to-[#B08D57] text-[#06140F] shadow-[0_0_40px_-10px_rgba(176,141,87,0.55)] hover:from-[#F0D9A4] hover:to-[#C9A464] ${FOCUS}`
const BUTTON_OUTLINE = `${BUTTON_BASE} border border-[#B08D57]/55 text-[#D9B97E] hover:border-[#D9B97E] hover:bg-[#B08D57] hover:text-[#06140F] ${FOCUS}`

const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.28em] text-[#B08D57]/85'

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
            <h2 className={cn('mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl', GOLD_TEXT)}>{title}</h2>
            {detail && (
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#E9DFC6]/55">{detail}</p>
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
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="#top" className={cn('flex items-center gap-3 rounded-sm', FOCUS)}>
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-base font-semibold text-[#D9B97E]"
                    >
                        B
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className={cn('font-serif text-lg font-semibold tracking-tight', GOLD_TEXT)}>Bidscope</span>
                        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.24em] text-[#B08D57]/70">
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
        <div className="px-4 py-6 text-center">
            <dd className={cn('font-serif text-4xl font-semibold tracking-tight sm:text-5xl', GOLD_TEXT)}>
                {stat.prefix ?? ''}
                {formatStatValue(count)}
                {stat.suffix ?? ''}
            </dd>
            <dt className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#E9DFC6]/45">
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
            className="mx-auto mt-14 grid max-w-4xl grid-cols-2 divide-[#B08D57]/15 border-y border-[#B08D57]/15 sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-[#B08D57]/15 sm:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-[#B08D57]/15 sm:[&>*:nth-child(odd)]:border-r-0"
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
        <div className={cn('p-7', PANEL, PANEL_HOVER)}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-lg font-semibold text-[#D9B97E]">
                {step}
            </span>
            <h3 className="mt-6 font-serif text-xl font-semibold leading-snug text-[#E9DFC6]">{title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#E9DFC6]/55">{detail}</p>
        </div>
    )
}

interface PricingCardProps
{
    readonly plan: PricingPlan
    readonly onStart: () => void
    readonly onSubscribe: () => void
}

function PricingCard({ plan, onStart, onSubscribe }: PricingCardProps)
{
    return (
        <div
            className={cn(
                'relative flex flex-col rounded-xl border p-7',
                plan.featured
                    ? 'border-[#B08D57]/70 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(22,66,50,0.95),rgba(11,31,24,0.95)_75%)] shadow-[0_0_0_1px_rgba(176,141,87,0.25),0_0_70px_-20px_rgba(176,141,87,0.45)] lg:-my-4 lg:py-11'
                    : cn(PANEL, PANEL_HOVER),
            )}
        >
            {plan.featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center whitespace-nowrap rounded-full border border-[#B08D57]/60 bg-[#06140F] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D9B97E]">
                    Most popular
                </span>
            )}
            <h3 className="font-serif text-xl font-semibold text-[#E9DFC6]">{plan.name}</h3>
            <p className="mt-1 text-sm text-[#E9DFC6]/50">{plan.detail}</p>
            <p className="mt-6 flex items-baseline gap-1.5">
                <span className={cn('font-serif text-5xl font-semibold tracking-tight', GOLD_TEXT)}>{plan.price}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/45">/ month</span>
            </p>
            <div aria-hidden="true" className="mt-6 h-px bg-gradient-to-r from-[#B08D57]/0 via-[#B08D57]/35 to-[#B08D57]/0" />
            <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-[15px] leading-relaxed text-[#E9DFC6]/75">
                        <span aria-hidden="true" className="mt-0.5 text-[#D9B97E]">&#10003;</span>
                        {feature}
                    </li>
                ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2">
                <button type="button" className={cn('h-11 w-full', plan.featured ? BUTTON_GOLD : BUTTON_OUTLINE)} onClick={onSubscribe}>
                    Subscribe
                </button>
                <button
                    type="button"
                    onClick={onStart}
                    className={cn('w-full rounded-md px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9DFC6]/45 transition-colors hover:text-[#D9B97E]', FOCUS)}
                >
                    Start free trial instead
                </button>
            </div>
        </div>
    )
}

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
        <div className="border-b border-[#B08D57]/15 py-5">
            <h3>
                <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((value) => !value)}
                    className={cn('flex w-full items-center justify-between gap-4 rounded-sm text-left', FOCUS)}
                >
                    <span className="font-serif text-lg font-semibold text-[#E9DFC6]">{item.question}</span>
                    <span aria-hidden="true" className="font-mono text-lg text-[#B08D57]">{open ? '−' : '+'}</span>
                </button>
            </h3>
            {open && (
                <p id={panelId} role="region" aria-labelledby={buttonId} className="mt-3 text-[15px] leading-relaxed text-[#E9DFC6]/60">
                    {item.answer}
                </p>
            )}
        </div>
    )
}

export function LandingPage()
{
    const navigate = useNavigate()

    // Arriving from the intro's ad, open on the plans rather than the hero.
    useEffect(() =>
    {
        if (window.location.hash === '')
        {
            document.getElementById('pricing')?.scrollIntoView()
        }
    }, [])

    return (
        <div id="top" className="relative min-h-dvh overflow-x-clip bg-[#06140F] text-[#E9DFC6]">
            {/* The intro's lamplight: a warm green glow behind the hero, falling off into near-black. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_55%_45%_at_50%_22%,rgba(22,66,50,0.6),rgba(6,20,15,0)_70%),radial-gradient(ellipse_30%_20%_at_50%_22%,rgba(176,141,87,0.08),rgba(6,20,15,0)_70%)]"
            />

            <SiteNav />

            <main className="relative mx-auto max-w-6xl px-6 pb-24">
                <section className="pt-16 sm:pt-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <GoldRule label="Tender intelligence" />
                        <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-[#E9DFC6] sm:text-6xl">
                            Every South African tender that <span className={GOLD_TEXT}>actually fits</span> your business.
                        </h1>
                        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#E9DFC6]/55 sm:text-lg">
                            Ranked in one feed, with reminders before briefings and closing dates.
                        </p>
                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <button type="button" onClick={() => navigate('/join')} className={cn('h-12 px-8', BUTTON_GOLD)}>
                                Start 1-week free trial
                            </button>
                            <a href="#pricing" className={cn('h-12 px-8', BUTTON_OUTLINE)}>See pricing</a>
                        </div>
                    </div>

                    <p className="mx-auto mt-12 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#E9DFC6]/40">
                        Built for South African SMEs &middot; eTenders + SOE + municipal sources
                    </p>

                    <StatsBand />
                </section>

                <section id="how-it-works" className="mt-28 scroll-mt-24">
                    <SectionHeading
                        eyebrow="How it works"
                        title="Three steps to your first shortlist"
                        detail="Between signing up and your first shortlisted tender."
                    />
                    <div className="mx-auto mt-12 grid max-w-xl gap-5 lg:max-w-none lg:grid-cols-3">
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

                <section id="pricing" className="relative mt-28 scroll-mt-24">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-24 -z-0 h-[700px] bg-[radial-gradient(ellipse_50%_45%_at_50%_55%,rgba(22,66,50,0.45),rgba(6,20,15,0)_70%)]"
                    />
                    <div className="relative">
                        <SectionHeading
                            eyebrow="Pricing"
                            title="Priced by where you work"
                            detail="One plan structure, priced by how many provinces you operate in. Every plan starts with a 7-day free trial."
                        />
                        <div className="mx-auto mt-14 grid max-w-xl gap-8 lg:max-w-none lg:grid-cols-3 lg:items-stretch lg:gap-5">
                            {PLANS.map((plan) => (
                                <PricingCard key={plan.name} plan={plan} onStart={() => navigate('/join')} onSubscribe={() => navigate('/join?intent=subscribe')} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="faq" className="mt-28 scroll-mt-24">
                    <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
                    <div className="mx-auto mt-10 max-w-2xl border-t border-[#B08D57]/15">
                        {FAQS.map((item, index) => (
                            <FaqRow key={item.question} item={item} index={index} />
                        ))}
                    </div>
                </section>

                <section className="relative mt-28 overflow-hidden rounded-2xl border border-[#B08D57]/25 bg-[#081A13] px-6 py-16 text-center">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(22,66,50,0.7),rgba(8,26,19,0)_70%)]"
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-xl border border-[#B08D57]/10" />
                    <div className="relative">
                        <span
                            aria-hidden="true"
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#B08D57]/45 font-serif text-lg font-semibold text-[#D9B97E]"
                        >
                            B
                        </span>
                        <h2 className={cn('mt-6 font-serif text-3xl font-semibold tracking-tight sm:text-4xl', GOLD_TEXT)}>Try Bidscope free for a week</h2>
                        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#E9DFC6]/55">
                            Answer a few questions about your business and see exactly how many
                            live tenders you qualify for — before you pay anything.
                        </p>
                        <div className="mt-9 flex justify-center">
                            <button type="button" onClick={() => navigate('/join')} className={cn('h-12 px-10', BUTTON_GOLD)}>
                                Start 1-week free trial
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative border-t border-[#B08D57]/15">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[#E9DFC6]/40 sm:flex-row">
                    <span>North Tech Africa (Pty) Ltd</span>
                    <div className="flex items-center gap-5">
                        <a href="https://northtech.africa/privacy" className="transition-colors hover:text-[#D9B97E]">Privacy</a>
                        <a href="/login" className="transition-colors hover:text-[#D9B97E]">Sign in</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
