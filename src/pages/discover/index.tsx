import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listTenders } from '@/api'
import { ForYouDeck } from '@/components/feed/for-you-deck'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/controls'
import { EmptyState } from '@/components/ui/empty-state'
import { IconFunnel } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { closingWindow, formatDate } from '@/lib/format'
import { serviceLabel } from '@/lib/service-lines'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

const PROVINCES = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
] as const

const WINDOWS: ReadonlyArray<{ value: string, label: string }> = [
    { value: '0', label: 'Any closing date' },
    { value: '7', label: 'Closing within 7 days' },
    { value: '30', label: 'Closing within 30 days' },
]

const SORTS: ReadonlyArray<{ value: string, label: string }> = [
    { value: 'relevant', label: 'Most relevant' },
    { value: 'closing', label: 'Closing soonest' },
    { value: 'newest', label: 'Newest' },
]

type Mode = 'foryou' | 'browse'

const TABS: ReadonlyArray<{ value: Mode, label: string }> = [
    { value: 'foryou', label: 'For You' },
    { value: 'browse', label: 'Browse' },
]

function BrowseList({ initialSearch }: { readonly initialSearch: string })
{
    const [search, setSearch] = useState(initialSearch)
    const [province, setProvince] = useState('')
    const [windowDays, setWindowDays] = useState('0')
    const [sort, setSort] = useState('relevant')
    const [tenders, setTenders] = useState<Tender[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const bookmarks = useBookmarks()

    useEffect(() =>
    {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        const windowBounds = closingWindow(Number(windowDays))

        const timer = setTimeout(() =>
        {
            listTenders(
                {
                    search: search.length > 0 ? search : undefined,
                    province: province.length > 0 ? province : undefined,
                    closingFrom: windowBounds.from,
                    closingTo: windowBounds.to,
                    sort,
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
        }, 200)

        return () =>
        {
            clearTimeout(timer)
            controller.abort()
        }
    }, [search, province, windowDays, sort])

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, reference…"
                    aria-label="Search tenders"
                />
                <Select value={province} onChange={(event) => setProvince(event.target.value)} aria-label="Filter by province">
                    <option value="">All provinces</option>
                    {PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
                </Select>
                <Select value={windowDays} onChange={(event) => setWindowDays(event.target.value)} aria-label="Filter by closing window">
                    {WINDOWS.map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}
                </Select>
                <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tenders">
                    {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
            </div>

            {loading && <p className="text-sm text-ink/60">Loading tenders…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && error === '' && tenders.length === 0 && (
                <EmptyState
                    icon={<IconFunnel className="size-5" />}
                    title="No tenders match"
                    description="Adjust the search or filters, or run a sync to pull the latest advertised tenders."
                    hint="Browse"
                />
            )}

            {!loading && error === '' && tenders.length > 0 && (
                <>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{total} tenders</p>
                    <ul className="flex flex-col gap-3">
                        {tenders.map((tender) => (
                            <li key={tender.id}>
                                <Link
                                    to={`/tenders/${tender.id}`}
                                    className="flex flex-col gap-2 rounded-lg border border-line bg-panel px-5 py-4 shadow-panel transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <span className="font-serif text-base font-semibold leading-snug text-ink">
                                            {tender.title ?? 'Untitled tender'}
                                        </span>
                                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-wax">
                                            closes {formatDate(tender.closing_date)}
                                        </span>
                                    </div>
                                    <span className="text-sm text-ink/60">{tender.organ_of_state ?? 'Unknown buyer'}</span>
                                    <span className="mt-1 flex flex-wrap items-center gap-2">
                                        {tender.relevance === 'relevant' && <Badge tone="success">Relevant</Badge>}
                                        {serviceLabel(tender.service_line) !== null && <Badge tone="navy">{serviceLabel(tender.service_line)}</Badge>}
                                        {tender.province !== null && <Badge>{tender.province}</Badge>}
                                        {tender.re_advert === 1 && <Badge tone="danger">Re-advertised</Badge>}
                                        {bookmarks.ids.has(tender.id) && <Badge tone="warn">Bookmarked</Badge>}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}

export function DiscoverPage()
{
    const [params] = useSearchParams()
    const [mode, setMode] = useState<Mode>('foryou')

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Discover"
                description="A ranked feed tuned to your services, an optimisation feed for adjacent work, or browse the full catalogue."
            />

            <div className="flex w-fit gap-1 rounded-lg border border-line bg-panel p-1" role="tablist" aria-label="Discover view">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={mode === tab.value}
                        onClick={() => setMode(tab.value)}
                        className={cn(
                            'rounded-md px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                            mode === tab.value ? 'bg-ink text-cream' : 'text-ink/60 hover:bg-ink/5',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {mode === 'foryou' && <ForYouDeck />}
            {mode === 'browse' && <BrowseList initialSearch={params.get('search') ?? ''} />}
        </div>
    )
}
