import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAccount } from '@/api'
import type { Account } from '@/types'

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
