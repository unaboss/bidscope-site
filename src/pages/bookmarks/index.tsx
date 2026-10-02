import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { addBookmark, listBookmarks, removeBookmark } from '@/api'
import { FeedEmpty } from '@/components/feed/feed-empty'
import { compactRand, prefersReducedMotion, urgencyOf } from '@/components/feed/signals'
import type { UrgencyBand } from '@/components/feed/signals'
import { QueueSkeleton } from '@/components/feed/skeleton'
import { InlineError, LiveStatus } from '@/components/feed/workspace'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconArrowRight, IconBookmark } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { StackedBar } from '@/components/ui/stacked-bar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UndoToast } from '@/components/ui/undo-toast'
import { DeadlineRow } from '@/pages/bookmarks/deadline-row'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

/** Must stay in step with the `animate-retire` duration in `index.css`. */
const RETIRE_MS = 260

/** How long an accidental removal stays undoable. */
const UNDO_MS = 10_000

interface BoardGroup
{
    readonly band: UrgencyBand
    readonly title: string
    /** Tile caption — short enough for a 7rem tile. */
    readonly short: string
    readonly note: string
    readonly accent: string
}

/**
 * The board reads top to bottom as pressure decreasing. Overdue sits first
 * because a closed tender on a shortlist is a job to finish, not a deadline.
 */
const GROUPS: readonly BoardGroup[] = [
    { band: 'overdue', title: 'Closed', short: 'Closed', note: 'The date has passed — clear it, or check whether it was re-advertised.', accent: 'bg-danger' },
    { band: 'week', title: 'Closing this week', short: '7 days', note: 'Submission window. Documents and pricing should already be signed off.', accent: 'bg-danger' },
    { band: 'fortnight', title: 'Next two weeks', short: '14 days', note: 'Pricing, compliance documents and briefing attendance land here.', accent: 'bg-warn' },
    { band: 'month', title: 'Rest of the month', short: '30 days', note: 'Enough runway to qualify the buyer and decide bid or no-bid.', accent: 'bg-warn' },
    { band: 'later', title: 'Later', short: 'Later', note: 'A watching brief. Nothing due yet.', accent: 'bg-navy' },
    { band: 'undated', title: 'No closing date', short: 'No date', note: 'The buyer never published a closing date — confirm it directly.', accent: 'bg-neutral-400' },
]

type BandFilter = UrgencyBand | 'all'

/** Sorted so the most urgent closing dates surface first; undated last. */
function byClosingDate(a: Tender, b: Tender): number
{
    if (a.closing_date === null) {
        return b.closing_date === null ? 0 : 1
    }

    if (b.closing_date === null) {
        return -1
    }

    return a.closing_date.localeCompare(b.closing_date)
}

interface PressureTileProps
{
    readonly count: number
    readonly label: string
    readonly accent: string
    readonly active: boolean
    /** What the band means; shown as a tooltip. */
    readonly note?: string
    readonly onClick: () => void
}

/** A count that is also a filter — the summary and the control are one thing. */
function PressureTile({ count, label, accent, active, note, onClick }: PressureTileProps): ReactElement
{
    const tile = (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'focus-ring-panel group relative flex min-w-[6.5rem] shrink-0 flex-col gap-1.5 overflow-hidden rounded-xl border',
                'px-4 py-3 text-start transition-[border-color,box-shadow,background-color] duration-200',
                active ? 'border-navy/40 bg-panel shadow-panel ring-1 ring-navy/10' : 'border-line bg-cream/60 hover:border-neutral-300 hover:bg-panel',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200',
                    accent,
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                )}
            />
            <span className="font-serif text-2xl font-semibold leading-none tabular-nums text-ink">{count}</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', accent)} />
                {label}
            </span>
        </button>
    )

    if (note === undefined) {
        return tile
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{tile}</TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[16rem] whitespace-normal font-sans text-xs normal-case tracking-normal">
                {note}
            </TooltipContent>
        </Tooltip>
    )
}

interface RemovedTender
{
    readonly id: string
    readonly title: string
}

