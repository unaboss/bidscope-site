import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { cn } from '@/lib/utils'

/**
 * Application frame: a persistent navy rail on desktop, a dismissible drawer on
 * mobile, and a sticky header above routed content.
 */
export function AppShell()
{
    const [navOpen, setNavOpen] = useState(false)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const drawerRef = useRef<HTMLElement>(null)
    const { pathname } = useLocation()

    // Close the drawer whenever the route changes.
    useEffect(() =>
    {
        setNavOpen(false)
    }, [pathname])

    // While open: trap Escape, move focus into the drawer, lock body scroll.
    useEffect(() =>
    {
        if (!navOpen) {
            return
        }

        function handleKeyDown(event: KeyboardEvent): void
        {
            if (event.key === 'Escape') {
                setNavOpen(false)
                toggleRef.current?.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        drawerRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus()

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () =>
        {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [navOpen])

    function dismissNav(): void
    {
        setNavOpen(false)
        toggleRef.current?.focus()
    }

    return (
        <div className="min-h-dvh bg-cream text-ink">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-[10px] focus:uppercase focus:tracking-[0.14em] focus:text-cream"
            >
                Skip to content
            </a>

            <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_1fr]">
                <aside className="sticky top-0 hidden h-dvh lg:block">
                    <AppSidebar />
                </aside>

                <div className="flex min-h-dvh min-w-0 flex-col">
                    <AppHeader navOpen={navOpen} onOpenNav={() => setNavOpen(true)} toggleRef={toggleRef} />
                    <main id="main-content" className="flex-1 px-4 py-8 lg:px-10 lg:py-12">
                        <Outlet />
                    </main>
                </div>
            </div>

            {navOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={dismissNav}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                id="app-sidebar"
                ref={drawerRef}
                aria-label="Primary navigation"
                className={cn(
                    'fixed inset-y-0 start-0 z-50 w-64 max-w-[85vw] shadow-panel lg:hidden',
                    navOpen ? 'block' : 'hidden',
                )}
            >
                <AppSidebar onNavigate={() => setNavOpen(false)} />
            </aside>
        </div>
    )
}
