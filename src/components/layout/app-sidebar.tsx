import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

interface AppSidebarProps
{
    /** Called when a nav link is activated — used to dismiss the mobile drawer. */
    readonly onNavigate?: () => void
}

/** Navy navigation rail shared by the desktop rail and the mobile drawer. */
export function AppSidebar({ onNavigate }: AppSidebarProps)
{
    return (
        <div className="flex h-full flex-col gap-8 bg-ink px-4 py-6 text-cream">
            <Link
                to="/"
                onClick={onNavigate}
                aria-label="North Tech Procurement"
                className="flex items-center gap-3 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
                <span className="flex flex-col leading-tight">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">North Tech</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cream/50">Procurement</span>
                </span>
            </Link>

            <nav aria-label="Primary" className="flex flex-col gap-1">
                <span className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-cream/40">
                    Workspace
                </span>
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) => cn(
                            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
                            isActive
                                ? 'bg-cream font-medium text-ink'
                                : 'text-cream/70 hover:bg-cream/10 hover:text-cream',
                        )}
                    >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
                <p className="px-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-cream/40">
                    Unified tender workspace
                    <br />
                    Phase 0
                </p>
            </div>
        </div>
    )
}
