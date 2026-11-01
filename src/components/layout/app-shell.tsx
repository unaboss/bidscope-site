import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Brand, SiteHeader } from '@/components/layout/site-header'

export function AppShell() {
    const [navOpen, setNavOpen] = useState(false)
    const toggle = useRef<HTMLButtonElement>(null)
    const drawer = useRef<HTMLElement>(null)
    const { pathname } = useLocation()
    const fullWidth = pathname === '/discover' || pathname.startsWith('/tenders/')
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
                const controls = drawer.current?.querySelectorAll<HTMLElement>('a, button')
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
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
            >
                Skip to content
            </a>
            <SiteHeader workspace />
            <div className="workspace-mobile-bar">
                <button
                    ref={toggle}
                    onClick={() => setNavOpen(true)}
                    aria-label="Open navigation"
                    aria-expanded={navOpen}
                    aria-controls="workspace-drawer"
                >
                    <Menu size={17} /> Workspace
                </button>
                <span>Bidscope</span>
            </div>
            {fullWidth ? (
                <main id="main-content" className="workspace-full">
                    <Outlet />
                </main>
            ) : (
                <div className="workspace-grid">
                    <aside className="workspace-sidebar">
                        <AppSidebar />
                    </aside>
                    <main id="main-content" className="workspace-main">
                        <Outlet />
                    </main>
                </div>
            )}
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
                        <div className="flex items-center justify-between">
                            <Brand />
                            <button
                                aria-label="Close navigation"
                                onClick={() => {
                                    setNavOpen(false)
                                    toggle.current?.focus()
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <AppSidebar onNavigate={() => setNavOpen(false)} />
                    </aside>
                </>
            )}
        </div>
    )
}
