import type { Account, BuyerProfile, Claim, ClaimInput, BuyerSummary, ComplianceCheck, ComplianceCheckResult, ComplianceInput, ComplianceResponse, DocumentStatus, FeedResponse, Portfolio, Settings, SettingsInput, Taxonomy, Tender, TenderDocumentCheck, TenderListResponse, TenderMapResponse } from '@/shared/types'

/** URL of the subscribable iCalendar feed for the current org. */
export const CALENDAR_FEED_URL = '/api/calendar/feed.ics'

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T>
{
    const response = await fetch(path, { headers: { accept: 'application/json' }, signal })

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
    }

    return await response.json() as T
}

/** The public eTenders category taxonomy (12 buckets, 91 categories). */
export function getCategories(signal?: AbortSignal): Promise<Taxonomy>
{
    return getJson<Taxonomy>('/api/categories', signal)
}

export interface TenderQuery
{
    readonly category?: string
    readonly search?: string
    readonly province?: string
    readonly source?: string
    readonly closingFrom?: string
    readonly closingTo?: string
    readonly relevantOnly?: boolean
    readonly sort?: string
    readonly limit?: number
    readonly offset?: number
}

/** The query string the list and the map share. */
function tenderParams(query: TenderQuery): URLSearchParams
{
    const params = new URLSearchParams()
    if (query.category) params.set('category', query.category)

    if (query.search !== undefined && query.search.length > 0) {
        params.set('search', query.search)
    }

    if (query.province !== undefined && query.province.length > 0) {
        params.set('province', query.province)
    }

    if (query.source !== undefined && query.source.length > 0) {
        params.set('source', query.source)
    }

    if (query.closingFrom !== undefined && query.closingFrom.length > 0) {
        params.set('closingFrom', query.closingFrom)
    }

    if (query.closingTo !== undefined && query.closingTo.length > 0) {
        params.set('closingTo', query.closingTo)
    }

    if (query.relevantOnly === true) {
        params.set('relevant', 'true')
    }

    if (query.sort !== undefined && query.sort.length > 0) {
        params.set('sort', query.sort)
    }

    if (query.limit !== undefined) {
        params.set('limit', String(query.limit))
    }

    if (query.offset !== undefined) {
        params.set('offset', String(query.offset))
    }

    return params
}

/** Lists tenders with the given filters. */
export function listTenders(query: TenderQuery, signal?: AbortSignal): Promise<TenderListResponse>
{
    return getJson<TenderListResponse>(`/api/tenders?${tenderParams(query).toString()}`, signal)
}

/** Every open tender matching the filters, placed for the map. Sort, limit and offset are ignored. */
export function getTenderMap(query: TenderQuery, signal?: AbortSignal): Promise<TenderMapResponse>
{
    return getJson<TenderMapResponse>(`/api/tenders/map?${tenderParams(query).toString()}`, signal)
}

/** Returns one tender by id. */
export function getTender(id: string, signal?: AbortSignal): Promise<Tender>
{
    return getJson<Tender>(`/api/tenders/${encodeURIComponent(id)}`, signal)
}

/** A tender's documents, each checked against its source for whether it downloads. */
export async function checkTenderDocuments(id: string, signal?: AbortSignal): Promise<TenderDocumentCheck[]>
{
    const body = await getJson<{ documents: TenderDocumentCheck[] }>(`/api/tenders/${encodeURIComponent(id)}/documents`, signal)

    return body.documents
}

/** The filename in a `Content-Disposition` header, preferring the UTF-8 form. */
function dispositionFilename(header: string | null): string | null
{
    if (header === null) {
        return null
    }

    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)

    if (encoded?.[1] !== undefined) {
        try {
            return decodeURIComponent(encoded[1])
        } catch {
            // fall through to the plain form
        }
    }

    return /filename="([^"]+)"/i.exec(header)?.[1] ?? null
}

