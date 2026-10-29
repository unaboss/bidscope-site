import { useEffect, useState } from 'react'
import { bidPackSourceUrl, getBidProfile } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fillBuyerPdf } from '@/lib/fill-buyer-pdf'
import { readTenderPdf, TenderPdfError } from '@/lib/tender-pdf'
import type { PageReport } from '../../../worker/domain/form-fill'
import { groupLines, readPreference, type PreferenceReading, type PreferenceSystem } from '../../../worker/domain/specific-goals'
import type { AcceptedGoal } from '../../../worker/domain/bid-pack'

interface BuyerDocumentsProps
{
    readonly tenderId: string
    readonly tenderNo: string | null
    readonly sources: ReadonlyArray<{ readonly index: number, readonly filename: string }>
    readonly accepted: readonly AcceptedGoal[]
    readonly acceptedSystem: PreferenceSystem | null
    /** Saves the goals into the pack; resolves once saved. */
    readonly onAccept: (system: PreferenceSystem | null, goals: AcceptedGoal[]) => Promise<void>
}

interface Filling
{
    readonly source: string
    /** Object URL of the filled copy; null when nothing could be filled. */
    readonly url: string | null
    readonly filename: string
    readonly pages: readonly PageReport[]
    readonly note: string
}

/** `Bid document.pdf` -> `Bid document (filled).pdf`. */
function filledName(filename: string): string
{
    return `${filename.replace(/\.pdf$/i, '')} (filled).pdf`
}

interface Reading
{
    readonly source: string
    readonly preference: PreferenceReading | null
    readonly note: string
}

/**
 * The buyer's own files: read each searchable PDF for the preference system and
 * the specific goals with their points, show where each was found, and let the
 * person accept them into the pack's preference points claim form.
 */
