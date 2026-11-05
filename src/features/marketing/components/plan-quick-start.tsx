import { useState } from 'react'
import { CheckIcon, ArrowUpRightIcon } from '@phosphor-icons/react'
import { TIER_CENTS, TIER_NAMES } from '@/features/billing/pricing'
import type { PricingTier } from '@/shared/api'
import { RollingPrice } from './rolling-price'
import './plan-quick-start.css'

const tiers: PricingTier[] = ['single', 'mid', 'all']
const details = {
    single: {
        title: 'A focused search in one province.',
        description: 'For businesses finding opportunities close to home.',
        features: ['1 province included', 'Ranked tender feed', 'Province and category filters'],
    },
    mid: {
        title: 'More reach. A clearer shortlist.',
        description: 'For businesses researching opportunities across several provinces.',
        features: ['Up to 4 provinces included', 'Saved tenders and watchlists', 'Deadline calendar and alerts'],
    },
    all: {
        title: 'Take your search nationwide.',
        description: 'For businesses pursuing opportunities across South Africa.',
        features: ['All 9 provinces included', 'Saved tenders and watchlists', 'Deadline calendar and alerts'],
    },
}

export function PlanQuickStart() {
    const [tier, setTier] = useState<PricingTier>('single')
    const plan = details[tier]
    return (
        <section className="container plan-quick-start" aria-labelledby="quick-plan-title">
            <div className="quick-plan-intro">
                <h2 id="quick-plan-title">Choose your coverage.</h2>
                <p>Start in one province, expand to four, or search nationwide.</p>
            </div>
            <div className="quick-plan-panel">
                <div className="quick-plan-toolbar">
                    <fieldset className="quick-plan-options">
                        <legend className="sr-only">Choose a monthly plan</legend>
                        {tiers.map((value) => (
                            <label key={value}>
                                <input className="sr-only" type="radio" name="quick-plan" value={value}
                                    checked={tier === value} onChange={() => setTier(value)} />
                                <span>{TIER_NAMES[value]}</span>
                            </label>
                        ))}
                    </fieldset>
                    <a className="quick-plan-compare" href="/pricing">
                        Compare plans <ArrowUpRightIcon size={16} aria-hidden="true" />
                    </a>
                </div>
                <div className="quick-plan-body">
                    <div className="quick-plan-details">
                        <h3>{plan.title}</h3>
                        <p>{plan.description}</p>
                        <ul aria-label={TIER_NAMES[tier] + ' features'}>
                            {plan.features.map((feature) => (
                                <li key={feature}><CheckIcon size={18} aria-hidden="true" />{feature}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="quick-plan-purchase">
                        <RollingPrice amount={TIER_CENTS[tier] / 100} yearly={false} />
                        <span className="quick-plan-billing">Billed monthly in ZAR</span>
                        <a className="bs-button" href={'/join?tier=' + tier + '&billing=monthly'}>
                            Get started with {TIER_NAMES[tier]}
                        </a>
                        <span className="quick-plan-setup">Choose your provinces during setup.</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
