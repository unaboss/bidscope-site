import { CaretRightIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/shared/lib/format'
import type { Tender } from '@/shared/types'

export function DiscoveryRow({ tender }: { readonly tender: Tender }) {
    return (
        <Link className="tender-list-row discovery-row" to={'/tenders/' + tender.id}>
            <div className="discovery-opportunity">
                <h2>{tender.title ?? 'Untitled tender'}</h2>
                <p>{tender.organ_of_state ?? 'Buyer not listed'}</p>
                {tender.tender_no && <span className="discovery-reference">Ref: {tender.tender_no}</span>}
            </div>
            <div className="discovery-classification">
                <span className="discovery-cell-label">Category / location</span>
                <span>{tender.category ?? 'Category not listed'}</span>
                <span className="discovery-location">{tender.province ?? 'Location not listed'}</span>
            </div>
            <div className="discovery-deadline">
                <span className="discovery-cell-label">Closing date</span>
                {tender.closing_date
                    ? <time dateTime={tender.closing_date}>{formatDate(tender.closing_date)}</time>
                    : <span>Date to be confirmed</span>}
            </div>
            <span className="discovery-open">View<span className="sr-only"> tender</span><CaretRightIcon size={15} aria-hidden="true" /></span>
        </Link>
    )
}
