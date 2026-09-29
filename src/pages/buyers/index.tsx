import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getBuyerProfile, listBuyers } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/controls'
import { EmptyState } from '@/components/ui/empty-state'
import { IconBuilding } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate, formatZAR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BuyerProfile, BuyerSummary } from '@/types'

function Stat({ label, value }: { readonly label: string, readonly value: string })
{
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
        </div>
    )
}

function Profile({ profile }: { readonly profile: BuyerProfile })
{
    return (
        <article className="flex flex-col gap-5 rounded-xl border border-line bg-panel p-6 shadow-panel">
            <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">{profile.organ}</h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">Buyer profile</p>
            </header>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Open tenders" value={String(profile.openTenders)} />
                <Stat label="Awards on record" value={String(profile.awards)} />
                <Stat label="Median award" value={profile.medianAward === null ? '—' : formatZAR(profile.medianAward)} />
                <Stat label="Decision speed" value={profile.decisionSpeedDays === null ? '—' : `${profile.decisionSpeedDays} days`} />
            </dl>

            {profile.topSuppliers.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Frequent winners</h3>
                    <ul className="flex flex-col gap-1 text-sm text-ink/80">
                        {profile.topSuppliers.map((supplier) => (
                            <li key={supplier.supplier} className="flex items-center justify-between gap-3">
                                <span>{supplier.supplier}</span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                    {supplier.count} wins{supplier.total > 0 && ` · ${formatZAR(supplier.total)}`}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {profile.categories.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">What they buy</h3>
                    <ul className="flex flex-col gap-1 text-sm text-ink/80">
                        {profile.categories.slice(0, 6).map((category) => (
                            <li key={category.category} className="flex items-center justify-between gap-3">
                                <span>{category.category}</span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                    {category.count}{category.median !== null && ` · ${formatZAR(category.median)} median`}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {profile.recentAwards.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Recent awards</h3>
                    <ul className="flex flex-col gap-1 text-sm text-ink/80">
                        {profile.recentAwards.map((award, index) => (
                            <li key={`${award.tenderNo ?? 'award'}-${index}`} className="flex items-center justify-between gap-3">
                                <span>{award.supplier ?? award.tenderNo ?? 'Unknown'}</span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                    {award.amount === null ? '—' : formatZAR(award.amount)} · {formatDate(award.awardDate)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </article>
    )
}

export function BuyersPage()
{
    const [params] = useSearchParams()
    const [search, setSearch] = useState('')
    const [buyers, setBuyers] = useState<BuyerSummary[]>([])
    const [selected, setSelected] = useState<string | null>(params.get('name'))
    const [profile, setProfile] = useState<BuyerProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() =>
    {
        const controller = new AbortController()
        setLoading(true)

        const timer = setTimeout(() =>
        {
            listBuyers(search.length > 0 ? search : undefined, controller.signal)
                .then((result) => setBuyers(result))
                .catch((cause: unknown) =>
                {
                    if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                        setError(cause instanceof Error ? cause.message : 'Failed to load buyers')
                    }
                })
                .finally(() => setLoading(false))
        }, 200)

        return () =>
        {
            clearTimeout(timer)
            controller.abort()
        }
    }, [search])

    const activeOrgan = selected ?? buyers[0]?.organ ?? null

    useEffect(() =>
    {
        if (activeOrgan === null) {
            return
        }

        const controller = new AbortController()
        setProfile(null)

        getBuyerProfile(activeOrgan, controller.signal)
            .then((result) => setProfile(result))
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load profile')
                }
            })

        return () => controller.abort()
    }, [activeOrgan])

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Intelligence"
                title="Buyers"
                description="Issuer profiles — how often a buyer tenders, what they buy, at what value, and who wins."
            />

            <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search buyers…"
                aria-label="Search buyers"
            />

            {loading && <p className="text-sm text-ink/60">Loading buyers…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && error === '' && buyers.length === 0 && (
                <EmptyState
                    icon={<IconBuilding className="size-5" />}
                    title="No buyer history yet"
                    description="Profiles are built from ingested tenders and awards. Run a sync to populate them."
                    hint="Phase 5 · buyer profiles"
                />
            )}

            {!loading && error === '' && buyers.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <ul className="flex flex-col gap-2">
                        {buyers.map((buyer) =>
                        {
                            const isActive = activeOrgan === buyer.organ

                            return (
                                <li key={buyer.organ}>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(buyer.organ)}
                                        aria-current={isActive}
                                        className={cn(
                                            'flex w-full flex-col gap-1 rounded-lg border bg-panel px-4 py-3 text-left transition-colors',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                                            isActive ? 'border-navy/40 bg-navy/5' : 'border-line hover:bg-ink/5',
                                        )}
                                    >
                                        <span className="text-sm font-medium text-ink">{buyer.organ}</span>
                                        <span className="mt-1 flex flex-wrap items-center gap-2">
                                            <Badge tone="navy">{buyer.openTenders} open</Badge>
                                            {buyer.awards > 0 && <Badge>{buyer.awards} awards</Badge>}
                                            {buyer.averageAward !== null && (
                                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                                    avg {formatZAR(buyer.averageAward)}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    <section aria-label="Buyer profile" className="lg:sticky lg:top-24 lg:self-start">
                        {profile !== null
                            ? <Profile profile={profile} />
                            : <p className="text-sm text-ink/60">Loading profile…</p>}
                    </section>
                </div>
            )}
        </div>
    )
}
