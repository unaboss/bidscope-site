import { useId } from 'react'
import type { ReactElement } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DeadlineMeter, URGENCY_TEXT } from '@/components/feed/deadline-meter'
import { fromTender } from '@/components/feed/queue-item'
import { urgencyOf } from '@/components/feed/signals'
import type { UrgencyTone } from '@/components/feed/signals'
import { EstimateCompact } from '@/components/tender/estimate-value'
import { TenderCaseFile } from '@/components/tender/tender-case-file'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
    const panelId = useId()
    const titleId = useId()

    return (
        <li className={cn(retiring ? 'animate-retire' : 'animate-rise')}>
            <Card
                asChild
                className={cn(
                    'relative overflow-hidden shadow-none transition-[border-color,box-shadow] duration-200',
                    expanded ? 'border-navy/35 shadow-panel ring-1 ring-navy/10' : 'hover:border-navy/25 hover:shadow-panel',
                )}
            >
                <article aria-labelledby={titleId}>
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                        <div
                            aria-hidden="true"
                            className={cn(
                                'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 self-start rounded-lg border py-2',
                                CHIP[urgency.tone],
                            )}
                        >
                            {parts === null
                                ? <span className="font-mono text-lg leading-none">—</span>
                                : (
                                    <>
                                        <span className="font-serif text-xl font-semibold leading-none tabular-nums">{parts.day}</span>
                                        <span className="font-mono text-[9px] uppercase tracking-[0.14em]">{parts.month}</span>
                                    </>
                                )}
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <h3 id={titleId} className="font-serif text-[15px] font-semibold leading-snug text-ink">
                                <Link to={`/tenders/${tender.id}`} className="focus-ring-panel rounded-sm hover:text-navy">
                                    {item.title}
                                </Link>
                            </h3>

                            <p className="truncate text-[13px] leading-snug text-ink/55">
                                {item.organ}
                                {item.province !== null && ` · ${item.province}`}
                            </p>

                            {(item.relevant || item.service !== null || item.reAdvert || item.briefing !== null) && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {item.relevant && <Badge tone="success" dot>Relevant</Badge>}
                                    {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                                    {item.reAdvert && <Badge tone="danger">Re-advert</Badge>}
                                    {item.briefing !== null && <Badge tone="warn" dot>Briefing {item.briefing}</Badge>}
                                </div>
                            )}

                            <DeadlineMeter urgency={urgency} className="mt-0.5" />

                            <p className="flex flex-wrap items-center gap-x-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">
                                <span className={URGENCY_TEXT[urgency.tone]}>
                                    {tender.closing_date !== null ? `closes ${formatDate(tender.closing_date)} · ${urgency.label}` : urgency.label}
                                </span>
                                <EstimateCompact estimate={item.estimate} />
                            </p>
                        </div>

                        <div className="col-span-2 flex flex-row gap-2 sm:col-span-1 sm:flex-col">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onToggle}
                                disabled={busy}
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                className={cn(
                                    'focus-ring-panel text-[10px] text-ink/65 hover:border-navy/30 hover:bg-navy/5 hover:text-navy',
                                    expanded && 'border-navy/30 bg-navy/5 text-navy',
                                )}
                            >
                                {expanded ? 'Hide' : 'Details'}
                                <ChevronDown
                                    aria-hidden="true"
                                    className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-180')}
                                />
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={onRemove}
                                disabled={busy}
                                aria-label={`Remove ${item.title} from your shortlist`}
                                className="focus-ring-panel text-[10px]"
                            >
                                <Trash2 aria-hidden="true" className="size-3.5" />
                                Remove
                            </Button>
                        </div>
                    </div>

                    {expanded && (
                        <div id={panelId} className="animate-reveal border-t border-line bg-cream/50 p-4">
                            <TenderCaseFile tender={tender} bookmarked onToggleBookmark={onRemove} />
                        </div>
                    )}
                </article>
            </Card>
        </li>
    )
}
