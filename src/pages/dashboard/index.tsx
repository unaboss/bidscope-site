import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPortfolio, getTenderMap } from '@/api'
import { EstimateCompact } from '@/components/tender/estimate-value'
import { EmptyState } from '@/components/ui/empty-state'
import { FeatureGate } from '@/components/ui/locked-feature'
import { IconArrowRight, IconDashboard } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { estimateFrom } from '@/lib/estimate'
import { compactRand, daysUntil, formatDate, relativeDays } from '@/lib/format'
import { serviceLabel } from '@/lib/service-lines'
import { cn } from '@/lib/utils'
import type { Portfolio, PortfolioClient, PortfolioSector, TenderMapResponse, TenderScope } from '@/types'

const SECTOR_LABEL: Record<string, string> = {
    government: 'Government structures',
    'state-owned': 'State-owned',
    external: 'External / private',
}

function Stat({ value, label }: { readonly value: number, readonly label: string })
{
    return (
        <div className="flex min-w-0 flex-col rounded-lg border border-line bg-panel px-3 py-2 shadow-panel sm:px-4 sm:py-3">
            <span className="font-serif text-xl font-semibold text-ink">{value}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</span>
        </div>
    )
}

/** Deliverables shown on a dashboard row before the rest fold into "+N more". */
const DELIVERABLES_SHOWN = 3

/** The understanding job's summary and deliverables, compact enough for a dashboard row. */
function ScopeLines({ scope }: { readonly scope: TenderScope })
{
    const shown = scope.deliverables.slice(0, DELIVERABLES_SHOWN)
    const more = scope.deliverables.length - shown.length

    if (scope.summary === null && shown.length === 0) {
        return null
    }

    return (
        <span className="flex flex-col gap-1.5 pt-0.5">
            {scope.summary !== null && (
                <span className="line-clamp-3 text-xs leading-relaxed text-ink/70">{scope.summary}</span>
            )}
            {shown.length > 0 && (
                <span className="flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-wax">Deliverables</span>
                    {shown.map((item, index) => (
                        <span key={`${item}-${index}`} className="flex items-start gap-1.5 text-xs text-ink/75">
                            <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-wax/70" />
                            <span className="line-clamp-2">{item}</span>
                        </span>
                    ))}
                    {more > 0 && (
                        <span className="ps-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45">+{more} more</span>
                    )}
                </span>
            )}
        </span>
    )
}

interface ClientCardProps
{
    readonly client: PortfolioClient
    readonly openRows: Record<string, boolean>
    readonly onToggleRow: (key: string) => void
}

/**
 * One client: a plain header plus its work-type rows. Mirroring the legacy
 * Intelligence view, the card itself is not a link — only the work-type rows are
 * interactive, and each expands to that work type's tenders.
 */
