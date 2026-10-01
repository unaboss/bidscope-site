import { useEffect, useId, useMemo, useState } from 'react'
import type { KeyboardEvent, ReactElement } from 'react'
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
import { useBookmarks } from '@/hooks/use-bookmarks'
import { closingWindow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

type Mode = 'foryou' | 'browse'

const TABS: ReadonlyArray<{ value: Mode, label: string, hint: string }> = [
    { value: 'foryou', label: 'For You', hint: 'Ranked and explained for your profile' },
    { value: 'browse', label: 'Browse', hint: 'Search and filter the full catalogue' },
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

interface ModeSwitchProps
{
    readonly mode: Mode
    readonly onChange: (next: Mode) => void
    readonly idPrefix: string
}

/**
 * The source switch.
 *
 * For You and Browse are no longer separate screens — they are two ways to fill
 * the same queue, so the control is a single track with a sliding block rather
 * than two unrelated buttons.
 */
function ModeSwitch({ mode, onChange, idPrefix }: ModeSwitchProps): ReactElement
{
    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void
    {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return
        }

        event.preventDefault()
        const index = TABS.findIndex((tab) => tab.value === mode)
        const next = TABS[event.key === 'ArrowRight' ? (index + 1) % TABS.length : (index + TABS.length - 1) % TABS.length]

        if (next !== undefined) {
            onChange(next.value)
            document.getElementById(`${idPrefix}-tab-${next.value}`)?.focus()
        }
    }

    return (
        <div
            role="tablist"
            aria-label="Discover source"
            onKeyDown={handleKeyDown}
            className="relative inline-grid grid-cols-2 rounded-xl border border-line bg-panel p-1 shadow-panel"
        >
            <span
                aria-hidden="true"
                className={cn(
                    'absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-lg bg-ink',
                    'transition-transform duration-300 ease-out',
                    mode === 'browse' && 'translate-x-full',
                )}
            />

            {TABS.map((tab) => (
                <button
                    key={tab.value}
                    id={`${idPrefix}-tab-${tab.value}`}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.value}
                    aria-controls={`${idPrefix}-panel-${tab.value}`}
                    tabIndex={mode === tab.value ? 0 : -1}
                    title={tab.hint}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        'focus-ring-panel relative z-10 rounded-lg px-6 py-2 font-mono text-[11px] uppercase tracking-[0.14em]',
                        'transition-colors duration-200',
                        mode === tab.value ? 'text-cream' : 'text-ink/55 hover:text-ink',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export function DiscoverPage(): ReactElement
{
    const [params] = useSearchParams()
    const [mode, setMode] = useState<Mode>('foryou')
    const idPrefix = useId()
    const current = TABS.find((tab) => tab.value === mode)

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Discover"
                description="One queue, two sources. Work the ranked feed until it is empty, or search the whole catalogue — either way the brief on the right tells you why a tender is worth your afternoon."
                actions={<ModeSwitch mode={mode} onChange={setMode} idPrefix={idPrefix} />}
            />

            <p className="-mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">{current?.hint}</p>

            <div
                role="tabpanel"
                id={`${idPrefix}-panel-${mode}`}
                aria-labelledby={`${idPrefix}-tab-${mode}`}
            >
                {mode === 'foryou' && <ForYouDeck />}
                {mode === 'browse' && <BrowseList initialSearch={params.get('search') ?? ''} />}
            </div>
        </div>
    )
}
