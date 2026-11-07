import { useId, useState } from 'react'
import { CaretDownIcon, CheckIcon, LaptopIcon, ChartBarIcon, MapTrifoldIcon, MinusIcon, UsersThreeIcon } from '@phosphor-icons/react'
import {
    ANNUAL_MONTHS_CHARGED,
    INCLUDED_PROVINCES,
    MAX_PROVINCES,
    PROVINCE_ADDON_CENTS,
    TIER_CENTS,
    TIER_NAMES,
} from '@/features/billing/pricing'
import type { PricingTier } from '@/shared/api'
import { accountFor, FEATURES, hasFeature, type PlanId } from '../../../../worker/domain/plans'
import { RollingPrice } from './rolling-price'
import './pricing-cards.css'

const TIERS: PricingTier[] = ['single', 'mid', 'all']

/**
 * The plan each tier grants. Mirrors `PLAN_FOR_TIER` in
 * `worker/domain/pricing.ts`; the matrix below is read from the Worker's own
 * feature catalogue, so the pricing page cannot promise something the app
 * refuses to unlock.
 */
const PLAN_FOR_TIER: Readonly<Record<PricingTier, PlanId>> = { single: 'starter', mid: 'growth', all: 'pro' }

const ACCOUNTS = Object.fromEntries(
    TIERS.map((tier) => [tier, accountFor(PLAN_FOR_TIER[tier], null, new Date())]),
) as Record<PricingTier, ReturnType<typeof accountFor>>

const PLANS = {
    single: {
        icon: LaptopIcon,
        description: 'Essential tender discovery for a focused local search.',
        features: [
            '1 province included',
            'Ranked tender feed',
            'Tender descriptions and summaries',
            'Province and category filters',
        ],
    },
    mid: {
        icon: ChartBarIcon,
        description: 'Broader coverage and tools to organise your opportunities.',
        features: [
            'Up to 4 provinces included',
            'Smart tender matching',
            'Saved tenders and watchlists',
            'Deadline calendar and alerts',
        ],
    },
    all: {
        icon: UsersThreeIcon,
        description: 'Nationwide tender research in one connected workspace.',
        features: [
            'All 9 provinces included',
            'Everything in Growth',
            'Smart tender matching',
            'Watchlist and deadline tools',
        ],
    },
}

/** What every plan includes, said once instead of three times. */
const BASELINE = [
    'Every source in one feed',
    'Plain-language AI summaries',
    'Ranked, relevant-first matches',
    'Province and category filters',
]

/** Which features sit behind a paid tier, used to group the comparison table. */
function comparisonRows() {
    return FEATURES.map((feature) => ({
        label: feature.label,
        description: feature.description,
        values: TIERS.map((tier) => hasFeature(ACCOUNTS[tier], feature.key)),
    }))
}

/**
 * How many extra provinces a plan can carry, and what each costs. Pro is
 * nationwide, so it has nothing to top up — it shows the closed state of the
 * same row instead, which keeps the three cards' internals aligned.
 */
function ProvinceTopUp({ tier }: { readonly tier: PricingTier }) {
    const [open, setOpen] = useState(false)
    const panelId = useId()
    const extra = MAX_PROVINCES[tier] - INCLUDED_PROVINCES[tier]

    if (extra <= 0) {
        return (
            <div className="plan-topup" data-open="false">
                <span className="plan-topup-trigger is-static">
                    <MapTrifoldIcon size={13} aria-hidden="true" />
                    Nationwide coverage
                </span>
            </div>
        )
    }

    return (
        <div className="plan-topup" data-open={open}>
            <button
                type="button"
                className="plan-topup-trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((current) => !current)}
            >
                <span>
                    {extra} more {extra === 1 ? 'province' : 'provinces'} available
                </span>
                <CaretDownIcon size={13} aria-hidden="true" className="plan-topup-caret" />
            </button>
            {/* 0fr → 1fr is the only height transition that needs no measurement. */}
            <div className="plan-topup-panel" id={panelId} aria-hidden={!open} inert={!open}>
                <div>
                    <p>
                        Add any of the remaining provinces for{' '}
                        <strong>R{PROVINCE_ADDON_CENTS / 100} a month each</strong>. Choose them
                        during setup and change them whenever your work moves.
                    </p>
                </div>
            </div>
        </div>
    )
}

