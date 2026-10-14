import type { PricingTier } from '@/api'
import type {
    Account,
    EligibilitySummary,
    FeedItem,
    Portfolio,
    PortfolioClient,
    PortfolioProvince,
    PortfolioService,
    Taxonomy,
    Tender,
    TenderMapPoint,
    TenderScope,
} from '@/types'
import { CATEGORY_BUCKETS, TENDER_CATEGORIES } from '../../../worker/domain/categories'
import { eligibilityWeight } from '../../../worker/domain/eligibility'
import { BASIS_SCOPE } from '../../../worker/domain/estimates'
import { scoreTender } from '../../../worker/domain/feed'
import { accountFor, FEATURES, hasFeature, type PlanId } from '../../../worker/domain/plans'
import { redactForPlan } from '../../../worker/middleware/plan'
import { coverage, dayFromToday, demoSettings, provinceOf, type PreviewTender } from './demo-data'

/**
 * The app's API, answered in the browser for the public preview: North Tech's
 * real matched tenders, loaded once, served under the plan picked in the
 * preview. The plan rules are the server's own (features, locked data, the
 * feed ranking), so each plan shows exactly what it would in a real account.
 * Bookmarks and dismissals live in memory; everything else is read-only.
 */

const PLAN_FOR_TIER: Readonly<Record<PricingTier, PlanId>> = { single: 'starter', mid: 'growth', all: 'pro' }

interface Entry
{
    readonly row: Tender
    readonly eligibility: EligibilitySummary
    readonly brief: TenderScope | null
    readonly sector: string
    readonly point: PreviewTender['point']
}

let tier: PricingTier = 'mid'
let entries: Entry[] = []
let provinces = coverage([])
let bookmarked = new Map<string, string>()
const dismissed = new Set<string>()
/** Settles once the tenders have loaded: false when they could not be. */
let loading: Promise<boolean> = Promise.resolve(true)

/** Switches the plan the tenders are served for. */
export function setDemoTier(next: PricingTier): void
{
    tier = next
}

/** The plan as the app's `/api/account` would report it. */
export function demoAccount(forTier: PricingTier = tier): Account
{
    const account = accountFor(PLAN_FOR_TIER[forTier], null, new Date())

    return { ...account, features: [...account.features] }
}

function featureEnabled(key: string): boolean
{
    return hasFeature(accountFor(PLAN_FOR_TIER[tier], null, new Date()), key)
}

/** National and unstated tenders show on every plan; the rest only where the plan works. */
function covered(row: Tender, forTier: PricingTier = tier): boolean
{
    const province = provinceOf(row)

    return province === null || provinces[forTier].includes(province)
}

function isRelevant(row: Tender): boolean
{
    return row.relevance === 'relevant' && covered(row)
}

/** Puts the preview's tenders in place, with a few already saved so Growth and Pro open with bookmarks. */
export function setPreviewTenders(tenders: readonly PreviewTender[]): void
{
    entries = tenders.map(({ eligibility, brief, sector, point, ...row }) => ({ row, eligibility, brief, sector, point }))
    provinces = coverage(tenders)
    dismissed.clear()

    const soon = dayFromToday(3)
    // Ones with time left to work on first, then any with a date for the calendar.
    const rank = (entry: Entry): number => entry.row.closing_date === null ? 2 : entry.row.closing_date >= soon ? 0 : 1

    bookmarked = new Map(
        entries
            .filter((entry) => covered(entry.row, 'mid'))
            .sort((a, b) => rank(a) - rank(b))
            .slice(0, 4)
            .map((entry, index) => [entry.row.id, dayFromToday(-(index + 2))]),
    )
}

function estimateFields(row: Tender)
{
    return {
        estimatedValue: row.estimated_value ?? null,
        estimateLow: row.estimate_low ?? null,
        estimateHigh: row.estimate_high ?? null,
        estimateBasis: row.estimate_basis ?? null,
        estimateDetail: row.estimate_detail ?? null,
    }
}

