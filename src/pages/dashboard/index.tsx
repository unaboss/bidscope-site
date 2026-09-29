import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPortfolio } from '@/api'
import { EmptyState } from '@/components/ui/empty-state'
import { IconDashboard } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate, formatZAR } from '@/lib/format'
import { serviceLabel } from '@/lib/service-lines'
import { cn } from '@/lib/utils'
import type { Portfolio, PortfolioClient, PortfolioSector } from '@/types'

const SECTOR_LABEL: Record<string, string> = {
    government: 'Government structures',
    'state-owned': 'State-owned',
    external: 'External / private',
}

function Stat({ value, label }: { readonly value: number, readonly label: string })
{
    return (
        <div className="flex min-w-[92px] flex-col rounded-lg border border-line bg-panel px-4 py-3 shadow-panel">
            <span className="font-serif text-xl font-semibold text-ink">{value}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</span>
        </div>
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
                                    {service.estimatedValue !== null && ` · ${formatZAR(service.estimatedValue)}`}
                                </span>
                            </button>

                            {isOpen && (
                                <ul className="flex flex-col gap-1 px-3 pb-2 pt-1">
                                    {service.tenders.map((tender) => (
                                        <li key={tender.id}>
                                            <Link
                                                to={`/tenders/${tender.id}`}
                                                className="flex items-center justify-between gap-3 rounded text-xs text-ink/80 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                                            >
                                                <span>{tender.title ?? 'Untitled tender'}</span>
                                                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                                    closes {formatDate(tender.closingDate)}
                                                </span>
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sector.clients.map((client) => (
                    <ClientCard key={client.name} client={client} openRows={openRows} onToggleRow={onToggleRow} />
                ))}
            </div>
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
                    <div className="flex flex-wrap gap-3">
                        <Stat value={portfolio.summary.clients} label="clients" />
                        <Stat value={portfolio.summary.tenders} label="tenders" />
                        <Stat value={portfolio.summary.government} label="government" />
                        <Stat value={portfolio.summary.stateOwned} label="state-owned" />
                        <Stat value={portfolio.summary.external} label="external" />
                        <Stat value={portfolio.summary.provinces} label="provinces" />
                    </div>

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
                                        className="flex items-center gap-3 rounded-lg bg-ink px-4 py-2.5 text-left text-cream transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                                    >
                                        <span className={cn('font-mono text-xs transition-transform', isOpen && 'rotate-90')} aria-hidden="true">▸</span>
                                        <span className="font-serif text-base font-semibold">{province.province}</span>
                                        <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.14em] text-cream/70">
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
