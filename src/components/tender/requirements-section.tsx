import type { ReactElement } from 'react'
import { chipCopy } from '@/components/tender/eligibility-chip'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { EligibilitySummary } from '@/types'

/** Each extracted requirement with its state and, when we have it, the quoted evidence. */
export function RequirementsSection({ eligibility }: { readonly eligibility: EligibilitySummary }): ReactElement
{
    return (
        <section aria-label="Requirements" className="flex flex-col gap-2">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Requirements</h3>

            {eligibility.gates.length === 0
                ? <p className="text-sm text-ink/70">No requirements were found in the tender documents. Check them before you bid.</p>
                : (
                    <ul className="flex flex-col gap-3">
                        {eligibility.gates.map((gate) =>
                        {
                            const copy = chipCopy(gate.state)

                            return (
                                <li key={`${gate.type}:${gate.subjectKey}`} className="flex flex-col gap-1.5 rounded-lg border border-line p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium uppercase text-ink">
                                            {gate.type}{gate.subjectKey !== '' && ` · ${gate.subjectKey}`}
                                        </span>
                                        {copy !== null && <Badge tone={copy.tone} dot>{copy.label}</Badge>}
                                        {gate.asAt !== null && (
                                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                                                Profile as at {formatDate(gate.asAt)}
                                            </span>
                                        )}
                                    </div>
                                    {gate.evidence !== null && (
                                        <blockquote className="border-s-2 border-navy/30 ps-3 text-sm italic text-ink/70">
                                            “{gate.evidence}”
                                        </blockquote>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
        </section>
    )
}
