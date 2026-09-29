import type { CalendarEvent } from '@/lib/calendar'
import { cn } from '@/lib/utils'

/** Sunday-first, matching the reference design. */
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

const GRID_CELLS = 42

function isoOf(date: Date): string
{
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

interface MonthGridProps
{
    /** Any date within the month to render. */
    readonly monthDate: Date
    readonly todayIso: string
    readonly selectedIso: string | null
    readonly byDate: Record<string, readonly CalendarEvent[]>
    readonly onSelect: (iso: string) => void
}

/**
 * A month grid (landscape): seven columns, one cell per day, with a dot per
 * event kind — closing in red, briefing in navy. Clicking a day selects it.
 */
export function MonthGrid({ monthDate, todayIso, selectedIso, byDate, onSelect }: MonthGridProps)
{
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const start = new Date(year, month, 1 - firstOfMonth.getDay())

    const cells = Array.from({ length: GRID_CELLS }, (_unused, index) =>
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))

    return (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {WEEKDAYS.map((label, index) => (
                <div key={index} className="bg-panel py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    {label}
                </div>
            ))}

            {cells.map((cell) =>
            {
                const iso = isoOf(cell)
                const inMonth = cell.getMonth() === month
                const events = byDate[iso] ?? []
                const isToday = iso === todayIso
                const isSelected = iso === selectedIso
                const hasClosing = events.some((event) => event.kind === 'closing')
                const hasBriefing = events.some((event) => event.kind === 'briefing')

                return (
                    <button
                        key={iso}
                        type="button"
                        onClick={() => onSelect(iso)}
                        aria-pressed={isSelected}
                        className={cn(
                            'flex min-h-[76px] flex-col items-start gap-1 bg-panel p-2 text-left transition-colors hover:bg-ink/5',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy',
                            !inMonth && 'opacity-40',
                            isSelected && 'ring-2 ring-inset ring-navy',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full font-mono text-xs',
                                isToday ? 'bg-danger text-cream' : 'text-ink/70',
                            )}
                        >
                            {cell.getDate()}
                        </span>
                        <span className="flex gap-1">
                            {hasClosing && <span className="size-1.5 rounded-full bg-danger" title="Closing date" />}
                            {hasBriefing && <span className="size-1.5 rounded-full bg-navy" title="Briefing date" />}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
