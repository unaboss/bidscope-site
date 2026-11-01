import { useState } from 'react'
import { Check } from 'lucide-react'
import { ANNUAL_MONTHS_CHARGED, TIER_CENTS, TIER_NAMES } from '@/lib/pricing'
import type { PricingTier } from '@/api'
import { SectionLabel } from './section-label'

const TIERS: PricingTier[] = ['single', 'mid', 'all']
const PLAN_COPY = {
    single: {
        description: 'For small businesses',
        features: ['1 province included', 'Ranked tender feed', 'AI tender summaries'],
    },
    mid: {
        description: 'For growing teams',
        features: ['Up to 4 provinces', 'Smart tender matching', 'Deadline alerts', 'Save and organise tenders'],
    },
    all: {
        description: 'For larger organisations',
        features: ['All 9 provinces', 'Smart tender matching', 'Deadline alerts', 'All Growth features'],
    },
}

export function PricingCards({ standalone = false }: { readonly standalone?: boolean }) {
    const [yearly, setYearly] = useState(false)
    return (
        <section id="pricing" className={standalone ? 'pricing-section standalone-pricing' : 'pricing-section'}>
            {!standalone && (
                <>
                    <SectionLabel className="centered">Pricing</SectionLabel>
                    <h2>Simple and transparent</h2>
                </>
            )}
            <div className="billing-toggle" role="group" aria-label="Billing period">
                <button aria-pressed={!yearly} className={!yearly ? 'active' : ''} onClick={() => setYearly(false)}>
                    Monthly
                </button>
                <button aria-pressed={yearly} className={yearly ? 'active' : ''} onClick={() => setYearly(true)}>
                    Yearly
                </button>
                <span>2 months free</span>
            </div>
            <div className="pricing-grid">
                {TIERS.map((tier) => (
                    <article key={tier} className={'price-card ' + (tier === 'mid' ? 'featured' : '')}>
                        <div className="price-card-title">
                            <h3>{TIER_NAMES[tier]}</h3>
                            {tier === 'mid' && <span className="popular-badge">Most popular</span>}
                        </div>
                        <p>{PLAN_COPY[tier].description}</p>
                        <div className="plan-price">
                            R{(TIER_CENTS[tier] / 100) * (yearly ? ANNUAL_MONTHS_CHARGED : 1)}{' '}
                            <span>/{yearly ? 'year' : 'month'}</span>
                        </div>
                        <ul>
                            {PLAN_COPY[tier].features.map((feature) => (
                                <li key={feature}>
                                    <Check size={18} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <a
                            className={'bs-button ' + (tier === 'mid' ? '' : 'outline')}
                            href={'/join?tier=' + tier + '&billing=' + (yearly ? 'annual' : 'monthly')}
                        >
                            Start free trial
                        </a>
                    </article>
                ))}
            </div>
        </section>
    )
}
