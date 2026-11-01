import type { ReactElement } from 'react'

/** Match the discovery rows while results load, without repeated announcements. */
export function TenderListSkeleton(): ReactElement
{
    return (
        <div className="tender-list-skeleton" role="status" aria-live="polite">
            <span className="sr-only">Finding opportunities…</span>
            {Array.from({ length: 6 }, (_, index) => (
                <div className="tender-loading-row" key={index} aria-hidden="true">
                    <div className="tender-loading-copy">
                        <span className="nt-skeleton tender-loading-line title" />
                        <span className="nt-skeleton tender-loading-line buyer" />
                    </div>
                    <span className="nt-skeleton tender-loading-line category" />
                    <span className="nt-skeleton tender-loading-line date" />
                    <span className="nt-skeleton tender-loading-line arrow" />
                </div>
            ))}
        </div>
    )
}
