import type { ReactNode } from 'react'

interface EmptyStateProps
{
    readonly icon: ReactNode
    readonly title: string
    readonly description: string
    /** Optional roadmap hint, e.g. "Phase 1 · Discover". */
    readonly hint?: string
}

/** Dashed, panel-styled empty state used by every placeholder screen. */
export function EmptyState({ icon, title, description, hint }: EmptyStateProps)
{
    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line bg-panel px-6 py-16 text-center shadow-panel">
            <span className="grid size-11 place-items-center rounded-full bg-navy/10 text-navy" aria-hidden="true">
                {icon}
            </span>
            <div className="flex max-w-md flex-col gap-1.5">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                <p className="text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
            {hint !== undefined && (
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">{hint}</p>
            )}
        </div>
    )
}
