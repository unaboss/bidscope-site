import { daysUntil, formatZAR, relativeDays } from '@/lib/format'

/** Colour intent for a deadline. Never the only signal — always paired with text. */
export type UrgencyTone = 'danger' | 'warn' | 'neutral'

/** Grouping buckets for the Bookmarks deadline board, in board order. */
export type UrgencyBand = 'overdue' | 'week' | 'fortnight' | 'month' | 'later' | 'undated'

export interface Urgency
{
    /** Whole days until closing; negative once past, null when undated. */
    readonly days: number | null
    readonly tone: UrgencyTone
    readonly band: UrgencyBand
    /** Short lowercase countdown, e.g. "in 6 days", "closed 2 days ago". */
    readonly label: string
    /** 0 (all the time in the world) … 1 (out of time) — drives the meter fill. */
    readonly pressure: number
}

/** Runway beyond which a deadline exerts no visual pressure at all. */
const HORIZON_DAYS = 45

const UNDATED: Urgency = {
    days: null,
    tone: 'neutral',
    band: 'undated',
    label: 'no closing date',
    pressure: 0,
}

function bandFor(days: number): UrgencyBand
{
    if (days < 0) {
        return 'overdue'
    }

    if (days <= 7) {
        return 'week'
    }

    if (days <= 14) {
        return 'fortnight'
    }

    if (days <= 30) {
        return 'month'
    }

    return 'later'
}

function toneFor(days: number): UrgencyTone
{
    if (days <= 7) {
        return 'danger'
    }

    if (days <= 30) {
        return 'warn'
    }

    return 'neutral'
}

function labelFor(days: number): string
{
    if (days >= 0) {
        return relativeDays(days)
    }

    const past = Math.abs(days)

    return `closed ${past} day${past === 1 ? '' : 's'} ago`
}

/**
 * Everything the UI needs to express a closing date: the countdown, the tone,
 * the board bucket and the meter fill. Derived once, read everywhere, so the
 * queue row, the brief and the deadline board can never disagree.
 */
export function urgencyOf(closingDate: string | null | undefined): Urgency
{
    if (closingDate === null || closingDate === undefined || closingDate.length === 0) {
        return UNDATED
    }

    const days = daysUntil(closingDate)

    return {
        days,
        tone: toneFor(days),
        band: bandFor(days),
        label: labelFor(days),
        pressure: days <= 0 ? 1 : 1 - Math.min(days, HORIZON_DAYS) / HORIZON_DAYS,
    }
}

function trimTenth(value: number): string
{
    return value.toFixed(1).replace(/\.0$/, '')
}

/**
 * Rand formatted to fit a card corner: "R1.2m", "R450k". Falls back to the full
 * locale currency below R10 000, where abbreviating loses more than it saves.
 */
export function compactRand(value: number | null | undefined): string | null
{
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return null
    }

    const magnitude = Math.abs(value)

    if (magnitude >= 1_000_000_000) {
        return `R${trimTenth(value / 1_000_000_000)}bn`
    }

    if (magnitude >= 1_000_000) {
        return `R${trimTenth(value / 1_000_000)}m`
    }

    if (magnitude >= 10_000) {
        return `R${Math.round(value / 1_000)}k`
    }

    return formatZAR(value)
}

/** True when the user has asked the OS to minimise animation. */
export function prefersReducedMotion(): boolean
{
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