/**
 * Downloads one tender document through Bidscope and saves it in the browser.
 * Returns the source's status when it would not hand the file over.
 */
export async function downloadTenderDocument(id: string, doc: TenderDocumentCheck): Promise<'saved' | DocumentStatus>
{
    let response: Response

    try {
        response = await fetch(`/api/tenders/${encodeURIComponent(id)}/documents/${doc.index}`)
    } catch {
        return 'unreachable'
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { status?: DocumentStatus }

        return body.status ?? 'unreachable'
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = dispositionFilename(response.headers.get('content-disposition')) ?? doc.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)

    return 'saved'
}

/** Lists the current org's bookmarked tenders. */
export async function listBookmarks(signal?: AbortSignal): Promise<Tender[]>
{
    const body = await getJson<{ bookmarks: Tender[] }>('/api/bookmarks', signal)

    return body.bookmarks
}

/** Bookmarks a tender for the current org. */
export async function addBookmark(tenderId: string): Promise<void>
{
    const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ tenderId }),
    })

    if (!response.ok) {
        throw new Error(`Could not bookmark (${response.status})`)
    }
}

/** Removes a bookmark for the current org. */
export async function removeBookmark(tenderId: string): Promise<void>
{
    const response = await fetch(`/api/bookmarks/${encodeURIComponent(tenderId)}`, { method: 'DELETE' })

    if (!response.ok) {
        throw new Error(`Could not remove bookmark (${response.status})`)
    }
}

/** The org's plan, trial and enabled features. */
export function getAccount(signal?: AbortSignal): Promise<Account>
{
    return getJson<Account>('/api/account', signal)
}

/** True when the caller has a valid session (200) rather than being a visitor (401). */
export async function getSession(): Promise<boolean>
{
    try
    {
        const response = await fetch('/api/account', { headers: { accept: 'application/json' } })

        return response.ok
    }
    catch
    {
        return false
    }
}

/** An API failure carrying the HTTP status, so callers can branch on 409 etc. */
export class ApiError extends Error
{
    readonly status: number

    constructor(status: number, message: string)
    {
        super(message)
        this.status = status
    }
}

export interface RelevancePreview
{
    readonly qualified: number
    readonly total: number
}

/** The public qualify-count for a candidate profile (no account needed). */
export function previewRelevance(
    input: { readonly serviceLines: string[], readonly categories?: string[], readonly provinces: string[], readonly companyName?: string },
    signal?: AbortSignal,
): Promise<RelevancePreview>
{
    const params = new URLSearchParams()

    if (input.serviceLines.length > 0)
    {
        params.set('serviceLines', input.serviceLines.join(','))
    }

    if (input.categories !== undefined && input.categories.length > 0)
    {
        params.set('categories', input.categories.join(','))
    }

    if (input.provinces.length > 0)
    {
        params.set('provinces', input.provinces.join(','))
    }

    if (input.companyName !== undefined && input.companyName.length > 0)
    {
        params.set('companyName', input.companyName)
    }

    return getJson<RelevancePreview>(`/api/relevance/preview?${params.toString()}`, signal)
}

export interface SignupInput
{
    readonly name: string
    readonly email: string
    readonly phone?: string
    readonly password: string
    readonly companyName: string
    readonly serviceLines: string[]
    readonly categories?: string[]
    readonly provinces: string[]
    readonly cidbGrades: Record<string, number>
    readonly turnstileToken?: string
}

export interface SignupResult
{
    readonly ok: boolean
    readonly qualified: number
    readonly total: number
    readonly trialEndsAt: string
    /** False when the activation email could not be sent (best-effort). */
    readonly activationSent?: boolean
    /** Signed token that authorises a public checkout for this pending org. */
    readonly checkoutToken?: string
}

/** Creates a trial account. Throws {@link ApiError} (409 = email taken). */
export async function signup(input: SignupInput): Promise<SignupResult>
{
    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
    })

    if (!response.ok)
    {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new ApiError(response.status, body?.error ?? `Signup failed (${response.status})`)
    }

    return await response.json() as SignupResult
}

