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
        <header className="flex flex-wrap items-end justify-between gap-4">
            {/* Actions sit beside the copy only while it keeps a readable measure. */}
            <div className="flex min-w-0 flex-1 basis-[22rem] flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-navy/85">{eyebrow}</span>
                <h1 className="font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
            {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    )
}
