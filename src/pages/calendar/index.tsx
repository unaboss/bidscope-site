import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CALENDAR_FEED_URL, listBookmarks } from '@/api'
import { MonthGrid } from '@/components/calendar/month-grid'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { IconCalendar, IconDownload } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { buildEvents, eventsByDate, groupByDate, undated, type CalendarEvent, type DateGroup } from '@/lib/calendar'
import { daysUntil, formatDate, relativeDays } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

type CalendarView = 'calendar' | 'timeline'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const

/** Local `YYYY-MM-DD` for a date. */
function isoOf(date: Date): string
{
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

/** Clash type for a day: two closings is a hard conflict, a mix is softer. */
function clash(events: readonly CalendarEvent[]): { tone: BadgeTone, label: string } | null
{
    if (events.length < 2) {
        return null
    }

    const closings = events.filter((event) => event.kind === 'closing').length

    if (closings >= 2) {
        return { tone: 'danger', label: `Closing conflict · ${closings} close` }
    }

    return { tone: 'warn', label: `Briefing overlap · ${events.length} items` }
}

function EventRow({ event }: { readonly event: CalendarEvent })
{
    return (
        <li className="flex items-center gap-3">
            <Badge tone={event.kind === 'briefing' ? 'navy' : 'warn'}>{event.kind}</Badge>
            <Link to={`/tenders/${event.tenderId}`} className="text-sm text-ink/80 underline-offset-2 hover:underline">
                {event.title}
            </Link>
        </li>
    )
}

function DateSection({ group, past }: { readonly group: DateGroup, readonly past: boolean })
{
    const days = daysUntil(group.date)
    const clashInfo = clash(group.events)

    return (
        <li className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-4 shadow-panel">
            <div className="flex flex-wrap items-center gap-2">
                <h3 className={`font-serif text-sm font-semibold ${past ? 'text-ink/50' : 'text-ink'}`}>{formatDate(group.date)}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    {relativeDays(days)}
                </span>
                {clashInfo !== null && <Badge tone={clashInfo.tone}>{clashInfo.label}</Badge>}
            </div>
            <ul className="flex flex-col gap-1.5">
                {group.events.map((event) => <EventRow key={event.id} event={event} />)}
            </ul>
        </li>
    )
}

/** Two dots in the legend, matching the grid markers. */
function Legend()
{
    return (
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-danger" /> Closing date</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-navy" /> Briefing date</span>
        </div>
    )
}

export function CalendarPage()
{
    const [tenders, setTenders] = useState<Tender[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [view, setView] = useState<CalendarView>('calendar')
    const [cursor, setCursor] = useState(() => new Date())
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() =>
    {
        const controller = new AbortController()

        listBookmarks(controller.signal)
            .then((result) => setTenders(result))
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load calendar')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [])

    const today = isoOf(new Date())
    const events = useMemo(() => buildEvents(tenders), [tenders])
    const byDate = useMemo(() => eventsByDate(events), [events])
    const upcoming = useMemo(() => groupByDate(events.filter((event) => daysUntil(event.date) >= 0), true), [events])
    const past = useMemo(() => groupByDate(events.filter((event) => daysUntil(event.date) < 0), false), [events])
    const noDates = useMemo(() => undated(tenders), [tenders])

    function shiftMonth(delta: number): void
    {
        setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
    }

    function goToday(): void
    {
        setCursor(new Date())
        setSelected(today)
    }

    const selectedEvents = selected === null ? [] : (byDate[selected] ?? [])

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Calendar"
                description="Every bookmarked tender's briefing and closing dates — a month view or a timeline — with clash warnings."
                actions={
                    <a
                        href={CALENDAR_FEED_URL}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-panel px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                        <IconDownload className="size-4" />
                        Subscribe (ICS)
                    </a>
                }
            />

            {loading && <p className="text-sm text-ink/60">Loading calendar…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && error === '' && tenders.length === 0 && (
                <EmptyState
                    icon={<IconCalendar className="size-5" />}
                    title="No bookmarks yet"
                    description="Bookmark tenders and all their briefings and closing dates will appear here — past and upcoming."
                    hint="Phase 2 · calendar"
                />
            )}

            {!loading && error === '' && tenders.length > 0 && (
                <div className="flex flex-col gap-6">
                    {/* View toggle */}
                    <div className="flex w-fit gap-1 rounded-lg border border-line bg-panel p-1" role="tablist" aria-label="Calendar view">
                        {([['calendar', 'Calendar'], ['timeline', 'Timeline']] as const).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={view === value}
                                onClick={() => setView(value)}
                                className={cn(
                                    'rounded-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                                    view === value ? 'bg-ink text-cream' : 'text-ink/60 hover:bg-ink/5',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {view === 'calendar' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex size-8 items-center justify-center rounded-md border border-line bg-panel text-ink transition-colors hover:bg-ink/5">‹</button>
                                    <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="flex size-8 items-center justify-center rounded-md border border-line bg-panel text-ink transition-colors hover:bg-ink/5">›</button>
                                </div>
                                <h2 className="font-serif text-lg font-semibold text-ink">
                                    {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                                </h2>
                                <button type="button" onClick={goToday} className="rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5">Today</button>
                                <div className="ms-auto"><Legend /></div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
                                <MonthGrid monthDate={cursor} todayIso={today} selectedIso={selected} byDate={byDate} onSelect={setSelected} />

                                <section className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-panel">
                                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">
                                        {selected === null ? 'Select a day' : formatDate(selected)}
                                    </h3>
                                    {selected === null
                                        ? <p className="text-sm text-ink/50">Pick a day to see its briefings and closings.</p>
                                        : selectedEvents.length === 0
                                            ? <p className="text-sm text-ink/50">No events.</p>
                                            : <ul className="flex flex-col gap-2.5">{selectedEvents.map((event) => <EventRow key={event.id} event={event} />)}</ul>}
                                </section>
                            </div>
                        </div>
                    )}

                    {view === 'timeline' && (
                        <div className="flex flex-col gap-6">
                            {noDates.length > 0 && (
                                <section className="flex flex-col gap-2">
                                    <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">No dates yet ({noDates.length})</h2>
                                    <ul className="flex flex-col gap-1.5 rounded-xl border border-dashed border-line bg-panel px-4 py-3">
                                        {noDates.map((tender) => (
                                            <li key={tender.id}>
                                                <Link to={`/tenders/${tender.id}`} className="text-sm text-ink/70 underline-offset-2 hover:underline">
                                                    {tender.title ?? 'Untitled tender'}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <section className="flex flex-col gap-3">
                                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Upcoming ({upcoming.length})</h2>
                                {upcoming.length === 0
                                    ? <p className="text-sm text-ink/50">No upcoming deadlines.</p>
                                    : <ol className="flex flex-col gap-3">{upcoming.map((group) => <DateSection key={group.date} group={group} past={false} />)}</ol>}
                            </section>

                            {past.length > 0 && (
                                <details className="flex flex-col gap-3">
                                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                                        Past ({past.length})
                                    </summary>
                                    <ol className="mt-3 flex flex-col gap-3">{past.map((group) => <DateSection key={group.date} group={group} past />)}</ol>
                                </details>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
