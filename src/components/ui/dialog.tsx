import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { IconClose } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface DialogProps
{
    readonly open: boolean
    readonly title: string
    readonly onClose: () => void
    /** Width preset. `lg` suits larger detail views. */
    readonly size?: 'md' | 'lg'
    readonly children: ReactNode
}

const SIZES = {
    md: 'max-w-lg',
    lg: 'max-w-3xl',
} as const

/**
 * Modal built on the native `<dialog>` element, so focus trapping, Escape and
 * the top-layer backdrop come from the platform. Focus returns to the trigger
 * automatically when the dialog closes.
 */
export function Dialog({ open, title, onClose, size = 'md', children }: DialogProps)
{
    const ref = useRef<HTMLDialogElement>(null)
    const titleId = useId()

    useEffect(() =>
    {
        const element = ref.current

        if (element === null) {
            return
        }

        if (open && !element.open) {
            element.showModal()
        } else if (!open && element.open) {
            element.close()
        }
    }, [open])

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            className={cn(
                'w-[calc(100%-2rem)] rounded-xl border border-line bg-panel p-6 text-ink shadow-panel backdrop:bg-black/60',
                SIZES[size],
            )}
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <h2 id={titleId} className="font-mono text-xs uppercase tracking-[0.18em] text-ink/70">
                    {title}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-me-1 -mt-1 grid size-7 place-items-center rounded-md text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                >
                    <IconClose className="size-4" />
                </button>
            </div>
            {children}
        </dialog>
    )
}
