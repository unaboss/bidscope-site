import { useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DeadlineMeter, URGENCY_TEXT } from '@/components/feed/deadline-meter'
import { fromTender } from '@/components/feed/queue-item'
import { compactRand, urgencyOf } from '@/components/feed/signals'
import type { UrgencyTone } from '@/components/feed/signals'
import { TenderCaseFile } from '@/components/tender/tender-case-file'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Tender } from '@/types'

/** Calendar-chip treatment per deadline tone. */
const CHIP: Record<UrgencyTone, string> = {
    danger: 'border-danger/30 bg-danger/[0.07] text-danger',
    warn: 'border-warn/35 bg-warn/[0.07] text-warn',
    neutral: 'border-line bg-cream text-ink/65',
}

interface DateParts
{
    readonly day: string
    readonly month: string
}

function dateParts(value: string | null): DateParts | null
{
    if (value === null || value.length === 0) {
        return null
    }

    const parsed = new Date(`${value}T00:00:00Z`)

    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    return {
        day: new Intl.DateTimeFormat('en-ZA', { day: '2-digit', timeZone: 'UTC' }).format(parsed),
        month: new Intl.DateTimeFormat('en-ZA', { month: 'short', timeZone: 'UTC' }).format(parsed),
    }
}

interface RowActionProps
{
    readonly onClick: () => void
    readonly disabled: boolean
    readonly tone?: 'default' | 'danger'
    readonly expanded?: boolean
    readonly controls?: string
    readonly children: ReactNode
}

/**
 * Row-level action. Hand-rolled rather than the shared `Button`, because these
 * need a danger hover and `cn()` does no conflict resolution.
 */
function RowAction({ onClick, disabled, tone = 'default', expanded, controls, children }: RowActionProps): ReactElement
{
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-expanded={expanded}
            aria-controls={controls}
            className={cn(
                'focus-ring-panel inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3',
                'font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                'disabled:pointer-events-none disabled:opacity-40',
                tone === 'danger'
                    ? 'border-line text-ink/45 hover:border-danger/35 hover:bg-danger/[0.07] hover:text-danger'
                    : 'border-line text-ink/65 hover:border-navy/30 hover:bg-navy/5 hover:text-navy',
            )}
        >
            {children}
        </button>
    )
}

interface DeadlineRowProps
{
    readonly tender: Tender
    readonly expanded: boolean
    readonly busy: boolean
    readonly retiring: boolean
    readonly onToggle: () => void
    readonly onRemove: () => void
}

/**
 * One shortlisted tender on the deadline board.
 *
 * The calendar chip carries the date so a column of rows reads like a diary;
 * the meter underneath turns "how long have I got" into something you feel
 * rather than calculate. Details expand in place — the shortlist never loses
 * its position to a detail pane.
 */
export function DeadlineRow({ tender, expanded, busy, retiring, onToggle, onRemove }: DeadlineRowProps): ReactElement
{
    const item = fromTender(tender)
    const urgency = urgencyOf(tender.closing_date)
    const parts = dateParts(tender.closing_date)
    const value = compactRand(item.estimatedValue)
    const panelId = useId()

    return (
        <li className={cn(retiring ? 'animate-retire' : 'animate-rise')}>
            <article
                className={cn(
                    'overflow-hidden rounded-xl border bg-panel transition-[border-color,box-shadow] duration-200',
                    expanded ? 'border-navy/35 shadow-panel' : 'border-line hover:border-navy/25 hover:shadow-panel',
                )}
            >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <div
                        className={cn(
                            'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border py-2',
                            CHIP[urgency.tone],
                        )}
                    >
                        {parts === null
                            ? <span aria-hidden="true" className="font-mono text-lg leading-none">—</span>
                            : (
                                <>
                                    <span aria-hidden="true" className="font-serif text-xl font-semibold leading-none tabular-nums">
                                        {parts.day}
                                    </span>
                                    <span aria-hidden="true" className="font-mono text-[9px] uppercase tracking-[0.14em]">
                                        {parts.month}
                                    </span>
                                </>
                            )}
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                        <h3 className="font-serif text-[15px] font-semibold leading-snug text-ink">
                            <Link to={`/tenders/${tender.id}`} className="focus-ring-panel rounded-sm hover:text-navy">
                                {item.title}
                            </Link>
                        </h3>

                        <p className="truncate text-[13px] leading-snug text-ink/55">
                            {item.organ}
                            {item.province !== null && ` · ${item.province}`}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {item.relevant && <Badge tone="success">Relevant</Badge>}
                            {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                            {item.reAdvert && <Badge tone="danger">Re-advert</Badge>}
                            {item.briefing !== null && <Badge tone="warn">Briefing {item.briefing}</Badge>}
                        </div>

                        <DeadlineMeter urgency={urgency} className="mt-0.5" />

                        <p className="flex flex-wrap items-center gap-x-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">
                            <span className={URGENCY_TEXT[urgency.tone]}>
                                {tender.closing_date !== null ? `closes ${formatDate(tender.closing_date)} · ${urgency.label}` : urgency.label}
                            </span>
                            {value !== null && <span className="tabular-nums">{value}</span>}
                        </p>
                    </div>

                    <div className="col-span-2 flex flex-row gap-2 sm:col-span-1 sm:flex-col">
                        <RowAction onClick={onToggle} disabled={busy} expanded={expanded} controls={panelId}>
                            {expanded ? 'Hide' : 'Details'}
                        </RowAction>
                        <RowAction onClick={onRemove} disabled={busy} tone="danger">
                            Remove
                        </RowAction>
                    </div>
                </div>

                {expanded && (
                    <div id={panelId} className="animate-reveal border-t border-line bg-cream/50 p-4">
                        <TenderCaseFile tender={tender} bookmarked onToggleBookmark={onRemove} />
                    </div>
                )}
            </article>
        </li>
    )
}
