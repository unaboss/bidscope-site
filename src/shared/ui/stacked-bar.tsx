import type { ReactElement } from 'react'
import { cn } from '@/shared/lib/utils'

export interface StackedSegment
{
    readonly key: string
    readonly value: number
    /** Background utility for the segment, e.g. `bg-danger`. */
    readonly tone: string
}

interface StackedBarProps
{
    readonly segments: readonly StackedSegment[]
    /** Segment to emphasise; the rest recede. Null emphasises all. */
    readonly highlight?: string | null
    readonly className?: string
}

/**
 * A single bar split into proportional segments — the shape of a set at a
 * glance. Decorative: callers always render the same counts as text.
 */
export function StackedBar({ segments, highlight = null, className }: StackedBarProps): ReactElement
{
    const visible = segments.filter((segment) => segment.value > 0)

    return (
        <span aria-hidden="true" className={cn('flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full', className)}>
            {visible.length === 0 && <span className="flex-1 rounded-full bg-ink/[0.07]" />}
            {visible.map((segment) => (
                <span
                    key={segment.key}
                    className={cn(
                        'h-full min-w-1.5 rounded-full transition-opacity duration-200',
                        segment.tone,
                        highlight !== null && highlight !== segment.key && 'opacity-25',
                    )}
                    style={{ flexGrow: segment.value, flexBasis: 0 }}
                />
            ))}
        </span>
    )
}
