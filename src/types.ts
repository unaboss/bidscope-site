import type { BidDirector, BidPerson, BidProfile, BidReference } from '../worker/domain/bid-profile'
import type { PackAttachment, PackInputs, PackTender, PricingLine, PricingTotals } from '../worker/domain/bid-pack'

/** A tender as returned by `/api/tenders`. Mirrors the D1 `tender` row. */
export interface Tender
{
    readonly id: string
    readonly tender_no: string | null
    readonly title: string | null
    readonly description: string | null
    readonly organ_of_state: string | null
    readonly department: string | null
    readonly province: string | null
    readonly category: string | null
    readonly client_type: string | null
    readonly bid_type: string | null
    readonly contract_value: number | null
    readonly published_date: string | null
    readonly closing_date: string | null
    readonly briefing_required: number
    readonly briefing_compulsory: number
    readonly briefing_date: string | null
    readonly contact_person: string | null
    readonly email: string | null
    readonly telephone: string | null
    readonly validity_days: number | null
    readonly two_envelope: number
    readonly source: string | null
    readonly source_status: string
    readonly raw_id: number | null
    readonly support_documents: string | null
    /** Likely value from the strongest evidence the tender has; see `src/lib/estimate.ts`. */
    readonly estimated_value?: number | null
    /** The likely range; either end is null when it is open (up to / over). */
    readonly estimate_low?: number | null
    readonly estimate_high?: number | null
    readonly estimate_basis?: string | null
    /** The CIDB grade asked for (e.g. "4GB") or the number of awards behind the estimate. */
    readonly estimate_detail?: string | null
    /** Only on `/api/tenders/:id`: the sentence a value stated in the documents was read from. */
    readonly estimate_quote?: string | null
    /** 1 when the tender text marks it as a re-advertisement. */
    readonly re_advert?: number
    /** Profile token when the tender matches the client's work, else `other`. */
    readonly relevance?: string | null
    /** Service-line code (SF/SE/CL/CD/RS/CW/OT). */
    readonly service_line?: string | null
    /** Present only on `/api/bookmarks` responses. */
    readonly bookmark_note?: string | null
    readonly bookmarked_at?: string | null
    /** Present on `/api/tenders/:id` only. */
    readonly eligibility?: EligibilitySummary
    /** Present on `/api/tenders/:id` only; null until the understanding job has read the tender. */
    readonly brief?: TenderScope | null
}

/** The understanding job's plain-language read of a tender. */
export interface TenderScope
{
    readonly summary: string | null
    readonly subject: string | null
    readonly nature: string | null
    readonly deliverables: string[]
    readonly skills: string[]
    /** What was read: title_only | title+desc | full_documents. */
    readonly basis: string | null
}

export type GateState =
    | 'meets_verified'
    | 'meets_declared'
    | 'fails'
    | 'requirement_not_found'
    | 'tender_unreadable'
    | 'profile_unknown'

export interface GateSummary
{
    readonly type: string
    readonly subjectKey: string
    /** What the requirement asks for, in plain words. */
    readonly label: string
    readonly state: GateState
    readonly evidence: string | null
    readonly asAt: string | null
}

export interface EligibilitySummary
{
    readonly state: GateState
    readonly gates: GateSummary[]
}

export interface BuyerSummary
{
    readonly organ: string
    readonly openTenders: number
    readonly awards: number
    readonly averageAward: number | null
}

export interface BuyerCategory
{
    readonly category: string
    readonly count: number
    readonly median: number | null
}

export interface BuyerSupplier
{
    readonly supplier: string
    readonly count: number
    readonly total: number
}

export interface BuyerAward
{
    readonly tenderNo: string | null
    readonly supplier: string | null
    readonly amount: number | null
    readonly awardDate: string | null
    readonly category: string | null
}

export interface BuyerProfile
{
    readonly organ: string
    readonly openTenders: number
    readonly awards: number
    readonly medianAward: number | null
    readonly decisionSpeedDays: number | null
    readonly topSuppliers: BuyerSupplier[]
    readonly categories: BuyerCategory[]
    readonly recentAwards: BuyerAward[]
}

export interface TenderListResponse
{
    readonly tenders: Tender[]
    readonly total: number
}

export interface Feature
{
    readonly key: string
    readonly label: string
    readonly description: string
    readonly billable: boolean
    readonly enabled: boolean
}

