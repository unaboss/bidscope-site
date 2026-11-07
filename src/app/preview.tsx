import { XIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import type { PricingTier } from '@/shared/api'
import { FixedPlanProvider } from '@/shared/runtime/plan'
import { PreviewContext } from '@/shared/runtime/preview'
import { cn } from '@/shared/lib/utils'
import { AppPages } from '@/app/router'
import { BUTTON_GOLD, FOCUS } from '@/features/marketing/components/brand'
import { TierToggle } from '@/features/billing/components/plan-panel'
import { demoAccount, setDemoTier } from '@/features/preview/demo-api'

export { installDemoApi } from '@/features/preview/demo-api'

function isTier(value: string | null): value is PricingTier
{
    return value === 'single' || value === 'mid' || value === 'all'
}

/** The plan in the link (`/preview?plan=single`), or Growth. */
function tierFromUrl(): PricingTier
{
    const plan = new URLSearchParams(window.location.search).get('plan')

    return isTier(plan) ? plan : 'mid'
}

interface PreviewBarProps
{
    readonly tier: PricingTier
    readonly onTierChange: (tier: PricingTier) => void
}

/**
 * Which plan is showing, the way to subscribe to it, and the way out. A pill
 * floating at the foot of the screen; on a desktop, a card at the foot of the
 * navigation rail, so it never covers the page.
 */
function PreviewBar({ tier, onTierChange }: PreviewBarProps)
{
    const location = useLocation()
    const navigate = useNavigate()

    // Keep the chosen plan when navigating, refreshing or sharing a preview page.
    useEffect(() =>
    {
        const query = new URLSearchParams(location.search)

        if (query.get('plan') !== tier) {
            query.set('plan', tier)
            void navigate({ ...location, search: `?${query}` }, { replace: true })
        }
    }, [tier, location, navigate])

    return (
        <div
            role="region"
            aria-label="App preview"
            // There is no navigation rail to dock to any more, so the bar stays a
            // floating pill at the foot of the page at every width.
            className="fixed inset-x-0 bottom-3 z-[35] flex justify-center px-3 sm:bottom-5"
        >
            <div className="flex items-center gap-1 rounded-full border border-[#B08D57]/35 bg-panel p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] sm:gap-2">
                <span className="hidden ps-3 text-xs font-medium text-ink/60 sm:inline">Preview</span>
                <div className="w-[10.5rem] sm:w-56">
                    <TierToggle tier={tier} onChange={onTierChange} pill />
                </div>
                <a
                    href={`/subscribe?tier=${tier}`}
                    className={cn(BUTTON_GOLD, 'h-8 rounded-full px-3 text-[10px] tracking-[0.14em] sm:px-4 sm:h-9')}
                >
                    Subscribe
                </a>
                <a
                    href="/"
                    aria-label="Close the preview"
                    className={cn('grid size-8 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:text-navy', FOCUS)}
                >
                    <XIcon className="size-4" />
                </a>
            </div>
        </div>
    )
}

/**
 * The public preview of the app (`/preview`): the real pages, on North Tech's
 * own profile and the tenders matched to it, with a switch between Starter,
 * Growth and Pro.
 * Nothing can be saved; the company profile is view only.
 */
export function PreviewApp()
{
    const [tier, setTierState] = useState<PricingTier>(() =>
    {
        const initial = tierFromUrl()
        setDemoTier(initial)

        return initial
    })

    const setTier = useCallback((next: PricingTier) =>
    {
        setDemoTier(next)
        setTierState(next)
    }, [])

    const preview = useMemo(() => ({ tier, setTier }), [tier, setTier])

    return (
        <BrowserRouter basename="/preview">
            <PreviewContext.Provider value={preview}>
                {/* A new plan remounts the pages, so each one loads again on that plan's data. */}
                <FixedPlanProvider key={tier} account={demoAccount(tier)}>
                    {/* The bar floats over the page: leave room under it. */}
                    <div className="[&_#main-content]:pb-32">
                        <AppPages />
                    </div>
                </FixedPlanProvider>
                <PreviewBar tier={tier} onTierChange={setTier} />
            </PreviewContext.Provider>
        </BrowserRouter>
    )
}
