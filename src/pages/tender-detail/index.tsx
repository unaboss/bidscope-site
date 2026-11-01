import { useEffect, useState } from 'react'
import {
    ArrowLeft,
    Bookmark,
    CalendarDays,
    FileText,
    Layers,
    MapPin,
    Building2,
    Hash,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getTender } from '@/api'
import { RequirementsList } from '@/components/tender/requirements-section'
import { EstimateValue } from '@/components/tender/estimate-value'
import { DownloadTender } from '@/components/tender/download-tender'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { formatDate } from '@/lib/format'
import { tenderEstimate } from '@/lib/estimate'
import { buildDeepLink, sourceSite } from '@/lib/sources'
import type { Tender } from '@/types'

const TABS = ['Details', 'Documents', 'Requirements', 'Updates'] as const

export function TenderDetailPage() {
    const { id } = useParams()
    const [tender, setTender] = useState<Tender | null>(null)
    const [tab, setTab] = useState<(typeof TABS)[number]>('Details')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const bookmarks = useBookmarks()
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        setTab('Details')
        getTender(id ?? '', controller.signal)
            .then(setTender)
            .catch((e) => {
                if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load tender.')
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [id])
    async function copyRef() {
        if (!tender?.tender_no) return
        try {
            await navigator.clipboard.writeText(tender.tender_no)
            setCopied(true)
        } catch {
            setError('Could not copy the reference. Select and copy it from the details below.')
        }
    }
    const back = (
        <Link className="detail-back" to="/discover">
            <ArrowLeft size={14} /> Back to tenders
        </Link>
    )
    if (loading)
        return (
            <div>
                {back}
                <p className="list-message" role="status">
                    Loading tender…
                </p>
            </div>
        )
    if (!tender)
        return (
            <div>
                {back}
                <div className="list-message">
                    <FileText size={30} />
                    <h1>Tender not found</h1>
                    <p>{error || 'This tender is no longer available.'}</p>
                </div>
            </div>
        )
    const deepLink = buildDeepLink(tender.source, tender.support_documents, tender.raw_id)
    const site = sourceSite(tender.source)
    const saved = bookmarks.ids.has(tender.id)
    return (
        <div className="tender-detail-page">
            {back}
            <div className="detail-title">
                <div>
                    <h1>{tender.title ?? 'Untitled tender'}</h1>
                    <div className="detail-meta">
                        <span>
                            <Building2 size={13} />
                            {tender.organ_of_state ?? 'Buyer not listed'}
                        </span>
                        <span>
                            <MapPin size={13} />
                            {tender.province ?? 'Location not listed'}
                        </span>
                        <span>
                            <Hash size={13} />
                            {tender.tender_no ?? 'Reference not listed'}
                        </span>
                    </div>
                </div>
                <button
                    className="bs-button small"
                    disabled={bookmarks.loading}
                    onClick={() => void bookmarks.toggle(tender.id)}
                    aria-pressed={saved}
                >
                    {saved ? 'On your watchlist' : 'Add to watchlist'}
                    <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                </button>
            </div>
            {(error || bookmarks.error) && (
                <p className="inline-error mt-5" role="alert">
                    {error || bookmarks.error}
                </p>
            )}
            <div className="detail-summary">
                <article>
                    <CalendarDays />
                    <div>
                        <span>Closes</span>
                        <strong>{tender.closing_date ? formatDate(tender.closing_date) : 'To be confirmed'}</strong>
                    </div>
                </article>
                <article>
                    <Layers />
                    <div>
                        <span>Category</span>
                        <strong>{tender.category ?? 'Not specified'}</strong>
                    </div>
                </article>
                <article>
                    <FileText />
                    <div>
                        <span>Type</span>
                        <strong>{tender.bid_type ?? tender.brief?.nature ?? 'Not specified'}</strong>
                    </div>
                </article>
            </div>
            <div className="detail-panel">
                <div className="detail-tabs" role="tablist" aria-label="Tender information">
                    {TABS.map((name, index) => (
                        <button
                            key={name}
                            role="tab"
                            id={'tab-' + name}
                            aria-controls="tender-tab-panel"
                            aria-selected={tab === name}
                            tabIndex={tab === name ? 0 : -1}
                            onClick={() => setTab(name)}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                    event.preventDefault()
                                    const next =
                                        TABS[
                                            (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
                                        ]!
                                    setTab(next)
                                    document.getElementById('tab-' + next)?.focus()
                                }
                                if (event.key === 'Home' || event.key === 'End') {
                                    event.preventDefault()
                                    const next = event.key === 'Home' ? TABS[0] : TABS[TABS.length - 1]!
                                    setTab(next)
                                    document.getElementById('tab-' + next)?.focus()
                                }
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div
                    id="tender-tab-panel"
                    role="tabpanel"
                    aria-labelledby={'tab-' + tab}
                    className="detail-tab-content"
                >
                    {tab === 'Details' && (
                        <>
                            <section>
                                <h2>Description</h2>
                                <p className="whitespace-pre-line">
                                    {tender.description ??
                                        tender.brief?.summary ??
                                        'A description has not been provided. Check the source documents for the full scope.'}
                                </p>
                            </section>
                            {tender.brief?.summary && tender.description && (
                                <section>
                                    <h3>Tender summary</h3>
                                    <p>{tender.brief.summary}</p>
                                </section>
                            )}
                            {!!tender.brief?.deliverables.length && (
                                <section>
                                    <h3>Deliverables</h3>
                                    <ul className="list-disc ps-5">
                                        {tender.brief.deliverables.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                            <section>
                                <h3>Estimated value</h3>
                                <EstimateValue estimate={tenderEstimate(tender)} />
                            </section>
                            <section>
                                <h3>Buyer and contact</h3>
                                <Link
                                    className="quiet-link"
                                    to={'/buyers?name=' + encodeURIComponent(tender.organ_of_state ?? '')}
                                >
                                    {tender.organ_of_state ?? 'Buyer profile'} <ExternalLink size={13} />
                                </Link>
                                <div className="detail-contact">
                                    {tender.contact_person && <span>{tender.contact_person}</span>}
                                    {tender.email && <a href={'mailto:' + tender.email}>{tender.email}</a>}
                                    {tender.telephone && <a href={'tel:' + tender.telephone}>{tender.telephone}</a>}
                                </div>
                            </section>
                        </>
                    )}
                    {tab === 'Documents' && (
                        <>
                            <h2>Tender documents</h2>
                            <p className="mb-5">
                                View and download the original documents from {site?.name ?? 'the tender source'}.
                            </p>
                            <DownloadTender
                                tender={tender}
                                deepLink={deepLink}
                                siteName={site?.name ?? tender.source ?? 'Source'}
                                onCopyRef={() => void copyRef()}
                                copied={copied}
                            />
                            {deepLink && (
                                <a
                                    className="quiet-link mt-5"
                                    href={deepLink.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open original notice <ExternalLink size={14} />
                                </a>
                            )}
                        </>
                    )}
                    {tab === 'Requirements' && (
                        <>
                            <h2>Requirements</h2>
                            {tender.eligibility ? (
                                <RequirementsList eligibility={tender.eligibility} />
                            ) : (
                                <p>
                                    Requirements have not been extracted yet. Review the source documents before
                                    bidding.
                                </p>
                            )}
                            <section>
                                <h3>Briefing</h3>
                                <p>
                                    {tender.briefing_date
                                        ? formatDate(tender.briefing_date) +
                                          (tender.briefing_compulsory ? ' — compulsory' : '')
                                        : tender.briefing_required
                                          ? 'Required; date not provided.'
                                          : 'No briefing listed.'}
                                </p>
                            </section>
                        </>
                    )}
                    {tab === 'Updates' && (
                        <>
                            <h2>Notice information</h2>
                            <p>Published: {tender.published_date ? formatDate(tender.published_date) : 'Not listed'}</p>
                            <p>Status: {tender.source_status}</p>
                            {tender.re_advert === 1 && <p>This tender has been re-advertised.</p>}
                            <p className="mt-4">Check the original notice for amendments and the latest updates.</p>
                            <button onClick={() => void copyRef()} className="quiet-link mt-4">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Reference copied' : 'Copy tender reference'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
