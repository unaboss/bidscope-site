import type { ReactElement, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Countdown, DeadlineMeter } from '@/components/feed/deadline-meter'
import { DeadlineDial } from '@/components/feed/deadline-dial'
import type { QueueItem } from '@/components/feed/queue-item'
import { urgencyOf } from '@/components/feed/signals'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IconArrowRight, IconBookmark, IconClose } from '@/components/ui/icons'
import { formatDate, formatZAR } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * `pane` is the persistent desktop rail; `inline` is the same brief opened
 * under its own row on narrow screens, where the title and buyer are already
 * one line above and would only be read twice.
 */
type BriefVariant = 'pane' | 'inline'

interface TenderBriefProps
{
    readonly item: QueueItem
    readonly saved: boolean
    readonly busy: boolean
    readonly onSave: () => void
    /** Omitted in Browse, where dismissing a catalogue row has no meaning. */
    readonly onDismiss?: () => void
    /** Standing in the current ranking, e.g. "3rd of 18". */
    readonly standing?: string | null
    readonly variant?: BriefVariant
    readonly className?: string
}

function Fact({ label, children }: { readonly label: string, readonly children: ReactNode }): ReactElement
{
    return (
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-line/70 py-2 last:border-b-0">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">{label}</dt>
            <dd className="text-sm leading-snug text-ink">{children}</dd>
        </div>
    )
}

function valueText(item: QueueItem): string
{
    if (item.estimatedValue === null) {
        return 'Not published'
    }

    const amount = formatZAR(item.estimatedValue)

    return item.valueBasis !== null ? `${amount} · ${item.valueBasis}` : amount
}

/**
 * The reading pane of the Discover workspace: one tender, argued rather than
 * tabulated. Deadline first, then the facts that decide a bid/no-bid, then the
 * ranking rationale, then the two decisions the user is here to make.
 */
export function TenderBrief({
    item,
    saved,
    busy,
    onSave,
    onDismiss,
    standing,
    variant = 'pane',
    className,
}: TenderBriefProps): ReactElement
{
    const urgency = urgencyOf(item.closingDate)
    const isPane = variant === 'pane'
    const reasons = item.reasons.slice(0, 4)

    return (
        <Card
            asChild
            className={cn(
                'flex flex-col overflow-hidden rounded-2xl',
                !isPane && 'bg-cream/70 shadow-none',
                className,
            )}
        >
            <article aria-label={isPane ? undefined : `Brief: ${item.title}`}>
                {isPane && (
                    <CardHeader className="nt-grain gap-4 space-y-0 border-b border-line bg-cream/60 px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">Tender brief</span>
                            {standing !== null && standing !== undefined && (
                                <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                                    {standing}
                                </span>
                            )}
                        </div>

                        <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
                            <Link to={`/tenders/${item.id}`} className="focus-ring rounded-sm hover:text-navy">
                                {item.title}
                            </Link>
                        </h2>

                        <p className="text-sm leading-snug text-ink/65">
                            {item.organ}
                            {item.province !== null && <span className="text-ink/40"> · {item.province}</span>}
                        </p>

                        {(item.relevant || item.service !== null || item.reAdvert || saved) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {item.relevant && <Badge tone="success" dot>Relevant</Badge>}
                                {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                                {item.reAdvert && <Badge tone="danger">Re-advertised</Badge>}
                                {saved && <Badge tone="warn" dot>Saved</Badge>}
                            </div>
                        )}
                    </CardHeader>
                )}

                <CardContent className="flex flex-col gap-5 px-5 py-5">
                    <section aria-label="Closing date" className="flex items-center gap-4">
                        <DeadlineDial urgency={urgency} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">Closing</span>
                            <p className="font-serif text-2xl font-semibold leading-none tracking-tight text-ink">
                                {item.closingDate !== null ? formatDate(item.closingDate) : 'Not published'}
                            </p>
                            <Countdown urgency={urgency} />
                        </div>
                    </section>

                    <DeadlineMeter urgency={urgency} className="-mt-1" />

                    <dl className="flex flex-col">
                        <Fact label="Est. value">{valueText(item)}</Fact>
                        <Fact label="Published">{formatDate(item.publishedDate)}</Fact>
                        {item.briefing !== null && <Fact label="Briefing">{item.briefing}</Fact>}
                        {item.category !== null && <Fact label="Category">{item.category}</Fact>}
                        {!isPane && item.province !== null && <Fact label="Province">{item.province}</Fact>}
                    </dl>

                    {reasons.length > 0 && (
                        <section
                            aria-label="Why this tender"
                            className="relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-navy/15 bg-navy/[0.04] py-3 pe-4 ps-5"
                        >
                            <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-navy/40" />
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/80">Why this</h3>
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
                                    {reasons.length} signal{reasons.length === 1 ? '' : 's'}
                                </span>
                            </div>
                            <ul className="flex flex-col gap-1.5">
                                {reasons.map((reason) => (
                                    <li key={reason} className="flex gap-2.5 text-sm leading-snug text-ink/80">
                                        <span aria-hidden="true" className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-navy/50" />
                                        <span className="first-letter:uppercase">{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </CardContent>

                <CardFooter className="mt-auto flex-wrap gap-2 border-t border-line bg-cream/40 px-5 py-4">
                    <Button
                        variant={saved ? 'secondary' : 'primary'}
                        size="sm"
                        aria-pressed={saved}
                        disabled={busy}
                        onClick={onSave}
                        className={cn(saved && 'border-warn/30 bg-warn/[0.07] text-warn hover:bg-warn/10')}
                    >
                        <IconBookmark className="size-3.5" fill={saved ? 'currentColor' : 'none'} />
                        {saved ? 'Saved' : 'Save'}
                    </Button>

                    {onDismiss !== undefined && (
                        <Button variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>
                            <IconClose className="size-3.5" />
                            Dismiss
                        </Button>
                    )}

                    <Button asChild variant="link" size="sm" className="focus-ring-panel group ms-auto px-1 text-[10px]">
                        <Link to={`/tenders/${item.id}`}>
                            Open case file
                            <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                        </Link>
                    </Button>
                </CardFooter>
            </article>
        </Card>
    )
}