export interface PublicCheckout
{
    readonly authorizationUrl: string
    readonly reference: string
    readonly amountCents: number
    readonly tier: string
}

/** Starts a Paystack checkout for a pending account, authorised by the signup token. */
export async function startPublicCheckout(token: string): Promise<PublicCheckout>
{
    const response = await fetch('/api/public/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ token }),
    })

    if (!response.ok)
    {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new ApiError(response.status, body?.error ?? `Could not start checkout (${response.status})`)
    }

    return await response.json() as PublicCheckout
}

/**
 * Confirms a public checkout after Paystack returns; applies the plan. With the
 * subscribe flow's `token` and a promo charge, the server also signs the payer in.
 */
export async function confirmPublicCheckout(
    reference: string,
    token?: string,
): Promise<{ readonly plan: string, readonly signedIn?: boolean }>
{
    const response = await fetch('/api/public/checkout/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(token === undefined ? { reference } : { reference, token }),
    })

    if (!response.ok)
    {
        throw new ApiError(response.status, `Could not confirm payment (${response.status})`)
    }

    return await response.json() as { plan: string, signedIn?: boolean }
}

export type PricingTier = 'single' | 'mid' | 'all'

/** Emails the 50%-off discount code to `email`. */
export async function requestDiscountCode(email: string, tier?: PricingTier): Promise<void>
{
    const response = await fetch('/api/public/discount', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(tier === undefined ? { email } : { email, tier }),
    })

    if (!response.ok)
    {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new ApiError(response.status, body?.error ?? `Could not send the code (${response.status})`)
    }
}

export interface SubscribeInput
{
    readonly email: string
    readonly password: string
    readonly companyName: string
    readonly tier: PricingTier
    readonly billing: 'monthly' | 'annual'
    readonly provinces: readonly string[]
    readonly code?: string
}

export interface SubscribeCheckout extends PublicCheckout
{
    /** Resumes the charge in Paystack's on-page popup (empty if Paystack omitted it). */
    readonly accessCode: string
    readonly promo: boolean
    readonly checkoutToken: string
}

/** Creates the account and starts its Paystack charge in one call. */
export async function startSubscribe(input: SubscribeInput): Promise<SubscribeCheckout>
{
    const response = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
    })

    if (!response.ok)
    {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new ApiError(response.status, body?.error ?? `Could not start checkout (${response.status})`)
    }

    return await response.json() as SubscribeCheckout
}

/** The org's settings (the provider key is never returned). */
export function getSettings(signal?: AbortSignal): Promise<Settings>
{
    return getJson<Settings>('/api/settings', signal)
}

/** Saves the org's settings. */
export async function saveSettings(input: SettingsInput): Promise<Settings>
{
    const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        throw new Error(`Could not save settings (${response.status})`)
    }

    return await response.json() as Settings
}

/** The org's current eligibility claims. */
export async function getClaims(signal?: AbortSignal): Promise<Claim[]>
{
    const body = await getJson<{ claims: Claim[] }>('/api/claims', signal)

    return body.claims
}

/**
 * Replaces the org's user-editable claims (everything except `cidb_grade`).
 * `skipped` lists claims left alone because a verified row already exists.
 */
export async function saveClaims(claims: readonly ClaimInput[]): Promise<{ claims: Claim[], skipped: Array<{ claimType: string }> }>
{
    const response = await fetch('/api/claims', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ claims }),
    })

    if (!response.ok) {
        throw new Error(`Could not save eligibility details (${response.status})`)
    }

    return await response.json() as { claims: Claim[], skipped: Array<{ claimType: string }> }
}

/** Recent compliance registration checks. */
export async function listComplianceChecks(signal?: AbortSignal): Promise<ComplianceCheck[]>
{
    const body = await getJson<{ checks: ComplianceCheck[] }>('/api/compliance/checks', signal)

    return body.checks
}

