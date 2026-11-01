import { useEffect, useState } from 'react'
import { ArrowLeftIcon as ArrowLeft, ArrowRightIcon as ArrowRight, MagnifyingGlassIcon as Search } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, listTenders } from '@/shared/api'
import { PROVINCES } from '@/features/tenders/components/feed/browse-filters'
import { TenderListSkeleton } from '@/features/tenders/components/feed/list-skeleton'
import { DiscoveryRow } from '@/features/tenders/components/feed/discovery-row'
import './discovery.css'
import type { Tender } from '@/shared/types'

const PAGE_SIZE = 20

export function DiscoverPage() {
    const [params, setParams] = useSearchParams()
    const [tenders, setTenders] = useState<Tender[]>([])
    const [total, setTotal] = useState(0)
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const search = params.get('search') ?? ''
    const province = params.get('province') ?? ''
    const category = params.get('category') ?? ''
    const status = params.get('status') ?? 'open'
    const relevantOnly = params.get('relevant') === 'true'
    const page = Math.max(0, Number(params.get('page')) || 0)
    function filter(key: string, value: string) {
        const next = new URLSearchParams(params)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        setParams(next, { replace: key === 'search' })
    }
    useEffect(() => {
        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            setLoading(true)
            setError('')
            const today = new Date().toISOString().slice(0, 10)
            const soon = new Date()
            soon.setDate(soon.getDate() + 7)
            listTenders(
                {
                    search,
                    province,
                    category,
                    relevantOnly,
                    closingFrom: status === 'all' ? undefined : today,
                    closingTo: status === 'soon' ? soon.toISOString().slice(0, 10) : undefined,
                    sort: 'closing',
                    limit: PAGE_SIZE,
                    offset: page * PAGE_SIZE,
                },
                controller.signal,
            )
                .then((result) => {
                    setTenders(result.tenders)
                    setTotal(result.total)
                })
                .catch((e) => {
                    if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load tenders.')
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false)
                })
        }, 200)
        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [search, province, category, status, page, relevantOnly])
    useEffect(() => {
        const controller = new AbortController()
        getCategories(controller.signal)
            .then((result) => setCategories(result.categories.map((category) => category.label).sort()))
            .catch(() => undefined)
        return () => controller.abort()
    }, [])
    return (
        <div className="tender-list-page discovery-page">
            <div className="workspace-title">
                <div>
                    <h1>Tenders</h1>
                    <p>Browse and filter South African tenders.</p>
                </div>
                <label className="matching-filter">
                    <input
                        type="checkbox"
                        checked={relevantOnly}
                        onChange={(event) => filter('relevant', event.target.checked ? 'true' : '')}
                    />{' '}
                    Only my matches
                </label>
            </div>
            <section className="tender-filters" aria-label="Tender filters">
                <label className="search-control">
                    <span className="sr-only">Search tenders</span>
                    <input
                        value={search}
                        onChange={(e) => filter('search', e.target.value)}
                        placeholder="Search tenders, organisations, or keywords..."
                    />
                    <Search size={19} />
                </label>
                <select aria-label="Province" value={province} onChange={(e) => filter('province', e.target.value)}>
                    <option value="">Province</option>
                    {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                    ))}
                </select>
                <select aria-label="Category" value={category} onChange={(e) => filter('category', e.target.value)}>
                    <option value="">Category</option>
                    {categories.map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
                <select aria-label="Status" value={status} onChange={(e) => filter('status', e.target.value)}>
                    <option value="open">Open</option>
                    <option value="soon">Closing soon</option>
                    <option value="all">All statuses</option>
                </select>
            </section>
            <div className="discovery-results-bar">
                <p role="status">{loading ? 'Finding tenders…' : error ? 'Results unavailable' : total.toLocaleString() + ' tenders'}</p>
                <span>Sorted by closing date</span>
                {(search || province || category || relevantOnly || status !== 'open') && (
                    <button type="button" onClick={() => {
                        const next = new URLSearchParams(params)
                        for (const key of ['search', 'province', 'category', 'relevant', 'status', 'page']) next.delete(key)
                        setParams(next)
                    }}>Reset filters</button>
                )}
            </div>
            {error ? (
                <div className="inline-error" role="alert">
                    {error}
                    <button onClick={() => window.location.reload()}>Try again</button>
                </div>
            ) : (
                <div className="tender-list" aria-busy={loading}>
                    {loading ? (
                        <TenderListSkeleton />
                    ) : tenders.length === 0 ? (
                        <div className="list-message">
                            <Search size={30} />
                            <h2>No tenders found</h2>
                            <p>Try a different search or clear your filters.</p>
                            <button className="bs-button outline" onClick={() => setParams({ status: 'all' })}>
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        tenders.map((tender) => (
                            <DiscoveryRow key={tender.id} tender={tender} />
                        ))
                    )}
                </div>
            )}
            {!loading && total > 0 && (
                <div className="list-pagination">
                    <span>
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} tenders
                    </span>
                    <div>
                        <button
                            aria-label="Previous page"
                            disabled={page === 0}
                            onClick={() => filter('page', String(page - 1))}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <button
                            aria-label="Next page"
                            disabled={(page + 1) * PAGE_SIZE >= total}
                            onClick={() => filter('page', String(page + 1))}
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
