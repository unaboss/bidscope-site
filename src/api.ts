import type { Account, BuyerProfile, BuyerSummary, ComplianceCheck, ComplianceCheckResult, ComplianceInput, ComplianceResponse, FeedResponse, Portfolio, Settings, SettingsInput, Tender, TenderListResponse } from '@/types'

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

export interface TenderQuery
{
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

/** Lists tenders with the given filters. */
export function listTenders(query: TenderQuery, signal?: AbortSignal): Promise<TenderListResponse>
{
    const params = new URLSearchParams()

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

    return getJson<TenderListResponse>(`/api/tenders?${params.toString()}`, signal)
}

/** Returns one tender by id. */
export function getTender(id: string, signal?: AbortSignal): Promise<Tender>
{
    return getJson<Tender>(`/api/tenders/${encodeURIComponent(id)}`, signal)
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
    input: { readonly serviceLines: string[], readonly provinces: string[], readonly companyName?: string },
    signal?: AbortSignal,
): Promise<RelevancePreview>
{
    const params = new URLSearchParams()

    if (input.serviceLines.length > 0)
    {
        params.set('serviceLines', input.serviceLines.join(','))
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
