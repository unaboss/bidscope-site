import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { useFeature } from '@/lib/plan'
import { usePreview } from '@/lib/preview'

function PlanTag({ feature }: { readonly feature: string }) {
    return useFeature(feature) ? null : <span className="plan-tag">Growth</span>
}

export function AppSidebar({ onNavigate }: { readonly onNavigate?: () => void }) {
    const preview = usePreview()
    return (
        <div className="sidebar-inner">
            <nav className="workspace-links" aria-label="Primary">
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
                <p>
                    Your next opportunity
                    <br />
                    starts here.
                </p>
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
