import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTender } from '@/api'
import { EstimateValue } from '@/components/tender/estimate-value'
import { RequirementsList } from '@/components/tender/requirements-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IconArrowRight, IconQuote } from '@/components/ui/icons'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { estimateNote, tenderEstimate } from '@/lib/estimate'
import { daysUntil, formatDate, relativeDays } from '@/lib/format'
import { UpgradeLink } from '@/lib/preview'
import { buildDeepLink, isVerifiedRef, sourceSite } from '@/lib/sources'
import { serviceLabel } from '@/lib/service-lines'
import type { Tender, TenderScope } from '@/types'

interface DocumentLink
{
    readonly name: string
    readonly url: string | null
}

function documents(tender: Tender): DocumentLink[]
{
    if (tender.support_documents === null) {
        return []
    }

    try {
        const parsed = JSON.parse(tender.support_documents) as Array<{ filename?: string | null, url?: string | null }>

        return parsed
            .map((doc) => ({ name: doc.filename ?? '', url: doc.url ?? null }))
            .filter((doc) => doc.name.length > 0)
    } catch {
        return []
    }
}

function Row({ label, children }: { readonly label: string, readonly children: ReactNode })
{
    return (
        <div className="flex flex-col gap-0.5 border-b border-line/60 py-2 last:border-0 sm:flex-row sm:gap-4">
            <dt className="shrink-0 font-mono sm:w-36 text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</dt>
            <dd className="min-w-0 text-sm text-ink [overflow-wrap:anywhere]">{children}</dd>
        </div>
    )
}

function Panel({ title, children }: { readonly title: string, readonly children: ReactNode })
{
    return (
        <section className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-panel p-5 shadow-panel">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">{title}</h2>
            {children}
        </section>
    )
}

const BASIS_NOTE: Record<string, string> = {
    full_documents: 'Read from the tender documents.',
    'title+desc': 'Read from the title and description only. The documents may say more.',
    title_only: 'Read from the title only. Check the documents for the full scope.',
}

