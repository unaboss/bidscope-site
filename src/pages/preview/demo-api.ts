import type { PricingTier } from '@/api'
import type {
    Account,
    FeedItem,
    Portfolio,
    PortfolioClient,
    PortfolioProvince,
    PortfolioTender,
    Taxonomy,
    Tender,
    TenderMapPoint,
    TenderScope,
} from '@/types'
import { CATEGORY_BUCKETS, TENDER_CATEGORIES } from '../../../worker/domain/categories'
import { BASIS_SCOPE } from '../../../worker/domain/estimates'
import { scoreTender } from '../../../worker/domain/feed'
import { aggregateGateStates } from '../../../worker/domain/gates'
import { accountFor, FEATURES, hasFeature, type PlanId } from '../../../worker/domain/plans'
import { redactForPlan } from '../../../worker/middleware/plan'
import {
    DEMO_BOOKMARKS,
    DEMO_CATEGORIES,
    DEMO_PROVINCES,
    DEMO_TENDERS,
    dayFromToday,
    demoClaims,
    demoSettings,
    type DemoTender,
} from './demo-data'

/**
 * The app's API, answered in the browser from sample data, for the public
 * preview. The plan rules are the server's own (features, locked data, the
 * feed ranking), so each plan shows exactly what it would in a real account.
 * Bookmarks and dismissals live in memory; everything else is read-only.
 */

const PLAN_FOR_TIER: Readonly<Record<PricingTier, PlanId>> = { single: 'starter', mid: 'growth', all: 'pro' }

let tier: PricingTier = 'mid'
const bookmarked = new Map<string, string>(DEMO_BOOKMARKS.map((id, index) => [id, dayFromToday(-(index + 2))]))
const dismissed = new Set<string>()

/** Switches the plan the sample data is served for. */
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

function isRelevant(tender: DemoTender): boolean
{
    return DEMO_CATEGORIES.includes(tender.category) && DEMO_PROVINCES[tier].includes(tender.province)
}

function scope(tender: DemoTender): TenderScope
{
    return {
        summary: tender.summary,
        subject: null,
        nature: null,
        deliverables: [...tender.deliverables],
        skills: [...tender.skills],
        basis: 'full_documents',
    }
}

function eligibility(tender: DemoTender): FeedItem['eligibility']
{
    const gates = tender.gates.map((gate) => ({
        type: gate.type,
        subjectKey: '',
        label: gate.label,
        state: gate.state,
        evidence: null,
        asAt: null,
    }))

    return { state: aggregateGateStates(gates.map((gate) => gate.state)), gates }
}

function estimateFields(tender: DemoTender)
{
    return {
        estimatedValue: tender.estimate.value,
        estimateLow: tender.estimate.low,
        estimateHigh: tender.estimate.high,
        estimateBasis: tender.estimate.basis,
        estimateDetail: tender.estimate.detail,
    }
}

function toTender(tender: DemoTender, detail: boolean): Tender
{
    const estimate = estimateFields(tender)

    return {
        id: tender.id,
        tender_no: tender.tenderNo,
        title: tender.title,
        description: tender.description,
        organ_of_state: tender.organ,
        department: tender.department,
        province: tender.province,
        category: tender.category,
        client_type: tender.sector === 'state-owned' ? 'State-owned entity' : 'Government',
        bid_type: tender.bidType,
        contract_value: null,
        published_date: dayFromToday(-tender.publishedAgo),
        closing_date: dayFromToday(tender.closesIn),
        briefing_required: tender.briefing === null ? 0 : 1,
        briefing_compulsory: tender.briefing?.compulsory === true ? 1 : 0,
        briefing_date: tender.briefing === null ? null : dayFromToday(tender.briefing.inDays),
        contact_person: null,
        email: null,
        telephone: null,
        validity_days: 90,
        two_envelope: tender.estimate.value >= 5_000_000 ? 1 : 0,
        // Shown as the source badge; a source the app does not know gets no "Open on…" link.
        source: 'sample',
        source_status: 'Published',
        raw_id: null,
        support_documents: JSON.stringify([
            { filename: 'Bid document.pdf', url: null },
            { filename: 'Specification and bill of quantities.pdf', url: null },
        ]),
        estimated_value: estimate.estimatedValue,
        estimate_low: estimate.estimateLow,
        estimate_high: estimate.estimateHigh,
        estimate_basis: estimate.estimateBasis,
        estimate_detail: estimate.estimateDetail,
        estimate_quote: null,
        re_advert: tender.reAdvert ? 1 : 0,
        relevance: isRelevant(tender) ? 'relevant' : 'other',
        service_line: tender.bucket,
        ...(bookmarked.has(tender.id) ? { bookmark_note: null, bookmarked_at: bookmarked.get(tender.id) ?? null } : {}),
        ...(detail ? { eligibility: eligibility(tender), brief: scope(tender) } : {}),
    }
}

