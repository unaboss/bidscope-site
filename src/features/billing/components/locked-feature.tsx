import type { ReactNode } from 'react'
import { useFeature } from '@/shared/runtime/plan'
import { UpgradeLink } from '@/shared/runtime/preview'

interface LockedFeatureProps
{
    readonly title: string
    readonly detail: string
    readonly className?: string
}

/** What a plan without the feature sees in its place: what it does, and where to get it. */
export function LockedFeature({ title, detail, className }: LockedFeatureProps)
{
    return (
        <div className={`flex flex-col items-start gap-3 rounded-xl border border-wax/35 bg-wax/[0.06] p-5 ${className ?? ''}`} role="note">
            <span className="text-xs font-medium text-ink/55">Included in Growth and Pro</span>
            <p className="font-sans text-lg font-semibold text-ink">{title}</p>
            <p className="max-w-xl text-sm leading-relaxed text-ink/65">{detail}</p>
            <UpgradeLink className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy/90">
                Upgrade to Growth
            </UpgradeLink>
        </div>
    )
}

interface FeatureGateProps extends LockedFeatureProps
{
    readonly feature: string
    readonly children: ReactNode
}

/** Renders `children` when the plan has `feature`, otherwise the upgrade panel. */
export function FeatureGate({ feature, children, ...locked }: FeatureGateProps)
{
    return useFeature(feature) ? <>{children}</> : <LockedFeature {...locked} />
}
