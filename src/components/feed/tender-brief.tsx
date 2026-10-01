import type { ReactElement, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Countdown, DeadlineMeter } from '@/components/feed/deadline-meter'
import type { QueueItem } from '@/components/feed/queue-item'
import { urgencyOf } from '@/components/feed/signals'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

    return (
        <article
            className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-line bg-panel',
                isPane ? 'shadow-panel' : 'bg-cream/70',
                className,
            )}
        >
            {isPane && (
                <header className="nt-grain flex flex-col gap-4 border-b border-line bg-cream/60 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-wax">Tender brief</span>
                        {standing !== null && standing !== undefined && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">{standing}</span>
                        )}
                    </div>

                    <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
                        <Link to={`/tenders/${item.id}`} className="focus-ring hover:text-navy">
                            {item.title}
                        </Link>
                    </h2>

                    <p className="text-sm leading-snug text-ink/65">
                        {item.organ}
                        {item.province !== null && <span className="text-ink/40"> · {item.province}</span>}
                    </p>

                    {(item.relevant || item.service !== null || item.reAdvert || saved) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {item.relevant && <Badge tone="success">Relevant</Badge>}
                            {item.service !== null && <Badge tone="navy">{item.service}</Badge>}
                            {item.reAdvert && <Badge tone="danger">Re-advertised</Badge>}
                            {saved && <Badge tone="warn">Saved</Badge>}
                        </div>
                    )}
                </header>
            )}

            <div className="flex flex-col gap-5 px-5 py-5">
                <section aria-label="Closing date" className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">Closing</span>
                        <Countdown urgency={urgency} />
                    </div>
                    <p className="font-serif text-2xl font-semibold leading-none tracking-tight text-ink">
                        {item.closingDate !== null ? formatDate(item.closingDate) : 'Not published'}
                    </p>
                    <DeadlineMeter urgency={urgency} className="mt-1" />
                </section>

                <dl className="flex flex-col">
                    <Fact label="Est. value">{valueText(item)}</Fact>
                    <Fact label="Published">{formatDate(item.publishedDate)}</Fact>
                    {item.briefing !== null && <Fact label="Briefing">{item.briefing}</Fact>}
                    {item.category !== null && <Fact label="Category">{item.category}</Fact>}
                    {!isPane && item.province !== null && <Fact label="Province">{item.province}</Fact>}
                </dl>

                {item.reasons.length > 0 && (
                    <section className="flex flex-col gap-2 rounded-xl border border-navy/15 bg-navy/[0.04] px-4 py-3">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/70">Why this</h3>
                        <ul className="flex flex-col gap-1.5">
                            {item.reasons.slice(0, 4).map((reason) => (
                                <li key={reason} className="flex gap-2.5 text-sm leading-snug text-ink/80">
                                    <span aria-hidden="true" className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-navy/50" />
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-line bg-cream/40 px-5 py-4">
                <Button
                    variant={saved ? 'secondary' : 'primary'}
                    size="sm"
                    aria-pressed={saved}
                    disabled={busy}
                    onClick={onSave}
                >
                    <IconBookmark className="size-3.5" />
                    {saved ? 'Saved' : 'Save'}
                </Button>

                {onDismiss !== undefined && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>
                        <IconClose className="size-3.5" />
                        Dismiss
                    </Button>
                )}

                <Link
                    to={`/tenders/${item.id}`}
                    className="focus-ring-panel ms-auto inline-flex items-center gap-1.5 rounded-md px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-navy hover:underline"
                >
                    Open case file
                    <IconArrowRight className="size-3.5" />
                </Link>
            </footer>
        </article>
    )
}