export function PricingCards({ standalone = false }: { readonly standalone?: boolean }) {
    const [yearly, setYearly] = useState(false)
    const rows = comparisonRows()

    return (
        <section className="ref-pricing" id="pricing">
            {!standalone && <h2>Simple and transparent</h2>}
            <div className="ref-billing" role="group" aria-label="Billing period">
                <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
                    Monthly
                </button>
                <button aria-pressed={yearly} onClick={() => setYearly(true)}>
                    Annual <span>2 months free</span>
                </button>
            </div>

            <ul className="pricing-baseline" aria-label="Included in every plan">
                {BASELINE.map((item) => (
                    <li key={item}>
                        <CheckIcon size={15} aria-hidden="true" />
                        {item}
                    </li>
                ))}
            </ul>

            <div className="ref-plans">
                {TIERS.map((tier) => {
                    const Icon = PLANS[tier].icon
                    return (
                        <article key={tier} className={tier === 'mid' ? 'featured' : ''}>
                            <div className="ref-plan-top">
                                <span className="ref-icon">
                                    <Icon size={32} />
                                </span>
                                {tier === 'mid' && <span className="ref-popular">Most popular</span>}
                            </div>
                            <h2>{TIER_NAMES[tier]}</h2>
                            <p>{PLANS[tier].description}</p>
                            <RollingPrice
                                amount={(TIER_CENTS[tier] / 100) * (yearly ? ANNUAL_MONTHS_CHARGED : 1)}
                                yearly={yearly}
                            />
                            <ul>
                                {PLANS[tier].features.map((feature) => (
                                    <li key={feature}>
                                        <CheckIcon size={21} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <ProvinceTopUp tier={tier} />
                            <div className="plan-commit">
                                <span className="plan-trial">
                                    <CheckIcon size={15} aria-hidden="true" />
                                    7 days free, no card needed
                                </span>
                                <a
                                    className={'bs-button ' + (tier === 'mid' ? '' : 'outline')}
                                    href={'/join?tier=' + tier + '&billing=' + (yearly ? 'annual' : 'monthly')}
                                >
                                    Start free trial
                                </a>
                            </div>
                        </article>
                    )
                })}
            </div>

            <div className="ref-comparison-heading">
                <h2>Compare plans</h2>
                <p>Every capability in the workspace, and which plan carries it.</p>
            </div>
            <div className="ref-table-scroll" tabIndex={0} role="region" aria-label="Plan comparison">
                <table className="ref-comparison">
                    <caption>Included in each plan</caption>
                    <thead>
                        <tr>
                            <th scope="col">Capability</th>
                            {TIERS.map((tier) => (
                                <th key={tier} scope="col">
                                    {TIER_NAMES[tier]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Provinces included</th>
                            {TIERS.map((tier) => (
                                <td key={tier}>{INCLUDED_PROVINCES[tier]}</td>
                            ))}
                        </tr>
                        <tr>
                            <th scope="row">Provinces with add-ons</th>
                            {TIERS.map((tier) => (
                                <td key={tier}>{MAX_PROVINCES[tier]}</td>
                            ))}
                        </tr>
                        {rows.map((row) => (
                            <tr key={row.label}>
                                <th scope="row">
                                    {row.label}
                                    <span className="ref-comparison-detail">{row.description}</span>
                                </th>
                                {row.values.map((included, index) => (
                                    <td key={TIERS[index]}>
                                        {included ? (
                                            <span className="ref-included">
                                                <CheckIcon size={19} aria-hidden="true" />
                                                <span className="sr-only">Included</span>
                                            </span>
                                        ) : (
                                            <span className="ref-excluded">
                                                <MinusIcon size={17} aria-hidden="true" />
                                                <span className="sr-only">Not included</span>
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="ref-plan-note">7-day free trial. No credit card required. Cancel anytime.</p>
        </section>
    )
}
