import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Layers, List, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dismissTender, getFeed } from '@/api'
import { FeedEmpty } from '@/components/feed/feed-empty'
import { fromFeedItem } from '@/components/feed/queue-item'
import { prefersReducedMotion } from '@/components/feed/signals'
import { BriefSkeleton } from '@/components/feed/skeleton'
import { TenderBrief } from '@/components/feed/tender-brief'
import { SwipeDeck } from '@/components/feed/swipe-deck'
import type { SwipeDecision } from '@/components/feed/swipe-deck'
import { TenderQueue } from '@/components/feed/tender-queue'
import { InlineError, LiveStatus, ShortcutLegend, Workspace } from '@/components/feed/workspace'
import { Button } from '@/components/ui/button'
import { IconArrowRight, IconBookmark, IconShieldCheck } from '@/components/ui/icons'
import { SegmentedTabsList } from '@/components/ui/segmented-tabs'
import type { SegmentedTab } from '@/components/ui/segmented-tabs'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/types'

const PAGE_SIZE = 20

/** Rows left in hand before the next page is fetched behind the scenes. */
const TOP_UP_AT = 4

/** Must stay in step with the `animate-retire` duration in `index.css`. */
const RETIRE_MS = 260

type DeckView = 'swipe' | 'list'

const VIEW_KEY = 'bidscope.foryou.view'

/** The remembered view; swipe unless this browser last chose the list. */
function storedView(): DeckView
{
    try {
        return window.localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'swipe'
    } catch {
        return 'swipe'
    }
}

function rememberView(view: DeckView): void
{
    try {
        window.localStorage.setItem(VIEW_KEY, view)
    } catch {
        // Private windows can refuse storage; the toggle still works for this visit.
    }
}

const VIEWS: ReadonlyArray<SegmentedTab<DeckView>> = [
    { value: 'swipe', label: 'Swipe', icon: <Layers className="size-3.5" /> },
    { value: 'list', label: 'List', icon: <List className="size-3.5" /> },
]

function isView(value: string): value is DeckView
{
    return value === 'swipe' || value === 'list'
}

/** The fanned card backs on the cover: a hint of the pile, with no tender on show. */
function CatalogStack(): ReactElement
{
    return (
        <div aria-hidden="true" className="relative me-4 hidden h-40 w-48 shrink-0 md:block">
            {[-9, -3, 4].map((tilt, index) => (
                <div
                    key={tilt}
                    className="absolute inset-0 flex flex-col gap-2.5 rounded-xl border border-line bg-cream p-4 shadow-panel"
                    style={{ transform: `translate3d(${index * 14}px, ${index * -8}px, 0) rotate(${tilt}deg)` }}
                >
                    <span className="h-1.5 w-12 rounded-full bg-wax/50" />
                    <span className="h-3 w-full rounded-full bg-ink/10" />
                    <span className="h-3 w-4/5 rounded-full bg-ink/10" />
                    <span className="h-2 w-1/2 rounded-full bg-ink/[0.07]" />
                    <span className="mt-auto flex gap-1.5">
                        <span className="h-4 w-14 rounded-full bg-success/20" />
                        <span className="h-4 w-10 rounded-full bg-navy/20" />
                    </span>
                </div>
            ))}
        </div>
    )
}

interface CatalogCoverProps
{
    readonly remaining: number
    readonly triaged: number
    readonly onOpen: () => void
}

/** What For You shows before the catalog opens: the size of the pile and the way in. */
function CatalogCover({ remaining, triaged, onOpen }: CatalogCoverProps): ReactElement
{
    return (
        <section aria-labelledby="foryou-cover-title" className="nt-grain animate-rise relative overflow-hidden rounded-2xl border border-line bg-panel shadow-panel">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy/40 to-transparent" />

            <div className="flex items-center justify-between gap-10 px-6 py-7 sm:px-8">
                <div className="flex max-w-2xl flex-col gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">Your catalog</span>
                    <h2 id="foryou-cover-title" className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
                        <span className="tabular-nums text-navy">{remaining}</span> tender{remaining === 1 ? '' : 's'} ranked for your profile
                    </h2>
                    <p className="text-sm leading-relaxed text-ink/70">
                        Each card shows what the work delivers, what you need to qualify and why it was picked for you.
                        Swipe through them one at a time, or switch to the list.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                        <Button onClick={onOpen} className="h-11 px-6">
                            <Layers aria-hidden="true" className="size-4" />
                            View catalog
                        </Button>
                        {triaged > 0 && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                                {triaged} worked through this visit
                            </span>
                        )}
                    </div>
                </div>

                <CatalogStack />
            </div>
        </section>
    )
}

