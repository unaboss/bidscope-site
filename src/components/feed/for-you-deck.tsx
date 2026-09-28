import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dismissTender, getFeed } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IconFunnel } from '@/components/ui/icons'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { daysUntil, formatDate, formatZAR, relativeDays } from '@/lib/format'
import { serviceLabel } from '@/lib/service-lines'
import type { FeedItem } from '@/types'

const PAGE_SIZE = 20

export function ForYouDeck()
{
    const [items, setItems] = useState<FeedItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const fetched = useRef(0)
    const bookmarks = useBookmarks()

    const load = useCallback(async (offset: number, append: boolean, signal?: AbortSignal) =>
    {
        const result = await getFeed('foryou', PAGE_SIZE, offset, signal)
        fetched.current += result.items.length
        setTotal(result.total)
        setItems((current) => (append ? [...current, ...result.items] : result.items))
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        load(0, false, controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load the feed')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [load])

    async function act(id: string, action: 'save' | 'dismiss'): Promise<void>
    {
        setBusyId(id)
        setError('')

        try {
            if (action === 'save') {
                await bookmarks.toggle(id)
            } else {
                await dismissTender(id)
            }

            setItems((current) => current.filter((item) => item.id !== id))

            // Top up when the deck runs low.
            if (items.length <= 4 && fetched.current < total) {
                await load(fetched.current, true)
            }
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Action failed')
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return <p className="text-sm text-ink/60">Building your feed…</p>
    }

    if (error !== '' && items.length === 0) {
        return <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={<IconFunnel className="size-5" />}
                title="You're all caught up"
                description="No ranked tenders left — you have saved or dismissed everything in scope. New tenders appear after the next sync."
                hint="For You"
            />
        )
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="deck-scroll h-[calc(100dvh-13rem)] w-full snap-y snap-mandatory overflow-y-auto rounded-2xl border border-line bg-cream shadow-panel"
                aria-label="For You tender deck"
            >
                {items.map((item) =>
                {
                    const isSaved = bookmarks.ids.has(item.id)
                    const days = item.closingDate !== null ? daysUntil(item.closingDate) : null

                    return (
                        <article
                            key={item.id}
                            className="relative flex h-full w-full snap-start flex-col justify-between gap-6 bg-panel p-6"
                        >
                            <header className="flex flex-wrap items-center gap-2">
                                {item.relevance === 'relevant' && <Badge tone="success">Relevant</Badge>}
                                {serviceLabel(item.serviceLine) !== null && <Badge tone="navy">{serviceLabel(item.serviceLine)}</Badge>}
                                {item.reAdvert === 1 && <Badge tone="danger">Re-advertised</Badge>}
                                {item.reasons.length > 0 && (
                                    <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">
                                        {item.reasons.slice(0, 2).join(' · ')}
                                    </span>
                                )}
                            </header>

                            <div className="flex flex-1 flex-col justify-center gap-3">
                                <h2 className="font-serif text-2xl font-semibold leading-snug text-ink">
                                    <Link
                                        to={`/tenders/${item.id}`}
                                        className="after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                                    >
                                        {item.title ?? 'Untitled tender'}
                                    </Link>
                                </h2>
                                <p className="text-base leading-snug text-ink/70">
                                    {item.organ ?? 'Unknown buyer'}
                                </p>
                                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/70">
                                    <div className="flex flex-col">
                                        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">Closing</dt>
                                        <dd className="text-ink">
                                            {item.closingDate !== null ? `${formatDate(item.closingDate)} (${relativeDays(days ?? 0)})` : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex flex-col">
                                        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">Est. value</dt>
                                        <dd className="text-ink">{item.estimatedValue !== null ? formatZAR(item.estimatedValue) : 'Not published'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <footer className="relative z-10 flex flex-wrap items-center gap-3">
                                <Button
                                    variant={isSaved ? 'secondary' : 'primary'}
                                    onClick={() => void act(item.id, 'save')}
                                    disabled={busyId === item.id}
                                >
                                    {isSaved ? 'Saved' : 'Save'}
                                </Button>
                                <Button variant="secondary" onClick={() => void act(item.id, 'dismiss')} disabled={busyId === item.id}>
                                    Dismiss
                                </Button>
                                <Link
                                    to={`/tenders/${item.id}`}
                                    className="ms-auto font-mono text-[10px] uppercase tracking-[0.14em] text-navy underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                                >
                                    Open case file
                                </Link>
                            </footer>
                        </article>
                    )
                })}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
                {items.length} shown · {total} ranked · swipe up for the next
            </p>
        </div>
    )
}
