import { useEffect, useRef } from 'react'
import type { FocusEvent, KeyboardEvent, ReactElement, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Countdown, DeadlineMeter, URGENCY_SPINE } from '@/components/feed/deadline-meter'
import type { QueueItem } from '@/components/feed/queue-item'
import { compactRand, urgencyOf } from '@/components/feed/signals'
import { EligibilityChip } from '@/components/tender/eligibility-chip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBookmark, IconClose } from '@/components/ui/icons'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Rows past this point start immediately; a long stagger stops feeling alive. */
const STAGGER_LIMIT = 8
const STAGGER_STEP_MS = 35

/** Keys that move focus within the queue rather than reaching the document. */
const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'j', 'k', 'Home', 'End'])

function targetRow(rows: readonly HTMLButtonElement[], index: number, key: string): HTMLButtonElement | undefined
{
    if (key === 'ArrowDown' || key === 'j') {
        return rows[index + 1]
    }

    if (key === 'ArrowUp' || key === 'k') {
        return rows[index - 1]
    }

    return key === 'Home' ? rows[0] : rows[rows.length - 1]
}

interface QuickActionProps
{
    readonly label: string
    /** Visible tooltip text; the accessible name stays the fuller `label`. */
    readonly hint: string
    readonly shortcut: string
    readonly pressed?: boolean
    readonly active: boolean
    readonly disabled: boolean
    readonly onClick: () => void
    readonly children: ReactNode
}

/**
 * Icon affordance living beside the row rather than inside it — a button cannot
 * nest in a button, and triage has to be possible without opening the brief.
 * The tooltip names the action and teaches its key.
 */
function QuickAction({ label, hint, shortcut, pressed, active, disabled, onClick, children }: QuickActionProps): ReactElement
{
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={label}
                    aria-pressed={pressed}
                    disabled={disabled}
                    tabIndex={active ? 0 : -1}
                    onClick={onClick}
                    className={cn(
                        'focus-ring-panel border border-transparent text-ink/30 hover:border-line hover:bg-ink/5 hover:text-ink',
                        pressed === true && 'border-warn/25 bg-warn/10 text-warn hover:border-warn/35 hover:bg-warn/15 hover:text-warn',
                    )}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="flex items-center gap-2">
                {hint}
                <Kbd className="border-cream/20 bg-cream/10 text-cream shadow-none">{shortcut}</Kbd>
            </TooltipContent>
        </Tooltip>
    )
}

interface TenderQueueProps
{
    readonly items: readonly QueueItem[]
    /** The row the brief is currently showing — already resolved by the caller. */
    readonly activeId: string | null
    readonly savedIds: ReadonlySet<string>
    readonly busyId: string | null
    /** Row mid-exit animation; removed from state once it finishes. */
    readonly retiringId: string | null
    readonly onSelect: (id: string) => void
    readonly onSave: (id: string) => void
    readonly onDismiss?: (id: string) => void
    /** Shows the ranking numeral. For-You is ranked; Browse is not. */
    readonly ranked?: boolean
    readonly label: string
    /** The brief, rendered under the active row below the split breakpoint. */
    readonly renderInlineBrief: (item: QueueItem) => ReactNode
}

/**
 * The ranked triage queue.
 *
 * Rows are scannable rather than complete: deadline temperature on the spine,
 * countdown and value in the corner, one line of rationale at the foot. The
 * full argument lives in the brief. Arrow keys / J / K walk the list and move
 * the brief with focus; S saves, X dismisses, O opens — so a whole feed can be
 * cleared without touching the pointer.
 */
