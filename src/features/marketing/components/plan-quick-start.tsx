import { useState } from 'react'
import { ArrowUpRightIcon, CheckIcon, ShieldCheckIcon } from '@phosphor-icons/react'
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

/**
 * The plan decision that opens registration.
 *
 * The three plans are one segmented control, so the choice reads as a control
 * rather than three cards competing for attention; the commitment — price,
 * trial, action — sits beside it. Prices appear twice on purpose: small in the
 * segment (which plan), large in the panel (what it costs).
 */
export function PlanQuickStart({ entry = false, initialTier = 'single' }: {
    readonly entry?: boolean
    readonly initialTier?: PricingTier
}) {
    const [tier, setTier] = useState<PricingTier>(initialTier)
    const plan = details[tier]
    const price = TIER_CENTS[tier] / 100

    return (
        <section
            className={'container plan-quick-start' + (entry ? ' plan-entry' : '')}
            aria-labelledby="quick-plan-title"
        >
            <header className="quick-plan-head">
                <p className="quick-plan-step">Step 1 of 3</p>
                {entry ? (
                    <h1 id="quick-plan-title">Choose your plan.</h1>
                ) : (
                    <h2 id="quick-plan-title">Choose your plan.</h2>
                )}
                <p className="quick-plan-lead">
                    Seven days free on every plan. Change or cancel whenever you like.
                </p>
            </header>

            <div className="quick-plan-panel">
                <div className="quick-plan-toolbar">
                    <fieldset className="quick-plan-options">
                        <legend className="sr-only">Plan</legend>
                        {tiers.map((value) => (
                            <label key={value} className={tier === value ? 'is-selected' : undefined}>
                                <input
                                    className="sr-only"
                                    type="radio"
                                    name="quick-plan"
                                    value={value}
                                    checked={tier === value}
                                    onChange={() => setTier(value)}
                                />
                                <span className="quick-plan-option-price">R{TIER_CENTS[value] / 100}</span>
                                <span className="quick-plan-option-name">{TIER_NAMES[value]}</span>
                            </label>
                        ))}
                    </fieldset>
                    <a className="quick-plan-compare" href="/pricing">
                        Compare plans <ArrowUpRightIcon size={15} aria-hidden="true" />
                    </a>
                </div>

                <div className="quick-plan-body">
                    <div className="quick-plan-details">
                        <h3>{plan.title}</h3>
                        <p>{plan.description}</p>
                        <ul aria-label={`${TIER_NAMES[tier]} features`}>
                            {plan.features.map((feature) => (
                                <li key={feature}>
                                    <CheckIcon size={17} aria-hidden="true" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="quick-plan-purchase">
                        <RollingPrice amount={price} yearly={false} />
                        <p className="quick-plan-trial">
                            <span className="quick-plan-trial-pill">
                                <ShieldCheckIcon size={15} aria-hidden="true" />
                                7 days free
                            </span>
                            No card needed to start
                        </p>
                        <a className="bs-button" href={`/join?tier=${tier}&billing=monthly`}>
                            Start free trial
                        </a>
                        <span className="quick-plan-setup">
                            Billed monthly in ZAR after the trial. Choose your provinces next.
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}
