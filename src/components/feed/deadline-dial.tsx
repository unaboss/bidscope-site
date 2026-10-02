import type { ReactElement } from 'react'
import type { Urgency, UrgencyTone } from '@/components/feed/signals'
import { cn } from '@/lib/utils'

/** Arc colour per tone; the arc draws in `currentColor`. */
const ARC: Record<UrgencyTone, string> = {
    danger: 'text-danger',
    warn: 'text-warn',
    neutral: 'text-navy/70',
}

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface DeadlineDialProps
{
    readonly urgency: Urgency
    readonly className?: string
}

/**
 * The brief's countdown as a gauge: the arc fills as the runway is used up
 * (empty at 45 days out, closed at the deadline) and the face carries the
 * whole days left.
 *
 * Decorative — it always sits beside the written closing date and countdown,
 * so assistive technology reads those rather than a second, numeric version.
 */
export function DeadlineDial({ urgency, className }: DeadlineDialProps): ReactElement
{
    // A floor keeps a visible tick, so an empty dial never looks unrendered.
    const filled = Math.max(urgency.pressure, 0.03)
    const { days } = urgency

    return (
        <span aria-hidden="true" className={cn('relative grid size-16 shrink-0 place-items-center', className)}>
            <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
                <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="5" className="stroke-ink/[0.07]" />
                <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
                    className={cn('transition-[stroke-dashoffset] duration-700 ease-out', ARC[urgency.tone])}
                />
            </svg>

            {days === null && <span className="font-mono text-sm text-ink/40">—</span>}
            {days !== null && days < 0 && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-danger">Closed</span>
            )}
            {days !== null && days >= 0 && (
                <span className="flex flex-col items-center leading-none">
                    <span className="font-serif text-lg font-semibold tabular-nums text-ink">{days}</span>
                    <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/45">
                        {days === 1 ? 'day' : 'days'}
                    </span>
                </span>
            )}
        </span>
    )
}
