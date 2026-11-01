import type { ReactNode } from 'react'
import type { PricingTier } from '@/api'
import { monthlyTotalCents, PROMO_MONTHS, PROMO_PERCENT, promoCents, TIER_NAMES } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { FOCUS, formatRands, GOLD_TEXT } from './brand'

/** The shape of a typed code once normalised (see worker/lib/discount-code.ts). */
export const CODE_PATTERN = /^BID50-[0-9A-Z]{8}$/

export function normaliseCode(raw: string): string
{
    return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** True when a typed code has the shape of a discount code (the server checks it against the email). */
export function codeLooksValid(code: string): boolean
{
    return CODE_PATTERN.test(normaliseCode(code))
}

/** What is charged each month (and today) for a plan, province count and code. Billing is monthly only. */
export function todayCentsFor(tier: PricingTier, count: number, promo: boolean): number
{
    return promo ? promoCents(tier, count) : monthlyTotalCents(tier, count)
}

export function FieldLabel({ htmlFor, children }: { readonly htmlFor: string, readonly children: ReactNode })
{
    return <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[#14251d]/55">{children}</label>
}

/** What each plan includes, listed on the pricing card and at payment. */
export const PLAN_INCLUDES: Readonly<Record<PricingTier, readonly string[]>> = {
    single: ['Ranked tender feed for 1 province', 'AI summary of every tender', 'Search across every source'],
    mid: [
        'Everything in Starter, up to 4 provinces',
        'Alerts before briefings and closing',
        'Bookmarks and deadline calendar',
        'Price estimates and buyer profiles',
        'Tender map and requirement checks',
    ],
    all: ['Everything in Growth', 'All nine provinces, every source', 'Best value from 6 provinces up'],
}

function CheckIcon()
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#075037]">
            <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * The chosen plan's list. Every plan's list sits in the same cell, so the
 * block keeps the tallest list's height when the plan changes.
 */
export function PlanIncludes({ tier, className, listClassName }: { readonly tier: PricingTier, readonly className?: string, readonly listClassName?: string })
{
    return (
        <div className={cn('grid', className)}>
            {(['single', 'mid', 'all'] as const).map((option) => (
                <ul
                    key={option}
                    aria-label={`${TIER_NAMES[option]} includes`}
                    aria-hidden={option !== tier}
                    className={cn('col-start-1 row-start-1 flex flex-col gap-1.5', listClassName, option !== tier && 'invisible')}
                >
                    {PLAN_INCLUDES[option].map((item) => (
                        <li key={item} className="flex gap-2 text-[13px] leading-snug text-[#14251d]/75">
                            <CheckIcon />
                            {item}
                        </li>
                    ))}
                </ul>
            ))}
        </div>
    )
}

interface TierToggleProps
{
    readonly tier: PricingTier
    readonly onChange: (tier: PricingTier) => void
    /** Fully rounded, as a small pill. */
    readonly pill?: boolean
}

/** Starter / Growth / Pro. */
export function TierToggle({ tier, onChange, pill = false }: TierToggleProps)
{
    return (
        <div role="radiogroup" aria-label="Plan" className={cn('grid grid-cols-3 gap-1 border border-[#B08D57]/20 bg-[#fdfcfb]/60 p-1', pill ? 'rounded-full' : 'rounded-lg')}>
            {(['single', 'mid', 'all'] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={tier === option}
                    onClick={() => onChange(option)}
                    className={cn(
                        'px-1 text-center font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
                        pill ? 'rounded-full py-1.5' : 'rounded-md py-2',
                        tier === option ? 'bg-[#075037] font-bold text-[#fdfcfb]' : 'text-[#14251d]/60 hover:text-[#075037]',
                        FOCUS,
                    )}
                >
                    {TIER_NAMES[option]}
                </button>
            ))}
        </div>
    )
}

interface PriceBlockProps
{
    readonly tier: PricingTier
    readonly count: number
    readonly promo: boolean
    /** Smaller figures, for the pricing page's hero. */
    readonly compact?: boolean
}

/** The monthly price, with the full price struck through while a discount applies. */
export function PriceBlock({ tier, count, promo, compact = false }: PriceBlockProps)
{
    const full = formatRands(monthlyTotalCents(tier, count))
    const today = todayCentsFor(tier, count, promo)

    return (
        <div>
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                {promo && <s className={cn('font-serif font-semibold text-[#14251d]/40 decoration-[#075037]/80 decoration-2', compact ? 'text-lg' : 'text-xl')}>{full}</s>}
                <span className={cn('font-serif font-semibold tracking-tight', compact ? 'text-3xl' : 'text-4xl', GOLD_TEXT)}>{formatRands(today)}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#14251d]/45">/ month</span>
            </p>
            <p className={cn('leading-relaxed text-[#14251d]/55', compact ? 'mt-1 text-[12px]' : 'mt-2 text-[13px]')}>
                {promo
                    ? <>{PROMO_PERCENT}% off for {PROMO_MONTHS} months, then {full}/month. Cancel anytime.</>
                    : <>Billed monthly. Cancel anytime.</>}
            </p>
        </div>
    )
}
