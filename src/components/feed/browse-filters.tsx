import { useId, useState } from 'react'
import type { ReactElement, SVGProps } from 'react'
import { Input, Select } from '@/components/ui/controls'
import { IconClose, IconFunnel } from '@/components/ui/icons'
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

function IconSearch(props: Omit<SVGProps<SVGSVGElement>, 'children'>): ReactElement
{
    return (
        <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    )
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
        <span className="inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/[0.06] ps-3 text-navy">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{label}</span>
            <button
                type="button"
                onClick={onClear}
                aria-label={`Remove filter: ${label}`}
                className="focus-ring grid size-6 place-items-center rounded-full text-navy/60 transition-colors hover:bg-navy/10 hover:text-navy"
            >
                <IconClose className="size-3" />
            </button>
        </span>
    )
}

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
    const active = activeFilterCount(value)

    function patch(change: Partial<BrowseFilterState>): void
    {
        onChange({ ...value, ...change })
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-3 shadow-panel sm:p-4">
            <div className="flex items-center gap-2">
                <span className="relative flex-1">
                    <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                    <Input
                        type="search"
                        value={value.search}
                        onChange={(event) => patch({ search: event.target.value })}
                        placeholder="Search titles, buyers and references…"
                        aria-label="Search tenders"
                        className="h-11 ps-9 text-[15px]"
                    />
                </span>

                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className={cn(
                        'focus-ring-panel inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-3',
                        'font-mono text-[10px] uppercase tracking-[0.14em] transition-colors sm:hidden',
                        active > 0 ? 'border-navy/30 bg-navy/5 text-navy' : 'border-line text-ink/60 hover:bg-ink/5',
                    )}
                >
                    <IconFunnel className="size-3.5" />
                    Filters
                    {active > 0 && (
                        <span className="grid size-4 place-items-center rounded-full bg-navy text-[9px] text-cream">
                            {active}
                        </span>
                    )}
                </button>
            </div>

            <div id={panelId} className={cn('gap-2 sm:grid sm:grid-cols-3', open ? 'grid' : 'hidden')}>
                <Select
                    value={value.province}
                    onChange={(event) => patch({ province: event.target.value })}
                    aria-label="Filter by province"
                >
                    <option value="">All provinces</option>
                    {PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
                </Select>

                <Select
                    value={value.windowDays}
                    onChange={(event) => patch({ windowDays: event.target.value })}
                    aria-label="Filter by closing window"
                >
                    {WINDOWS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>

                <Select
                    value={value.sort}
                    onChange={(event) => patch({ sort: event.target.value })}
                    aria-label="Sort tenders"
                >
                    {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line/70 pt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                    {resultCount === null ? 'Searching…' : `${resultCount} tenders`}
                    <span className="text-ink/30"> · {labelOf(SORTS, value.sort)}</span>
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
                    <button
                        type="button"
                        onClick={() => onChange({ ...EMPTY_FILTERS, sort: value.sort })}
                        className="focus-ring-panel ms-auto rounded-md px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45 underline transition-colors hover:text-ink"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    )
}