function toTender(entry: Entry, detail: boolean): Tender
{
    const saved = bookmarked.get(entry.row.id)

    return {
        ...entry.row,
        relevance: isRelevant(entry.row) ? 'relevant' : 'other',
        ...(saved === undefined ? {} : { bookmark_note: null, bookmarked_at: saved }),
        ...(detail ? { eligibility: entry.eligibility, brief: entry.brief } : {}),
    }
}

/** Open, relevant, not dismissed: what the feed and the dashboard count. */
function workable(): Entry[]
{
    return entries.filter((entry) => isRelevant(entry.row) && !dismissed.has(entry.row.id))
}

/** The For-You ranking, weighted by the requirement checks, as the server ranks it. */
function feed(limit: number, offset: number): { items: FeedItem[], total: number }
{
    const today = new Date()
    // Starter cannot bookmark, so it has no saved buyers to rank by.
    const saved = featureEnabled('bookmarks_calendar') ? entries.filter((entry) => bookmarked.has(entry.row.id)) : []
    const savedOrgans = new Set(saved.map((entry) => (entry.row.organ_of_state ?? '').toLowerCase()).filter((organ) => organ !== ''))
    const ranked = workable()
        .map((entry) =>
        {
            const base = {
                id: entry.row.id,
                title: entry.row.title,
                relevance: 'relevant',
                serviceLine: entry.row.service_line ?? null,
                closingDate: entry.row.closing_date,
                publishedDate: entry.row.published_date,
                organ: entry.row.organ_of_state,
                reAdvert: entry.row.re_advert ?? 0,
                ...estimateFields(entry.row),
            }
            const { score, reasons } = scoreTender(base, { relevantToken: 'relevant', savedOrgans, dismissedOrgans: new Set() }, today)
            const weight = eligibilityWeight(entry.eligibility.state)
            // Scaling a negative score by a weight < 1 would raise it, so divide instead.
            const weighted = score >= 0 ? score * weight : score / Math.max(weight, 0.01)
            const item: FeedItem = { ...base, score: weighted, reasons, eligibility: entry.eligibility, brief: entry.brief }

            return { item, failed: entry.eligibility.state === 'fails' }
        })
        .sort((a, b) => Number(a.failed) - Number(b.failed) || b.item.score - a.item.score)
        .map((entry) => entry.item)

    return { items: ranked.slice(offset, offset + limit), total: ranked.length }
}

interface TenderFilters
{
    readonly search: string
    readonly province: string
    readonly closingFrom: string
    readonly closingTo: string
    readonly relevantOnly: boolean
}

function filtersOf(params: URLSearchParams): TenderFilters
{
    return {
        search: (params.get('search') ?? '').trim().toLowerCase(),
        province: params.get('province') ?? '',
        closingFrom: params.get('closingFrom') ?? '',
        closingTo: params.get('closingTo') ?? '',
        relevantOnly: params.get('relevant') === 'true',
    }
}

function matches(row: Tender, filters: TenderFilters): boolean
{
    const closing = row.closing_date ?? ''
    const text = [row.title, row.description, row.organ_of_state, row.tender_no].filter((part) => part !== null).join(' ').toLowerCase()

    return (filters.search === '' || text.includes(filters.search))
        && (filters.province === '' || row.province === filters.province)
        && (filters.closingFrom === '' || closing >= filters.closingFrom)
        && (filters.closingTo === '' || (closing !== '' && closing <= filters.closingTo))
        && (!filters.relevantOnly || isRelevant(row))
}

/** Undated last. */
function byClosing(a: Entry, b: Entry): number
{
    return Number(a.row.closing_date === null) - Number(b.row.closing_date === null)
        || (a.row.closing_date ?? '').localeCompare(b.row.closing_date ?? '')
}

function listTenders(params: URLSearchParams): { tenders: Tender[], total: number }
{
    const filters = filtersOf(params)
    const sort = params.get('sort') ?? 'relevant'
    const limit = Number(params.get('limit') ?? '50')
    const offset = Number(params.get('offset') ?? '0')
    const found = entries.filter((entry) => matches(entry.row, filters))

    if (sort === 'newest') {
        found.sort((a, b) => (b.row.published_date ?? '').localeCompare(a.row.published_date ?? ''))
    } else if (sort === 'closing') {
        found.sort(byClosing)
    } else {
        found.sort((a, b) => Number(isRelevant(b.row)) - Number(isRelevant(a.row)) || byClosing(a, b))
    }

    return { tenders: found.slice(offset, offset + limit).map((entry) => toTender(entry, false)), total: found.length }
}

