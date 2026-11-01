import { urgencyOf } from '@/features/tenders/components/feed/signals'
import { estimateFrom, tenderEstimate, type ValueEstimate } from '@/features/tenders/estimate'
import { daysUntil, formatDate } from '@/shared/lib/format'
import { serviceLabel } from '@/shared/lib/service-lines'
import type { FeedItem, GateState, GateSummary, Tender } from '@/shared/types'

/**
 * The single shape the Discover queue renders.
 *
 * For-You serves ranked `FeedItem`s and Browse serves filtered `Tender`s; the
 * two carry different subsets of the same tender. Normalising here is what lets
 * one queue, one brief and one set of keyboard shortcuts serve both modes.
 */
export interface QueueItem
{
    readonly id: string
    readonly title: string
    readonly organ: string
    readonly province: string | null
    readonly category: string | null
    /** Human service-line name, already resolved from the code. */
    readonly service: string | null
    readonly closingDate: string | null
    readonly publishedDate: string | null
    /** The likely value and where it came from; null when nothing gives a clue. */
    readonly estimate: ValueEstimate | null
    readonly briefing: string | null
    readonly reAdvert: boolean
    readonly relevant: boolean
    /** Plain-language "why this" lines, most telling first. */
    readonly reasons: readonly string[]
    /** Overall gate state; absent in Browse, where rows carry no eligibility. */
    readonly eligibility?: GateState
    /** Each requirement read from the tender; absent in Browse, like `eligibility`. */
    readonly requirements?: readonly GateSummary[]
    /** What has to be delivered, as DeepSeek read it; absent in Browse, empty until it has run. */
    readonly deliverables?: readonly string[]
}

const UNTITLED = 'Untitled tender'
const UNKNOWN_BUYER = 'Unknown buyer'

function nonEmpty(value: string | null | undefined): string | null
{
    if (value === null || value === undefined || value.trim().length === 0) {
        return null
    }

    return value
}

/** Maps a ranked feed entry, keeping the server's own explanation of the match. */
export function fromFeedItem(item: FeedItem): QueueItem
{
    return {
        id: item.id,
        title: nonEmpty(item.title) ?? UNTITLED,
        organ: nonEmpty(item.organ) ?? UNKNOWN_BUYER,
        province: null,
        category: null,
        service: serviceLabel(item.serviceLine),
        closingDate: item.closingDate,
        publishedDate: item.publishedDate,
        estimate: estimateFrom(item),
        briefing: null,
        reAdvert: item.reAdvert === 1,
        relevant: item.relevance === 'relevant',
        reasons: item.reasons,
        eligibility: item.eligibility?.state,
        requirements: item.eligibility?.gates ?? [],
        deliverables: item.brief?.deliverables ?? [],
    }
}

/**
 * Browse rows have no server-side ranking, so "why this" is assembled from
 * facts already on the row. Every line is a statement about the tender itself —
 * nothing here invents a signal the data does not hold.
 */
function reasonsForTender(tender: Tender): string[]
{
    const reasons: string[] = []
    const urgency = urgencyOf(tender.closing_date)
    const service = serviceLabel(tender.service_line)

    if (tender.relevance === 'relevant') {
        reasons.push('inside your service lines')
    }

    if (service !== null) {
        reasons.push(`classified as ${service.toLowerCase()}`)
    }

    if (urgency.days !== null && urgency.days >= 0 && urgency.days <= 7) {
        reasons.push(urgency.days === 0 ? 'closes today' : `closes ${urgency.label}`)
    }

    if (tender.re_advert === 1) {
        reasons.push('re-advertised, so the first round drew no award')
    }

    if (tender.briefing_compulsory === 1) {
        reasons.push('compulsory briefing — attendance gates the bid')
    }

    return reasons
}

function briefingFor(tender: Tender): string | null
{
    if (tender.briefing_date !== null) {
        const parts = [formatDate(tender.briefing_date)]

        if (tender.briefing_compulsory === 1) {
            parts.push('compulsory')
        }

        if (daysUntil(tender.briefing_date) < 0) {
            parts.push('briefing passed')
        }

        return parts.join(' · ')
    }

    if (tender.briefing_required === 1) {
        return tender.briefing_compulsory === 1 ? 'Compulsory, date TBC' : 'Required, date TBC'
    }

    return null
}

/** Maps a catalogue tender, which carries province and category the feed omits. */
export function fromTender(tender: Tender): QueueItem
{
    return {
        id: tender.id,
        title: nonEmpty(tender.title) ?? UNTITLED,
        organ: nonEmpty(tender.organ_of_state) ?? UNKNOWN_BUYER,
        province: nonEmpty(tender.province),
        category: nonEmpty(tender.category),
        service: serviceLabel(tender.service_line),
        closingDate: tender.closing_date,
        publishedDate: tender.published_date,
        estimate: tenderEstimate(tender),
        briefing: briefingFor(tender),
        reAdvert: tender.re_advert === 1,
        relevant: tender.relevance === 'relevant',
        reasons: reasonsForTender(tender),
    }
}
