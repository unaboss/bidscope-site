import { useCallback, useEffect, useState } from 'react'
import { addBookmark, listBookmarks, removeBookmark } from '@/api'

export interface BookmarksState
{
    readonly ids: ReadonlySet<string>
    readonly loading: boolean
    readonly error: string
    readonly toggle: (tenderId: string) => Promise<void>
    readonly refresh: () => Promise<void>
}

/**
 * Tracks the current org's bookmarked tender ids and exposes an optimistic
 * toggle. On failure the change is rolled back so the UI never lies about the
 * server state.
 */
export function useBookmarks(): BookmarksState
{
    const [ids, setIds] = useState<ReadonlySet<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const refresh = useCallback(async (signal?: AbortSignal) =>
    {
        const tenders = await listBookmarks(signal)
        setIds(new Set(tenders.map((tender) => tender.id)))
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        refresh(controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load bookmarks')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [refresh])

    const toggle = useCallback(async (tenderId: string) =>
    {
        const wasBookmarked = ids.has(tenderId)

        setIds((current) =>
        {
            const next = new Set(current)

            if (wasBookmarked) {
                next.delete(tenderId)
            } else {
                next.add(tenderId)
            }

            return next
        })

        try {
            if (wasBookmarked) {
                await removeBookmark(tenderId)
            } else {
                await addBookmark(tenderId)
            }
        } catch (cause: unknown) {
            // Roll back the optimistic change.
            setIds((current) =>
            {
                const next = new Set(current)

                if (wasBookmarked) {
                    next.add(tenderId)
                } else {
                    next.delete(tenderId)
                }

                return next
            })
            setError(cause instanceof Error ? cause.message : 'Could not update bookmark')
        }
    }, [ids])

    return { ids, loading, error, toggle, refresh: () => refresh() }
}
