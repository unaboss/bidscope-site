import { useCallback, useMemo, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { PricingTier } from '@/api'
import { FixedPlanProvider } from '@/lib/plan'
import { PreviewContext } from '@/lib/preview'
import { cn } from '@/lib/utils'
import { AppPages } from '@/router'
import { BUTTON_GOLD, FOCUS } from '../public/brand'
import { TierToggle } from '../public/plan-panel'
import { demoAccount, setDemoTier } from './demo-api'

export { installDemoApi } from './demo-api'

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
    return (
        <div
            role="region"
            aria-label="App preview"
            className="fixed inset-x-0 bottom-3 z-[35] flex justify-center px-3 sm:bottom-5 lg:inset-x-auto lg:bottom-0 lg:start-0 lg:block lg:w-64 lg:p-4"
        >
            <div className="flex items-center gap-1 rounded-full border border-[#B08D57]/35 bg-[#06140F] p-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] sm:gap-2 lg:grid lg:grid-cols-[1fr_auto] lg:gap-2.5 lg:rounded-xl lg:p-3">
                <span className="hidden ps-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#D9B97E]/75 sm:inline lg:order-1 lg:ps-1">Preview</span>
                <div className="w-[10.5rem] sm:w-56 lg:order-3 lg:col-span-2 lg:w-auto">
                    <TierToggle tier={tier} onChange={onTierChange} pill />
                </div>
                <a
                    href={`/subscribe?tier=${tier}`}
                    className={cn(BUTTON_GOLD, 'h-8 rounded-full px-3 text-[10px] tracking-[0.14em] sm:px-4 lg:order-4 lg:col-span-2 lg:h-9')}
                >
                    Subscribe
                </a>
                <a
                    href="/pricing"
                    aria-label="Close the preview"
                    className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[#E9DFC6]/60 transition-colors hover:text-[#D9B97E] lg:order-2', FOCUS)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
                        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
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
        window.history.replaceState(null, '', `/preview?plan=${next}`)
    }, [])

    const preview = useMemo(() => ({ tier, setTier }), [tier, setTier])

    return (
        <MemoryRouter>
            <PreviewContext.Provider value={preview}>
                {/* A new plan remounts the pages, so each one loads again on that plan's data. */}
                <FixedPlanProvider key={tier} account={demoAccount(tier)}>
                    {/* Below desktop the bar floats over the page: leave room under it. */}
                    <div className="[&_#main-content]:pb-28 lg:[&_#main-content]:pb-12">
                        <AppPages />
                    </div>
                </FixedPlanProvider>
                <PreviewBar tier={tier} onTierChange={setTier} />
            </PreviewContext.Provider>
        </MemoryRouter>
    )
}