/** Runs a compliance registration check (provider-backed). */
export async function runComplianceCheck(): Promise<ComplianceCheckResult>
{
    const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { accept: 'application/json' },
    })

    if (!response.ok) {
        throw new Error(`Check failed (${response.status})`)
    }

    return await response.json() as ComplianceCheckResult
}

export type FeedMode = 'foryou' | 'optimise'

/** The org's ranked feed. `optimise` ranks opportunities outside your service lines. */
export function getFeed(mode: FeedMode = 'foryou', limit = 20, offset = 0, signal?: AbortSignal): Promise<FeedResponse>
{
    return getJson<FeedResponse>(`/api/feed?mode=${mode}&limit=${limit}&offset=${offset}`, signal)
}

/** Dismisses a tender from the For-You feed. */
export async function dismissTender(tenderId: string): Promise<void>
{
    const response = await fetch('/api/feed/dismiss', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ tenderId }),
    })

    if (!response.ok) {
        throw new Error(`Could not dismiss (${response.status})`)
    }
}

/** The portal tree: province → sector → client → service-line, plus summary. */
export function getPortfolio(signal?: AbortSignal): Promise<Portfolio>
{
    return getJson<Portfolio>('/api/portfolio', signal)
}

/** Lists buyers with open-tender and award counts. */
export async function listBuyers(search: string | undefined, signal?: AbortSignal): Promise<BuyerSummary[]>
{
    const params = new URLSearchParams()

    if (search !== undefined && search.length > 0) {
        params.set('search', search)
    }

    const body = await getJson<{ buyers: BuyerSummary[] }>(`/api/buyers?${params.toString()}`, signal)

    return body.buyers
}

/** Returns one buyer's profile. */
export function getBuyerProfile(name: string, signal?: AbortSignal): Promise<BuyerProfile>
{
    return getJson<BuyerProfile>(`/api/buyers/profile?name=${encodeURIComponent(name)}`, signal)
}

/** Lists compliance documents, computed states, cross-checks and type options. */
export function listCompliance(signal?: AbortSignal): Promise<ComplianceResponse>
{
    return getJson<ComplianceResponse>('/api/compliance', signal)
}

async function sendCompliance(method: 'POST' | 'PATCH', path: string, input: ComplianceInput): Promise<Response>
{
    const response = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
    }

    return response
}

/** Creates a compliance document. */
export async function createCompliance(input: ComplianceInput): Promise<void>
{
    await sendCompliance('POST', '/api/compliance', input)
}

/** Updates a compliance document. */
export async function updateCompliance(id: string, input: ComplianceInput): Promise<void>
{
    await sendCompliance('PATCH', `/api/compliance/${encodeURIComponent(id)}`, input)
}

/** Deletes a compliance document. */
export async function deleteCompliance(id: string): Promise<void>
{
    const response = await fetch(`/api/compliance/${encodeURIComponent(id)}`, { method: 'DELETE' })

    if (!response.ok) {
        throw new Error(`Could not delete document (${response.status})`)
    }
}

export interface CheckoutResult
{
    readonly authorizationUrl: string
    readonly reference: string
}

/** Starts a Paystack subscription checkout for the current org. */
export async function startCheckout(): Promise<CheckoutResult>
{
    const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { accept: 'application/json' } })

    if (!response.ok)
    {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new ApiError(response.status, body?.error ?? `Checkout failed (${response.status})`)
    }

    return await response.json() as CheckoutResult
}

/** Confirms a Paystack transaction after the browser return (webhook fallback). */
export async function confirmCheckout(reference: string): Promise<{ ok: boolean, status?: string, plan?: string }>
{
    const response = await fetch('/api/billing/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ reference }),
    })

    if (!response.ok)
    {
        throw new ApiError(response.status, `Confirm failed (${response.status})`)
    }

    return await response.json() as { ok: boolean, status?: string, plan?: string }
}