export function TenderQueue({
    items,
    activeId,
    savedIds,
    busyId,
    retiringId,
    onSelect,
    onSave,
    onDismiss,
    ranked = false,
    label,
    renderInlineBrief,
}: TenderQueueProps): ReactElement
{
    const listRef = useRef<HTMLUListElement>(null)
    const keyboardActive = useRef(false)
    const navigate = useNavigate()

    /*
     * Saving or dismissing removes the focused row, which drops focus to the
     * body and silently ends the keyboard session. When the queue changes while
     * the user was driving it from the keyboard, hand focus to whichever row
     * inherited the selection.
     */
    useEffect(() =>
    {
        const list = listRef.current

        if (!keyboardActive.current || list === null || list.contains(document.activeElement)) {
            return
        }

        list.querySelector<HTMLButtonElement>('[data-queue-row][tabindex="0"]')?.focus()
    }, [items])

    function handleBlur(event: FocusEvent<HTMLUListElement>): void
    {
        // A null `relatedTarget` means the focused row was removed, not that the
        // user left the queue — keep the session alive so the effect can restore.
        const next = event.relatedTarget

        if (next !== null && !(listRef.current?.contains(next) ?? false)) {
            keyboardActive.current = false
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLUListElement>): void
    {
        const list = listRef.current

        if (list === null) {
            return
        }

        const rows = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-queue-row]'))
        const index = rows.findIndex((row) => row === document.activeElement)

        // Focus is on a quick action or inside the inline brief: leave it alone.
        if (index === -1) {
            return
        }

        if (NAVIGATION_KEYS.has(event.key)) {
            // Swallow the key even at the ends of the list, so arrowing never
            // silently turns into a page scroll halfway through triage.
            event.preventDefault()
            targetRow(rows, index, event.key)?.focus()

            return
        }

        const item = items[index]

        if (item === undefined || event.altKey || event.ctrlKey || event.metaKey) {
            return
        }

        if (event.key === 's' || event.key === 'S') {
            event.preventDefault()
            onSave(item.id)
        } else if ((event.key === 'x' || event.key === 'X') && onDismiss !== undefined) {
            event.preventDefault()
            onDismiss(item.id)
        } else if (event.key === 'o' || event.key === 'O') {
            event.preventDefault()
            navigate(`/tenders/${item.id}`)
        }
    }

    return (
        <ul
            ref={listRef}
            aria-label={label}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="flex flex-col gap-2.5"
        >
            {items.map((item, index) =>
            {
                const urgency = urgencyOf(item.closingDate)
                const isActive = item.id === activeId
                const isSaved = savedIds.has(item.id)
                const isBusy = busyId === item.id
                const value = compactRand(item.estimatedValue)
                const reason = item.reasons[0]

                return (
                    <li
                        key={item.id}
                        className={cn(retiringId === item.id ? 'animate-retire' : 'animate-rise')}
                        style={index < STAGGER_LIMIT ? { animationDelay: `${index * STAGGER_STEP_MS}ms` } : undefined}
                    >
                        <div
                            className={cn(
                                'group relative flex items-stretch overflow-hidden rounded-xl border bg-panel',
                                'transition-[border-color,box-shadow] duration-200',
                                isActive
                                    ? 'border-navy/40 shadow-panel ring-1 ring-navy/10'
                                    : 'border-line hover:border-navy/25 hover:shadow-panel',
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute inset-y-0 start-0 w-[3px] transition-opacity',
                                    URGENCY_SPINE[urgency.tone],
                                    isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
                                )}
                            />

                            <button
                                type="button"
                                data-queue-row
                                tabIndex={isActive ? 0 : -1}
                                aria-current={isActive ? 'true' : undefined}
                                onFocus={() =>
                                {
                                    keyboardActive.current = true
                                    onSelect(item.id)
                                }}
                                onClick={() => onSelect(item.id)}
                                className="focus-ring-panel flex min-w-0 flex-1 flex-col gap-2.5 py-3.5 pe-2 ps-4 text-start sm:ps-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="flex min-w-0 items-start gap-2.5">
                                        {ranked && (
                                            <span
                                                aria-hidden="true"
                                                className="mt-[3px] shrink-0 font-mono text-[11px] tabular-nums text-ink/25"
                                            >
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-ink">
                                                {item.title}
                                            </span>
                                            <span className="mt-1 block truncate text-[13px] leading-snug text-ink/55">
                                                {item.organ}
                                                {item.province !== null && ` · ${item.province}`}
                                            </span>
                                        </span>
                                    </span>

                                    <span className="flex shrink-0 flex-col items-end gap-1">
                                        <Countdown urgency={urgency} />
                                        {value !== null && (
                                            <span className="font-mono text-[11px] tabular-nums text-ink/40">{value}</span>
                                        )}
                                    </span>
                                </div>

                                <DeadlineMeter urgency={urgency} />

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {isSaved && <Badge tone="warn" dot>Saved</Badge>}
                                    {item.relevant && <Badge tone="success" dot>Relevant</Badge>}
                                    {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                                    {item.reAdvert && <Badge tone="danger">Re-advert</Badge>}
                                    <EligibilityChip state={item.eligibility} />
                                </div>

                                {reason !== undefined && (
                                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink/35">
                                        why · {reason}
                                    </span>
                                )}
                            </button>

                            <div className="flex shrink-0 flex-col items-center justify-center gap-1 pe-2 ps-1">
                                <QuickAction
                                    label={isSaved ? `Remove ${item.title} from bookmarks` : `Save ${item.title}`}
                                    hint={isSaved ? 'Unsave' : 'Save'}
                                    shortcut="S"
                                    pressed={isSaved}
                                    active={isActive}
                                    disabled={isBusy}
                                    onClick={() => onSave(item.id)}
                                >
                                    <IconBookmark className="size-4" fill={isSaved ? 'currentColor' : 'none'} />
                                </QuickAction>

                                {onDismiss !== undefined && (
                                    <QuickAction
                                        label={`Dismiss ${item.title}`}
                                        hint="Dismiss"
                                        shortcut="X"
                                        active={isActive}
                                        disabled={isBusy}
                                        onClick={() => onDismiss(item.id)}
                                    >
                                        <IconClose className="size-4" />
                                    </QuickAction>
                                )}
                            </div>
                        </div>

                        {isActive && (
                            <div className="animate-reveal mt-2 xl:hidden">{renderInlineBrief(item)}</div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
