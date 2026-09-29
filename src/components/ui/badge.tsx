import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'navy' | 'success' | 'warn' | 'danger'

const TONES: Record<BadgeTone, string> = {
    neutral: 'bg-ink/10 text-ink/80',
    navy: 'bg-navy/10 text-navy',
    success: 'bg-success/10 text-success',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
}

interface BadgeProps
{
    readonly tone?: BadgeTone
    readonly className?: string
    readonly children: ReactNode
}

/** Small uppercase status chip. Always paired with text — colour is never the only signal. */
export function Badge({ tone = 'neutral', className, children }: BadgeProps)
{
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
                TONES[tone],
                className,
            )}
        >
            {children}
        </span>
    )
}
