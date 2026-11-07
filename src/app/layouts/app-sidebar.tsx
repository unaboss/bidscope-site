import { SignOutIcon as LogOut, TrayIcon } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/app/layouts/nav-items'
import { useFeature, usePlanName, useTrialDays } from '@/shared/runtime/plan'
import { usePreview } from '@/shared/runtime/preview'
import { cn } from '@/shared/lib/utils'

function PlanTag({ feature }: { readonly feature: string }) {
    return useFeature(feature) ? null : <span className="plan-tag">Growth</span>
}

/**
 * Navigation, and the account facts that belong beside it.
 *
 * The same list feeds the desktop rail and the mobile drawer, so there is one
 * definition of where things are. The plan card at the foot is the rail's one
 * promotional element; everything above it is navigation.
 */
export function WorkspaceNav({ onNavigate, compact = false }: {
    readonly onNavigate?: () => void
    readonly compact?: boolean
}) {
    const preview = usePreview()
    const plan = usePlanName()
    const trialDays = useTrialDays()

    return (
        <div className={cn('sidebar-inner', compact && 'is-compact')}>
            <nav className="workspace-links" aria-label="Workspace">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                        <item.icon width={17} height={17} aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.feature && <PlanTag feature={item.feature} />}
                    </NavLink>
                ))}
            </nav>

            {plan !== null && (
                <NavLink to="/billing" className="rail-plan" onClick={onNavigate}>
                    <div className="rail-plan-head">
                        <TrayIcon size={16} aria-hidden="true" />
                        <span>{plan} plan</span>
                    </div>
                    <p>
                        {trialDays !== null && trialDays > 0
                            ? `${trialDays} ${trialDays === 1 ? 'day' : 'days'} of full access left.`
                            : 'Full coverage, daily updates and the deadline tools.'}
                    </p>
                    <span className="rail-plan-link">
                        {trialDays !== null && trialDays > 0 ? 'Keep this plan' : 'Manage plan'}
                    </span>
                </NavLink>
            )}

            {preview === null && (
                <form method="post" action="/logout" className="rail-signout">
                    <button type="submit">
                        <LogOut size={15} aria-hidden="true" />
                        Sign out
                    </button>
                </form>
            )}
        </div>
    )
}
