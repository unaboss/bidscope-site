import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface FeedEmptyProps
{
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly icon: ReactNode
    /** Actions or a footnote; rendered under the copy. */
    readonly children?: ReactNode
    readonly className?: string
}

/**
 * Editorial empty state.
 *
 * Reaching zero is usually an achievement in this product — a cleared feed, a
 * shortlist not yet started — so it is set like a page of the dossier rather
 * than an error, and always offers the next move.
 */
export function FeedEmpty({ eyebrow, title, description, icon, children, className }: FeedEmptyProps): ReactElement
{
    return (
        <section
            className={cn(
                'nt-grain animate-rise relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl',
                'border border-dashed border-neutral-300 bg-panel px-6 py-16 text-center shadow-panel',
                className,
            )}
        >
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy/25 to-transparent"
            />

            <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-full bg-navy/[0.07] text-navy ring-1 ring-inset ring-navy/15"
            >
                {icon}
            </span>

            <div className="flex max-w-md flex-col gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">{eyebrow}</span>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
                <p className="text-sm leading-relaxed text-ink/60">{description}</p>
            </div>

            {children !== undefined && (
                <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
            )}
        </section>
    )
}
