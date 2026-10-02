import { useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/controls'
import { IconClose, IconFunnel } from '@/components/ui/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const PROVINCES = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
] as const

export const WINDOWS: ReadonlyArray<{ value: string, label: string }> = [
    { value: '0', label: 'Any closing date' },
    { value: '7', label: 'Closing within 7 days' },
    { value: '30', label: 'Closing within 30 days' },
]

export const SORTS: ReadonlyArray<{ value: string, label: string }> = [
    { value: 'relevant', label: 'Most relevant' },
    { value: 'closing', label: 'Closing soonest' },
    { value: 'newest', label: 'Newest' },
]

export interface BrowseFilterState
{
    readonly search: string
    readonly province: string
    readonly windowDays: string
    readonly sort: string
}

export const EMPTY_FILTERS: BrowseFilterState = { search: '', province: '', windowDays: '0', sort: 'relevant' }

/**
 * Radix Select reserves the empty string for "no selection", so "all
 * provinces" travels through the control as a sentinel and back out as ''.
 */
const ALL_PROVINCES = '__all__'

/** Count of filters that actually narrow the catalogue. Sort is not one. */
export function activeFilterCount(value: BrowseFilterState): number
{
    return [value.search.length > 0, value.province.length > 0, value.windowDays !== '0']
        .filter(Boolean)
        .length
}

function labelOf(options: ReadonlyArray<{ value: string, label: string }>, value: string): string
{
    return options.find((option) => option.value === value)?.label ?? value
}

interface ChipProps
{
    readonly label: string
    readonly onClear: () => void
}

/** A committed filter, shown as a removable chip so the state is never hidden. */
function Chip({ label, onClear }: ChipProps): ReactElement
{
    return (
        <span className="animate-reveal inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/[0.06] ps-3 text-navy">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{label}</span>
            <button
                type="button"
                onClick={onClear}
                aria-label={`Remove filter: ${label}`}
                className="focus-ring-panel grid size-6 place-items-center rounded-full text-navy/60 transition-colors hover:bg-navy/10 hover:text-navy"
            >
                <IconClose className="size-3" />
            </button>
        </span>
    )
}

interface FilterSelectProps
{
    readonly label: string
    readonly value: string
    readonly options: ReadonlyArray<{ value: string, label: string }>
    readonly onChange: (next: string) => void
    readonly active: boolean
}

/** One narrowing control: a small caption over a themed Radix select. */
function FilterSelect({ label, value, options, onChange, active }: FilterSelectProps): ReactElement
{
    const captionId = useId()

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <span id={captionId} className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger aria-labelledby={captionId} className={cn(active && 'border-navy/30 bg-navy/[0.03]')}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

const PROVINCE_OPTIONS: ReadonlyArray<{ value: string, label: string }> = [
    { value: ALL_PROVINCES, label: 'All provinces' },
    ...PROVINCES.map((name) => ({ value: name, label: name })),
]

interface BrowseFiltersProps
{
    readonly value: BrowseFilterState
    readonly onChange: (next: BrowseFilterState) => void
    /** Result count once loaded, null while a request is in flight. */
    readonly resultCount: number | null
}

/**
 * Browse's control surface.
 *
 * Search is the headline and always visible; the narrowing controls collapse
 * behind a counted toggle on small screens. Whatever is active is repeated as
 * removable chips, so the user can always see — and undo — the reason a result
 * set looks thin.
 */
export function BrowseFilters({ value, onChange, resultCount }: BrowseFiltersProps): ReactElement
{
    const [open, setOpen] = useState(false)
    const panelId = useId()
    const searchRef = useRef<HTMLInputElement>(null)
    const active = activeFilterCount(value)

    function patch(change: Partial<BrowseFilterState>): void
    {
        onChange({ ...value, ...change })
    }

    return (
        <Card className="flex flex-col gap-3 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2">
                <span className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                    <Input
                        ref={searchRef}
                        type="search"
                        value={value.search}
                        onChange={(event) => patch({ search: event.target.value })}
                        placeholder="Search titles, buyers and references…"
                        aria-label="Search tenders"
                        className="h-11 pe-10 ps-9 text-[15px] [&::-webkit-search-cancel-button]:hidden"
                    />
                    {value.search.length > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                            {
                                patch({ search: '' })
                                searchRef.current?.focus()
                            }}
                            aria-label="Clear search"
                            className="focus-ring-panel absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                            <IconClose className="size-3.5" />
                        </button>
                    )}
                </span>

                <Button
                    variant="secondary"
                    onClick={() => setOpen((current) => !current)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className={cn(
                        'focus-ring-panel h-11 shrink-0 px-3 text-[10px] sm:hidden',
                        active > 0 && 'border-navy/30 bg-navy/5 text-navy hover:bg-navy/10',
                    )}
                >
                    <IconFunnel className="size-3.5" />
                    Filters
                    {active > 0 && (
                        <span className="grid size-4 place-items-center rounded-full bg-navy text-[9px] text-cream">
                            {active}
                        </span>
                    )}
                </Button>
            </div>

            <div id={panelId} className={cn('gap-3 sm:grid sm:grid-cols-3', open ? 'animate-reveal grid' : 'hidden')}>
                <FilterSelect
                    label="Province"
                    value={value.province.length > 0 ? value.province : ALL_PROVINCES}
                    options={PROVINCE_OPTIONS}
                    onChange={(next) => patch({ province: next === ALL_PROVINCES ? '' : next })}
                    active={value.province.length > 0}
                />
                <FilterSelect
                    label="Closing window"
                    value={value.windowDays}
                    options={WINDOWS}
                    onChange={(next) => patch({ windowDays: next })}
                    active={value.windowDays !== '0'}
                />
                <FilterSelect
                    label="Sort by"
                    value={value.sort}
                    options={SORTS}
                    onChange={(next) => patch({ sort: next })}
                    active={false}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line/70 pt-3">
                <p aria-live="polite" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                    {resultCount === null
                        ? (
                            <>
                                <span aria-hidden="true" className="nt-skeleton inline-block h-2.5 w-16 rounded-full" />
                                <span className="sr-only">Searching…</span>
                            </>
                        )
                        : <Badge tone="navy" className="tabular-nums">{resultCount} tenders</Badge>}
                    <span className="text-ink/35">{labelOf(SORTS, value.sort)}</span>
                </p>

                {value.search.length > 0 && (
                    <Chip label={`“${value.search}”`} onClear={() => patch({ search: '' })} />
                )}
                {value.province.length > 0 && (
                    <Chip label={value.province} onClear={() => patch({ province: '' })} />
                )}
                {value.windowDays !== '0' && (
                    <Chip label={labelOf(WINDOWS, value.windowDays)} onClear={() => patch({ windowDays: '0' })} />
                )}

                {active > 1 && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => onChange({ ...EMPTY_FILTERS, sort: value.sort })}
                        className="focus-ring-panel ms-auto h-auto px-1 text-[10px] text-ink/50 underline hover:text-ink"
                    >
                        Clear all
                    </Button>
                )}
            </div>
        </Card>
    )
}