/** Open, relevant, not dismissed: what the feed and the dashboard count. */
function workable(): DemoTender[]
{
    return DEMO_TENDERS.filter((tender) => isRelevant(tender) && !dismissed.has(tender.id))
}

function feed(limit: number, offset: number): { items: FeedItem[], total: number }
{
    const today = new Date()
    // Starter cannot bookmark, so it has no saved buyers to rank by.
    const saved = featureEnabled('bookmarks_calendar') ? DEMO_TENDERS.filter((tender) => bookmarked.has(tender.id)) : []
    const savedOrgans = new Set(saved.map((tender) => tender.organ.toLowerCase()))
    const ranked = workable()
        .map((tender): FeedItem =>
        {
            const base = {
                id: tender.id,
                title: tender.title,
                relevance: 'relevant',
                serviceLine: tender.bucket,
                closingDate: dayFromToday(tender.closesIn),
                publishedDate: dayFromToday(-tender.publishedAgo),
                organ: tender.organ,
                reAdvert: tender.reAdvert ? 1 : 0,
                ...estimateFields(tender),
            }
            const { score, reasons } = scoreTender(base, { relevantToken: 'relevant', savedOrgans, dismissedOrgans: new Set() }, today)

            return { ...base, score, reasons, eligibility: eligibility(tender), brief: scope(tender) }
        })
        .sort((a, b) => b.score - a.score)

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

function matches(tender: DemoTender, filters: TenderFilters): boolean
{
    const closing = dayFromToday(tender.closesIn)
    const text = `${tender.title} ${tender.description} ${tender.organ} ${tender.tenderNo}`.toLowerCase()

    return (filters.search === '' || text.includes(filters.search))
        && (filters.province === '' || tender.province === filters.province)
        && (filters.closingFrom === '' || closing >= filters.closingFrom)
        && (filters.closingTo === '' || closing <= filters.closingTo)
        && (!filters.relevantOnly || isRelevant(tender))
}

function listTenders(params: URLSearchParams): { tenders: Tender[], total: number }
{
    const filters = filtersOf(params)
    const sort = params.get('sort') ?? 'relevant'
    const limit = Number(params.get('limit') ?? '50')
    const offset = Number(params.get('offset') ?? '0')
    const found = DEMO_TENDERS.filter((tender) => matches(tender, filters))
    const byClosing = (a: DemoTender, b: DemoTender): number => a.closesIn - b.closesIn

    if (sort === 'newest') {
        found.sort((a, b) => a.publishedAgo - b.publishedAgo)
    } else if (sort === 'closing') {
        found.sort(byClosing)
    } else {
        found.sort((a, b) => Number(isRelevant(b)) - Number(isRelevant(a)) || byClosing(a, b))
    }

    return { tenders: found.slice(offset, offset + limit).map((tender) => toTender(tender, false)), total: found.length }
}

function tenderMap(params: URLSearchParams): { points: TenderMapPoint[], unplaced: number, total: number }
{
    const filters = filtersOf(params)
    const points = DEMO_TENDERS.filter((tender) => matches(tender, filters)).map((tender): TenderMapPoint => ({
        id: tender.id,
        title: tender.title,
        organ: tender.organ,
        province: tender.province,
        closingDate: dayFromToday(tender.closesIn),
        relevant: isRelevant(tender),
        lat: tender.place.lat,
        lng: tender.place.lng,
        precision: tender.place.precision,
        place: tender.place.name,
        verified: tender.place.verified,
        ...estimateFields(tender),
    }))

    return { points, unplaced: 0, total: points.length }
}

const SECTOR_ORDER = ['government', 'state-owned', 'external']

/** The dashboard's province → sector → client → work type tree, built the way the server builds it. */
function portfolio(): Portfolio
{
    const tenders = workable()
    const provinces: PortfolioProvince[] = [...new Set(tenders.map((tender) => tender.province))]
        .sort((a, b) => a.localeCompare(b))
        .map((province) =>
        {
            const here = tenders.filter((tender) => tender.province === province)

            return {
                province,
                sectors: SECTOR_ORDER
                    .filter((sector) => here.some((tender) => tender.sector === sector))
                    .map((sector) =>
                    {
                        const inSector = here.filter((tender) => tender.sector === sector)
                        const clients: PortfolioClient[] = [...new Set(inSector.map((tender) => tender.organ))].map((name) =>
                        {
                            const own = inSector.filter((tender) => tender.organ === name)

                            return {
                                name,
                                tenderCount: own.length,
                                services: [...new Set(own.map((tender) => tender.bucket))].map((code) =>
                                {
                                    const work = own.filter((tender) => tender.bucket === code).sort((a, b) => a.closesIn - b.closesIn)
                                    const valued = work.filter((tender) => tender.estimate.basis !== BASIS_SCOPE)

                                    return {
                                        code,
                                        count: work.length,
                                        estimatedValue: valued.length === 0
                                            ? null
                                            : Math.round(valued.reduce((sum, tender) => sum + tender.estimate.value, 0) / valued.length),
                                        tenders: work.map((tender): PortfolioTender => ({
                                            id: tender.id,
                                            title: tender.title,
                                            closingDate: dayFromToday(tender.closesIn),
                                            brief: scope(tender),
                                            ...estimateFields(tender),
                                        })),
                                    }
                                }),
                            }
                        })

                        return { sector, clients: clients.sort((a, b) => b.tenderCount - a.tenderCount) }
                    }),
            }
        })
    const sectorOf = new Map(tenders.map((tender) => [tender.organ, tender.sector]))
    const count = (sector: string): number => [...sectorOf.values()].filter((value) => value === sector).length

    return {
        summary: {
            clients: sectorOf.size,
            tenders: tenders.length,
            government: count('government'),
            stateOwned: count('state-owned'),
            external: count('external'),
            provinces: provinces.length,
        },
        provinces,
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
    if (method === 'GET') {
        switch (path) {
            case '/api/account':
                return json(demoAccount())
            case '/api/settings':
                return json(demoSettings(tier))
            case '/api/claims':
                return json({ claims: demoClaims() })
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
                    ? planned({ bookmarks: DEMO_TENDERS.filter((tender) => bookmarked.has(tender.id)).map((tender) => toTender(tender, false)) })
                    : locked('bookmarks_calendar')
            default:
                break
        }

        if (path.startsWith('/api/tenders/')) {
            const id = decodeURIComponent(path.slice('/api/tenders/'.length))
            const tender = DEMO_TENDERS.find((entry) => entry.id === id)

            return tender === undefined ? json({ error: 'Not found' }, 404) : planned(toTender(tender, true))
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

    return json({ error: 'This is a preview on sample data, so nothing here can be changed.' }, 403)
}

/** Answers one `/api/` request from the sample data, on the current plan. */
export function demoResponse(request: Request): Promise<Response>
{
    const url = new URL(request.url)

    return answer(request.method, url.pathname, url.searchParams, request)
}

let installed = false

/**
 * Routes the page's `/api/` requests to the sample data. The preview is its
 * own page load, so this stays in place for as long as the page is open.
 */
export function installDemoApi(): void
{
    if (installed) {
        return
    }

    installed = true

    const network = window.fetch.bind(window)

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
