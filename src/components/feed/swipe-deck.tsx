import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { Countdown } from '@/components/feed/deadline-meter'
import type { QueueItem } from '@/components/feed/queue-item'
import { prefersReducedMotion, urgencyOf } from '@/components/feed/signals'
import { EligibilityChip } from '@/components/tender/eligibility-chip'
import { EstimateValue } from '@/components/tender/estimate-value'
import { DeliverablesChecklist, RequirementChecklist } from '@/components/tender/requirements-section'
import { Badge } from '@/components/ui/badge'
import { IconArrowRight, IconBookmark, IconClose } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export type SwipeDecision = 'save' | 'pass'

/** Must stay in step with the fly-out transition below. */
const FLY_MS = 280

/** Movement under this many px is a tap, not a drag, so links still open. */
const TAP_SLOP = 8

/** A quick flick decides even when it travels less than the distance threshold. */
const FLICK_SPEED = 0.5

/** Cards drawn behind the top one, to show the pile has depth. */
const STACK_DEPTH = 2

interface SwipeDeckProps
{
    readonly items: readonly QueueItem[]
    readonly savedIds: ReadonlySet<string>
    readonly total: number
    /** Cards already decided this session; the top card is the next one in rank order. */
    readonly triaged: number
    /** True while the parent is still saving or dismissing the last card. */
    readonly busy: boolean
    /** Resolves false when the action failed, so the card comes back. */
    readonly onDecide: (id: string, decision: SwipeDecision) => Promise<boolean>
}

type Phase = 'idle' | 'dragging' | 'flying' | 'settling'

/** Where the top card is and what it is doing; tied to one card so the next starts clean. */
interface Gesture
{
    readonly id: string | null
    readonly x: number
    readonly y: number
    readonly phase: Phase
}

const AT_REST: Gesture = { id: null, x: 0, y: 0, phase: 'idle' }

/** Arrow keys belong to these widgets (tabs, toggles, fields), not to the deck. */
const OWNS_ARROWS = 'input, textarea, select, [contenteditable="true"], [role="tablist"], [role="group"], [role="slider"]'

interface CardProps
{
    readonly item: QueueItem
    readonly saved: boolean
    readonly standing: string
}