export function BookmarksPage(): ReactElement
{
    const [tenders, setTenders] = useState<Tender[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [status, setStatus] = useState('')
    const [filter, setFilter] = useState<BandFilter>('all')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [retiringId, setRetiringId] = useState<string | null>(null)
    const [undo, setUndo] = useState<RemovedTender | null>(null)

    const load = useCallback(async (signal?: AbortSignal) =>
    {
        const result = await listBookmarks(signal)
        setTenders(result)
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        load(controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load bookmarks')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [load])

    useEffect(() =>
    {
        if (undo === null) {
            return
        }

        const timer = window.setTimeout(() => setUndo(null), UNDO_MS)

        return () => window.clearTimeout(timer)
    }, [undo])

    const sorted = useMemo(() => [...tenders].sort(byClosingDate), [tenders])

    const grouped = useMemo(() =>
    {
        const buckets = new Map<UrgencyBand, Tender[]>()

        for (const tender of sorted) {
            const { band } = urgencyOf(tender.closing_date)
            const existing = buckets.get(band)

            if (existing === undefined) {
                buckets.set(band, [tender])
            } else {
                existing.push(tender)
            }
        }

        return buckets
    }, [sorted])

    const trackedValue = useMemo(
        () => sorted.reduce((sum, tender) => sum + (tender.estimated_value ?? tender.contract_value ?? 0), 0),
        [sorted],
    )

    const closingSoon = grouped.get('week')?.length ?? 0
    const overdue = grouped.get('overdue')?.length ?? 0

    // A band that empties out (after a removal) must not strand the board.
    const activeFilter: BandFilter = filter !== 'all' && (grouped.get(filter)?.length ?? 0) === 0 ? 'all' : filter
    const visibleGroups = GROUPS.filter((group) =>
    {
        const count = grouped.get(group.band)?.length ?? 0

        return count > 0 && (activeFilter === 'all' || activeFilter === group.band)
    })

    async function remove(tenderId: string): Promise<void>
    {
        const tender = sorted.find((entry) => entry.id === tenderId)

        if (tender === undefined || busyId !== null) {
            return
        }

        setBusyId(tenderId)
        setError('')

        try {
            await removeBookmark(tenderId)

            if (!prefersReducedMotion()) {
                setRetiringId(tenderId)
                await new Promise<void>((resolve) => { window.setTimeout(resolve, RETIRE_MS) })
                setRetiringId(null)
            }

            setExpandedId((current) => (current === tenderId ? null : current))
            setTenders((current) => current.filter((entry) => entry.id !== tenderId))
            setUndo({ id: tenderId, title: tender.title ?? 'Untitled tender' })
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not remove the bookmark')
        } finally {
            setBusyId(null)
        }
    }

    async function restore(): Promise<void>
    {
        if (undo === null) {
            return
        }

        const target = undo
        setBusyId(target.id)
        setUndo(null)
        setError('')

        try {
            await addBookmark(target.id)
            await load()
            setStatus(`Restored ${target.title} to your shortlist.`)
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not restore the bookmark')
            setUndo(target)
        } finally {
            setBusyId(null)
        }
    }

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col gap-6">
                <LiveStatus message={status} />

                <PageHeader
                    eyebrow="Workspace"
                    title="Shortlist"
                    description="Everything you saved, laid out by how much time is left. The board runs from what closes first to what you are only watching."
                    actions={(
                        <div className="flex flex-wrap items-center gap-2">
                            {overdue > 0 && <Badge tone="danger" dot>{overdue} closed</Badge>}
                            {closingSoon > 0 && <Badge tone="warn" dot>{closingSoon} closing this week</Badge>}
                            <Badge tone="navy">{loading ? '…' : `${sorted.length} saved`}</Badge>
                        </div>
                    )}
                />

                {loading && <QueueSkeleton rows={4} />}

                {!loading && error !== '' && <InlineError message={error} />}

                {!loading && sorted.length === 0 && (
                    <FeedEmpty
                        eyebrow="Shortlist"
                        icon={<IconBookmark className="size-6" />}
                        title="Nothing on the shortlist yet"
                        description="Saving a tender puts it on this board and starts the clock. Deadlines group themselves, the nearest ones rise to the top, and briefing dates come along for the ride."
                    >
                        <Button asChild>
                            <Link to="/discover">
                                Find tenders to save
                                <IconArrowRight className="size-3.5" />
                            </Link>
                        </Button>
                    </FeedEmpty>
                )}

                {!loading && sorted.length > 0 && (
                    <>
                        <Card asChild className="rounded-2xl">
                            <section aria-label="Shortlist summary" className="flex flex-col gap-4 p-4 sm:p-5">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                    <p className="font-serif text-lg font-semibold tracking-tight text-ink">
                                        {sorted.length} on the board
                                    </p>
                                    {trackedValue > 0 && (
                                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                                            <span className="tabular-nums text-ink/70">{compactRand(trackedValue)}</span> tracked value
                                        </p>
                                    )}
                                </div>

                                <StackedBar
                                    segments={GROUPS.map((group) => ({
                                        key: group.band,
                                        value: grouped.get(group.band)?.length ?? 0,
                                        tone: group.accent,
                                    }))}
                                    highlight={activeFilter === 'all' ? null : activeFilter}
                                />

                                <ScrollArea className="-mx-1 w-[calc(100%+0.5rem)]">
                                    <div
                                        role="group"
                                        aria-label="Filter the board by closing window"
                                        className="flex w-max gap-2 p-1 pb-3"
                                    >
                                        <PressureTile
                                            count={sorted.length}
                                            label="All"
                                            accent="bg-ink"
                                            active={activeFilter === 'all'}
                                            onClick={() => setFilter('all')}
                                        />
                                        {GROUPS.map((group) =>
                                        {
                                            const count = grouped.get(group.band)?.length ?? 0

                                            if (count === 0) {
                                                return null
                                            }

                                            return (
                                                <PressureTile
                                                    key={group.band}
                                                    count={count}
                                                    label={group.short}
                                                    accent={group.accent}
                                                    note={group.note}
                                                    active={activeFilter === group.band}
                                                    onClick={() => setFilter(group.band)}
                                                />
                                            )
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </section>
                        </Card>

                        <div className="flex flex-col gap-8">
                            {visibleGroups.map((group) =>
                            {
                                const rows = grouped.get(group.band) ?? []

                                return (
                                    <section key={group.band} aria-label={group.title} className="flex flex-col gap-3">
                                        <div className="sticky top-16 z-10 -mx-1 flex flex-col gap-1 bg-cream/90 px-1 py-2 backdrop-blur">
                                            <div className="flex items-center gap-3">
                                                <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', group.accent)} />
                                                <h2 className="font-serif text-base font-semibold tracking-tight text-ink">
                                                    {group.title}
                                                </h2>
                                                <Separator className="flex-1 bg-line" />
                                                <Badge tone="neutral" className="tabular-nums">
                                                    {rows.length}
                                                    <span className="sr-only"> tender{rows.length === 1 ? '' : 's'}</span>
                                                </Badge>
                                            </div>
                                            <p className="ps-5 text-xs leading-snug text-ink/50">{group.note}</p>
                                        </div>

                                        <ul className="flex flex-col gap-2.5">
                                            {rows.map((tender) => (
                                                <DeadlineRow
                                                    key={tender.id}
                                                    tender={tender}
                                                    expanded={expandedId === tender.id}
                                                    busy={busyId === tender.id}
                                                    retiring={retiringId === tender.id}
                                                    onToggle={() => setExpandedId((current) => (current === tender.id ? null : tender.id))}
                                                    onRemove={() => void remove(tender.id)}
                                                />
                                            ))}
                                        </ul>
                                    </section>
                                )
                            })}
                        </div>
                    </>
                )}

                {undo !== null && (
                    <UndoToast
                        key={undo.id}
                        durationMs={UNDO_MS}
                        onUndo={() => void restore()}
                        onDismiss={() => setUndo(null)}
                    >
                        Removed <span className="font-semibold text-ink">{undo.title}</span> from your shortlist.
                    </UndoToast>
                )}
            </div>
        </TooltipProvider>
    )
}
