import { useState } from 'react'
import { CheckIcon, LaptopIcon, ChartBarIcon, UsersThreeIcon } from '@phosphor-icons/react'
import {
    ANNUAL_MONTHS_CHARGED,
    INCLUDED_PROVINCES,
    MAX_PROVINCES,
    TIER_CENTS,
    TIER_NAMES,
} from '@/features/billing/pricing'
import type { PricingTier } from '@/shared/api'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'

const TIERS: PricingTier[] = ['single', 'mid', 'all']
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
const COMPARISON = [
    { label: 'Included provinces', values: TIERS.map((tier) => String(INCLUDED_PROVINCES[tier])) },
    { label: 'Maximum provinces with add-ons', values: TIERS.map((tier) => String(MAX_PROVINCES[tier])) },
    { label: 'Tender discovery', values: ['Included', 'Included', 'Included'] },
    { label: 'Saved tenders', values: ['Not included', 'Included', 'Included'] },
    { label: 'Deadline calendar', values: ['Not included', 'Included', 'Included'] },
]

export function PricingCards({ standalone = false }: { readonly standalone?: boolean }) {
    const [yearly, setYearly] = useState(false)
    const prices = useSubtleReveal<HTMLDivElement>(yearly, '.ref-price')
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
            <div className="ref-plans" ref={prices}>
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
                            <div className="ref-price">
                                R
                                {((TIER_CENTS[tier] / 100) * (yearly ? ANNUAL_MONTHS_CHARGED : 1)).toLocaleString(
                                    'en-ZA',
                                )}{' '}
                                <span>/{yearly ? 'year' : 'month'}</span>
                            </div>
                            <ul>
                                {PLANS[tier].features.map((feature) => (
                                    <li key={feature}>
                                        <CheckIcon size={21} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <a
                                className={'bs-button ' + (tier === 'mid' ? '' : 'outline')}
                                href={'/join?tier=' + tier + '&billing=' + (yearly ? 'annual' : 'monthly')}
                            >
                                Get started
                            </a>
                        </article>
                    )
                })}
            </div>
            <div className="ref-comparison-heading">
                <h2>Compare plans</h2>
                <p>See what’s included and choose the coverage that fits your team.</p>
            </div>
            <div className="ref-table-scroll" tabIndex={0} role="region" aria-label="Plan comparison">
                <table className="ref-comparison">
                    <caption>Included in each plan</caption>
                    <thead>
                        <tr>
                            <th scope="col">Features</th>
                            {TIERS.map((tier) => (
                                <th key={tier} scope="col">
                                    {TIER_NAMES[tier]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {COMPARISON.map(({ label, values }) => (
                            <tr key={label}>
                                <th scope="row">{label}</th>
                                {values.map((value, index) => (
                                    <td key={TIERS[index]}>
                                        {value === 'Included' ? (
                                            <span className="ref-included">
                                                <CheckIcon size={19} aria-hidden="true" />
                                                <span className="sr-only">Included</span>
                                            </span>
                                        ) : (
                                            value
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
