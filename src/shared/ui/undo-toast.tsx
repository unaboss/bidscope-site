import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/shared/ui/button'
import { IconClose } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/utils'

interface UndoToastProps
{
    readonly children: ReactNode
    readonly onUndo: () => void
    readonly onDismiss: () => void
    /** How long the caller keeps the undo alive; drives the draining bar. */
    readonly durationMs: number
    readonly className?: string
}

/**
 * Floating "done — undo?" notice. The hairline along the top drains over the
 * undo window, so the deadline is visible rather than a surprise. Under
 * reduced motion the bar is dropped entirely: a drain that snaps to empty
 * would read as "already expired". Remount it (via `key`) to restart.
 */
export function UndoToast({ children, onUndo, onDismiss, durationMs, className }: UndoToastProps): ReactElement
{
    const [draining, setDraining] = useState(false)

    useEffect(() =>
    {
        // One frame at full width first, so the transition has a start point.
        const frame = window.requestAnimationFrame(() => setDraining(true))

        return () => window.cancelAnimationFrame(frame)
    }, [])

    return (
        <div
            role="status"
            className={cn(
                'animate-rise fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg overflow-hidden rounded-xl',
                'border border-line bg-panel text-ink shadow-panel',
                className,
            )}
        >
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-ink/[0.06] motion-reduce:hidden">
                <span
                    className={cn(
                        'block h-full origin-left bg-navy/60 transition-transform ease-linear',
                        draining ? 'scale-x-0' : 'scale-x-100',
                    )}
                    style={{ transitionDuration: `${durationMs}ms` }}
                />
            </span>

            <div className="flex items-center gap-3 py-2.5 pe-2 ps-4">
                <p className="min-w-0 flex-1 text-sm leading-snug text-ink/70">{children}</p>
                <Button variant="secondary" size="sm" onClick={onUndo}>Undo</Button>
                <Button variant="ghost" size="icon-sm" aria-label="Dismiss notice" onClick={onDismiss}>
                    <IconClose className="size-4" />
                </Button>
            </div>
        </div>
    )
}
