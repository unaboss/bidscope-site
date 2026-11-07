import { useEffect, useRef, useState } from 'react'
import { ListIcon as Menu, XIcon as X } from '@phosphor-icons/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { WorkspaceNav } from '@/app/layouts/app-sidebar'
import { AccountMenu } from '@/app/layouts/account-menu'
import { WorkspaceSearch } from '@/app/layouts/workspace-search'
import { Brand } from '@/features/marketing/components/site-header'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { cn } from '@/shared/lib/utils'
import './workspace-nav.css'

/**
 * The signed-in frame: a rail that navigates, and a utility bar that holds what
 * is not navigation — global search, appearance and the account menu. Nothing
 * appears twice, so each surface has one job.
 *
 * The rail collapses into a drawer below 1088px; the utility bar keeps the
 * search and the account menu at every width.
 */
export function AppShell() {
    const [navOpen, setNavOpen] = useState(false)
    const toggle = useRef<HTMLButtonElement>(null)
    const drawer = useRef<HTMLElement>(null)
    const { pathname } = useLocation()
    const wide = pathname === '/discover' || pathname.startsWith('/tenders/')

    useEffect(() => {
        setNavOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!navOpen) return
        drawer.current?.querySelector<HTMLAnchorElement>('a')?.focus()
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        function keyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setNavOpen(false)
                toggle.current?.focus()
            }
            if (event.key === 'Tab') {
                const controls = drawer.current?.querySelectorAll<HTMLElement>('a, button, input')
                const first = controls?.[0],
                    last = controls?.[controls.length - 1]
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last?.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault()
                    first?.focus()
                }
            }
        }
        document.addEventListener('keydown', keyDown)
        return () => {
            document.body.style.overflow = previous
            document.removeEventListener('keydown', keyDown)
        }
    }, [navOpen])

    return (
        <div className="workspace-frame">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-panel focus:p-3"
            >
                Skip to content
            </a>

            <aside className="workspace-rail" aria-label="Workspace">
                <NavLink to="/" aria-label="Bidscope dashboard" className="workspace-brand" end>
                    <Brand />
                </NavLink>
                <WorkspaceNav />
            </aside>

            <div className="workspace-body">
                <header className="workspace-topbar">
                    <button
                        ref={toggle}
                        type="button"
                        onClick={() => setNavOpen(true)}
                        aria-label="Open navigation"
                        aria-expanded={navOpen}
                        aria-controls="workspace-drawer"
                        className="workspace-menu-button"
                    >
                        <Menu size={18} aria-hidden="true" />
                    </button>

                    <WorkspaceSearch />

                    <div className="workspace-actions">
                        <ThemeToggle />
                        <AccountMenu />
                    </div>
                </header>

                <main
                    id="main-content"
                    className={cn('workspace-main', wide && 'is-wide')}
                    tabIndex={-1}
                >
                    <Outlet />
                </main>
            </div>

            {navOpen && (
                <>
                    <button
                        className="workspace-overlay"
                        aria-label="Close navigation"
                        onClick={() => {
                            setNavOpen(false)
                            toggle.current?.focus()
                        }}
                    />
                    <aside
                        ref={drawer}
                        id="workspace-drawer"
                        className="workspace-drawer"
                        aria-label="Workspace navigation"
                    >
                        <div className="workspace-drawer-head">
                            <Brand />
                            <button
                                type="button"
                                aria-label="Close navigation"
                                onClick={() => {
                                    setNavOpen(false)
                                    toggle.current?.focus()
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <WorkspaceNav onNavigate={() => setNavOpen(false)} compact />
                    </aside>
                </>
            )}
        </div>
    )
}
