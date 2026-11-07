import type { ReactNode } from 'react'

interface PageHeaderProps
{
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly actions?: ReactNode
}

/**
 * Consistent page title block: a short section label, a single `<h1>`, and the
 * supporting line. The label is sentence case at body-caption size — design.md
 * asks for hierarchy from weight and size, not from all-caps tracking.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps)
{
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            {/* Actions sit beside the copy only while it keeps a readable measure. */}
            <div className="flex min-w-0 flex-1 basis-[22rem] flex-col gap-2">
                <span className="text-xs font-medium text-ink/55">{eyebrow}</span>
                <h1 className="font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
            {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    )
}
