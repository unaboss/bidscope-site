import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export type BadgeTone = 'neutral' | 'navy' | 'success' | 'warn' | 'danger'

/**
 * Small uppercase status chip, in the shadcn/ui `cva` shape. `tone` is the
 * colour intent; `dot` adds a leading marker for chips that sit in dense rows.
 */
export const badgeVariants = cva(
    'inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
    {
        variants: {
            tone: {
                neutral: 'bg-ink/10 text-ink/80',
                navy: 'bg-navy/10 text-navy',
                success: 'bg-success/10 text-success',
                warn: 'bg-warn/10 text-warn',
                danger: 'bg-danger/10 text-danger',
            } satisfies Record<BadgeTone, string>,
        },
        defaultVariants: {
            tone: 'neutral',
        },
    },
)

interface BadgeProps extends ComponentProps<'span'>
{
    readonly tone?: BadgeTone
    /** Leading dot in the badge's own colour. Decorative. */
    readonly dot?: boolean
}

/** Always paired with text — colour is never the only signal. */
export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: BadgeProps)
{
    return (
        <span className={cn(badgeVariants({ tone }), dot && 'gap-1.5', className)} {...props}>
            {dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />}
            {children}
        </span>
    )
}
