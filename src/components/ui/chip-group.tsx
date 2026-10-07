import { cn } from '@/lib/utils'

interface ChipGroupProps
{
    readonly label: string
    readonly options: ReadonlyArray<{ readonly value: string, readonly text: string }>
    readonly selected: readonly string[]
    readonly onToggle: (value: string) => void
}

/** A labelled set of toggle chips backed by a string[] value. */
export function ChipGroup(props: ChipGroupProps)
{
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">{props.label}</legend>
            <div className="flex flex-wrap gap-2">
                {props.options.map((option) => {
                    const active = props.selected.includes(option.value)

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => props.onToggle(option.value)}
                            className={cn(
                                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:ring-offset-cream',
                                active
                                    ? 'border-navy bg-navy text-cream'
                                    : 'border-line bg-panel text-ink/70 hover:bg-ink/5',
                            )}
                        >
                            {option.text}
                        </button>
                    )
                })}
            </div>
        </fieldset>
    )
}
