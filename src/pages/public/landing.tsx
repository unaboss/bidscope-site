import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLink
{
    readonly label: string
    readonly href: string
}

const NAV_LINKS: readonly NavLink[] = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Screens', href: '#screens' },
    { label: 'FAQ', href: '#faq' },
]

interface Slide
{
    readonly src: string
    readonly alt: string
}

const SLIDES: readonly Slide[] = [
    {
        src: '/shots/app-discover.png',
        alt: 'For-You feed ranking live tenders to fit your business',
    },
    {
        src: '/shots/app-clients.png',
        alt: 'Clients view showing public-sector buyers by province, with tender counts',
    },
    {
        src: '/shots/app-calendar.png',
        alt: 'Deadline calendar showing briefing and closing dates for bookmarked tenders',
    },
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

/** Warm brass accent used sparingly alongside navy — pricing highlight and the closing CTA's seal line. */
const GOLD = '#B08D57'
const GOLD_INK = '#8A6A3F'

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.08)]'
const CARD_SHADOW_HOVER = 'hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.12)]'

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
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a
                    href="#top"
                    className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                    <span
                        aria-hidden="true"
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-navy font-mono text-[11px] font-semibold text-white"
                    >
                        B
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                            Bidscope
                        </span>
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            by North Tech
                        </span>
                    </span>
                </a>

                <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3 sm:gap-4">
                    <a
                        href="/login"
                        className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                        Sign in
                    </a>
                    <div className="hidden sm:block">
                        <Button size="sm" onClick={() => navigate('/join')}>Start free trial</Button>
                    </div>
                </div>

                <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:hidden"
                    aria-expanded={open}
                    aria-controls={menuId}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    onClick={() => setOpen((value) => !value)}
                >
                    <BurgerIcon open={open} />
                </button>
            </div>

            {open && (
                <div id={menuId} className="border-t border-slate-200 bg-white px-6 pb-6 pt-2 sm:hidden">
                    <nav aria-label="Primary" className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={closeMenu}
                                className="rounded-md px-2 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href="/login"
                            onClick={closeMenu}
                            className="rounded-md px-2 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                        >
                            Sign in
                        </a>
                        <div className="mt-2">
                            <Button
                                className="w-full"
                                onClick={() =>
                                {
                                    closeMenu()
                                    navigate('/join')
                                }}
                            >
                                Start free trial
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}

const AUTO_ADVANCE_MS = 4800

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

/** Shortest signed distance from `active` to `index` around a loop of `total` items. */
function slideOffset(index: number, active: number, total: number): number
{
    let diff = index - active
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
}

function ScreensCarousel()
{
    const total = SLIDES.length
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const reducedMotion = usePrefersReducedMotion()

    const goTo = useCallback((index: number) =>
    {
        setActive(((index % total) + total) % total)
    }, [total])

    const goPrev = useCallback(() => goTo(active - 1), [goTo, active])
    const goNext = useCallback(() => goTo(active + 1), [goTo, active])

    useEffect(() =>
    {
        if (reducedMotion || paused)
        {
            return
        }

        const timer = window.setInterval(() =>
        {
            setActive((current) => (current + 1) % total)
        }, AUTO_ADVANCE_MS)

        return () => window.clearInterval(timer)
    }, [reducedMotion, paused, total, active])

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) =>
    {
        if (event.key === 'ArrowLeft')
        {
            event.preventDefault()
            goPrev()
        }
        else if (event.key === 'ArrowRight')
        {
            event.preventDefault()
            goNext()
        }
    }

    const activeSlide = SLIDES[active]!

    return (
        <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Product screens"
            tabIndex={0}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={onKeyDown}
            className="screens-carousel relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
            <style>{`
                .screens-carousel-card {
                    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, filter 500ms ease;
                }
                @media (prefers-reduced-motion: reduce) {
                    .screens-carousel-card {
                        transition: none;
                    }
                }
            `}</style>

            <div className="sr-only" aria-live="polite">
                {`Screen ${active + 1} of ${total}: ${activeSlide.alt}`}
            </div>

            {reducedMotion ? (
                <div className="mx-auto w-[150px] sm:w-[190px] md:w-[220px] lg:w-[240px]">
                    <div
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${active + 1} of ${total}`}
                        className="overflow-hidden rounded-xl border-4 border-navy/50 bg-slate-100 shadow-[0_10px_16px_rgba(15,23,42,0.06),0_24px_48px_rgba(15,23,42,0.16)]"
                    >
                        <img
                            src={activeSlide.src}
                            alt={activeSlide.alt}
                            loading="lazy"
                            className="aspect-[3/5] w-full object-cover"
                        />
                    </div>
                </div>
            ) : (
                <div className="relative mx-auto h-[300px] overflow-hidden sm:h-[360px] md:h-[420px] lg:h-[470px]">
                    {SLIDES.map((slide, index) =>
                    {
                        const offset = slideOffset(index, active, total)
                        const isActive = offset === 0
                        const distance = Math.abs(offset)

                        if (distance > 2)
                        {
                            return null
                        }

                        const scale = isActive ? 1 : distance === 1 ? 0.8 : 0.64
                        const opacity = isActive ? 1 : distance === 1 ? 0.55 : 0.28
                        const translatePercent = offset * 88
                        const zIndex = 20 - distance

                        return (
                            <div
                                key={slide.src}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${index + 1} of ${total}`}
                                aria-hidden={!isActive}
                                className="screens-carousel-card absolute left-1/2 top-1/2 w-[150px] sm:w-[190px] md:w-[220px] lg:w-[240px]"
                                style={{
                                    transform: `translate(-50%, -50%) translateX(${translatePercent}%) scale(${scale})`,
                                    opacity,
                                    zIndex,
                                    filter: isActive ? 'none' : 'saturate(0.9) brightness(0.96)',
                                }}
                            >
                                <div
                                    className={cn(
                                        'overflow-hidden rounded-xl border-4 bg-slate-100',
                                        isActive
                                            ? 'border-navy/50 shadow-[0_10px_16px_rgba(15,23,42,0.06),0_24px_48px_rgba(15,23,42,0.16)]'
                                            : 'border-navy/25 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_rgba(15,23,42,0.08)]',
                                    )}
                                >
                                    <img
                                        src={slide.src}
                                        alt={slide.alt}
                                        loading="lazy"
                                        className="aspect-[3/5] w-full object-cover"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous screen"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-navy/40 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                    <span aria-hidden="true">&#8592;</span>
                </button>

                <div className="flex items-center gap-2">
                    {SLIDES.map((slide, index) => (
                        <button
                            key={slide.src}
                            type="button"
                            onClick={() => goTo(index)}
                            aria-label={`Go to screen ${index + 1}`}
                            aria-current={index === active}
                            className={cn(
                                'h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                                index === active ? 'w-5 bg-navy' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
                            )}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next screen"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-navy/40 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                    <span aria-hidden="true">&#8594;</span>
                </button>
            </div>
        </div>
    )
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
        <div className={cn('rounded-xl border border-slate-200 bg-white p-5 text-center transition-shadow', CARD_SHADOW, CARD_SHADOW_HOVER)}>
            <dd className="font-serif text-2xl font-semibold text-navy sm:text-3xl">
                {stat.prefix ?? ''}
                {formatStatValue(count)}
                {stat.suffix ?? ''}
            </dd>
            <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
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
        <dl ref={containerRef} className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
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
        <div className={cn('rounded-xl border border-slate-200 bg-white p-6 transition-shadow', CARD_SHADOW, CARD_SHADOW_HOVER)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-mono text-xs font-semibold text-white">
                {step}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{detail}</p>
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
                'flex flex-col rounded-xl border p-6',
                CARD_SHADOW,
                plan.featured ? 'border-navy bg-navy/5 ring-1 ring-navy' : 'border-slate-200 bg-white',
            )}
        >
            {plan.featured && (
                <span
                    className="inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ backgroundColor: `${GOLD}26`, color: GOLD_INK }}
                >
                    Most popular
                </span>
            )}
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{plan.detail}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">
                {plan.price}
                <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                        <span aria-hidden="true" className="text-navy">&#10003;</span>
                        {feature}
                    </li>
                ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full" variant={plan.featured ? 'primary' : 'secondary'} onClick={onSubscribe}>
                    Subscribe
                </Button>
                <button
                    type="button"
                    onClick={onStart}
                    className="w-full rounded-md px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-navy"
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
        <div className="border-b border-slate-200 py-4">
            <h3>
                <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                >
                    <span className="text-base font-semibold text-slate-900">{item.question}</span>
                    <span aria-hidden="true" className="font-mono text-lg text-slate-500">{open ? '−' : '+'}</span>
                </button>
            </h3>
            {open && (
                <p id={panelId} role="region" aria-labelledby={buttonId} className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.answer}
                </p>
            )}
        </div>
    )
}

export function LandingPage()
{
    const navigate = useNavigate()

    return (
        <div id="top" className="relative min-h-dvh bg-white text-slate-900">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_55%_at_50%_-5%,rgba(20,55,94,0.08),rgba(255,255,255,0)_70%)]"
            />

            <SiteNav />

            <main className="mx-auto max-w-6xl px-6 pb-24">
                <section className="pt-10 sm:pt-14">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy">Tender intelligence</p>
                        <h1 className="mt-3 font-serif text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
                            Bidscope finds every South African tender that actually fits your business.
                        </h1>
                        <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                            <Button size="sm" onClick={() => navigate('/join')}>Start 1-week free trial</Button>
                        </div>
                    </div>

                    <div id="screens" className="mt-10 scroll-mt-24 sm:mt-12">
                        <ScreensCarousel />
                    </div>
                    <p className="mx-auto mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        Built for South African SMEs &middot; eTenders + SOE + municipal sources
                    </p>

                    <StatsBand />
                </section>

                <section id="how-it-works" className="mt-24 scroll-mt-24">
                    <h2 className="text-center font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">How it works</h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-500">
                        Three steps between signing up and your first shortlisted tender.
                    </p>
                    <div className="mt-10 grid gap-5 sm:grid-cols-3">
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

                <section id="pricing" className="mt-24 scroll-mt-24">
                    <h2 className="text-center font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">Pricing</h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-500">
                        One plan structure, priced by how many provinces you operate in.
                        Every plan starts with a 7-day free trial.
                    </p>
                    <div className="mt-10 grid gap-5 sm:grid-cols-3">
                        {PLANS.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} onStart={() => navigate('/join')} onSubscribe={() => navigate('/join?intent=subscribe')} />
                        ))}
                    </div>
                </section>

                <section id="faq" className="mt-24 scroll-mt-24">
                    <h2 className="text-center font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
                    <div className="mx-auto mt-10 max-w-2xl">
                        {FAQS.map((item, index) => (
                            <FaqRow key={item.question} item={item} index={index} />
                        ))}
                    </div>
                </section>

                <section
                    className={cn(
                        'relative mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-navy/[0.06] via-white to-white px-6 py-14 text-center',
                        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_60px_-24px_rgba(20,55,94,0.25)]',
                    )}
                >
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-[#B08D57] to-navy"
                    />
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-navy">Free trial</p>
                    <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-900 sm:text-3xl">Try Bidscope free for a week</h2>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
                        Answer a few questions about your business and see exactly how many
                        live tenders you qualify for — before you pay anything.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button onClick={() => navigate('/join')}>Start 1-week free trial</Button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:flex-row">
                    <span>North Tech Africa (Pty) Ltd</span>
                    <div className="flex items-center gap-4">
                        <a href="https://northtech.africa/privacy" className="transition-colors hover:text-slate-900">Privacy</a>
                        <a href="/login" className="transition-colors hover:text-slate-900">Sign in</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
