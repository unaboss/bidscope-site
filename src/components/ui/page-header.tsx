import type { ReactNode } from 'react'

interface PageHeaderProps
{
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly actions?: ReactNode
}

/** Consistent page title block: mono eyebrow, single `<h1>`, supporting copy. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps)
{
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">{eyebrow}</span>
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
            {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    )
}
