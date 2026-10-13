import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { EligibilityChip } from '@/components/tender/eligibility-chip'
import { RequirementsSection } from '@/components/tender/requirements-section'
import { Button } from '@/components/ui/button'
import { estimateText, tenderEstimate } from '@/lib/estimate'
import { formatDate, daysUntil, relativeDays } from '@/lib/format'
import { serviceLabel } from '@/lib/service-lines'
import type { Tender } from '@/types'

function Fact({ label, value }: { readonly label: string, readonly value: string })
{
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
        </div>
    )
}

/** Extracts document filenames from the stored JSON, tolerating bad data. */
function documentNames(tender: Tender): string[]
{
    if (tender.support_documents === null) {
        return []
    }

    try {
        const parsed = JSON.parse(tender.support_documents) as Array<{ filename?: string | null }>

        return parsed.map((doc) => doc.filename ?? '').filter((name) => name.length > 0)
    } catch {
        return []
    }
}

interface TenderCaseFileProps
{
    readonly tender: Tender
    readonly bookmarked?: boolean
    readonly onToggleBookmark?: (tenderId: string) => void
}

/** The normalised one-page brief for a tender, shared by Discover, Bookmarks and the route. */
export function TenderCaseFile({ tender, bookmarked = false, onToggleBookmark }: TenderCaseFileProps)
{
    const docs = documentNames(tender)
    const closingIn = tender.closing_date !== null ? daysUntil(tender.closing_date) : null

    return (
        <article className="flex flex-col gap-6 rounded-xl border border-line bg-panel p-6 shadow-panel">
            <header className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="navy">{tender.source ?? 'unknown'}</Badge>
                    {tender.client_type !== null && <Badge>{tender.client_type}</Badge>}
                    <Badge tone={tender.source_status === 'advertised' ? 'success' : 'neutral'}>
                        {tender.source_status}
                    </Badge>
                    {tender.re_advert === 1 && <Badge tone="danger">Re-advertised</Badge>}
                    {serviceLabel(tender.service_line) !== null && <Badge tone="success">{serviceLabel(tender.service_line)}</Badge>}
                    <EligibilityChip state={tender.eligibility?.state} />
                    {bookmarked && <Badge tone="warn">Bookmarked</Badge>}
                </div>
                <h2 className="text-lg font-semibold text-ink">{tender.title ?? 'Untitled tender'}</h2>
                <p className="text-sm text-ink/60">
                    {tender.organ_of_state ?? 'Unknown buyer'}
                    {tender.tender_no !== null && ` · ${tender.tender_no}`}
                </p>
            </header>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Fact
                    label="Closing"
                    value={closingIn !== null ? `${formatDate(tender.closing_date)} (${relativeDays(closingIn)})` : '—'}
                />
                <Fact label="Published" value={formatDate(tender.published_date)} />
                <Fact
                    label="Briefing"
                    value={tender.briefing_date !== null
                        ? formatDate(tender.briefing_date)
                        : (tender.briefing_required ? 'Required' : 'None')}
                />
                <Fact label="Province" value={tender.province ?? '—'} />
                <Fact label="Category" value={tender.category ?? '—'} />
                <Fact label="Est. value" value={estimateText(tenderEstimate(tender))} />
                <Fact label="Bid type" value={tender.bid_type ?? '—'} />
                <Fact label="Validity" value={tender.validity_days !== null ? `${tender.validity_days} days` : '—'} />
                <Fact label="Submission" value={tender.two_envelope ? 'Two-envelope' : 'Standard'} />
            </dl>

            {tender.description !== null && (
                <p className="text-sm leading-relaxed text-ink/70">{tender.description}</p>
            )}

            {tender.eligibility !== undefined && <RequirementsSection eligibility={tender.eligibility} />}

            <section className="flex flex-col gap-2">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Contact</h3>
                <p className="text-sm text-ink/80">
                    {tender.contact_person ?? 'Not listed'}
                    {tender.email !== null && ` · ${tender.email}`}
                    {tender.telephone !== null && ` · ${tender.telephone}`}
                </p>
            </section>

            {docs.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                        Documents ({docs.length})
                    </h3>
                    <ul className="flex flex-col gap-1 text-sm text-ink/80">
                        {docs.map((name) => <li key={name}>{name}</li>)}
                    </ul>
                </section>
            )}

            <footer className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                {onToggleBookmark !== undefined
                    ? (
                        <Button
                            variant={bookmarked ? 'secondary' : 'primary'}
                            onClick={() => onToggleBookmark(tender.id)}
                        >
                            {bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        </Button>
                    )
                    : <Button variant="secondary" disabled>Bookmark</Button>}

                <Link
                    to={`/tenders/${tender.id}`}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                >
                    Open full case file
                </Link>
            </footer>
        </article>
    )
}