/**
 * For You opens on a cover, not on the cards. "View catalog" lifts the ranked
 * pile into a large window over the page, where it can be swiped one card at a
 * time or worked as a list; the page stays in view, dimmed, behind it.
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
    const [view, setView] = useState<DeckView>(storedView)
    const [open, setOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)
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

    /**
     * Saves (or unsaves) or dismisses a tender and retires it from the queue.
     * `swiped` means the card already flew off: skip the row animation, and a
     * right swipe only ever bookmarks, never removes an existing bookmark.
     * Resolves false when nothing happened, so a swiped card can come back.
     */
    async function act(id: string, action: 'save' | 'dismiss', swiped = false): Promise<boolean>
    {
        const index = items.findIndex((entry) => entry.id === id)
        const item = items[index]

        if (item === undefined || busyId !== null) {
            return false
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
                if (!(swiped && wasSaved)) {
                    await bookmarks.toggle(id)
                }
            } else {
                await dismissTender(id)
            }

            if (action === 'dismiss') {
                setStatus(`Dismissed ${title}.`)
            } else {
                setStatus(wasSaved && !swiped ? `Removed ${title} from bookmarks.` : `Saved ${title} to bookmarks.`)
            }

            setTriaged((current) => current + 1)
            setSelectedId(successor?.id ?? null)

            if (swiped) {
                setItems((current) => current.filter((entry) => entry.id !== id))
            } else {
                await retire(id)
            }

            if (remaining <= TOP_UP_AT && fetched.current < total) {
                await loadMore()
            }

            return true
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Action failed')

            return false
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return <div aria-hidden="true" className="nt-skeleton h-72 rounded-2xl" />
    }

    if (error !== '' && queue.length === 0 && !open) {
        return <InlineError message={error} />
    }

    const caughtUp = (
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
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <LiveStatus message={status} />

            {queue.length === 0
                ? caughtUp
                : <CatalogCover remaining={Math.max(total - triaged, queue.length)} triaged={triaged} onOpen={() => setOpen(true)} />}

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-night/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

                <Dialog.Content
                    ref={panel}
                    aria-describedby={undefined}
                    // Focus the window itself, so the arrow keys swipe straight away
                    // instead of moving between the Swipe and List tabs.
                    onOpenAutoFocus={(event) =>
                    {
                        event.preventDefault()
                        panel.current?.focus()
                    }}
                    className={cn(
                        'fixed inset-0 z-50 m-auto flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden',
                        'rounded-2xl border border-line bg-cream text-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75)] outline-none',
                        'sm:h-[min(900px,calc(100dvh-3rem))] sm:w-[calc(100vw-3rem)] lg:w-[min(1600px,84vw)]',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:slide-in-from-bottom-4 data-[state=open]:duration-300',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97] data-[state=closed]:duration-200',
                        'motion-reduce:animate-none',
                    )}
                >
                    <Tabs
                        value={view}
                        onValueChange={(next) =>
                        {
                            if (isView(next)) {
                                setView(next)
                                rememberView(next)
                            }
                        }}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-panel px-4 py-3 sm:px-6">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">For you</span>
                                <Dialog.Title className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink">
                                    Catalog
                                    <span className="ms-2 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-ink/45">
                                        {queue.length === 0 ? 'Cleared' : `${Math.max(total - triaged, queue.length)} ranked`}
                                    </span>
                                </Dialog.Title>
                            </div>

                            <div className="flex items-center gap-3">
                                <SegmentedTabsList tabs={VIEWS} value={view} label="Catalog view" />
                                <Dialog.Close asChild>
                                    <Button variant="secondary" className="h-10 px-3 sm:px-4">
                                        <X aria-hidden="true" className="size-4" />
                                        <span className="sr-only sm:not-sr-only">Close</span>
                                    </Button>
                                </Dialog.Close>
                            </div>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            <div className="flex min-h-full flex-col gap-4">
                                {/* `useBookmarks` absorbs its own failures, so surface them here too. */}
                                {error !== '' && <InlineError message={error} />}
                                {error === '' && bookmarks.error !== '' && <InlineError message={bookmarks.error} />}

                                {queue.length === 0 && caughtUp}

                                {queue.length > 0 && (
                                    <>
                                        <TabsContent
                                            value="swipe"
                                            className="my-auto rounded-2xl py-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-left-6 data-[state=active]:duration-300 motion-reduce:animate-none"
                                        >
                                            <SwipeDeck
                                                items={queue}
                                                savedIds={bookmarks.ids}
                                                total={total}
                                                triaged={triaged}
                                                busy={busyId !== null}
                                                onDecide={(id: string, decision: SwipeDecision) => act(id, decision === 'save' ? 'save' : 'dismiss', true)}
                                            />
                                        </TabsContent>

                                        <TabsContent
                                            value="list"
                                            className="mt-0 flex flex-col gap-4 rounded-2xl data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-6 data-[state=active]:duration-300 motion-reduce:animate-none"
                                        >
                                            <ShortcutLegend dismissable className="justify-end" />
                                            <Workspace
                                                framed
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
                                        </TabsContent>
                                    </>
                                )}
                            </div>
                        </div>
                    </Tabs>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
