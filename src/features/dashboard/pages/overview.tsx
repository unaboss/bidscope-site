import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon as ArrowRight, BookmarkIcon as Bookmark, CalendarCheckIcon as CalendarClock, FileMagnifyingGlassIcon as FileSearch } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { getFeed, listTenders } from '@/shared/api'
import { useBookmarks } from '@/features/bookmarks/use-bookmarks'
import { formatDate } from '@/shared/lib/format'
import type { Tender } from '@/shared/types'

export function DashboardOverview() {
    const [tenders, setTenders] = useState<Tender[]>([])
    const [matched, setMatched] = useState<number | null>(null)
    const [closing, setClosing] = useState<number | null>(null)
    const [days, setDays] = useState(30)
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
        ])
            .then(([recent, feed, deadlines]) => {
                setTenders(recent.tenders)
                setMatched(feed.total)
                setClosing(deadlines.total)
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
        const points = counts.map((n, i) => [(i / (days - 1)) * 900, 215 - (n / max) * 180])
        return {
            line: points.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' '),
            max,
            count: counts.reduce((a, b) => a + b, 0),
        }
    }, [tenders, days])
    return (
        <div className="dashboard-page">
            <div className="workspace-title">
                <div>
                    <h1>Dashboard</h1>
                    <p>Your tender activity at a glance.</p>
                </div>
                <Link to="/discover" className="quiet-link">
                    View all tenders <ArrowRight size={16} />
                </Link>
            </div>
            {error && (
                <p role="alert" className="inline-error">
                    {error}
                </p>
            )}
            <div className="dashboard-stats">
                {[
                    {
                        icon: FileSearch,
                        value: matched,
                        label: 'Matched tenders',
                        to: '/discover?relevant=true',
                        tone: 'green',
                    },
                    {
                        icon: Bookmark,
                        value: bookmarks.loading ? null : bookmarks.enabled ? bookmarks.ids.size : '—',
                        label: 'Watchlist',
                        to: '/bookmarks',
                        tone: 'green',
                    },
                    {
                        icon: CalendarClock,
                        value: closing,
                        label: 'Closing soon',
                        to: '/discover?status=soon',
                        tone: 'gold',
                    },
                ].map(({ icon: Icon, value, label, to, tone }) => (
                    <Link to={to} className={'dashboard-stat ' + tone} key={label}>
                        <div>
                            <strong>{value ?? '…'}</strong>
                            <span>
                                <Icon size={19} />
                            </span>
                        </div>
                        <p>{label}</p>
                    </Link>
                ))}
            </div>
            <section className="activity-card">
                <div className="card-heading">
                    <h2>Tenders over time</h2>
                    <select aria-label="Activity period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        <option value={30}>Last 30 days</option>
                        <option value={7}>Last 7 days</option>
                    </select>
                </div>
                <div className="activity-chart">
                    <span className="chart-max">{chart.max}</span>
                    <span className="chart-zero">0</span>
                    <svg
                        viewBox="0 0 900 245"
                        role="img"
                        aria-label={chart.count + ' recently published tenders over the last ' + days + ' days'}
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#237643" stopOpacity=".2" />
                                <stop offset="100%" stopColor="#237643" stopOpacity=".015" />
                            </linearGradient>
                        </defs>
                        <path d={chart.line + ' L900,245 L0,245 Z'} fill="url(#activity-fill)" />
                        <path
                            d={chart.line}
                            fill="none"
                            stroke="#075332"
                            strokeWidth="2.5"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>
                <div className="chart-caption">
                    <span>Publication dates from your 200 most recent tenders</span>
                    <span>Today</span>
                </div>
            </section>
            <section className="recent-tenders">
                <div className="card-heading">
                    <h2>Latest opportunities</h2>
                    <Link to="/discover" className="quiet-link">
                        Browse tenders <ArrowRight size={15} />
                    </Link>
                </div>
                {tenders.slice(0, 4).map((t) => (
                    <Link className="recent-row" key={t.id} to={'/tenders/' + t.id}>
                        <span className="recent-icon">
                            <FileSearch size={19} />
                        </span>
                        <div>
                            <h3>{t.title ?? 'Untitled tender'}</h3>
                            <p>{t.organ_of_state ?? 'Buyer not listed'}</p>
                        </div>
                        <span className="recent-date">
                            {t.closing_date ? formatDate(t.closing_date) : 'Date to be confirmed'}
                        </span>
                        <ArrowRight size={16} />
                    </Link>
                ))}
            </section>
            <Link to="/clients" className="directory-link">
                Explore clients and tender coverage by province <ArrowRight size={16} />
            </Link>
        </div>
    )
}
