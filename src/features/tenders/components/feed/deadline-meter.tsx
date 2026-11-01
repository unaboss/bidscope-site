import type { ReactElement } from 'react'
import type { Urgency, UrgencyTone } from '@/features/tenders/components/feed/signals'
import { cn } from '@/shared/lib/utils'

/** Meter fill per tone. */
const FILL: Record<UrgencyTone, string> = {
    danger: 'bg-danger',
    warn: 'bg-warn',
    neutral: 'bg-navy/60',
}

/** Countdown text colour per tone. */
export const URGENCY_TEXT: Record<UrgencyTone, string> = {
    danger: 'text-danger',
    warn: 'text-warn',
    neutral: 'text-ink/50',
}

/** Left-edge rule that gives a card its deadline temperature at a glance. */
export const URGENCY_SPINE: Record<UrgencyTone, string> = {
    danger: 'bg-danger',
    warn: 'bg-warn',
    neutral: 'bg-neutral-300',
}

interface DeadlineMeterProps
{
    readonly urgency: Urgency
    readonly className?: string
}

/**
 * Hairline pressure bar: empty at 45 days out, full on the closing day.
 *
 * Decorative by design — it is always rendered next to the countdown text, so
 * assistive technology reads the deadline rather than a redundant percentage.
 */
export function DeadlineMeter({ urgency, className }: DeadlineMeterProps): ReactElement
{
    // A floor keeps a sliver visible, so the bar never looks like a rendering bug.
    const width = Math.round(Math.max(urgency.pressure, 0.03) * 100)

    return (
        <span
            aria-hidden="true"
            className={cn('block h-[3px] w-full overflow-hidden rounded-full bg-ink/[0.07]', className)}
        >
            <span
                className={cn('block h-full rounded-full transition-[width] duration-700 ease-out', FILL[urgency.tone])}
                style={{ width: `${width}%` }}
            />
        </span>
    )
}

interface CountdownProps
{
    readonly urgency: Urgency
    readonly className?: string
}

/** The countdown as mono type, coloured by tone. */
export function Countdown({ urgency, className }: CountdownProps): ReactElement
{
    return (
        <span
            className={cn(
                'font-mono text-[10px] uppercase tracking-[0.12em]',
                URGENCY_TEXT[urgency.tone],
                className,
            )}
        >
            {urgency.label}
        </span>
    )
}