/** The understanding job's read of the tender: what it is for and what has to be delivered. */
function ScopePanel({ scope }: { readonly scope: TenderScope })
{
    if (scope.summary === null && scope.deliverables.length === 0) {
        return null
    }

    const note = scope.basis !== null ? BASIS_NOTE[scope.basis] : undefined

    return (
        <Panel title="Summary">
            {scope.summary !== null && <p className="text-sm leading-relaxed text-ink/85">{scope.summary}</p>}

            {scope.deliverables.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Deliverables</h3>
                    <ul className="flex flex-col gap-1">
                        {scope.deliverables.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-ink/85">
                                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-wax/70" />
                                <span className="[overflow-wrap:anywhere]">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {scope.skills.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Trades and skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {scope.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
                    </div>
                </div>
            )}

            {note !== undefined && <p className="pt-1 text-xs text-ink/50">{note}</p>}
        </Panel>
    )
}

export function TenderDetailPage()
{
    const { id } = useParams()
    const navigate = useNavigate()
    const [tender, setTender] = useState<Tender | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const bookmarks = useBookmarks()

    useEffect(() =>
    {
        if (id === undefined) {
            return
        }

        const controller = new AbortController()
        setLoading(true)
        setError('')

        getTender(id, controller.signal)
            .then((result) => setTender(result))
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load tender')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [id])

    function goBack(): void
    {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/discover')
        }
    }

    async function copyRef(ref: string): Promise<void>
    {
        try {
            await navigator.clipboard.writeText(ref)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // clipboard unavailable; silently ignore
        }
    }

    const back = (
        <button
            type="button"
            onClick={goBack}
            className="w-fit font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
            ← Back
        </button>
    )

    if (loading) {
        return <div className="flex flex-col gap-6">{back}<p className="text-sm text-ink/60">Loading tender…</p></div>
    }

    if (error !== '' || tender === null) {
        return (
            <div className="flex flex-col gap-6">
                {back}
                <EmptyState
                    icon={<IconQuote className="size-5" />}
                    title="Tender not found"
                    description={error !== '' ? error : 'This tender could not be loaded.'}
                    hint="Tender"
                />
            </div>
        )
    }

    const site = sourceSite(tender.source)
    const deepLink = buildDeepLink(tender.source, tender.support_documents, tender.raw_id)
    const refVerified = isVerifiedRef(tender.tender_no)
    const showSourceSearchHint = tender.source === 'etenders' || tender.source === 'ocds'
    const docs = documents(tender)
    const closingIn = tender.closing_date !== null ? daysUntil(tender.closing_date) : null
    const isSaved = bookmarks.ids.has(tender.id)
    const briefing = tender.briefing_date !== null
        ? [
            formatDate(tender.briefing_date),
            tender.briefing_compulsory === 1 ? 'compulsory' : null,
            daysUntil(tender.briefing_date) < 0 ? 'briefing passed' : null,
        ].filter((part): part is string => part !== null).join(' · ')
        : (tender.briefing_required ? 'Required' : 'None')
    const estimate = tenderEstimate(tender)
    const estimateWhy = estimate !== null ? estimateNote(estimate, tender.estimate_quote ?? null) : null

    return (
        <div className="flex flex-col gap-6">
            {back}

            {/* Cover sheet */}
            <header className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-panel sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="navy">{site?.name ?? tender.source ?? 'unknown'}</Badge>
                    {tender.relevance === 'relevant' && <Badge tone="success">Relevant</Badge>}
                    {serviceLabel(tender.service_line) !== null && <Badge tone="navy">{serviceLabel(tender.service_line)}</Badge>}
                    {tender.client_type !== null && <Badge>{tender.client_type}</Badge>}
                    <Badge tone={tender.source_status === 'advertised' ? 'success' : 'neutral'}>{tender.source_status}</Badge>
                    {tender.re_advert === 1 && <Badge tone="danger">Re-advertised</Badge>}
                </div>

                <h1 className="font-serif text-2xl font-semibold leading-snug text-ink [overflow-wrap:anywhere] sm:text-3xl">
                    {tender.title ?? 'Untitled tender'}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
                    <span>{tender.organ_of_state ?? 'Unknown buyer'}</span>
                    {tender.tender_no !== null && (
                        <span className="flex items-center gap-2">
                            <span className="font-mono text-xs">{tender.tender_no}</span>
                            <button
                                type="button"
                                onClick={() => void copyRef(tender.tender_no ?? '')}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            {!refVerified && (
                                <span title="This reference came back from the source empty, all-zero, or too short — it may not resolve if you search for it elsewhere.">
                                    <Badge tone="danger">unverified</Badge>
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {showSourceSearchHint && (
                    <p className="text-xs text-ink/55">
                        On eTenders, switch <span className="font-semibold">“Search by”</span> to <span className="font-semibold">“Tender No”</span> before pasting the copied code — the default search looks at tender names, not reference numbers.
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-wax">
                        {tender.closing_date !== null
                            ? `closes ${formatDate(tender.closing_date)}${closingIn !== null ? ` (${relativeDays(closingIn)})` : ''}`
                            : 'no closing date'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    {bookmarks.enabled ? (
                        <Button
                            variant={isSaved ? 'secondary' : 'primary'}
                            onClick={() => void bookmarks.toggle(tender.id)}
                        >
                            {isSaved ? 'Remove bookmark' : 'Bookmark'}
                        </Button>
                    ) : (
                        <UpgradeLink className="inline-flex h-10 items-center rounded-md border border-wax/40 px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-wax hover:bg-wax/10">
                            Bookmark · Growth plan
                        </UpgradeLink>
                    )}
                    {deepLink !== null && (
                        <a
                            href={deepLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-panel px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                        >
                            {deepLink.isSpecific ? 'Open tender' : `Open on ${site?.name ?? tender.source ?? 'source'}`}
                        </a>
                    )}
                    {tender.tender_no !== null && (
                        <button
                            type="button"
                            onClick={() => void copyRef(tender.tender_no ?? '')}
                            className="inline-flex h-10 items-center rounded-md border border-line bg-panel px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                        >
                            {copied ? 'Tender number copied' : 'Copy tender number'}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-6">
                    {tender.brief !== null && tender.brief !== undefined && <ScopePanel scope={tender.brief} />}

                    {tender.eligibility !== undefined && (
                        <Panel title={tender.eligibility.gates.length > 0 ? `Requirements (${tender.eligibility.gates.length})` : 'Requirements'}>
                            <RequirementsList eligibility={tender.eligibility} />
                        </Panel>
                    )}

                    <Panel title="Details">
                        <dl className="flex flex-col">
                            <Row label="Client">{tender.organ_of_state ?? '—'}</Row>
                            <Row label="Department">{tender.department ?? '—'}</Row>
                            <Row label="Province">{tender.province ?? '—'}</Row>
                            <Row label="Category">{tender.category !== null && tender.category !== '' ? tender.category : '—'}</Row>
                            <Row label="Bid type">{tender.bid_type ?? '—'}</Row>
                            <Row label="Published">{formatDate(tender.published_date)}</Row>
                            <Row label="Closing">{formatDate(tender.closing_date)}</Row>
                            <Row label="Briefing">{briefing}</Row>
                            <Row label="Bid validity">{tender.validity_days !== null ? `${tender.validity_days} days` : '—'}</Row>
                            <Row label="Two-envelope">{tender.two_envelope ? 'Yes' : 'No'}</Row>
                            <Row label="Est. value">
                                <EstimateValue estimate={estimate} />
                                {estimateWhy !== null && <span className="mt-0.5 block text-xs leading-snug text-ink/55">{estimateWhy}</span>}
                            </Row>
                        </dl>
                    </Panel>
                </div>

                <div className="grid min-w-0 gap-6 sm:grid-cols-2 xl:flex xl:flex-col">
                    <Panel title="Contact">
                        <p className="text-sm text-ink">
                            {tender.contact_person ?? 'Not listed'}
                        </p>
                        {tender.email !== null && (
                            <a href={`mailto:${tender.email}`} className="text-sm text-navy underline [overflow-wrap:anywhere]">{tender.email}</a>
                        )}
                        {tender.telephone !== null && <p className="text-sm text-ink/70">{tender.telephone}</p>}
                    </Panel>

                    <Panel title="Buyer">
                        <Link
                            to={`/buyers?name=${encodeURIComponent(tender.organ_of_state ?? '')}`}
                            className="inline-flex items-center gap-2 text-sm text-navy underline"
                        >
                            View buyer profile
                            <IconArrowRight className="size-3.5" />
                        </Link>
                        <p className="text-xs text-ink/55">History, frequent winners and decision speed for this buyer.</p>
                    </Panel>
                </div>
            </div>

            {docs.length > 0 && (
                <Panel title={`Documents (${docs.length})`}>
                    <ul className="flex flex-col gap-1">
                        {docs.map((doc, index) => (
                            <li key={`${doc.name}-${index}`}>
                                {doc.url !== null && doc.url !== ''
                                    ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-navy underline">{doc.name}</a>
                                    : <span className="text-sm text-ink/80">{doc.name}</span>}
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {tender.description !== null && (
                <Panel title="Description">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{tender.description}</p>
                </Panel>
            )}
        </div>
    )
}
