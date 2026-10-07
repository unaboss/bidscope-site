import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { bbeeCertCurrent, categoriesForCommodities, type CsdReport } from '@/lib/csd'
import { formatDate } from '@/lib/format'
import type { Taxonomy } from '@/types'

/** What the customer confirmed from their report, ready to merge into a form. */
export interface CsdApplied
{
    readonly report: CsdReport
    readonly categories: string[]
    readonly bbeeCurrent: boolean
}

interface CsdUploadProps
{
    readonly taxonomy: Taxonomy | null
    readonly onApply: (applied: CsdApplied) => void
    /** Extra line under the review, e.g. what will and won't be saved at this step. */
    readonly note?: string
}

type State =
    | { readonly kind: 'idle' }
    | { readonly kind: 'reading' }
    | { readonly kind: 'error', readonly message: string }
    | { readonly kind: 'review', readonly report: CsdReport }

function today(): string
{
    return new Date().toISOString().slice(0, 10)
}

function Row(props: { readonly label: string, readonly children: ReactNode })
{
    return (
        <div className="grid gap-1 border-b border-line py-2 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55">{props.label}</dt>
            <dd className="text-sm text-ink">{props.children}</dd>
        </div>
    )
}

/**
 * "Set up from your CSD report": reads the CSD summary PDF in the browser,
 * shows what it found, and hands the confirmed result to `onApply`.
 */
export function CsdUpload({ taxonomy, onApply, note }: CsdUploadProps)
{
    const [state, setState] = useState<State>({ kind: 'idle' })
    const input = useRef<HTMLInputElement>(null)
    const inputId = useId()

    const match = useMemo(() =>
    {
        if (state.kind !== 'review') {
            return null
        }

        return categoriesForCommodities(state.report.commodities, new Set(taxonomy?.categories.map((category) => category.label) ?? []))
    }, [state, taxonomy])

    async function read(file: File | undefined): Promise<void>
    {
        if (file === undefined) {
            return
        }

        setState({ kind: 'reading' })

        try {
            const { readCsdPdf } = await import('@/lib/csd-pdf')

            setState({ kind: 'review', report: await readCsdPdf(file) })
        } catch (cause: unknown) {
            setState({ kind: 'error', message: cause instanceof Error ? cause.message : 'We could not read that file.' })
        } finally {
            if (input.current !== null) {
                input.current.value = ''
            }
        }
    }

    const report = state.kind === 'review' ? state.report : null
    const bbeeCurrent = report !== null && bbeeCertCurrent(report.bbee, today())

    return (
        <div className="flex flex-col gap-4">
            <input
                ref={input}
                id={inputId}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => void read(event.target.files?.[0])}
            />

            {report === null && (
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={() => input.current?.click()} disabled={state.kind === 'reading'}>
                        {state.kind === 'reading' ? 'Reading your report…' : 'Upload CSD report (PDF)'}
                    </Button>
                    <span className="text-xs text-ink/55">Read on this device. Bank, ID and tax numbers are never sent to Bidscope.</span>
                </div>
            )}

            {state.kind === 'error' && <p className="text-sm text-danger" role="alert">{state.message}</p>}

            {report !== null && match !== null && (
                <div className="flex flex-col gap-4 rounded-lg border border-line bg-cream/60 p-4">
                    <dl className="flex flex-col">
                        <Row label="Company">{report.legalName}</Row>
                        <Row label="CSD">
                            {report.active
                                ? <>Active supplier <span className="font-mono text-xs">{report.supplierNumber}</span></>
                                : <>Not active on CSD <span className="font-mono text-xs">({report.supplierNumber})</span></>}
                        </Row>
                        <Row label="Tax">
                            {report.taxCompliant ? 'Tax compliant' : 'Not tax compliant'}
                            {report.taxCheckedOn !== null && <span className="text-ink/55"> · checked {formatDate(report.taxCheckedOn)}</span>}
                        </Row>
                        <Row label="B-BBEE certificate">
                            {report.bbee === null && 'None on CSD. Set your level below.'}
                            {report.bbee !== null && bbeeCurrent && <>Valid{report.bbee.expires !== null && ` until ${formatDate(report.bbee.expires)}`}. Set your level below; CSD doesn&rsquo;t record it.</>}
                            {report.bbee !== null && !bbeeCurrent && (
                                <span className="text-warn">
                                    {report.bbee.expires !== null ? `Expired on ${formatDate(report.bbee.expires)}` : `${report.bbee.status}, no expiry date`}. Update it on CSD so tenders that ask for it count you in.
                                </span>
                            )}
                        </Row>
                        {report.province !== null && (
                            <Row label="Based in">{report.province}. Your province choices are left as they are.</Row>
                        )}
                        <Row label="Tender categories">
                            <div className="flex flex-col gap-2">
                                <span>{match.categories.length} matched from {report.commodities.length} CSD commodit{report.commodities.length === 1 ? 'y' : 'ies'}</span>
                                <ul className="flex flex-wrap gap-1.5">
                                    {match.categories.map((label) => <li key={label}><Badge tone="navy">{label}</Badge></li>)}
                                </ul>
                                {match.unmatched.length > 0 && (
                                    <span className="text-xs text-ink/60">No match for: {match.unmatched.join('; ')}. Pick categories for these yourself.</span>
                                )}
                            </div>
                        </Row>
                    </dl>

                    {note !== undefined && <p className="text-xs text-ink/60">{note}</p>}

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => { onApply({ report, categories: match.categories, bbeeCurrent }); setState({ kind: 'idle' }) }}>
                            Fill in my profile
                        </Button>
                        <Button variant="ghost" onClick={() => setState({ kind: 'idle' })}>Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