export interface Account
{
    readonly plan: string
    readonly effectivePlan: string
    readonly trialEndsAt: string | null
    readonly trialActive: boolean
    readonly trialDaysLeft: number | null
    readonly features: Feature[]
}

export interface Settings
{
    readonly companyName: string | null
    readonly cidbGrades: Record<string, number>
    readonly serviceLines: string[]
    readonly categories: string[]
    readonly provinces: string[]
    readonly notifyEmail: string | null
    readonly notifyEnabled: boolean
    readonly tenderLeadDays: number[]
    readonly complianceLeadDays: number[]
    readonly provider: string | null
    readonly providerKeySet: boolean
}

export interface SettingsInput
{
    readonly companyName: string | null
    readonly cidbGrades: Record<string, number>
    readonly serviceLines: string[]
    readonly categories: string[]
    readonly provinces: string[]
    readonly notifyEmail: string | null
    readonly notifyEnabled: boolean
    readonly tenderLeadDays: number[]
    readonly complianceLeadDays: number[]
    readonly provider: string | null
    readonly providerKey?: string
}

/** A typed company fact the eligibility layer evaluates tenders against. */
export interface Claim
{
    readonly id: string
    readonly claimType: string
    readonly subjectKey: string
    readonly value: Readonly<Record<string, unknown>>
    readonly status: 'declared' | 'verified'
    readonly source: string
    readonly asAt: string
    readonly validUntil: string | null
}

/** One claim as sent to `PUT /api/claims` (always stored as declared). */
export interface ClaimInput
{
    readonly claimType: string
    readonly subjectKey: string
    readonly value: Readonly<Record<string, unknown>>
    readonly validUntil: string | null
    /** Typed by the user, or read from their CSD report. */
    readonly source: 'user' | 'csd_pdf'
}

export interface CategoryBucket
{
    readonly code: string
    readonly label: string
    readonly summary: string
}

export interface TenderCategory
{
    readonly id: number
    readonly label: string
    readonly bucket: string
}

/** The public eTenders taxonomy served by `GET /api/categories`. */
export interface Taxonomy
{
    readonly buckets: CategoryBucket[]
    readonly categories: TenderCategory[]
}

export interface ComplianceCheck
{
    readonly id: string
    readonly docType: string | null
    readonly source: string
    readonly status: string
    readonly detail: string | null
    readonly checkedAt: string
}

export interface ComplianceCheckResult
{
    readonly status: string
    readonly detail: string
}

/** The camelCase estimate fields the feed, map and portfolio responses carry. */
export interface EstimateFields
{
    readonly estimatedValue: number | null
    readonly estimateLow?: number | null
    readonly estimateHigh?: number | null
    readonly estimateBasis?: string | null
    readonly estimateDetail?: string | null
}

export interface FeedItem extends EstimateFields
{
    readonly id: string
    readonly title: string | null
    readonly relevance: string | null
    readonly serviceLine: string | null
    readonly closingDate: string | null
    readonly publishedDate: string | null
    readonly organ: string | null
    readonly reAdvert: number
    readonly score: number
    readonly reasons: string[]
    /** Absent on plans without requirement checks. */
    readonly eligibility?: EligibilitySummary
    /** DeepSeek's read of the scope; null until it has run on this tender. */
    readonly brief?: TenderScope | null
}

export interface FeedResponse
{
    readonly items: FeedItem[]
    readonly total: number
}

/** How a map pin is placed: a named site or town, the buyer's own town, or only the province. */
export type MapPrecision = 'site' | 'town' | 'municipality' | 'buyer' | 'province'

export interface TenderMapPoint extends EstimateFields
{
    readonly id: string
    readonly title: string | null
    readonly organ: string | null
    readonly province: string | null
    readonly closingDate: string | null
    readonly relevant: boolean
    readonly lat: number
    readonly lng: number
    readonly precision: MapPrecision
    /** What the pin stands for, e.g. "Durnacol cemeteries, Dannhauser Local Municipality". */
    readonly place: string
    /** True when the place was quoted from the tender text. */
    readonly verified: boolean
}

export interface TenderMapResponse
{
    readonly points: TenderMapPoint[]
    /** Matching open tenders with no place yet, e.g. national ones with no single site. */
    readonly unplaced: number
    readonly total: number
}

