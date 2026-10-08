import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { listTenders } from '@/api'
import { BrowseFilters, EMPTY_FILTERS } from '@/components/feed/browse-filters'
import type { BrowseFilterState } from '@/components/feed/browse-filters'
import { FeedEmpty } from '@/components/feed/feed-empty'
import { ForYouDeck } from '@/components/feed/for-you-deck'
import { fromTender } from '@/components/feed/queue-item'
import { BriefSkeleton, QueueSkeleton } from '@/components/feed/skeleton'
import { TenderBrief } from '@/components/feed/tender-brief'
import { TenderQueue } from '@/components/feed/tender-queue'
import { InlineError, LiveStatus, Workspace } from '@/components/feed/workspace'
import { Button } from '@/components/ui/button'
import { IconFunnel } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedTabsList } from '@/components/ui/segmented-tabs'
import type { SegmentedTab } from '@/components/ui/segmented-tabs'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { closingWindow } from '@/lib/format'
import type { Tender } from '@/types'

type Mode = 'foryou' | 'browse'

const TABS: ReadonlyArray<SegmentedTab<Mode> & { hint: string }> = [
    { value: 'foryou', label: 'For You', hint: 'Ranked and explained for your profile', icon: <Sparkles className="size-3.5" /> },
    { value: 'browse', label: 'Browse', hint: 'Search and filter the full catalogue', icon: <Search className="size-3.5" /> },
]

/** Milliseconds of quiet before a filter change reaches the API. */
const DEBOUNCE_MS = 200

function BrowseList({ initialSearch }: { readonly initialSearch: string }): ReactElement
{
    const [filters, setFilters] = useState<BrowseFilterState>({ ...EMPTY_FILTERS, search: initialSearch })
    const [tenders, setTenders] = useState<Tender[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [status, setStatus] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const bookmarks = useBookmarks()

    useEffect(() =>
    {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        const windowBounds = closingWindow(Number(filters.windowDays))

        const timer = setTimeout(() =>
        {
            listTenders(
                {
                    search: filters.search.length > 0 ? filters.search : undefined,
                    province: filters.province.length > 0 ? filters.province : undefined,
                    closingFrom: windowBounds.from,
                    closingTo: windowBounds.to,
                    sort: filters.sort,
                    limit: 100,
                },
                controller.signal,
            )
                .then((result) =>
                {
                    setTenders(result.tenders)
                    setTotal(result.total)
                })
                .catch((cause: unknown) =>
                {
                    if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                        setError(cause instanceof Error ? cause.message : 'Failed to load tenders')
                    }
                })
                .finally(() => setLoading(false))
        }, DEBOUNCE_MS)

        return () =>
        {
            clearTimeout(timer)
            controller.abort()
        }
    }, [filters])

    const queue = useMemo(() => tenders.map(fromTender), [tenders])
    const active = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null

    async function save(id: string): Promise<void>
    {
        const item = queue.find((entry) => entry.id === id)

        if (item === undefined || busyId !== null) {
            return
        }

        const wasSaved = bookmarks.ids.has(id)
        setBusyId(id)

        try {
            await bookmarks.toggle(id)
            setStatus(wasSaved ? `Removed ${item.title} from bookmarks.` : `Saved ${item.title} to bookmarks.`)
        } finally {
            setBusyId(null)
        }
    }

    const brief = active === null
        ? <BriefSkeleton />
        : (
            <TenderBrief
                item={active}
                saved={bookmarks.ids.has(active.id)}
                busy={busyId === active.id}
                onSave={() => void save(active.id)}
            />
        )

    return (
        <div className="flex flex-col gap-4">
            <LiveStatus message={status} />

            <BrowseFilters value={filters} onChange={setFilters} resultCount={loading ? null : total} />

            {/* `useBookmarks` absorbs its own failures, so surface them here too. */}
            {error !== '' && <InlineError message={error} />}
            {error === '' && bookmarks.error !== '' && <InlineError message={bookmarks.error} />}

            {loading && <Workspace queue={<QueueSkeleton />} brief={<BriefSkeleton />} />}

            {!loading && error === '' && queue.length === 0 && (
                <FeedEmpty
                    eyebrow="Browse"
                    icon={<IconFunnel className="size-6" />}
                    title="Nothing matches those filters"
                    description="Widen the closing window, drop the province, or search a shorter phrase. The catalogue refreshes with every sync of the advertised tenders."
                >
                    <Button variant="secondary" onClick={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}>
                        Clear filters
                    </Button>
                </FeedEmpty>
            )}

            {!loading && queue.length > 0 && (
                <Workspace
                    brief={brief}
                    queue={(
                        <TenderQueue
                            label="Catalogue search results"
                            items={queue}
                            activeId={active?.id ?? null}
                            savedIds={bookmarks.ids}
                            busyId={busyId}
                            retiringId={null}
                            onSelect={setSelectedId}
                            onSave={(id) => void save(id)}
                            renderInlineBrief={(item) => (
                                <TenderBrief
                                    variant="inline"
                                    item={item}
                                    saved={bookmarks.ids.has(item.id)}
                                    busy={busyId === item.id}
                                    onSave={() => void save(item.id)}
                                />
                            )}
                        />
                    )}
                />
            )}
        </div>
    )
}

function isMode(value: string): value is Mode
{
    return TABS.some((tab) => tab.value === value)
}

/** Radix makes each panel focusable; the primitive already carries the shared ring. */
const PANEL = 'mt-0 rounded-2xl'

/**
 * For You and Browse are not separate screens — they are two ways to fill the
 * same queue, so the source switch is one segmented track with a sliding block
 * (Radix tabs underneath: roles, roving focus and arrow keys come for free).
 */
export function DiscoverPage(): ReactElement
{
    const [params] = useSearchParams()
    const [mode, setMode] = useState<Mode>('foryou')
    const current = TABS.find((tab) => tab.value === mode)

    return (
        <TooltipProvider delayDuration={300}>
            <Tabs
                value={mode}
                onValueChange={(next) =>
                {
                    if (isMode(next)) {
                        setMode(next)
                    }
                }}
                className="flex flex-col gap-6"
            >
                <PageHeader
                    eyebrow="Workspace"
                    title="Discover"
                    description="One queue, two sources. Work the ranked feed until it is empty, or search the whole catalogue — either way the brief tells you why a tender is worth your afternoon."
                    actions={<SegmentedTabsList tabs={TABS} value={mode} label="Discover source" />}
                />

                <p className="-mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-wax/70" />
                    {current?.hint}
                </p>

                <TabsContent value="foryou" className={PANEL}>
                    <ForYouDeck />
                </TabsContent>
                <TabsContent value="browse" className={PANEL}>
                    <BrowseList initialSearch={params.get('search') ?? ''} />
                </TabsContent>
            </Tabs>
        </TooltipProvider>
    )
}
