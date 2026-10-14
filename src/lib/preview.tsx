import { createContext, useContext, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PricingTier } from '@/api'

export interface PreviewState
{
    readonly tier: PricingTier
    readonly setTier: (tier: PricingTier) => void
}

/** Set only inside the public preview of the app (`/preview`), which runs on sample data. */
export const PreviewContext = createContext<PreviewState | null>(null)

/** The preview's plan switch, or null in the real app. */
export function usePreview(): PreviewState | null
{
    return useContext(PreviewContext)
}

interface UpgradeLinkProps
{
    readonly className?: string
    readonly children: ReactNode
}

/** The way to Growth: the billing page, or in the preview, a switch of the preview to Growth. */
export function UpgradeLink({ className, children }: UpgradeLinkProps)
{
    const preview = usePreview()

    if (preview !== null) {
        return <button type="button" onClick={() => preview.setTier('mid')} className={className}>{children}</button>
    }

    return <Link to="/billing" className={className}>{children}</Link>
}
