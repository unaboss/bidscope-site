import { useState } from 'react'
import { checkTenderDocuments, downloadTenderDocument } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { IconDownload } from '@/shared/ui/icons'
import type { DeepLink } from '@/shared/lib/sources'
import type { DocumentStatus, Tender, TenderDocumentCheck } from '@/shared/types'

/** Why a document did not download, in the words the popup shows. */
export const STATUS_REASON: Record<Exclude<DocumentStatus, 'ready'>, string> = {
    page: 'The link opens a web page on the source, not the file itself.',
    login: 'The source asks you to sign in or register before it releases this file.',
    blocked: 'The source refused to hand this file to Bidscope. It often still opens in your own browser.',
    missing: 'The source says this file is no longer there. It may have been replaced by a newer version.',
    unreachable: 'The source did not answer in time. The site may be down or slow right now.',
    no_link: 'The source lists this document but gives no link to it.',
}

interface Failed
{
    readonly doc: TenderDocumentCheck
    readonly status: Exclude<DocumentStatus, 'ready'>
}

interface Outcome
{
    readonly listed: number
    readonly saved: number
    readonly failed: readonly Failed[]
    /** True when Bidscope could not even ask the source. */
    readonly checkFailed: boolean
}

interface DownloadTenderProps
{
    readonly tender: Tender
    readonly deepLink: DeepLink | null
    readonly siteName: string
    readonly onCopyRef: () => void
    readonly copied: boolean
}

const OUTBOUND = 'inline-flex h-10 items-center gap-2 rounded-md border border-line bg-panel px-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel'

/** The steps to get the documents by hand, for this tender's source. */
function manualSteps(tender: Tender, siteName: string, deepLink: DeepLink | null, needsLogin: boolean): string[]
{
    const ref = tender.tender_no !== null ? `tender number ${tender.tender_no}` : 'the tender title'

    if (tender.source === 'etenders' || tender.source === 'ocds') {
        return [
            deepLink?.isSpecific === true
                ? 'Open the tender on eTenders with the button below. The list filters to this tender on its own.'
                : 'Open eTenders with the button below.',
            `If the list does not filter, switch “Search by” to “Tender No” and paste ${ref}.`,
            'Expand the tender’s row and download the documents listed under it.',
        ]
    }

    return [
        deepLink?.isSpecific === true
            ? `Open the tender on ${siteName} with the button below.`
            : `Open ${siteName} with the button below and go to its tenders or procurement page.`,
        `Find the tender by ${ref}.`,
        needsLogin
            ? `Register or sign in as a supplier on ${siteName} if it asks, then download the documents from the tender page.`
            : 'Download the documents from the tender page.',
    ]
}

function lead(outcome: Outcome, siteName: string): string
{
    if (outcome.checkFailed) {
        return 'Bidscope could not check the documents for this tender just now. You can still get them from the source.'
    }

    if (outcome.listed === 0) {
        return `${siteName} did not list any documents for this tender with its advert. They are usually on the tender’s page at the source.`
    }

    if (outcome.saved > 0) {
        return outcome.failed.length === 1
            ? `Downloaded ${outcome.saved} of ${outcome.listed} documents. The other one could not be fetched directly, so get it from the source.`
            : `Downloaded ${outcome.saved} of ${outcome.listed} documents. The other ${outcome.failed.length} could not be fetched directly, so get them from the source.`
    }

    return outcome.listed === 1
        ? 'This document could not be downloaded directly. Here is how to get it.'
        : `None of the ${outcome.listed} documents could be downloaded directly. Here is how to get them.`
}

/**
 * "Download tender": asks the server which documents the source will hand
 * over, downloads those, and explains the rest in a popup with the next best
 * route (the source page, the steps there, or the buyer's contact).
 */
