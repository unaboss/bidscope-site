import { CircleAlert } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { Kbd } from '@/components/ui/kbd'
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

function Shortcut({ keys, children }: { readonly keys: readonly string[], readonly children: ReactNode }): ReactElement
{
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5">
                {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
            </span>
            {children}
        </span>
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
                'hidden flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45 lg:flex',
                className,
            )}
        >
            <span className="sr-only">Keyboard shortcuts:</span>
            <Shortcut keys={['↑', '↓']}>move</Shortcut>
            <Shortcut keys={['S']}>save</Shortcut>
            {dismissable && <Shortcut keys={['X']}>dismiss</Shortcut>}
            <Shortcut keys={['O']}>open</Shortcut>
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
                'animate-reveal flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger/5 px-4 py-2.5 text-sm text-danger',
                className,
            )}
        >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
        </p>
    )
}
