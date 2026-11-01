import { ArrowSquareOutIcon } from '@phosphor-icons/react'

interface NoticeSourceProps {
    name: string
    url?: string
}

export function NoticeSource({ name, url }: NoticeSourceProps) {
    return (
        <section className="detail-provenance" aria-label="Notice source">
            <div>
                <span className="detail-source-label">Notice source</span>
                <strong>{name}</strong>
                <p>Confirm requirements, amendments and closing times in the original notice.</p>
            </div>
            {url && (
                <a className="detail-source-link" href={url} target="_blank" rel="noopener noreferrer">
                    Open original notice <ArrowSquareOutIcon size={15} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                </a>
            )}
        </section>
    )
}
