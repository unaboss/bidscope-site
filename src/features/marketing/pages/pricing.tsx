import { PublicShell, ReferenceHero, ReferenceCta } from '../components/reference-layout'
import { PricingCards } from '../components/pricing-cards'
import { Accordion } from '@/shared/ui/accordion'

export function PricingPage() {
    return (
        <PublicShell>
            <ReferenceHero
                kind="map"
                title={
                    <>
                        Simple pricing for
                        <br />
                        growing teams.
                    </>
                }
                description="Flexible, transparent plans that help you find and organise tender opportunities across South Africa."
            />
            <div className="container">
                <PricingCards standalone />
                <section className="ref-billing-faq ref-section">
                    <div>
                        <h2>Billing FAQs</h2>
                        <p>Quick answers to common billing questions.</p>
                    </div>
                    <Accordion
                        items={[
                            {
                                id: 'plans',
                                title: 'Can I change my plan later?',
                                content: (
                                    <p>
                                        Review your plan and subscription options in your workspace’s Billing page.
                                        Contact support if you need help choosing coverage.
                                    </p>
                                ),
                            },
                            {
                                id: 'annual',
                                title: 'Do you offer annual billing?',
                                content: (
                                    <p>
                                        Yes. Annual prices charge ten months for twelve months of access. The pricing
                                        toggle displays the total annual amount.
                                    </p>
                                ),
                            },
                            {
                                id: 'extra',
                                title: 'Can I add more provinces?',
                                content: (
                                    <p>
                                        Additional provinces cost R100 per month. Starter supports up to three
                                        provinces, Growth up to eight, and Pro includes all nine.
                                    </p>
                                ),
                            },
                        ]}
                    />
                </section>
            </div>
            <ReferenceCta title="Ready to get started?" />
        </PublicShell>
    )
}
