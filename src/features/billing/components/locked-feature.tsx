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
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Growth and Pro</span>
            <p className="font-serif text-lg font-semibold text-ink">{title}</p>
            <p className="max-w-xl text-sm leading-relaxed text-ink/65">{detail}</p>
            <UpgradeLink
                className="inline-flex h-9 items-center rounded-md bg-gradient-to-b from-[#D9B97E] to-[#B08D57] px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#06140F] hover:from-[#F0D9A4]"
            >
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