export function BuyerDocuments({ tenderId, tenderNo, sources, accepted, acceptedSystem, onAccept }: BuyerDocumentsProps)
{
    const [busy, setBusy] = useState<string | null>(null)
    const [reading, setReading] = useState<Reading | null>(null)
    const [filling, setFilling] = useState<Filling | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // A filled copy lives in memory as an object URL until it is replaced or the page closes.
    useEffect(() => () =>
    {
        if (filling !== null && filling.url !== null) {
            URL.revokeObjectURL(filling.url)
        }
    }, [filling])

    async function fill(index: number, filename: string): Promise<void>
    {
        setBusy(`fill-${index}`)
        setError('')
        setFilling(null)

        try {
            const [pdf, { profile }] = await Promise.all([readTenderPdf(bidPackSourceUrl(tenderId, index)), getBidProfile()])

            if (pdf.scanned) {
                setFilling({ source: filename, url: null, filename, pages: [], note: 'This document is a scan, so there is no text to fill beside. Use the generated forms in the pack instead.' })

                return
            }

            const { plan, blob } = await fillBuyerPdf(pdf, profile, tenderNo)
            const count = plan.pages.reduce((total, page) => total + page.filled.length, 0)
            const note = plan.pages.length === 0
                ? 'No standard bid forms (SBD/MBD 1, 4, 6.1, 8, 9 or a pricing schedule) were found in this document.'
                : count === 0
                    ? 'The forms were found, but nothing could be filled with confidence. Check that your bid profile is complete.'
                    : `${count} answers written onto ${plan.pages.filter((page) => page.filled.length > 0).length} pages. Check every page before you print and sign it.`

            setFilling({ source: filename, url: blob === null ? null : URL.createObjectURL(blob), filename: filledName(filename), pages: plan.pages, note })
        } catch (cause) {
            setError(cause instanceof TenderPdfError ? cause.message : 'Could not fill that document.')
        } finally {
            setBusy(null)
        }
    }

    async function read(index: number, filename: string): Promise<void>
    {
        setBusy(`read-${index}`)
        setError('')
        setReading(null)

        try {
            const pdf = await readTenderPdf(bidPackSourceUrl(tenderId, index))

            if (pdf.scanned) {
                setReading({ source: filename, preference: null, note: 'This document is a scan, so its text cannot be read. Copy the specific goals from it by hand, or use the generated forms.' })

                return
            }

            const preference = readPreference(groupLines(pdf.items))
            const note = preference.goals.length === 0
                ? 'No specific goals with points were found in this document. Another of the tender’s files may hold them.'
                : preference.consistent
                    ? 'The goals add up to the points the document allocates to specific goals.'
                    : 'Check these against the document: they do not add up to the stated total.'

            setReading({ source: filename, preference, note })
        } catch (cause) {
            setError(cause instanceof TenderPdfError ? cause.message : 'Could not read that document.')
        } finally {
            setBusy(null)
        }
    }

    async function accept(): Promise<void>
    {
        if (reading?.preference === null || reading === null) {
            return
        }

        const { preference, source } = reading

        setSaving(true)
        setError('')

        try {
            await onAccept(preference.system, preference.goals.map((goal) => ({ ...goal, source })))
            setReading(null)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save the goals')
        } finally {
            setSaving(false)
        }
    }

    if (sources.length === 0) {
        return <p className="text-sm text-ink/60">The source lists no documents for this tender.</p>
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
                {sources.map((source) => (
                    <li key={source.index} className="flex flex-col gap-1.5 rounded-lg border border-line p-3">
                        <a href={bidPackSourceUrl(tenderId, source.index)} className="break-words text-sm text-navy underline" target="_blank" rel="noopener noreferrer">{source.filename}</a>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => void read(source.index, source.filename)}>
                                {busy === `read-${source.index}` ? 'Reading…' : 'Read scoring goals'}
                            </Button>
                            <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => void fill(source.index, source.filename)}>
                                {busy === `fill-${source.index}` ? 'Filling…' : 'Fill the buyer’s document'}
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>

            {error !== '' && <p className="text-sm text-danger" role="alert">{error}</p>}

            {filling !== null && (
                <div className="flex flex-col gap-2 rounded-lg border border-navy/30 bg-navy/5 p-3" role="status">
                    <p className="text-xs font-medium text-ink">{filling.source}</p>
                    <p className="text-xs text-ink/70">{filling.note}</p>
                    {filling.url !== null && (
                        <Button asChild size="sm" className="w-fit">
                            <a href={filling.url} download={filling.filename}>Download the filled copy</a>
                        </Button>
                    )}
                    {filling.pages.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                            {filling.pages.filter((page) => page.filled.length > 0 || page.skipped.length > 0).map((page) => (
                                <li key={page.page} className="flex flex-col text-xs">
                                    <span className="text-ink">Page {page.page} · {page.form}</span>
                                    {page.filled.length > 0 && <span className="text-success">Filled: {page.filled.join(', ')}</span>}
                                    {page.skipped.map((skip, position) => (
                                        <span key={`${skip.field}-${position}`} className="text-ink/60">Not filled: {skip.field} ({skip.reason})</span>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="text-xs text-ink/60">Signatures, dates, witnesses and Yes/No declarations are left for you to complete by hand.</p>
                </div>
            )}

            {reading !== null && (
                <div className="flex flex-col gap-2 rounded-lg border border-navy/30 bg-navy/5 p-3" role="status">
                    <p className="text-xs font-medium text-ink">{reading.source}</p>
                    {reading.preference !== null && (
                        <>
                            <p className="text-sm text-ink">
                                Preference system: <strong>{reading.preference.system ?? 'not stated'}</strong>
                                {reading.preference.systemPage !== null && <span className="text-ink/60"> (page {reading.preference.systemPage})</span>}
                            </p>
                            {reading.preference.goals.length > 0 && (
                                <ul className="flex flex-col gap-1.5">
                                    {reading.preference.goals.map((goal) => (
                                        <li key={goal.kind + goal.goal} className="flex flex-col">
                                            <span className="text-sm text-ink">
                                                {goal.goal}: <strong>{goal.points} points</strong> <span className="text-ink/60">(page {goal.page})</span>
                                            </span>
                                            <span className="text-xs text-ink/60">{goal.tiers.map((tier) => `${tier.label} = ${tier.points}`).join(' · ')}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                    <p className="text-xs text-ink/70">{reading.note}</p>
                    {reading.preference !== null && reading.preference.goals.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={saving} onClick={() => void accept()}>{saving ? 'Saving…' : 'Use these goals'}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setReading(null)}>Dismiss</Button>
                        </div>
                    )}
                </div>
            )}

            {accepted.length > 0 && (
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success">On the 6.1 form</Badge>
                        <span className="text-xs text-ink/70">
                            {acceptedSystem ?? 'System not stated'} · {accepted.map((goal) => `${goal.goal} ${goal.points}`).join(', ')}
                        </span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-auto w-fit px-1 text-xs" disabled={saving} onClick={() => void onAccept(null, [])}>Clear the goals</Button>
                </div>
            )}
        </div>
    )
}
