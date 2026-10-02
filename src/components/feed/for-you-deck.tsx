import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { dismissTender, getFeed } from '@/api'
import { FeedEmpty } from '@/components/feed/feed-empty'
import { fromFeedItem } from '@/components/feed/queue-item'
import type { QueueItem } from '@/components/feed/queue-item'
import { prefersReducedMotion, urgencyOf } from '@/components/feed/signals'
import { BriefSkeleton, QueueSkeleton } from '@/components/feed/skeleton'
import { TenderBrief } from '@/components/feed/tender-brief'
import { TenderQueue } from '@/components/feed/tender-queue'
import { InlineError, LiveStatus, ShortcutLegend, Workspace } from '@/components/feed/workspace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconArrowRight, IconBookmark, IconShieldCheck } from '@/components/ui/icons'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/types'

const PAGE_SIZE = 20

/** Rows left in hand before the next page is fetched behind the scenes. */
const TOP_UP_AT = 4

/** Must stay in step with the `animate-retire` duration in `index.css`. */
const RETIRE_MS = 260

function countClosingThisWeek(items: readonly QueueItem[]): number
{
    return items.filter((item) =>
    {
        const { days } = urgencyOf(item.closingDate)

        return days !== null && days <= 7
    }).length
}

interface TriageStripProps
{
    readonly remaining: number
    readonly closingThisWeek: number
    readonly triaged: number
}

interface StatProps
{
    readonly value: number
    readonly label: string
    readonly tone?: 'ink' | 'danger' | 'navy'
}

const STAT_TONE = {
    ink: 'text-ink',
    danger: 'text-danger',
    navy: 'text-navy',
} as const

/** One figure in the session strip: a serif numeral over a mono caption. */
function Stat({ value, label, tone = 'ink' }: StatProps): ReactElement
{
    return (
        // Caption first in the DOM (dt before dd), numeral first on screen.
        <div className="flex flex-col-reverse gap-1 px-5 first:ps-0 last:pe-0">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">{label}</dt>
            <dd className={cn('font-serif text-2xl font-semibold leading-none tabular-nums tracking-tight', STAT_TONE[tone])}>
                {value}
            </dd>
        </div>
    )
}

/**
 * The state of the session at a glance: what is left, what is burning, and how
 * far through the pile you are. The progress bar is the reward for triaging —
 * it is the only thing on the page that fills up.
 */
function TriageStrip({ remaining, closingThisWeek, triaged }: TriageStripProps): ReactElement
{
    const handled = triaged + remaining
    const progress = handled === 0 ? 0 : Math.round((triaged / handled) * 100)

    return (
        <Card asChild className="rounded-2xl">
            <section aria-label="Feed progress" className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <dl className="flex items-stretch divide-x divide-line">
                        <Stat value={remaining} label="Ranked for you" />
                        <Stat value={closingThisWeek} label="Close this week" tone={closingThisWeek > 0 ? 'danger' : 'ink'} />
                        <Stat value={triaged} label="Triaged" tone="navy" />
                    </dl>

                    <ShortcutLegend dismissable />
                </div>

                <div className="flex items-center gap-3">
                    <span
                        role="progressbar"
                        aria-label="Session progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-valuetext={`${triaged} of ${handled} triaged`}
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]"
                    >
                        <span
                            className="block h-full rounded-full bg-navy/70 transition-[width] duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </span>
                    <p aria-hidden="true" className="shrink-0 font-mono text-[10px] uppercase tabular-nums tracking-[0.14em] text-ink/40">
                        {progress}%
                    </p>
                </div>
            </section>
        </Card>
    )
}

/**
 * For You — a triage workspace rather than a deck.
 *
 * The old full-screen snap scroller showed one tender at a time and hid the
 * shape of the pile. This shows the ranked queue and the argument for the
 * selected tender side by side: scan on the left, decide on the right, and on
 * narrow screens the brief folds in beneath its own row.
 */