function ClientCard({ client, openRows, onToggleRow }: ClientCardProps)
{
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3">
                <span className="font-serif text-sm font-semibold text-ink">{client.name}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                    {client.tenderCount} tender{client.tenderCount === 1 ? '' : 's'}
                </span>
            </div>
            <ul className="flex flex-col gap-1">
                {client.services.map((service) =>
                {
                    const key = `${client.name}::${service.code}`
                    const isOpen = openRows[key] === true

                    return (
                        <li key={service.code} className="rounded-md bg-navy/5">
                            <button
                                type="button"
                                onClick={() => onToggleRow(key)}
                                aria-expanded={isOpen}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-navy/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                            >
                                <span className={cn('font-mono text-[10px] text-navy transition-transform', isOpen && 'rotate-90')} aria-hidden="true">▸</span>
                                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-navy">
                                    {serviceLabel(service.code) ?? service.code}
                                </span>
                                <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                    {service.count}
                                    {service.estimatedValue !== null && service.estimatedValue > 0 && ` · avg ${compactRand(service.estimatedValue)}`}
                                </span>
                            </button>

                            {/* One bordered row per tender, so titles never run into each other. */}
                            {isOpen && (
                                <ul className="mx-2 mb-2 mt-1 flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-panel">
                                    {service.tenders.map((tender) => (
                                        <li key={tender.id}>
                                            <Link
                                                to={`/tenders/${tender.id}`}
                                                className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy"
                                            >
                                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <span className="line-clamp-3 text-sm leading-snug text-ink group-hover:underline">
                                                        {tender.title ?? 'Untitled tender'}
                                                    </span>
                                                    {tender.brief !== null && <ScopeLines scope={tender.brief} />}
                                                    <span className="flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                                        <span>
                                                            {tender.closingDate !== null
                                                                ? `Closes ${formatDate(tender.closingDate)} · ${relativeDays(daysUntil(tender.closingDate))}`
                                                                : 'No closing date'}
                                                        </span>
                                                        <EstimateCompact estimate={estimateFrom(tender)} />
                                                    </span>
                                                </span>
                                                <IconArrowRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink/30 transition-colors group-hover:text-navy" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

interface SectorBlockProps
{
    readonly sector: PortfolioSector
    readonly openRows: Record<string, boolean>
    readonly onToggleRow: (key: string) => void
}

function SectorBlock({ sector, openRows, onToggleRow }: SectorBlockProps)
{
    return (
        <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">
                {SECTOR_LABEL[sector.sector] ?? sector.sector}
                <span className="text-ink/40">{sector.clients.length}</span>
            </h3>
            {/* auto-fit: a sector with one or two clients still spans the full width. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
                {sector.clients.map((client) => (
                    <ClientCard key={client.name} client={client} openRows={openRows} onToggleRow={onToggleRow} />
                ))}
            </div>
        </div>
    )
}

const TenderMap = lazy(() => import('@/components/map/tender-map'))

/** Screen left under the map, so its bottom edge shows on first load. */
const MAP_FIT_GAP = 24

/** On screens too short to fit everything, the map keeps this height and the page scrolls a little. */
const MAP_MIN_HEIGHT = 160

/**
 * A height that takes the map from where it sits to just above the bottom of the
 * screen, so the header, stats and map all show without scrolling. It uses the
 * small viewport height (`svh`), so a phone's URL bar showing and hiding while
 * scrolling never resizes the map; only a change in what sits above it does.
 */
function useFitToScreen(): [RefObject<HTMLDivElement | null>, string | undefined]
{
    const ref = useRef<HTMLDivElement>(null)
    const [top, setTop] = useState<number | null>(null)

    useLayoutEffect(() =>
    {
        const element = ref.current

        if (element === null) {
            return
        }

        const measure = (): void => setTop(Math.round(element.getBoundingClientRect().top + window.scrollY))

        measure()
        window.addEventListener('resize', measure)

        // Late web fonts or rewrapped text above the map move it without a window resize.
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
        observer?.observe(document.body)

        return () =>
        {
            window.removeEventListener('resize', measure)
            observer?.disconnect()
        }
    }, [])

    return [ref, top === null ? undefined : `max(${MAP_MIN_HEIGHT}px, calc(100svh - ${top + MAP_FIT_GAP}px))`]
}

/** Where the work is: the tenders this page counts (open and relevant to the org), as pins. */
function PortfolioMap(): ReactElement
{
    const navigate = useNavigate()
    const [frame, height] = useFitToScreen()
    const [points, setPoints] = useState<TenderMapResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() =>
    {
        const controller = new AbortController()

        getTenderMap({ relevantOnly: true }, controller.signal)
            .then(setPoints)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load the map')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [])

    return (
        <div className="flex flex-col gap-2">
            <div ref={frame} style={{ height }} className={cn(height === undefined && 'h-80')}>
                <Suspense fallback={<div aria-hidden="true" className="nt-skeleton h-full rounded-2xl" />}>
                    <TenderMap
                        size="compact"
                        points={points?.points ?? []}
                        unplaced={points?.unplaced ?? 0}
                        loading={loading}
                        onOpen={(id) => navigate(`/tenders/${id}`)}
                    />
                </Suspense>
            </div>
            {error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}
        </div>
    )
}

export function DashboardPage()
{
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const [openRows, setOpenRows] = useState<Record<string, boolean>>({})

    useEffect(() =>
    {
        const controller = new AbortController()

        getPortfolio(controller.signal)
            .then((result) => setPortfolio(result))
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load portfolio')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [])

    function toggleProvince(name: string): void
    {
        setOpen((current) => ({ ...current, [name]: current[name] !== true }))
    }

    function toggleRow(key: string): void
    {
        setOpenRows((current) => ({ ...current, [key]: current[key] !== true }))
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Intelligence"
                title="Clients"
                description="Relevant public-sector clients by province — government, state-owned and external. Expand a client's work type to see its tenders."
            />

            {loading && <p className="text-sm text-ink/60">Loading clients…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && error === '' && portfolio !== null && (
                <>
                    {/* Three across even on a phone, so the stats take two short rows and leave room for the map. */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-6">
                        <Stat value={portfolio.summary.clients} label="clients" />
                        <Stat value={portfolio.summary.tenders} label="tenders" />
                        <Stat value={portfolio.summary.government} label="government" />
                        <Stat value={portfolio.summary.stateOwned} label="state-owned" />
                        <Stat value={portfolio.summary.external} label="external" />
                        <Stat value={portfolio.summary.provinces} label="provinces" />
                    </div>

                    <FeatureGate feature="tender_map" title="See every matched tender on a map" detail="The tender map pins live tenders across South Africa so you can see where the work is. It comes with Growth and Pro.">
                        <PortfolioMap />
                    </FeatureGate>

                    {portfolio.provinces.length === 0 && (
                        <EmptyState
                            icon={<IconDashboard className="size-5" />}
                            title="No relevant clients yet"
                            description="Run a sync to pull live opportunities; relevant clients then group here by province."
                            hint="Phase 3 · portal"
                        />
                    )}

                    <div className="flex flex-col gap-2">
                        {portfolio.provinces.map((province) =>
                        {
                            const isOpen = open[province.province] === true

                            return (
                                <div key={province.province} className="flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => toggleProvince(province.province)}
                                        aria-expanded={isOpen}
                                        className="flex items-center gap-3 rounded-lg border border-navy/25 bg-panel px-4 py-2.5 text-left text-ink transition-colors hover:border-navy/50 hover:bg-navy/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                                    >
                                        <span className={cn('font-mono text-xs transition-transform', isOpen && 'rotate-90')} aria-hidden="true">▸</span>
                                        <span className="font-serif text-base font-semibold">{province.province}</span>
                                        <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.14em] text-navy/80">
                                            {province.sectors.reduce((sum, sector) => sum + sector.clients.length, 0)} clients
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="flex flex-col gap-5 px-2 py-4">
                                            {province.sectors.map((sector) => (
                                                <SectorBlock key={sector.sector} sector={sector} openRows={openRows} onToggleRow={toggleRow} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