export function DownloadTender({ tender, deepLink, siteName, onCopyRef, copied }: DownloadTenderProps)
{
    const [busy, setBusy] = useState<string | null>(null)
    const [done, setDone] = useState<string | null>(null)
    const [outcome, setOutcome] = useState<Outcome | null>(null)

    async function download(): Promise<void>
    {
        setDone(null)
        setBusy('Checking documents…')

        let docs: TenderDocumentCheck[]

        try {
            docs = await checkTenderDocuments(tender.id)
        } catch {
            setBusy(null)
            setOutcome({ listed: 0, saved: 0, failed: [], checkFailed: true })

            return
        }

        const ready = docs.filter((doc) => doc.status === 'ready')
        const failed: Failed[] = docs
            .filter((doc) => doc.status !== 'ready')
            .map((doc) => ({ doc, status: doc.status as Failed['status'] }))
        let saved = 0

        for (const [position, doc] of ready.entries()) {
            setBusy(ready.length === 1 ? 'Downloading…' : `Downloading ${position + 1} of ${ready.length}…`)

            const result = await downloadTenderDocument(tender.id, doc)

            if (result === 'saved') {
                saved += 1
            } else {
                failed.push({ doc, status: result === 'ready' ? 'unreachable' : result })
            }
        }

        setBusy(null)

        if (saved > 0 && failed.length === 0) {
            setDone(saved === 1 ? 'Downloaded' : `Downloaded ${saved} files`)
            setTimeout(() => setDone(null), 4000)

            return
        }

        failed.sort((a, b) => a.doc.index - b.doc.index)
        setOutcome({ listed: docs.length, saved, failed, checkFailed: false })
    }

    const needsLogin = outcome?.failed.some((item) => item.status === 'login') ?? false
    const steps = outcome !== null ? manualSteps(tender, siteName, deepLink, needsLogin) : []
    const subject = `Request for tender documents${tender.tender_no !== null ? `: ${tender.tender_no}` : ''}`

    return (
        <>
            <Button variant="secondary" onClick={() => void download()} disabled={busy !== null} aria-live="polite">
                <IconDownload className="size-3.5" />
                {busy ?? done ?? 'Download tender'}
            </Button>

            <Dialog open={outcome !== null} title="Download tender" onClose={() => setOutcome(null)}>
                {outcome !== null && (
                    <div className="flex flex-col gap-5 text-sm">
                        <p className="leading-relaxed text-ink/85">{lead(outcome, siteName)}</p>

                        {outcome.failed.length > 0 && (
                            <ul className="flex flex-col gap-3">
                                {outcome.failed.map(({ doc, status }) => (
                                    <li key={doc.index} className="flex flex-col gap-1 rounded-md border border-line/70 p-3">
                                        <span className="font-medium text-ink [overflow-wrap:anywhere]">{doc.name}</span>
                                        <span className="text-xs leading-snug text-ink/60">{STATUS_REASON[status]}</span>
                                        {doc.url !== null && status !== 'missing' && (
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="w-fit text-xs text-navy underline">
                                                Try the link in your browser
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex flex-col gap-2">
                            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Get them from {siteName}</h3>
                            <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-ink/85">
                                {steps.map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </div>

                        {tender.email !== null && (
                            <p className="text-xs leading-relaxed text-ink/60">
                                Still stuck? Ask the buyer{tender.contact_person !== null ? ` (${tender.contact_person})` : ''} to email the documents to{' '}
                                you: <a href={`mailto:${tender.email}?subject=${encodeURIComponent(subject)}`} className="text-navy underline [overflow-wrap:anywhere]">{tender.email}</a>.
                            </p>
                        )}

                        <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                            {deepLink !== null && (
                                <a href={deepLink.url} target="_blank" rel="noopener noreferrer" className={OUTBOUND}>
                                    {deepLink.isSpecific ? 'Open tender' : `Open ${siteName}`}
                                </a>
                            )}
                            {tender.tender_no !== null && (
                                <Button variant="secondary" onClick={onCopyRef}>
                                    {copied ? 'Copied' : 'Copy tender number'}
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => setOutcome(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    )
}