function tenderMap(params: URLSearchParams): { points: TenderMapPoint[], unplaced: number, total: number }
{
    const filters = filtersOf(params)
    const found = entries.filter((entry) => matches(entry.row, filters))
    const points = found.flatMap((entry): TenderMapPoint[] => entry.point === null ? [] : [{
        id: entry.row.id,
        title: entry.row.title,
        organ: entry.row.organ_of_state,
        province: entry.row.province,
        closingDate: entry.row.closing_date,
        relevant: isRelevant(entry.row),
        ...entry.point,
        ...estimateFields(entry.row),
    }])

    return { points, unplaced: found.length - points.length, total: found.length }
}

const SECTOR_ORDER = ['government', 'state-owned', 'external']

/** The dashboard's province → sector → client → work type tree, built the way the server builds it. */
function portfolio(): Portfolio
{
    const tenders = workable()
    const provinceOfEntry = (entry: Entry): string => (entry.row.province ?? '').trim() || 'Unspecified'
    const services = (own: readonly Entry[]): PortfolioService[] => [...new Set(own.map((entry) => entry.row.service_line ?? 'OT'))]
        .map((code) =>
        {
            const work = own.filter((entry) => (entry.row.service_line ?? 'OT') === code).sort(byClosing)
            const valued = work.filter((entry) => entry.row.estimated_value != null && entry.row.estimate_basis !== BASIS_SCOPE)

            return {
                code,
                count: work.length,
                estimatedValue: valued.length === 0
                    ? null
                    : Math.round(valued.reduce((sum, entry) => sum + (entry.row.estimated_value ?? 0), 0) / valued.length),
                tenders: work.map((entry) => ({
                    id: entry.row.id,
                    title: entry.row.title,
                    closingDate: entry.row.closing_date,
                    brief: entry.brief,
                    ...estimateFields(entry.row),
                })),
            }
        })
        .sort((a, b) => b.count - a.count)
    const provinceList: PortfolioProvince[] = [...new Set(tenders.map(provinceOfEntry))]
        .sort((a, b) => a.localeCompare(b))
        .map((province) =>
        {
            const here = tenders.filter((entry) => provinceOfEntry(entry) === province)

            return {
                province,
                sectors: SECTOR_ORDER
                    .filter((sector) => here.some((entry) => entry.sector === sector))
                    .map((sector) =>
                    {
                        const inSector = here.filter((entry) => entry.sector === sector)
                        const clients: PortfolioClient[] = [...new Set(inSector.map((entry) => entry.row.organ_of_state ?? 'Unknown buyer'))]
                            .map((name) =>
                            {
                                const own = inSector.filter((entry) => (entry.row.organ_of_state ?? 'Unknown buyer') === name)

                                return { name, tenderCount: own.length, services: services(own) }
                            })

                        return { sector, clients: clients.sort((a, b) => b.tenderCount - a.tenderCount) }
                    }),
            }
        })
    const sectorOf = new Map(tenders.map((entry) => [entry.row.organ_of_state ?? 'Unknown buyer', entry.sector]))
    const count = (sector: string): number => [...sectorOf.values()].filter((value) => value === sector).length

    return {
        summary: {
            clients: sectorOf.size,
            tenders: tenders.length,
            government: count('government'),
            stateOwned: count('state-owned'),
            external: sectorOf.size - count('government') - count('state-owned'),
            provinces: provinceList.length,
        },
        provinces: provinceList,
    }
}

function taxonomy(): Taxonomy
{
    return {
        buckets: CATEGORY_BUCKETS.map(({ code, label, summary }) => ({ code, label, summary })),
        categories: TENDER_CATEGORIES.map(({ id, label, bucket }) => ({ id, label, bucket })),
    }
}