export function ForYouDeck(): ReactElement
{
    const [items, setItems] = useState<FeedItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')
    const [status, setStatus] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const [retiringId, setRetiringId] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [triaged, setTriaged] = useState(0)
    const fetched = useRef(0)
    const bookmarks = useBookmarks()

    const load = useCallback(async (offset: number, append: boolean, signal?: AbortSignal) =>
    {
        const result = await getFeed('foryou', PAGE_SIZE, offset, signal)
        fetched.current += result.items.length
        setTotal(result.total)
        setItems((current) => (append ? [...current, ...result.items] : result.items))
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        load(0, false, controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load the feed')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [load])

    const queue = useMemo(() => items.map(fromFeedItem), [items])

    // Selection is derived, so a retired row hands the brief to its neighbour
    // without a second render pass fighting over state.
    const active = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null
    const closingThisWeek = useMemo(() => countClosingThisWeek(queue), [queue])
    const rank = active === null ? -1 : queue.findIndex((item) => item.id === active.id)

    async function loadMore(): Promise<void>
    {
        setLoadingMore(true)

        try {
            await load(fetched.current, true)
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not load more tenders')
        } finally {
            setLoadingMore(false)
        }
    }

    async function retire(id: string): Promise<void>
    {
        if (!prefersReducedMotion()) {
            setRetiringId(id)
            await new Promise<void>((resolve) => { window.setTimeout(resolve, RETIRE_MS) })
            setRetiringId(null)
        }

        setItems((current) => current.filter((entry) => entry.id !== id))
    }

    async function act(id: string, action: 'save' | 'dismiss'): Promise<void>
    {
        const index = items.findIndex((entry) => entry.id === id)
        const item = items[index]

        if (item === undefined || busyId !== null) {
            return
        }

        // Hand the brief on before the row leaves, so the pane never blinks.
        const successor = items[index + 1] ?? items[index - 1] ?? null
        const remaining = items.length - 1
        const wasSaved = bookmarks.ids.has(id)
        const title = item.title ?? 'tender'

        setBusyId(id)
        setError('')

        try {
            if (action === 'save') {
                await bookmarks.toggle(id)
            } else {
                await dismissTender(id)
            }

            if (action === 'dismiss') {
                setStatus(`Dismissed ${title}.`)
            } else {
                setStatus(wasSaved ? `Removed ${title} from bookmarks.` : `Saved ${title} to bookmarks.`)
            }

            setTriaged((current) => current + 1)
            setSelectedId(successor?.id ?? null)
            await retire(id)

            if (remaining <= TOP_UP_AT && fetched.current < total) {
                await loadMore()
            }
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Action failed')
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return (
            <Workspace queue={<QueueSkeleton />} brief={<BriefSkeleton />} />
        )
    }

    if (error !== '' && queue.length === 0) {
        return <InlineError message={error} />
    }

    if (queue.length === 0) {
        return (
            <FeedEmpty
                eyebrow="For You"
                icon={<IconShieldCheck className="size-6" />}
                title="You're all caught up"
                description={triaged > 0
                    ? `${triaged} tender${triaged === 1 ? '' : 's'} triaged. Nothing else is ranked for your profile right now — new work appears after the next sync.`
                    : 'Nothing is ranked for your profile right now. New advertised tenders appear here after the next sync.'}
            >
                <Button asChild>
                    <Link to="/bookmarks">
                        <IconBookmark className="size-3.5" />
                        Review your shortlist
                    </Link>
                </Button>
            </FeedEmpty>
        )
    }

    const brief = active === null
        ? <BriefSkeleton />
        : (
            <TenderBrief
                item={active}
                saved={bookmarks.ids.has(active.id)}
                busy={busyId === active.id}
                onSave={() => void act(active.id, 'save')}
                onDismiss={() => void act(active.id, 'dismiss')}
                standing={rank >= 0 ? `Rank ${String(rank + 1).padStart(2, '0')} of ${total}` : null}
            />
        )

    return (
        <div className="flex flex-col gap-4">
            <LiveStatus message={status} />

            <TriageStrip remaining={queue.length} closingThisWeek={closingThisWeek} triaged={triaged} />

            {/* `useBookmarks` absorbs its own failures, so surface them here too. */}
            {error !== '' && <InlineError message={error} />}
            {error === '' && bookmarks.error !== '' && <InlineError message={bookmarks.error} />}

            <Workspace
                brief={brief}
                queue={(
                    <div className="flex flex-col gap-4">
                        <TenderQueue
                            ranked
                            label="Tenders ranked for you"
                            items={queue}
                            activeId={active?.id ?? null}
                            savedIds={bookmarks.ids}
                            busyId={busyId}
                            retiringId={retiringId}
                            onSelect={setSelectedId}
                            onSave={(id) => void act(id, 'save')}
                            onDismiss={(id) => void act(id, 'dismiss')}
                            renderInlineBrief={(item) => (
                                <TenderBrief
                                    variant="inline"
                                    item={item}
                                    saved={bookmarks.ids.has(item.id)}
                                    busy={busyId === item.id}
                                    onSave={() => void act(item.id, 'save')}
                                    onDismiss={() => void act(item.id, 'dismiss')}
                                />
                            )}
                        />

                        {fetched.current < total && (
                            <div className="flex justify-center">
                                <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
                                    {loadingMore ? 'Loading…' : `Load ${Math.min(PAGE_SIZE, total - fetched.current)} more`}
                                    <IconArrowRight className="size-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            />
        </div>
    )
}
