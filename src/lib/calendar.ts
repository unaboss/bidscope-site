import type { Tender } from '@/types'

export interface CalendarEvent
{
    readonly id: string
    readonly tenderId: string
    readonly kind: 'briefing' | 'closing'
    readonly title: string
    /** ISO `YYYY-MM-DD`. */
    readonly date: string
}

/** Trims a stored timestamp to its `YYYY-MM-DD` day. */
function day(value: string): string
{
    return value.slice(0, 10)
}

/** Every briefing and closing event across the given tenders. */
export function buildEvents(tenders: readonly Tender[]): CalendarEvent[]
{
    const events: CalendarEvent[] = []

    for (const tender of tenders) {
        const name = tender.title ?? 'Tender'

        if (tender.briefing_date !== null) {
            events.push({ id: `${tender.id}-briefing`, tenderId: tender.id, kind: 'briefing', title: name, date: day(tender.briefing_date) })
        }

        if (tender.closing_date !== null) {
            events.push({ id: `${tender.id}-closing`, tenderId: tender.id, kind: 'closing', title: name, date: day(tender.closing_date) })
        }
    }

    return events
}

/** Bookmarked tenders with neither a briefing nor a closing date. */
export function undated(tenders: readonly Tender[]): Tender[]
{
    return tenders.filter((tender) => tender.briefing_date === null && tender.closing_date === null)
}

export interface DateGroup
{
    readonly date: string
    readonly events: CalendarEvent[]
}

/** Events grouped by day, ordered ascending or descending by date. */
export function groupByDate(events: readonly CalendarEvent[], ascending: boolean): DateGroup[]
{
    const map = new Map<string, CalendarEvent[]>()

    for (const event of events) {
        const list = map.get(event.date) ?? []
        list.push(event)
        map.set(event.date, list)
    }

    return [...map.entries()]
        .map(([date, grouped]) => ({ date, events: grouped }))
        .sort((a, b) => (ascending ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
}

/** Events keyed by their ISO day, for the month grid. */
export function eventsByDate(events: readonly CalendarEvent[]): Record<string, CalendarEvent[]>
{
    const map: Record<string, CalendarEvent[]> = {}

    for (const event of events) {
        (map[event.date] ??= []).push(event)
    }

    return map
}
