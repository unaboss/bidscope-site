import { cn } from '@/shared/lib/utils'

interface SpinnerProps
{
    readonly label?: string
    readonly className?: string
}

/** Standalone loading status; decorative motion is hidden from screen readers. */
export function Spinner({ label = 'Loading…', className }: SpinnerProps)
{
    return (
        <span role="status" className={cn('inline-flex items-center gap-2', className)}>
            <span aria-hidden="true" className="nt-spinner" />
            <span className="sr-only">{label}</span>
        </span>
    )
}
