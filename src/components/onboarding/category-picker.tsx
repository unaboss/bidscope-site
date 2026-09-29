import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TenderCategory, Taxonomy } from '@/types'

interface CategoryPickerProps
{
    readonly taxonomy: Taxonomy | null
    readonly value: readonly string[]
    readonly onChange: (next: string[]) => void
}

/** A toggle chip for a single category label. */
function CategoryChip(props: {
    readonly label: string
    readonly active: boolean
    readonly onToggle: () => void
})
{
    return (
        <button
            type="button"
            aria-pressed={props.active}
            onClick={props.onToggle}
            className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:ring-offset-cream',
                props.active
                    ? 'border-navy bg-navy text-cream'
                    : 'border-line bg-panel text-ink/70 hover:bg-ink/5',
            )}
        >
            {props.label}
        </button>
    )
}

/** A titled group of category chips. */
function CategorySection(props: {
    readonly title: string
    readonly categories: readonly TenderCategory[]
    readonly selected: ReadonlySet<string>
    readonly onToggle: (label: string) => void
})
{
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">{props.title}</legend>
            <div className="flex flex-wrap gap-2">
                {props.categories.map((category) => (
                    <CategoryChip
                        key={category.label}
                        label={category.label}
                        active={props.selected.has(category.label)}
                        onToggle={() => props.onToggle(category.label)}
                    />
                ))}
            </div>
        </fieldset>
    )
}

/**
 * Assisted picker over the eTenders categories: browse by bucket, or search the
 * flat list. While searching, categories from the buckets you have already
 * chosen are surfaced as "related".
 */
export function CategoryPicker({ taxonomy, value, onChange }: CategoryPickerProps)
{
    const [query, setQuery] = useState('')

    const selected = useMemo(() => new Set(value), [value])

    const selectedBuckets = useMemo(() =>
    {
        const bucketOf = new Map<string, string>()

        for (const category of taxonomy?.categories ?? [])
        {
            bucketOf.set(category.label, category.bucket)
        }

        const set = new Set<string>()

        for (const label of value)
        {
            const bucket = bucketOf.get(label)

            if (bucket !== undefined)
            {
                set.add(bucket)
            }
        }

        return set
    }, [taxonomy, value])

    function toggle(label: string): void
    {
        onChange(selected.has(label) ? value.filter((item) => item !== label) : [...value, label])
    }

    if (taxonomy === null)
    {
        return <p className="text-sm text-ink/60">Loading categories…</p>
    }

    const needle = query.trim().toLowerCase()
    const matched = needle === ''
        ? []
        : taxonomy.categories.filter((category) => category.label.toLowerCase().includes(needle))
    const related = needle === ''
        ? []
        : taxonomy.categories.filter((category) =>
            selectedBuckets.has(category.bucket)
            && !selected.has(category.label)
            && !category.label.toLowerCase().includes(needle))

    const searching = needle !== ''
    const browsing = !searching || (matched.length === 0 && related.length === 0)

    return (
        <div className="flex flex-col gap-6">
            {value.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                    <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">Selected ({value.length})</legend>
                    <div className="flex flex-wrap gap-2">
                        {value.map((label) => (
                            <CategoryChip key={label} label={label} active onToggle={() => toggle(label)} />
                        ))}
                    </div>
                </fieldset>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="category-search" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">Search categories</label>
                <input
                    id="category-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="e.g. security, water, software"
                    className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-ink/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:ring-offset-cream"
                />
            </div>

            {matched.length > 0 && <CategorySection title={`Matches (${matched.length})`} categories={matched} selected={selected} onToggle={toggle} />}
            {related.length > 0 && <CategorySection title="Related to your selection" categories={related} selected={selected} onToggle={toggle} />}

            {searching && browsing && (
                <p className="text-sm text-ink/60">No categories match &ldquo;{query.trim()}&rdquo; — browse the groups below.</p>
            )}

            {browsing && (
                <div className="flex flex-col gap-6">
                    {taxonomy.buckets.map((bucket) => (
                        <CategorySection
                            key={bucket.code}
                            title={bucket.label}
                            categories={taxonomy.categories.filter((category) => category.bucket === bucket.code)}
                            selected={selected}
                            onToggle={toggle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
