import { useEffect, useMemo, useState } from 'react'
import {
    ArrowRightIcon as ArrowRight,
    CalendarDotsIcon as CalendarClock,
    CaretRightIcon as CaretRight,
    MapPinAreaIcon as MapPinned,
    SealCheckIcon as SealCheck,
    SparkleIcon as Sparkle,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { getAccount, getFeed, listTenders } from '@/shared/api'
import { useBookmarks } from '@/features/bookmarks/use-bookmarks'
import { daysUntil, formatDate } from '@/shared/lib/format'
import { formatEstimate, tenderEstimate } from '@/features/tenders/estimate'
import type { Account, Tender } from '@/shared/types'
import './dashboard.css'

const CHART_WINDOW = 30

/**
 * The workspace home.
 *
 * One question leads — what should I look at next — so the page opens on the
 * matched count and the nearest deadline rather than three equal tiles, then
 * shows movement over time and the newest notices. The right rail holds the
 * things that expire: the closing list and the plan.
 */
export function DashboardOverview() {
    const [tenders, setTenders] = useState<Tender[]>([])
    const [matched, setMatched] = useState<number | null>(null)
    const [closing, setClosing] = useState<number | null>(null)
    const [account, setAccount] = useState<Account | null>(null)
    const [days, setDays] = useState(CHART_WINDOW)
    const [error, setError] = useState('')
    const bookmarks = useBookmarks()

    useEffect(() => {
        const controller = new AbortController()
        const soon = new Date()
        soon.setDate(soon.getDate() + 7)

        Promise.all([
            listTenders({ sort: 'newest', limit: 200 }, controller.signal),
            getFeed('foryou', 1, 0, controller.signal),
            listTenders(
                {
                    closingFrom: new Date().toISOString().slice(0, 10),
                    closingTo: soon.toISOString().slice(0, 10),
                    limit: 1,
                },
                controller.signal,
            ),
            getAccount(controller.signal),
        ])
            .then(([recent, feed, deadlines, plan]) => {
                setTenders(recent.tenders)
                setMatched(feed.total)
                setClosing(deadlines.total)
                setAccount(plan)
            })
            .catch((e) => {
                if (!controller.signal.aborted)
                    setError(e instanceof Error ? e.message : 'Could not load your dashboard.')
            })

        return () => controller.abort()
    }, [])

    const chart = useMemo(() => {
        const counts = Array.from({ length: days }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - days + 1 + i)
            return tenders.filter((t) => t.published_date?.slice(0, 10) === date.toISOString().slice(0, 10)).length
        })
        const max = Math.max(1, ...counts)
        const points = counts.map((n, i) => [(i / Math.max(1, days - 1)) * 900, 215 - (n / max) * 180])

        return {
            line: points.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' '),
            max,
            count: counts.reduce((a, b) => a + b, 0),
        }
    }, [tenders, days])

    /** The notices that close soonest, which is what an operator acts on. */
    const deadlines = useMemo(
        () =>
            [...tenders]
                .filter((tender) => tender.closing_date !== null && daysUntil(tender.closing_date) >= 0)
                .sort((a, b) => (a.closing_date ?? '').localeCompare(b.closing_date ?? ''))
                .slice(0, 5),
        [tenders],
    )

    const nearest = deadlines[0] ?? null
    const watchlist = bookmarks.loading ? null : bookmarks.enabled ? bookmarks.ids.size : '—'
    const trialDays = account?.trialActive ? account.trialDaysLeft : null
    const planName = account ? account.effectivePlan : null

    return (
        <div className="dashboard">
            <header className="workspace-title">
                <div>
                    <h1>Dashboard</h1>
                    <p>Your tender activity at a glance.</p>
                </div>
                <Link to="/discover?relevant=true" className="dashboard-primary">
                    Browse matches <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </header>

            {error && (
                <p role="alert" className="dashboard-error">
                    {error}
                </p>
            )}

            <div className="dashboard-grid">
                <div className="dashboard-column">
                    {/* Leads with the decision, not a metric wall. */}
                    <section className="dashboard-focus" aria-labelledby="focus-title">
                        <div className="dashboard-focus-main">
                            <p className="dashboard-eyebrow" id="focus-title">
                                Matched to your profile
                            </p>
                            <p className="dashboard-focus-value">
                                {matched ?? <span className="dashboard-skeleton" aria-label="Loading" />}
                            </p>
                            <p className="dashboard-focus-copy">
                                {closing === null
                                    ? 'Checking the deadlines…'
                                    : closing === 0
                                      ? 'No matches close in the next seven days.'
                                      : `${closing} ${closing === 1 ? 'match closes' : 'matches close'} in the next seven days.`}
                            </p>
                            <div className="dashboard-focus-actions">
                                <Link to="/discover?relevant=true" className="dashboard-cta">
                                    Open the feed <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                                <Link to="/discover?status=soon" className="dashboard-ghost">
                                    Closing soon
                                </Link>
                            </div>
                        </div>
                        <dl className="dashboard-focus-facts">
                            <div>
                                <dt>Watchlist</dt>
                                <dd>{watchlist ?? <span className="dashboard-skeleton" aria-label="Loading" />}</dd>
                            </div>
                            <div>
                                <dt>Nearest deadline</dt>
                                <dd>{nearest?.closing_date ? formatDate(nearest.closing_date) : '—'}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="dashboard-card" aria-labelledby="activity-title">
                        <div className="dashboard-card-head">
                            <div>
                                <h2 id="activity-title">Tenders published</h2>
                                <p className="dashboard-card-meta">
                                    {chart.count} in the last {days} days
                                </p>
                            </div>
                            <div className="dashboard-switch" role="group" aria-label="Activity period">
                                {[7, 30].map((window) => (
                                    <button
                                        key={window}
                                        type="button"
                                        aria-pressed={days === window}
                                        onClick={() => setDays(window)}
                                    >
                                        {window}d
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="dashboard-chart">
                            <span className="dashboard-chart-max">{chart.max}</span>
                            <span className="dashboard-chart-zero">0</span>
                            <svg
                                viewBox="0 0 900 245"
                                role="img"
                                aria-label={`${chart.count} tenders published in the last ${days} days`}
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#237643" stopOpacity=".22" />
                                        <stop offset="100%" stopColor="#237643" stopOpacity=".015" />
                                    </linearGradient>
                                </defs>
                                <path d={`${chart.line} L900,245 L0,245 Z`} fill="url(#activity-fill)" />
                                <path
                                    d={chart.line}
                                    fill="none"
                                    stroke="currentColor"
                                    className="dashboard-chart-line"
                                    strokeWidth="2.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                        <div className="dashboard-chart-caption">
                            <span>From your 200 most recent tenders</span>
                            <span>Today</span>
                        </div>
                    </section>

                    <section className="dashboard-card" aria-labelledby="latest-title">
                        <div className="dashboard-card-head">
                            <h2 id="latest-title">Latest opportunities</h2>
                            <Link to="/discover" className="dashboard-link">
                                All tenders <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                        </div>
                        {tenders.length === 0 && !error ? (
                            <ul className="dashboard-rows" aria-hidden="true">
                                {[0, 1, 2].map((row) => (
                                    <li key={row} className="dashboard-row is-loading">
                                        <span className="dashboard-skeleton dashboard-skeleton-line" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <ul className="dashboard-rows">
                                {tenders.slice(0, 4).map((tender) => {
                                    const estimate = tenderEstimate(tender)
                                    return (
                                        <li key={tender.id}>
                                            <Link className="dashboard-row" to={`/tenders/${tender.id}`}>
                                                <span className="dashboard-row-body">
                                                    <span className="dashboard-row-title">
                                                        {tender.title ?? 'Untitled tender'}
                                                    </span>
                                                    <span className="dashboard-row-meta">
                                                        {tender.organ_of_state ?? 'Buyer not listed'}
                                                        {estimate ? ` · ${formatEstimate(estimate, true)}` : ''}
                                                    </span>
                                                </span>
                                                <span className="dashboard-row-date">
                                                    {tender.closing_date
                                                        ? formatDate(tender.closing_date)
                                                        : 'To be confirmed'}
                                                </span>
                                                <CaretRight size={15} aria-hidden="true" />
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <aside className="dashboard-rail" aria-label="Deadlines and plan">
                    <section className="dashboard-card dashboard-card-tight" aria-labelledby="deadlines-title">
                        <div className="dashboard-card-head">
                            <h2 id="deadlines-title">Closing next</h2>
                            <CalendarClock size={17} aria-hidden="true" className="dashboard-head-icon" />
                        </div>
                        {deadlines.length === 0 ? (
                            <p className="dashboard-empty">
                                No matched tender closes in the next few weeks. New notices arrive every six
                                hours.
                            </p>
                        ) : (
                            <ul className="dashboard-deadlines">
                                {deadlines.map((tender) => {
                                    const left = tender.closing_date ? daysUntil(tender.closing_date) : null
                                    return (
                                        <li key={tender.id}>
                                            <Link to={`/tenders/${tender.id}`}>
                                                <span className="dashboard-deadline-title">
                                                    {tender.title ?? 'Untitled tender'}
                                                </span>
                                                <span className="dashboard-deadline-buyer">
                                                    {tender.organ_of_state ?? 'Buyer not listed'}
                                                </span>
                                                <span className="dashboard-deadline-meta">
                                                    <span
                                                        className={
                                                            'dashboard-deadline-badge' +
                                                            (left !== null && left <= 3 ? ' is-urgent' : '')
                                                        }
                                                    >
                                                        {left === null
                                                            ? 'No date'
                                                            : left === 0
                                                              ? 'Today'
                                                              : left === 1
                                                                ? 'Tomorrow'
                                                                : `${left} days`}
                                                    </span>
                                                    {formatDate(tender.closing_date)}
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                        <Link to="/discover?status=soon" className="dashboard-card-foot">
                            View all closing <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                    </section>

                    <section className="dashboard-plan" aria-labelledby="plan-title">
                        <div className="dashboard-plan-head">
                            <SealCheck size={18} aria-hidden="true" />
                            <h2 id="plan-title">
                                {planName === null ? 'Your plan' : `${planName[0]?.toUpperCase()}${planName.slice(1)} plan`}
                            </h2>
                        </div>
                        <p>
                            {trialDays !== null && trialDays > 0
                                ? `Trial: ${trialDays} ${trialDays === 1 ? 'day' : 'days'} left on everything.`
                                : 'Every matched tender, with the deadlines that matter kept in view.'}
                        </p>
                        <Link to="/billing" className="dashboard-plan-link">
                            {trialDays !== null && trialDays > 0 ? 'Keep this plan' : 'Manage plan'}
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </section>

                    <Link to="/clients" className="dashboard-rail-link">
                        <MapPinned size={17} aria-hidden="true" />
                        <span>
                            Explore clients and coverage
                            <small>Buyers, provinces and who wins the work.</small>
                        </span>
                        <CaretRight size={15} aria-hidden="true" />
                    </Link>

                    <Link to="/discover?sort=newest" className="dashboard-rail-link">
                        <Sparkle size={17} aria-hidden="true" />
                        <span>
                            What arrived today
                            <small>The newest notices across every source.</small>
                        </span>
                        <CaretRight size={15} aria-hidden="true" />
                    </Link>
                </aside>
            </div>
        </div>
    )
}