function SwipeCard({ item, saved, standing }: CardProps): ReactElement
{
    const urgency = urgencyOf(item.closingDate)
    const reasons = item.reasons.slice(0, 3)

    return (
        <article aria-label={item.title} className="flex h-full flex-1 flex-col xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <header className="nt-grain flex flex-col gap-3 border-b border-line bg-cream/60 px-5 py-4 xl:border-b-0 xl:border-e xl:py-5">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">For you</span>
                    <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                        {standing}
                    </span>
                </div>

                <h2 className="line-clamp-4 font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
                    {item.title}
                </h2>

                <p className="text-sm leading-snug text-ink/65">{item.organ}</p>

                {(item.relevant || item.service !== null || item.reAdvert || saved || item.eligibility !== undefined) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <EligibilityChip state={item.eligibility} />
                        {item.relevant && <Badge tone="success" dot>Relevant</Badge>}
                        {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                        {item.reAdvert && <Badge tone="danger">Re-advertised</Badge>}
                        {saved && <Badge tone="warn" dot>Saved</Badge>}
                    </div>
                )}
            </header>

            {/* One column up to a laptop. On a wide screen the card lies landscape, the facts in two
                columns beside the title, so it fits the window without scrolling. */}
            <div className="grid flex-1 gap-4 px-5 py-4 xl:grid-cols-2 xl:gap-x-6 xl:py-5">
                <div className="flex flex-col gap-4">
                    <p className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">Closing</span>
                        <span className="flex flex-wrap items-baseline justify-end gap-x-2">
                            <span className="text-ink">{item.closingDate !== null ? formatDate(item.closingDate) : 'Not published'}</span>
                            <Countdown urgency={urgency} />
                        </span>
                    </p>

                    <p className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 text-sm">
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">Est. value</span>
                        <EstimateValue estimate={item.estimate} className="justify-end text-right" />
                    </p>

                    {item.deliverables !== undefined && (
                        <DeliverablesChecklist deliverables={item.deliverables} className="border-b border-line/70 pb-3 xl:border-b-0 xl:pb-0" />
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {item.requirements !== undefined && (
                        <RequirementChecklist gates={item.requirements} className={cn(reasons.length > 0 && 'border-b border-line/70 pb-3')} />
                    )}

                    {reasons.length > 0 && (
                        <ul aria-label="Why this tender" className="flex flex-col gap-1.5">
                            {reasons.map((reason) => (
                                <li key={reason} className="flex gap-2.5 text-sm leading-snug text-ink/80">
                                    <span aria-hidden="true" className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-navy/50" />
                                    <span className="first-letter:uppercase">{reason}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        to={`/tenders/${item.id}`}
                        className="focus-ring-panel group mt-auto inline-flex items-center gap-1.5 self-start rounded-sm font-mono text-[10px] uppercase tracking-[0.14em] text-navy"
                    >
                        Open case file
                        <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </Link>
                </div>
            </div>
        </article>
    )
}

interface DeckButtonProps
{
    readonly decision: SwipeDecision
    readonly title: string
    readonly disabled: boolean
    readonly onClick: () => void
    readonly className?: string
}

function DeckButton({ decision, title, disabled, onClick, className }: DeckButtonProps): ReactElement
{
    const save = decision === 'save'

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={save ? `Bookmark ${title}` : `Pass on ${title}`}
            className={cn(
                'focus-ring inline-flex size-14 shrink-0 items-center justify-center rounded-full shadow-panel transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 motion-reduce:transition-none',
                save ? 'bg-navy text-cream' : 'border border-line bg-panel text-danger',
                className,
            )}
        >
            {save ? <IconBookmark className="size-6" /> : <IconClose className="size-6" />}
        </button>
    )
}

/**
 * For You as a deck: one tender at a time, swipe right to bookmark it, left to
 * pass on it. The buttons and arrow keys do the same, so the deck works without
 * a touch screen and for anyone who cannot drag.
 */
export function SwipeDeck({ items, savedIds, total, triaged, busy, onDecide }: SwipeDeckProps): ReactElement
{
    const [gesture, setGesture] = useState<Gesture>(AT_REST)
    const cardRef = useRef<HTMLDivElement>(null)
    const start = useRef<{ x: number, y: number, id: number } | null>(null)
    const dragged = useRef(false)
    const latest = useRef({ x: 0, y: 0, vx: 0, t: 0 })
    const top = items[0] ?? null
    const topId = top?.id ?? null

    // A gesture left over from the card that just flew off never moves its successor.
    const current = gesture.id === topId ? gesture : AT_REST
    const { phase } = current
    const drag = current
    const move = (x: number, y: number, next: Phase): void => setGesture({ id: topId, x, y, phase: next })

    const width = cardRef.current?.offsetWidth ?? 320
    const threshold = Math.min(100, width * 0.25)
    const locked = busy || phase === 'flying' || top === null

    async function decide(decision: SwipeDecision): Promise<void>
    {
        if (locked || top === null) {
            return
        }

        const direction = decision === 'save' ? 1 : -1

        if (!prefersReducedMotion()) {
            move(direction * (window.innerWidth + width), drag.y, 'flying')
            await new Promise<void>((resolve) => { window.setTimeout(resolve, FLY_MS) })
        }

        const ok = await onDecide(top.id, decision)

        if (!ok) {
            move(0, 0, 'settling')
        }
    }

    // Arrow keys mirror the swipe while the deck is on screen.
    const decideRef = useRef(decide)
    decideRef.current = decide

    useEffect(() =>
    {
        function onKey(event: KeyboardEvent): void
        {
            const target = event.target instanceof Element ? event.target : null

            if (event.altKey || event.ctrlKey || event.metaKey || target?.closest(OWNS_ARROWS) != null) {
                return
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault()
                void decideRef.current('save')
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                void decideRef.current('pass')
            }
        }

        window.addEventListener('keydown', onKey)

        return () => window.removeEventListener('keydown', onKey)
    }, [])

    function onPointerDown(event: ReactPointerEvent<HTMLDivElement>): void
    {
        if (locked || (event.pointerType === 'mouse' && event.button !== 0)) {
            return
        }

        start.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
        latest.current = { x: 0, y: 0, vx: 0, t: event.timeStamp }
        dragged.current = false
    }

    function onPointerMove(event: ReactPointerEvent<HTMLDivElement>): void
    {
        const origin = start.current

        if (origin === null || origin.id !== event.pointerId) {
            return
        }

        const x = event.clientX - origin.x
        const y = event.clientY - origin.y

        if (!dragged.current) {
            // Fingers rarely move dead level, so any direction past the slop starts the drag.
            if (Math.hypot(x, y) < TAP_SLOP) {
                return
            }

            dragged.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
        }

        // Speed of the last stretch of the drag, smoothed, so a flick counts however long the finger rested first.
        const previous = latest.current
        const instant = (x - previous.x) / Math.max(1, event.timeStamp - previous.t)
        latest.current = { x, y, vx: previous.vx * 0.3 + instant * 0.7, t: event.timeStamp }
        move(x, y, 'dragging')
    }

    function onPointerUp(): void
    {
        const origin = start.current
        start.current = null

        if (origin === null || !dragged.current) {
            return
        }

        // Read the last move from the ref: the release can land before its render.
        const { x } = latest.current
        const speed = Math.abs(latest.current.vx)

        if (Math.abs(x) >= threshold || (speed >= FLICK_SPEED && Math.abs(x) > threshold / 3 && Math.sign(latest.current.vx) === Math.sign(x))) {
            void decide(x > 0 ? 'save' : 'pass')
        } else {
            move(0, 0, 'settling')
        }
    }

    function onPointerCancel(): void
    {
        start.current = null

        if (dragged.current) {
            move(0, 0, 'settling')
        }
    }

    if (top === null) {
        return <></>
    }

    // How far through a decision the drag is, 0 to 1, for the stamps and the stack.
    const progress = Math.min(1, Math.abs(drag.x) / threshold)
    const rank = triaged + 1
    const behind = items.slice(1, 1 + STACK_DEPTH)

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 xl:max-w-none">
            {/* On a wide screen pass and save flank the card, on the side it would fly to. */}
            <div className="flex w-full items-center gap-5">
                <DeckButton decision="pass" title={top.title} disabled={locked} onClick={() => void decide('pass')} className="hidden xl:inline-flex" />

                <div className="relative min-w-0 flex-1 select-none">
                    {behind.map((item, index) =>
                    {
                        const depth = index + 1 - progress
                        const scale = 1 - depth * 0.04
                        const lift = depth * 12

                        return (
                            <div
                                key={item.id}
                                aria-hidden="true"
                                className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel transition-transform duration-200 ease-out"
                                style={{ transform: `translate3d(0, ${lift}px, 0) scale(${scale})`, zIndex: STACK_DEPTH - index }}
                            >
                                <SwipeCard item={item} saved={savedIds.has(item.id)} standing={`${rank + index + 1} of ${total}`} />
                            </div>
                        )
                    })}

                    <div
                        key={top.id}
                        ref={cardRef}
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerCancel}
                        onClickCapture={(event) =>
                        {
                            // The click that ends a drag must not open the case file.
                            if (dragged.current) {
                                event.preventDefault()
                                event.stopPropagation()
                                dragged.current = false
                            }
                        }}
                        className={cn(
                            'relative flex min-h-[24rem] cursor-grab touch-none flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel active:cursor-grabbing',
                            phase !== 'dragging' && 'transition-transform ease-out motion-reduce:transition-none',
                            phase === 'flying' ? 'duration-[280ms]' : 'duration-300',
                        )}
                        style={{
                            transform: `translate3d(${drag.x}px, ${drag.y * 0.3}px, 0) rotate(${drag.x / 18}deg)`,
                            zIndex: STACK_DEPTH + 1,
                        }}
                    >
                        <SwipeCard item={top} saved={savedIds.has(top.id)} standing={`${rank} of ${total}`} />

                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute start-5 top-5 rotate-[-12deg] rounded-md border-2 border-success px-2.5 py-1 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-success"
                            style={{ opacity: drag.x > 0 ? progress : 0 }}
                        >
                            Bookmark
                        </span>
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute end-5 top-5 rotate-[12deg] rounded-md border-2 border-danger px-2.5 py-1 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-danger"
                            style={{ opacity: drag.x < 0 ? progress : 0 }}
                        >
                            Pass
                        </span>
                    </div>
                </div>

                <DeckButton decision="save" title={top.title} disabled={locked} onClick={() => void decide('save')} className="hidden xl:inline-flex" />
            </div>

            {/* Pinned to the bottom of the catalog window, so a long card never hides the buttons. */}
            <div className="sticky bottom-0 z-10 flex w-full items-center justify-center gap-6 bg-gradient-to-t from-cream from-50% to-transparent pb-1 pt-5 xl:hidden">
                <DeckButton decision="pass" title={top.title} disabled={locked} onClick={() => void decide('pass')} />
                <DeckButton decision="save" title={top.title} disabled={locked} onClick={() => void decide('save')} />
            </div>

            <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                Swipe right to bookmark · left to pass
                <span className="hidden lg:inline"> · or use the ← → keys</span>
            </p>
        </div>
    )
}
