import { useState } from 'react'
import { INCLUDED_PROVINCES, TIER_CENTS, TIER_NAMES } from '@/features/billing/pricing'
import type { PricingTier } from '@/shared/api'
import './plan-quick-start.css'

const tiers: PricingTier[] = ['single', 'mid', 'all']

export function PlanQuickStart() {
    const [tier, setTier] = useState<PricingTier>('single')
    return (
        <section className="container plan-quick-start" aria-labelledby="quick-plan-title">
            <div className="quick-plan-intro">
                <h2 id="quick-plan-title">Start with the coverage you need</h2>
                <a href="/pricing">Compare all features</a>
            </div>
            <fieldset className="quick-plan-options">
                <legend className="sr-only">Choose a monthly plan</legend>
                {tiers.map((value) => (
                    <label key={value} data-selected={tier === value}>
                        <input type="radio" name="quick-plan" value={value} checked={tier === value}
                            onChange={() => setTier(value)} />
                        <span>
                            <strong>{TIER_NAMES[value]}</strong>
                            <small>{INCLUDED_PROVINCES[value]} {value === 'single' ? 'province' : 'provinces'}</small>
                        </span>
                        <span className="quick-plan-price">R{TIER_CENTS[value] / 100}<small>/month</small></span>
                    </label>
                ))}
            </fieldset>
            <div className="quick-plan-action">
                <span>Monthly billing. Choose your provinces during setup.</span>
                <a className="bs-button" href={'/join?tier=' + tier + '&billing=monthly'}>
                    Continue with {TIER_NAMES[tier]}
                </a>
            </div>
        </section>
    )
}
