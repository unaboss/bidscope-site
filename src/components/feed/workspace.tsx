import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WorkspaceProps
{
    readonly queue: ReactNode
    readonly brief: ReactNode
}

/**
 * The Discover frame: a scrolling queue beside a brief that stays put.
 *
 * The split only appears at `xl`, where the app rail still leaves room for two
 * readable columns. Below it the brief folds into the queue, under the row it
 * belongs to, so small screens get one column and no modal.
 */
export function Workspace({ queue, brief }: WorkspaceProps): ReactElement
{
    return (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,25rem)]">
            <div className="min-w-0">{queue}</div>
            <aside
                aria-label="Tender brief"
                className="hidden xl:sticky xl:top-20 xl:block xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto"
            >
                {brief}
            </aside>
        </div>
    )
}

/** A single key in the shortcut legend. */
export function Kbd({ children }: { readonly children: ReactNode }): ReactElement
{
    return (
        <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink/60 shadow-[0_1px_0_rgb(var(--color-ink)/0.08)]">
            {children}
        </kbd>
    )
}

interface ShortcutLegendProps
{
    readonly dismissable: boolean
    readonly className?: string
}

/**
 * Discoverability for the keyboard path. Hidden on touch widths, where the
 * shortcuts do not apply and the row would only be noise.
 */
export function ShortcutLegend({ dismissable, className }: ShortcutLegendProps): ReactElement
{
    return (
        <p
            className={cn(
                'hidden flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40 lg:flex',
                className,
            )}
        >
            <span className="inline-flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
            <span className="inline-flex items-center gap-1"><Kbd>S</Kbd> save</span>
            {dismissable && <span className="inline-flex items-center gap-1"><Kbd>X</Kbd> dismiss</span>}
            <span className="inline-flex items-center gap-1"><Kbd>O</Kbd> open</span>
        </p>
    )
}

/**
 * Polite announcement channel for actions that only change the list visually —
 * a saved or dismissed row has to be spoken, not just animated away.
 */
export function LiveStatus({ message }: { readonly message: string }): ReactElement
{
    return <p role="status" aria-live="polite" className="sr-only">{message}</p>
}

interface InlineErrorProps
{
    readonly message: string
    readonly className?: string
}

/** Non-blocking failure notice shown above content that is still usable. */
export function InlineError({ message, className }: InlineErrorProps): ReactElement
{
    return (
        <p
            role="alert"
            className={cn(
                'rounded-lg border border-danger/25 bg-danger/5 px-4 py-2.5 text-sm text-danger',
                className,
            )}
        >
            {message}
        </p>
    )
}
