import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'

/**
 * A single keyboard key. Raised by a one-pixel ink shadow so it reads as a
 * physical key in running text, a legend or a tooltip.
 */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>): ReactElement
{
    return (
        <kbd
            className={cn(
                'inline-grid min-w-[1.25rem] place-items-center rounded border border-line bg-panel px-1.5 py-0.5',
                'font-mono text-[10px] uppercase leading-none text-ink/60 shadow-[0_1px_0_rgb(var(--color-ink)/0.08)]',
                className,
            )}
            {...props}
        />
    )
}
