import { NavLink } from 'react-router-dom'
import { SignOutIcon as LogOut } from '@phosphor-icons/react'
import { NAV_ITEMS } from '@/app/layouts/nav-items'
import { useFeature } from '@/shared/runtime/plan'
import { usePreview } from '@/shared/runtime/preview'
import './workspace-nav.css'

function PlanTag({ feature }: { readonly feature: string }) {
    return useFeature(feature) ? null : <span className="plan-tag">Growth</span>
}

export function AppSidebar({ onNavigate }: { readonly onNavigate?: () => void }) {
    const preview = usePreview()
    return (
        <div className="sidebar-inner">
            <p className="workspace-nav-label">Workspace</p>
            <nav className="workspace-links" aria-label="Workspace">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                        <item.icon width={16} height={16} />
                        <span>{item.label}</span>
                        {item.feature && <PlanTag feature={item.feature} />}
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-bottom">
                {preview === null && (
                    <form method="post" action="/logout">
                        <button type="submit">
                            <LogOut size={15} />
                            Sign out
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
