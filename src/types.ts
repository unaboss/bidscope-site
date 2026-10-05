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
    /** Derived estimate from award medians (null until enough history exists). */
    readonly estimated_value?: number | null
    readonly estimate_basis?: string | null
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

export interface FeedItem
{
    readonly id: string
    readonly title: string | null
    readonly relevance: string | null
    readonly serviceLine: string | null
    readonly closingDate: string | null
    readonly publishedDate: string | null
    readonly estimatedValue: number | null
    readonly organ: string | null
    readonly reAdvert: number
    readonly score: number
    readonly reasons: string[]
    readonly eligibility: EligibilitySummary
}

export interface FeedResponse
{
    readonly items: FeedItem[]
    readonly total: number
}

export interface PortfolioTender
{
    readonly id: string
    readonly title: string | null
    readonly closingDate: string | null
    readonly estimatedValue: number | null
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