function json(body: unknown, status = 200): Response
{
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** The server's answer for a feature the plan lacks. */
function locked(key: string): Response
{
    const label = FEATURES.find((feature) => feature.key === key)?.label ?? key

    return json({ error: `${label} is not included in your plan.`, feature: key }, 402)
}

/** Strips what the plan does not include, as the server's middleware does. */
function planned(body: unknown): Response
{
    return json(redactForPlan(body, featureEnabled('price_estimates'), featureEnabled('requirement_checks')))
}

async function answer(method: string, path: string, params: URLSearchParams, request: Request): Promise<Response>
{
    if (!await loading) {
        return json({ error: 'The preview could not load its tenders. Refresh the page to try again.' }, 503)
    }

    if (method === 'GET') {
        switch (path) {
            case '/api/account':
                return json(demoAccount())
            case '/api/settings':
                return json(demoSettings(provinces[tier]))
            case '/api/claims':
                return json({ claims: [] })
            case '/api/categories':
                return json(taxonomy())
            case '/api/feed':
                return planned(feed(Number(params.get('limit') ?? '20'), Number(params.get('offset') ?? '0')))
            case '/api/portfolio':
                return planned(portfolio())
            case '/api/tenders':
                return planned(listTenders(params))
            case '/api/tenders/map':
                return featureEnabled('tender_map') ? planned(tenderMap(params)) : locked('tender_map')
            case '/api/bookmarks':
                return featureEnabled('bookmarks_calendar')
                    ? planned({ bookmarks: entries.filter((entry) => bookmarked.has(entry.row.id)).map((entry) => toTender(entry, false)) })
                    : locked('bookmarks_calendar')
            default:
                break
        }

        if (path.startsWith('/api/tenders/')) {
            const id = decodeURIComponent(path.slice('/api/tenders/'.length))
            const entry = entries.find((candidate) => candidate.row.id === id)

            return entry === undefined ? json({ error: 'Not found' }, 404) : planned(toTender(entry, true))
        }

        return json({ error: 'Not found' }, 404)
    }

    if (path === '/api/bookmarks' && method === 'POST') {
        if (!featureEnabled('bookmarks_calendar')) {
            return locked('bookmarks_calendar')
        }

        const body = await request.json() as { tenderId?: unknown }

        if (typeof body.tenderId === 'string') {
            bookmarked.set(body.tenderId, dayFromToday(0))
        }

        return json({ ok: true })
    }

    if (path.startsWith('/api/bookmarks/') && method === 'DELETE') {
        bookmarked.delete(decodeURIComponent(path.slice('/api/bookmarks/'.length)))

        return json({ ok: true })
    }

    if (path === '/api/feed/dismiss' && method === 'POST') {
        const body = await request.json() as { tenderId?: unknown }

        if (typeof body.tenderId === 'string') {
            dismissed.add(body.tenderId)
        }

        return json({ ok: true })
    }

    return json({ error: 'This is a preview, so nothing here can be changed.' }, 403)
}

/** Answers one `/api/` request from the preview's tenders, on the current plan. */
export function demoResponse(request: Request): Promise<Response>
{
    const url = new URL(request.url)

    return answer(request.method, url.pathname, url.searchParams, request)
}

let installed = false

/**
 * Loads the preview's tenders and routes the page's `/api/` requests to them.
 * The preview is its own page load, so this stays in place for as long as the
 * page is open; requests made before the tenders arrive wait for them.
 */
export function installDemoApi(): void
{
    if (installed) {
        return
    }

    installed = true

    const network = window.fetch.bind(window)

    loading = network('/api/preview/tenders')
        .then(async (response) =>
        {
            if (!response.ok) {
                return false
            }

            const body = await response.json() as { tenders?: PreviewTender[] }

            setPreviewTenders(body.tenders ?? [])

            return true
        })
        .catch(() => false)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    {
        const request = new Request(input, init)
        const url = new URL(request.url)

        if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
            return network(input, init)
        }

        if (request.signal.aborted) {
            throw new DOMException('The request was aborted.', 'AbortError')
        }

        return demoResponse(request)
    }
}
