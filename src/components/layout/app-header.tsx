import type { RefObject } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { findNavItem } from '@/components/layout/nav-items'
import { IconMenu } from '@/components/ui/icons'

interface AppHeaderProps
{
    readonly navOpen: boolean
    readonly onOpenNav: () => void
    readonly toggleRef: RefObject<HTMLButtonElement | null>
}

const FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream'

/** Sticky top bar: drawer toggle on mobile, current section on desktop. */
export function AppHeader({ navOpen, onOpenNav, toggleRef }: AppHeaderProps)
{
    const { pathname } = useLocation()
    const current = findNavItem(pathname)

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-cream/85 px-4 backdrop-blur lg:px-8">
            <button
                ref={toggleRef}
                type="button"
                onClick={onOpenNav}
                aria-label="Open navigation"
                aria-expanded={navOpen}
                aria-controls="app-sidebar"
                className={`grid size-9 place-items-center rounded-md border border-line text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink lg:hidden ${FOCUS_RING}`}
            >
                <IconMenu className="size-4" />
            </button>

            <Link
                to="/"
                aria-label="Bidscope"
                className="flex items-center gap-2 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream lg:hidden"
            >
                <span className="bg-gradient-to-b from-[#F0D9A4] via-[#C9A464] to-[#8A6A3F] bg-clip-text font-serif text-base font-semibold tracking-tight text-transparent">Bidscope</span>
            </Link>

            <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 lg:block">
                {current?.label ?? 'Procurement'}
            </p>

            <div className="ms-auto flex items-center gap-3">
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 sm:inline">
                    Unified tender workspace
                </span>
            </div>
        </header>
    )
}
