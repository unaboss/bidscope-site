import { useState } from 'react'
import { bidPackSourceUrl } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { readTenderPdf, TenderPdfError } from '@/lib/tender-pdf'
import { groupLines, readPreference, type PreferenceReading, type PreferenceSystem } from '../../../worker/domain/specific-goals'
import type { AcceptedGoal } from '../../../worker/domain/bid-pack'

interface BuyerDocumentsProps
{
    readonly tenderId: string
    readonly sources: ReadonlyArray<{ readonly index: number, readonly filename: string }>
    readonly accepted: readonly AcceptedGoal[]
    readonly acceptedSystem: PreferenceSystem | null
    /** Saves the goals into the pack; resolves once saved. */
    readonly onAccept: (system: PreferenceSystem | null, goals: AcceptedGoal[]) => Promise<void>
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
export function BuyerDocuments({ tenderId, sources, accepted, acceptedSystem, onAccept }: BuyerDocumentsProps)
{
    const [busy, setBusy] = useState<number | null>(null)
    const [reading, setReading] = useState<Reading | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function read(index: number, filename: string): Promise<void>
    {
        setBusy(index)
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
                        <Button variant="secondary" size="sm" className="w-fit" disabled={busy !== null} onClick={() => void read(source.index, source.filename)}>
                            {busy === source.index ? 'Reading…' : 'Read scoring goals'}
                        </Button>
                    </li>
                ))}
            </ul>

            {error !== '' && <p className="text-sm text-danger" role="alert">{error}</p>}

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
