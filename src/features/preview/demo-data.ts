import type { PricingTier } from '@/shared/api'
import { PROVINCES } from '@/features/profile/profile'
import type { EligibilitySummary, Settings, Tender, TenderMapPoint, TenderScope } from '@/shared/types'

/**
 * The company the public preview shows: North Tech Africa's own account. Its
 * tenders are the real ones Bidscope matched to it, loaded when the preview
 * opens (`GET /api/preview/tenders`).
 */
export const PREVIEW_COMPANY = 'North Tech Africa'

/** The eTenders categories that describe North Tech's work, as its profile lists them. */
export const PREVIEW_CATEGORIES: readonly string[] = [
    'Information and communication',
    'Computer programming, consultancy and related activities',
    'Information service activities',
]

/** One matched tender, as `/api/preview/tenders` sends it. */
export interface PreviewTender extends Tender
{
    readonly eligibility: EligibilitySummary
    readonly brief: TenderScope | null
    /** government | state-owned | external, from the buyer's name. */
    readonly sector: string
    readonly point: Pick<TenderMapPoint, 'lat' | 'lng' | 'precision' | 'place' | 'verified'> | null
}

const DAY_MS = 86_400_000

/** `YYYY-MM-DD`, `days` from today (negative for the past), counted the way the app counts days. */
export function dayFromToday(days: number): string
{
    const now = new Date()

    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) + days * DAY_MS).toISOString().slice(0, 10)
}

/** The province a tender is pinned to, or null for a national or unstated one, which every plan sees. */
export function provinceOf(tender: Tender): string | null
{
    return tender.province !== null && PROVINCES.includes(tender.province) ? tender.province : null
}

/**
 * Where North Tech works on each plan: the province with the most matched
 * tenders, the top four, or all nine.
 */
export function coverage(tenders: readonly Tender[]): Record<PricingTier, readonly string[]>
{
    const counts = new Map<string, number>()

    for (const tender of tenders) {
        const province = provinceOf(tender)

        if (province !== null) {
            counts.set(province, (counts.get(province) ?? 0) + 1)
        }
    }

    const ranked = [...PROVINCES].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))

    return { single: ranked.slice(0, 1), mid: ranked.slice(0, 4), all: PROVINCES }
}

export function demoSettings(provinces: readonly string[]): Settings
{
    return {
        companyName: PREVIEW_COMPANY,
        cidbGrades: {},
        serviceLines: [],
        categories: [...PREVIEW_CATEGORIES],
        provinces: [...provinces],
        notifyEmail: null,
        notifyEnabled: false,
        tenderLeadDays: [7, 3, 1],
        complianceLeadDays: [60, 30, 7],
        provider: null,
        providerKeySet: false,
    }
}
