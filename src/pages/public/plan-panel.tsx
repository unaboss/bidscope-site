import type { ReactNode } from 'react'
import type { PricingTier } from '@/api'
import {
    annualCents,
    isPromoTier,
    monthlyTotalCents,
    PROMO_MONTHS,
    PROMO_PERCENT,
    promoCents,
    TIER_NAMES,
    type Billing,
} from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { EYEBROW, FOCUS, formatRands, GOLD_TEXT, INPUT, PANEL } from './brand'

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

/** What is charged today for a plan, billing period, province count and code. */
export function todayCentsFor(tier: PricingTier, billing: Billing, count: number, promo: boolean): number
{
    if (billing === 'annual')
    {
        return annualCents(tier, count)
    }

    return promo ? promoCents(tier, count) : monthlyTotalCents(tier, count)
}

export function FieldLabel({ htmlFor, children }: { readonly htmlFor: string, readonly children: ReactNode })
{
    return <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[#E9DFC6]/55">{children}</label>
}

interface PriceBlockProps
{
    readonly tier: PricingTier
    readonly billing: Billing
    readonly count: number
    readonly promo: boolean
    /** Smaller figures, for the pricing page's hero. */
    readonly compact?: boolean
}

/** The price due today, with the full price struck through while a discount applies. */
export function PriceBlock({ tier, billing, count, promo, compact = false }: PriceBlockProps)
{
    const monthly = monthlyTotalCents(tier, count)
    const full = formatRands(monthly)
    const today = todayCentsFor(tier, billing, count, promo)
    const struck = billing === 'annual' ? formatRands(monthly * 12) : promo ? full : null

    return (
        <div>
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                {struck !== null && <s className={cn('font-serif font-semibold text-[#E9DFC6]/40 decoration-[#D9B97E]/80 decoration-2', compact ? 'text-lg' : 'text-xl')}>{struck}</s>}
                <span className={cn('font-serif font-semibold tracking-tight', compact ? 'text-3xl' : 'text-4xl', GOLD_TEXT)}>{formatRands(today)}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E9DFC6]/45">today</span>
            </p>
            <p className={cn('leading-relaxed text-[#E9DFC6]/60', compact ? 'mt-1 text-[12px]' : 'mt-2 text-[13px]')}>
                {billing === 'annual'
                    ? <>Twelve months for the price of ten ({full}/month), renewing yearly. Cancel anytime.</>
                    : promo
                        ? <>{PROMO_PERCENT}% off for {PROMO_MONTHS} months ({formatRands(today)}/month), then {full}/month. Cancel anytime.</>
                        : <>{full}/month, billed monthly. Cancel anytime.</>}
            </p>
        </div>
    )
}

interface PlanPanelProps
{
    readonly tier: PricingTier
    readonly billing: Billing
    /** Provinces priced (Pro ignores it; others price at least one). */
    readonly count: number
    readonly promo: boolean
    readonly code: string
    readonly codeId: string
    readonly onTierChange: (tier: PricingTier) => void
    readonly onBillingChange: (billing: Billing) => void
    readonly onCodeChange: (code: string) => void
    /** Under the code field: the "email me a code" prompt, or a confirmation. */
    readonly codeHelp: ReactNode
    /** Between the price and the code field (e.g. the add-on provinces note). */
    readonly note?: ReactNode
    /** The panel's last row: the total due, or the button that moves on. */
    readonly footer: ReactNode
    readonly className?: string
    /** Takes the place of the "Your plan" label at the top (the hero's preview button). */
    readonly header?: ReactNode
    /** Tighter spacing, smaller controls and no plan heading, for the pricing page's hero. */
    readonly compact?: boolean
}

/**
 * The plan picker: plan, billing period, price and discount code. The pricing
 * page's hero and the payment page show the same panel, so the price a visitor
 * picks is the price they see when they pay.
 */
export function PlanPanel(props: PlanPanelProps)
{
    const { tier, billing, count, promo, code } = props
    const compact = props.compact === true
    const toggle = compact ? 'py-1.5' : 'py-2'

    return (
        <div className={cn('flex flex-col', compact ? 'gap-3 p-4 sm:p-5' : 'gap-5 p-5 sm:p-6', PANEL, 'border-[#D9B97E]/35', props.className)}>
            <div>
                {props.header ?? <p className={EYEBROW}>Your plan</p>}
                <div role="radiogroup" aria-label="Plan" className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg border border-[#B08D57]/20 bg-[#06140F]/60 p-1">
                    {(['single', 'mid', 'all'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={tier === option}
                            onClick={() => props.onTierChange(option)}
                            className={cn(
                                'rounded-md px-1 text-center font-mono text-[10px] uppercase leading-tight tracking-[0.08em] transition-colors',
                                toggle,
                                tier === option ? 'bg-[#D9B97E] font-bold text-[#06140F]' : 'text-[#E9DFC6]/60 hover:text-[#D9B97E]',
                                FOCUS,
                            )}
                        >
                            {TIER_NAMES[option]}
                            {billing === 'monthly' && isPromoTier(option) && <span className="block text-[9px] opacity-80">{PROMO_PERCENT}% off</span>}
                        </button>
                    ))}
                </div>
                {!compact && <p className="mt-4 font-serif text-xl font-semibold text-[#E9DFC6]">{TIER_NAMES[tier]}</p>}
            </div>

            <div role="radiogroup" aria-label="Billing" className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#B08D57]/20 bg-[#06140F]/60 p-1">
                {(['monthly', 'annual'] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={billing === option}
                        onClick={() => props.onBillingChange(option)}
                        className={cn(
                            'rounded-md px-1 text-center font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                            toggle,
                            billing === option ? 'bg-[#D9B97E] font-bold text-[#06140F]' : 'text-[#E9DFC6]/60 hover:text-[#D9B97E]',
                            FOCUS,
                        )}
                    >
                        {option === 'monthly' ? 'Monthly' : 'Yearly · 2 free'}
                    </button>
                ))}
            </div>

            <PriceBlock tier={tier} billing={billing} count={count} promo={promo} compact={compact} />

            {props.note}

            {isPromoTier(tier) && billing === 'monthly' && (
                <div>
                    {compact
                        ? <label htmlFor={props.codeId} className="sr-only">Discount code</label>
                        : <FieldLabel htmlFor={props.codeId}>Discount code</FieldLabel>}
                    <input
                        id={props.codeId}
                        value={code}
                        onChange={(event) => props.onCodeChange(event.target.value)}
                        placeholder={compact ? 'Discount code (BID50-…)' : 'BID50-XXXXXXXX'}
                        autoCapitalize="characters"
                        spellCheck={false}
                        className={cn(INPUT, 'font-mono uppercase tracking-[0.1em]', compact && 'h-10 text-[14px]')}
                    />
                    {props.codeHelp}
                </div>
            )}

            {props.footer}
        </div>
    )
}
