import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/shared/lib/utils'

export interface SegmentedTab<T extends string>
{
    readonly value: T
    readonly label: string
    readonly icon?: ReactNode
    /** Shown as the native tooltip; keep it short. */
    readonly hint?: string
}

interface SegmentedTabsListProps<T extends string>
{
    readonly tabs: ReadonlyArray<SegmentedTab<T>>
    /** The current value, so the thumb can be measured against its trigger. */
    readonly value: T
    readonly label: string
    readonly className?: string
}

/**
 * Segmented control with a sliding thumb, layered on the shadcn `Tabs`
 * primitive — Radix supplies the roles, roving focus and arrow keys; this adds
 * the measured ink block that travels under the active trigger. Must sit
 * inside a `<Tabs>` root.
 */
export function SegmentedTabsList<T extends string>({ tabs, value, label, className }: SegmentedTabsListProps<T>): ReactElement
{
    const listRef = useRef<HTMLDivElement>(null)
    const [thumb, setThumb] = useState<CSSProperties | null>(null)

    const measure = useCallback(() =>
    {
        const trigger = listRef.current?.querySelector<HTMLElement>(`[data-segment="${value}"]`)

        if (trigger === null || trigger === undefined) {
            return
        }

        setThumb({ width: trigger.offsetWidth, transform: `translateX(${trigger.offsetLeft}px)` })
    }, [value])

    useLayoutEffect(() =>
    {
        measure()

        const list = listRef.current

        if (list === null || typeof ResizeObserver === 'undefined') {
            return
        }

        // Web fonts landing late, or the header wrapping, both move the triggers.
        const observer = new ResizeObserver(measure)
        observer.observe(list)

        return () => observer.disconnect()
    }, [measure])

    return (
        <TabsList
            ref={listRef}
            aria-label={label}
            className={cn('relative h-auto gap-0 rounded-xl border border-line bg-panel p-1 shadow-panel', className)}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'absolute inset-y-1 start-0 rounded-lg bg-navy transition-[transform,width] duration-300 ease-out',
                    thumb === null && 'opacity-0',
                )}
                style={thumb ?? undefined}
            />

            {tabs.map((tab) => (
                <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-segment={tab.value}
                    title={tab.hint}
                    className={cn(
                        'relative z-10 gap-2 rounded-lg px-5 py-2 font-mono text-[11px] font-normal uppercase tracking-[0.14em]',
                        'transition-colors duration-200 data-[state=inactive]:text-ink/55 data-[state=inactive]:hover:text-ink',
                        // The thumb is the active surface, so the trigger stays transparent.
                        'data-[state=active]:bg-transparent data-[state=active]:text-cream data-[state=active]:shadow-none',
                    )}
                >
                    {tab.icon !== undefined && <span aria-hidden="true" className="inline-flex">{tab.icon}</span>}
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
    )
}
