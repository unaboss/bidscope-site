import { Check } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { PricingCards } from '@/components/marketing/pricing-cards'
import { ContourLines } from '@/components/marketing/contour-lines'

export function PricingPage() {
    return (
        <div className="marketing-page">
            <SiteHeader />
            <main className="container pricing-page">
                <ContourLines />
                <h1>Pricing</h1>
                <p className="page-description">Choose the plan that fits your team.</p>
                <PricingCards standalone />
                <div className="pricing-footnote">
                    <Check size={15} /> 7-day free trial <span>·</span> No credit card required <span>·</span> Cancel
                    anytime
                </div>
            </main>
            <SiteFooter />
        </div>
    )
}
