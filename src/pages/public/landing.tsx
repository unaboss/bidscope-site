import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { HeroSection } from '@/components/marketing/hero'
import { HowItWorksSection } from '@/components/marketing/how-it-works'
import { CoverageSection } from '@/components/marketing/coverage'
import { FeaturesSection } from '@/components/marketing/features'
import { PricingCards } from '@/components/marketing/pricing-cards'
import { CallToAction } from '@/components/marketing/call-to-action'

export function LandingPage() {
    return (
        <div className="marketing-page">
            <SiteHeader />
            <main>
                <HeroSection />
                <HowItWorksSection />
                <CoverageSection />
                <FeaturesSection />
                <div className="container">
                    <PricingCards />
                </div>
                <CallToAction />
            </main>
            <SiteFooter />
        </div>
    )
}
