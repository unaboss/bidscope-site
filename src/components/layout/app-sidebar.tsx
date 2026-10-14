import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { IconLogout } from '@/components/ui/icons'
import { useFeature } from '@/lib/plan'
import { usePreview } from '@/lib/preview'
import { cn } from '@/lib/utils'

interface AppSidebarProps
{
    /** Called when a nav link is activated — used to dismiss the mobile drawer. */
    readonly onNavigate?: () => void
}

const RAIL_FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-night'

/** A small "Growth" marker on a rail link the current plan does not include. */
function PlanTag({ feature }: { readonly feature: string })
{
    return useFeature(feature)
        ? null
        : <span className="ms-auto rounded-full border border-wax/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-wax">Growth</span>
}

/** Deep green navigation rail, shared by the desktop rail and the mobile drawer. */
export function AppSidebar({ onNavigate }: AppSidebarProps)
{
    const preview = usePreview()

    return (
        <div className="flex h-full flex-col gap-8 border-e border-navy/15 bg-night px-4 py-6 text-ink">
            <Link
                to="/"
                onClick={onNavigate}
                aria-label="Bidscope"
                className={cn('flex items-center gap-3 rounded-md px-2 py-1', RAIL_FOCUS)}
            >
                <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-navy/45 font-serif text-base font-semibold text-navy"
                >
                    B
                </span>
                <span className="flex flex-col leading-tight">
                    <span className="bg-gradient-to-b from-[#F0D9A4] via-[#C9A464] to-[#8A6A3F] bg-clip-text font-serif text-lg font-semibold tracking-tight text-transparent">
                        Bidscope
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-navy/70">by North Tech</span>
                </span>
            </Link>

            <nav aria-label="Primary" className="flex flex-col gap-1">
                <span className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-navy/60">
                    Workspace
                </span>
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) => cn(
                            'flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                            RAIL_FOCUS,
                            isActive
                                ? 'border-navy/40 bg-navy/10 font-medium text-[#F0D9A4]'
                                : 'border-transparent text-ink/60 hover:bg-navy/[0.06] hover:text-ink',
                        )}
                    >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                        {item.feature !== undefined && <PlanTag feature={item.feature} />}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
                <p className="px-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-ink/35">
                    Unified tender workspace
                    <br />
                    Phase 0
                </p>
                {/* The preview has no session to end; its own bar leads back out. */}
                {preview === null && (
                    <form method="post" action="/logout">
                        <button
                            type="submit"
                            className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-navy/[0.06] hover:text-ink', RAIL_FOCUS)}
                        >
                            <IconLogout className="size-4 shrink-0" />
                            <span>Sign out</span>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
