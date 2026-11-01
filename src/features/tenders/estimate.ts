import { compactRand, formatZAR } from '@/shared/lib/format'
import type { EstimateFields, Tender } from '@/shared/types'

/**
 * Where a tender's value estimate came from, strongest evidence first. Mirrors
 * `worker/domain/estimates.ts`, which picks the first that applies.
 */
export const BASIS_PUBLISHED = 'published'
export const BASIS_STATED = 'stated in documents'
export const BASIS_CIDB_BAND = 'CIDB grade band'
export const BASIS_CLIENT_CATEGORY = 'client similar awards'
export const BASIS_CLIENT = 'client history'
export const BASIS_AI_SIMILAR = 'AI estimate from similar awards'
export const BASIS_SCOPE = 'AI scope estimate'

export interface ValueEstimate
{
    /** One figure: the amount itself, the award median, or the middle of the range. */
    readonly value: number
    /** The likely range; either end is null when it is open (up to / over). */
    readonly low: number | null
    readonly high: number | null
    readonly basis: string | null
    /** The CIDB grade asked for (e.g. "4GB") or the number of awards behind it. */
    readonly detail: string | null
}

export function estimateFrom(fields: EstimateFields): ValueEstimate | null
{
    if (fields.estimatedValue === null) {
        return null
    }

    return {
        value: fields.estimatedValue,
        low: fields.estimateLow ?? null,
        high: fields.estimateHigh ?? null,
        basis: fields.estimateBasis ?? null,
        detail: fields.estimateDetail ?? null,
    }
}

/** A catalogue tender's estimate; a published value stands in until the estimate has been worked out. */
export function tenderEstimate(tender: Tender): ValueEstimate | null
{
    if (tender.estimated_value !== null && tender.estimated_value !== undefined) {
        return {
            value: tender.estimated_value,
            low: tender.estimate_low ?? null,
            high: tender.estimate_high ?? null,
            basis: tender.estimate_basis ?? null,
            detail: tender.estimate_detail ?? null,
        }
    }

    if (tender.contract_value !== null && tender.contract_value > 0) {
        return { value: tender.contract_value, low: null, high: null, basis: BASIS_PUBLISHED, detail: null }
    }

    return null
}

/** True for DeepSeek's rough range from the scope, which is never shown without saying so. */
export function isRoughEstimate(estimate: ValueEstimate | null): boolean
{
    return estimate?.basis === BASIS_SCOPE
}

/**
 * The amount as a reader should see it: a range when the evidence gives one
 * ("R3m–R6m", "Up to R200k", "Over R200m"), else the amount itself. `compact`
 * abbreviates a single amount too, for tight rows.
 */
export function formatEstimate(estimate: ValueEstimate, compact = false): string
{
    const { low, high, value } = estimate

    if (low !== null && high !== null) {
        return `${compactRand(low)}–${compactRand(high)}`
    }

    if (high !== null) {
        return `Up to ${compactRand(high)}`
    }

    if (low !== null) {
        return `Over ${compactRand(low)}`
    }

    return compact ? compactRand(value) ?? formatZAR(value) : formatZAR(value)
}

function awardCount(detail: string | null): string | null
{
    const count = /\d+/.exec(detail ?? '')?.[0]

    return count !== undefined ? count : null
}

/** Plain words for where the estimate came from, e.g. "CIDB 4GB grade band" or "Rough AI estimate". */
export function estimateSource(estimate: ValueEstimate): string
{
    const count = awardCount(estimate.detail)

    switch (estimate.basis) {
        case BASIS_PUBLISHED:
            return 'Published by the buyer'
        case BASIS_STATED:
            return 'Stated in the tender documents'
        case BASIS_CIDB_BAND:
            return estimate.detail !== null ? `CIDB ${estimate.detail} grade band` : 'CIDB grade band'
        case BASIS_CLIENT_CATEGORY:
            return count !== null ? `${count} similar awards by this buyer` : 'Similar awards by this buyer'
        case BASIS_CLIENT:
            return count !== null ? `${count} past awards by this buyer` : 'Past awards by this buyer'
        case BASIS_AI_SIMILAR:
            return count !== null ? `AI estimate from ${count} similar awards` : 'AI estimate'
        case BASIS_SCOPE:
            return 'Rough AI estimate'
        default:
            return estimate.basis ?? 'Estimate'
    }
}

/** One line for plain-text places: "R3m–R6m · CIDB 4GB grade band". */
export function estimateText(estimate: ValueEstimate | null, compact = false): string
{
    return estimate === null ? 'Not known yet' : `${formatEstimate(estimate, compact)} · ${estimateSource(estimate)}`
}

/**
 * Why the estimate reads as it does, for the tender's own page. `quote` is the
 * sentence a stated value was read from, when the API sends it.
 */
export function estimateNote(estimate: ValueEstimate, quote: string | null = null): string | null
{
    const range = estimate.low !== null || estimate.high !== null ? formatEstimate(estimate) : null

    switch (estimate.basis) {
        case BASIS_PUBLISHED:
            return 'The buyer published this value with the notice.'
        case BASIS_STATED:
            return quote !== null ? `\u201c${quote}\u201d` : null
        case BASIS_CIDB_BAND:
            return `A tender is graded by its value, so the CIDB grade it asks for${estimate.detail !== null ? ` (${estimate.detail})` : ''} puts it at ${range ?? formatZAR(estimate.value)}.`
        case BASIS_CLIENT_CATEGORY:
        case BASIS_CLIENT:
            return `The middle half of those awards; their median is ${formatZAR(estimate.value)}.`
        case BASIS_AI_SIMILAR:
            return `DeepSeek’s range from the scope, checked against ${awardCount(estimate.detail) ?? 'similar'} past awards for similar work and what they went for. An estimate, not a quote.`
        case BASIS_SCOPE:
            return 'DeepSeek’s rough range from the scope alone. The tender gives no price, CIDB grade or award history to go on, so treat it as a guess.'
        default:
            return null
    }
}