export interface PortfolioTender extends EstimateFields
{
    readonly id: string
    readonly title: string | null
    readonly closingDate: string | null
    readonly brief: TenderScope | null
}

export interface PortfolioService
{
    readonly code: string
    readonly count: number
    readonly estimatedValue: number | null
    readonly tenders: PortfolioTender[]
}

export interface PortfolioClient
{
    readonly name: string
    readonly tenderCount: number
    readonly services: PortfolioService[]
}

export interface PortfolioSector
{
    readonly sector: string
    readonly clients: PortfolioClient[]
}

export interface PortfolioProvince
{
    readonly province: string
    readonly sectors: PortfolioSector[]
}

export interface PortfolioSummary
{
    readonly clients: number
    readonly tenders: number
    readonly government: number
    readonly stateOwned: number
    readonly external: number
    readonly provinces: number
}

export interface Portfolio
{
    readonly summary: PortfolioSummary
    readonly provinces: PortfolioProvince[]
}

export type ComplianceMode = 'fixed_expiry' | 'rolling_recheck'

export type ComplianceStatus = 'expired' | 'expiring' | 'recheck_due' | 'valid'

export interface ComplianceState
{
    readonly status: ComplianceStatus
    readonly dueDate: string | null
    readonly daysUntil: number | null
}

export interface ComplianceDocument
{
    readonly id: string
    readonly type: string
    readonly label: string | null
    readonly number: string | null
    readonly mode: ComplianceMode
    readonly issueDate: string | null
    readonly expiryDate: string | null
    readonly recheckIntervalDays: number | null
    readonly lastVerifiedDate: string | null
    readonly notes: string | null
}

export interface ComplianceDocumentView extends ComplianceDocument
{
    readonly state: ComplianceState
}

export interface ComplianceTypeDef
{
    readonly value: string
    readonly label: string
    readonly mode: ComplianceMode
    readonly intervalDays: number | null
}

export interface ComplianceCrossCheck
{
    readonly docId: string
    readonly docLabel: string
    readonly dueDate: string
    readonly tenderId: string
    readonly tenderTitle: string
    readonly closingDate: string
}

export interface ComplianceResponse
{
    readonly documents: ComplianceDocumentView[]
    readonly crossChecks: ComplianceCrossCheck[]
    readonly types: ComplianceTypeDef[]
}

export interface ComplianceInput
{
    readonly type: string
    readonly label: string | null
    readonly number: string | null
    readonly mode: ComplianceMode
    readonly issueDate: string | null
    readonly expiryDate: string | null
    readonly recheckIntervalDays: number | null
    readonly lastVerifiedDate: string | null
    readonly notes: string | null
}

export type { BidDirector, BidPerson, BidProfile, BidReference }

export interface BidProfileResponse
{
    readonly profile: BidProfile
    readonly updatedAt: string | null
}

export type { PackAttachment, PackInputs as BidPackInputs, PackTender, PricingLine, PricingTotals }

/** One document of a bid pack, as `/api/bid-pack/:tenderId` lists it (no HTML body). */
export interface BidPackDocument
{
    readonly key: string
    readonly code: string | null
    readonly title: string
    readonly purpose: string
    readonly missing: string[]
    readonly needsSignature: boolean
    readonly needsCommissioner: boolean
}

export interface BidPackSummary
{
    readonly tender: PackTender
    readonly municipal: boolean
    readonly documents: BidPackDocument[]
    readonly attachments: PackAttachment[]
    readonly manualSteps: string[]
    readonly warnings: string[]
    readonly totals: PricingTotals
    readonly inputs: PackInputs
    /** The buyer's own files, readable through `/api/bid-pack/:tenderId/source/:index`. */
    readonly sources: Array<{ readonly index: number, readonly filename: string }>
    readonly email: BidPackEmailState
}

export interface BidPackEmailState
{
    /** False when the server has no email key: buttons explain instead of sending. */
    readonly configured: boolean
    /** The org's own addresses the documents can go to. */
    readonly recipients: string[]
    /** Tender files the source lists for download. */
    readonly documentCount: number
    /** The request that would go to the buyer, or null without a contact email. */
    readonly request: { readonly to: string, readonly subject: string, readonly text: string, readonly replyTo: string } | null
    readonly sent: Array<{ readonly kind: 'documents' | 'request', readonly recipient: string, readonly status: string, readonly detail: string | null, readonly createdAt: string }>
}
