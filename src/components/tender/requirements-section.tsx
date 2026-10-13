import type { ReactElement } from 'react'
import { chipCopy } from '@/components/tender/eligibility-chip'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EligibilitySummary, GateSummary } from '@/types'

/** Each extracted requirement in plain words, with its state against the profile and the quoted evidence. */
export function RequirementsList({ eligibility }: { readonly eligibility: EligibilitySummary }): ReactElement
{
    if (eligibility.gates.length === 0) {
        return (
            <p className="text-sm text-ink/70">
                No registration or grading requirements have been picked up from this tender yet. Check the tender documents before you bid.
            </p>
        )
    }

    return (
        <ul className="flex flex-col gap-3">
            {eligibility.gates.map((gate) =>
            {
                const copy = chipCopy(gate.state)

                return (
                    <li key={`${gate.type}:${gate.subjectKey}`} className="flex flex-col gap-1.5 rounded-lg border border-line p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-ink">{gate.label}</span>
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
    )
}

/** The requirements as a compact checklist for cards: what each asks for and its state, no quotes. */
export function RequirementChecklist({ gates, className }: { readonly gates: readonly GateSummary[], readonly className?: string }): ReactElement
{
    return (
        <section aria-label="Requirements" className={cn('flex flex-col gap-2', className)}>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">Requirements</h3>

            {gates.length === 0
                ? <p className="text-sm leading-snug text-ink/55">None picked up from this tender yet. Check the documents before you bid.</p>
                : (
                    <ul className="flex flex-col gap-1.5">
                        {gates.map((gate) =>
                        {
                            const copy = chipCopy(gate.state)

                            return (
                                <li key={`${gate.type}:${gate.subjectKey}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                    <span className="text-sm leading-snug text-ink/85">{gate.label}</span>
                                    {copy !== null && <Badge tone={copy.tone} dot>{copy.label}</Badge>}
                                </li>
                            )
                        })}
                    </ul>
                )}
        </section>
    )
}

/** Deliverables a card shows before folding the rest into a count. */
const DELIVERABLES_SHOWN = 4

/** What the tender asks to be delivered, as DeepSeek read it, sized for a card. */
export function DeliverablesChecklist({ deliverables, className }: { readonly deliverables: readonly string[], readonly className?: string }): ReactElement
{
    const shown = deliverables.slice(0, DELIVERABLES_SHOWN)
    const more = deliverables.length - shown.length

    return (
        <section aria-label="Deliverables" className={cn('flex flex-col gap-2', className)}>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">Deliverables</h3>

            {shown.length === 0
                ? <p className="text-sm leading-snug text-ink/55">Not read from this tender yet. Open the case file for the full scope.</p>
                : (
                    <ul className="flex flex-col gap-1.5">
                        {shown.map((deliverable, index) => (
                            <li key={`${deliverable}-${index}`} className="flex gap-2.5 text-sm leading-snug text-ink/85">
                                <span aria-hidden="true" className="mt-[0.4rem] size-1.5 shrink-0 rotate-45 bg-navy/60" />
                                <span className="line-clamp-2 first-letter:uppercase">{deliverable}</span>
                            </li>
                        ))}
                        {more > 0 && (
                            <li className="ps-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                                +{more} more in the case file
                            </li>
                        )}
                    </ul>
                )}
        </section>
    )
}

export function RequirementsSection({ eligibility }: { readonly eligibility: EligibilitySummary }): ReactElement
{
    return (
        <section aria-label="Requirements" className="flex flex-col gap-2">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">Requirements</h3>
            <RequirementsList eligibility={eligibility} />
        </section>
    )
}
