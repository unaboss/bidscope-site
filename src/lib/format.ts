const EM_DASH = '\u2014'

/** Formats a `YYYY-MM-DD` date for display, or an em dash when absent. */
export function formatDate(value: string | null): string
{
    if (value === null || value.length === 0) {
        return EM_DASH
    }

    // Tolerate a full timestamp ("2026-09-11 00:00:00.000000") by taking the day.
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`)

    if (Number.isNaN(parsed.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC',
    }).format(parsed)
}

/** Formats a rand amount using the locale-aware currency formatter. */
export function formatZAR(value: number): string
{
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0,
    }).format(value)
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

/**
 * Inclusive date bounds for a "closing within N days" filter: from today to
 * today + N. Returns empty bounds for a non-positive window (meaning "any").
 */
export function closingWindow(days: number): { from?: string, to?: string }
{
    if (!Number.isFinite(days) || days <= 0) {
        return {}
    }

    const now = new Date()
    const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())

    return {
        from: new Date(start).toISOString().slice(0, 10),
        to: new Date(start + days * 86_400_000).toISOString().slice(0, 10),
    }
}

/** Whole days from today until a `YYYY-MM-DD` date (negative when past). */
export function daysUntil(date: string): number
{
    const now = new Date()
    const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    const target = Date.parse(`${date.slice(0, 10)}T00:00:00Z`)

    return Math.round((target - base) / 86_400_000)
}

/** Human label for a day count, e.g. "in 7 days", "today", "3 days ago". */
export function relativeDays(days: number): string
{
    if (days === 0) {
        return 'today'
    }

    if (days === 1) {
        return 'tomorrow'
    }

    if (days > 1) {
        return `in ${days} days`
    }

    return `${Math.abs(days)} days ago`
}
