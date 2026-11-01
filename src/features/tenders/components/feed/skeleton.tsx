import type { ReactElement } from 'react'
import { cn } from '@/shared/lib/utils'

function Bar({ className }: { readonly className?: string }): ReactElement
{
    return <span className={cn('nt-skeleton block h-2.5 rounded-full', className)} />
}

/**
 * Queue placeholder shaped like the rows it replaces, so the layout does not
 * jump when the data lands. Announced once, politely, rather than 5 times.
 */
export function QueueSkeleton({ rows = 5 }: { readonly rows?: number }): ReactElement
{
    return (
        <div className="flex flex-col gap-2.5" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading tenders…</span>
            {Array.from({ length: rows }, (_unused, index) => index).map((index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className="animate-rise flex flex-col gap-3 rounded-xl border border-line bg-panel py-4 pe-4 ps-5"
                    style={{ animationDelay: `${index * 45}ms` }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <span className="flex w-full max-w-sm flex-col gap-2">
                            <Bar className="w-full" />
                            <Bar className="w-2/3 opacity-70" />
                        </span>
                        <Bar className="w-16 shrink-0 opacity-60" />
                    </div>
                    <Bar className="h-[3px] w-full opacity-50" />
                    <span className="flex gap-1.5">
                        <Bar className="h-4 w-20 rounded-sm opacity-50" />
                        <Bar className="h-4 w-28 rounded-sm opacity-40" />
                    </span>
                </div>
            ))}
        </div>
    )
}

/** Brief-pane placeholder, matched to the pane's masthead-then-facts rhythm. */
export function BriefSkeleton(): ReactElement
{
    return (
        <div aria-hidden="true" className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <span className="flex flex-col gap-2.5">
                <Bar className="w-24 opacity-60" />
                <Bar className="h-4 w-full" />
                <Bar className="h-4 w-4/5" />
                <Bar className="w-1/2 opacity-70" />
            </span>
            <Bar className="h-[3px] w-full opacity-50" />
            <span className="flex flex-col gap-3">
                <Bar className="w-full opacity-60" />
                <Bar className="w-5/6 opacity-50" />
                <Bar className="w-3/4 opacity-40" />
            </span>
        </div>
    )
}
