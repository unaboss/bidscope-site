import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAccount } from '@/shared/api'
import type { Account } from '@/shared/types'

const PlanContext = createContext<Account | null>(null)

/** Loads the org's plan once for the signed-in app. */
export function PlanProvider({ children }: { readonly children: ReactNode })
{
    const [account, setAccount] = useState<Account | null>(null)

    useEffect(() =>
    {
        const controller = new AbortController()

        getAccount(controller.signal).then(setAccount).catch(() => undefined)

        return () => controller.abort()
    }, [])

    return <PlanContext.Provider value={account}>{children}</PlanContext.Provider>
}

/** Supplies a known plan without loading it, for the public preview of the app. */
export function FixedPlanProvider({ account, children }: { readonly account: Account, readonly children: ReactNode })
{
    return <PlanContext.Provider value={account}>{children}</PlanContext.Provider>
}

/**
 * True when the plan includes `key`. While the plan is still loading (or could
 * not load) this answers true: the server enforces every lock, so the UI never
 * hides something the account actually has.
 */
export function useFeature(key: string): boolean
{
    const account = useContext(PlanContext)

    return account === null || account.features.some((feature) => feature.key === key && feature.enabled)
}

/** The plan in force, titled for display ("Pro"), or null while it loads. */
export function usePlanName(): string | null
{
    const account = useContext(PlanContext)

    if (account === null)
    {
        return null
    }

    const name = account.effectivePlan

    return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Whole days left in the trial, or null when the plan is not a live trial. */
export function useTrialDays(): number | null
{
    const account = useContext(PlanContext)

    return account?.trialActive ? account.trialDaysLeft : null
}
