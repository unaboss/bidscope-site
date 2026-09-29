import { useCallback, useEffect, useMemo, useState } from 'react'
import { listBookmarks, removeBookmark } from '@/api'
import { TenderCaseFile } from '@/components/tender/tender-case-file'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { IconBookmark } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

export function BookmarksPage()
{
    const [tenders, setTenders] = useState<Tender[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const load = useCallback(async (signal?: AbortSignal) =>
    {
        const result = await listBookmarks(signal)
        setTenders(result)
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        load(controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load bookmarks')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [load])

    async function remove(tenderId: string): Promise<void>
    {
        await removeBookmark(tenderId)
        setSelectedId(null)
        await load()
    }

    const selected = useMemo(
        () => tenders.find((tender) => tender.id === selectedId) ?? tenders[0] ?? null,
        [tenders, selectedId],
    )

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Bookmarks"
                description="The tenders you have shortlisted, with their briefing and closing dates."
                actions={<Badge tone="navy">{loading ? '...' : `${tenders.length} saved`}</Badge>}
            />

            {loading && <p className="text-sm text-ink/60">Loading bookmarks…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
                    {error}
                </p>
            )}

            {!loading && error === '' && tenders.length === 0 && (
                <EmptyState
                    icon={<IconBookmark className="size-5" />}
                    title="No bookmarks yet"
                    description="Bookmark a tender from Discover and it will appear here with its deadline."
                    hint="Phase 2 · bookmarks + alerts"
                />
            )}

            {!loading && error === '' && tenders.length > 0 && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <ul className="flex flex-col gap-2">
                        {tenders.map((tender) =>
                        {
                            const isSelected = selected?.id === tender.id

                            return (
                                <li key={tender.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(tender.id)}
                                        aria-current={isSelected}
                                        className={cn(
                                            'flex w-full flex-col gap-1 rounded-lg border bg-panel px-4 py-3 text-left transition-colors',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                                            isSelected ? 'border-navy/40 bg-navy/5' : 'border-line hover:bg-ink/5',
                                        )}
                                    >
                                        <span className="text-sm font-medium text-ink">{tender.title ?? 'Untitled tender'}</span>
                                        <span className="text-xs text-ink/60">{tender.organ_of_state ?? 'Unknown buyer'}</span>
                                        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                                            closes {formatDate(tender.closing_date)}
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    <section aria-label="Bookmarked tender" className="lg:sticky lg:top-24 lg:self-start">
                        {selected !== null && (
                            <TenderCaseFile tender={selected} bookmarked onToggleBookmark={remove} />
                        )}
                    </section>
                </div>
            )}
        </div>
    )
}
