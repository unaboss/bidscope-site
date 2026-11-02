import { useLocation } from 'react-router-dom'
import { useState, useRef } from 'react'
import { ArrowRightIcon as ArrowRight, ListIcon as Menu, XIcon as X } from '@phosphor-icons/react'
import { usePreview } from '@/shared/runtime/preview'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

export function Brand() {
    return (
        <span className="brand">
            <svg className="ref-logo-mark" width="46" height="32" viewBox="0 0 46 32" fill="none" aria-hidden="true">
                <path d="M0 30 25 4l6 7L12 30Z" fill="#c5a144" />
                <path d="m14 30 19-20 5 6-13 14Z" fill="#337650" />
                <path d="m28 30 12-12 6 12Z" fill="#145333" />
                <path d="m20 8 5-5 4 5-5 5Z" fill="#e1c16a" />
            </svg>
            <span>Bidscope</span>
        </span>
    )
}

/** Full-document links keep the public, workspace and preview routers separate. */
export function SiteHeader({ workspace = false }: { readonly workspace?: boolean }) {
    const [open, setOpen] = useState(false)
    const menu = useSubtleReveal<HTMLElement>(open, {
        duration: 0.24,
        y: -10,
        stagger: 0.035,
        selector: 'a',
        enabled: open,
    })
    const { pathname } = useLocation()
    const menuToggle = useRef<HTMLButtonElement>(null)
    const preview = usePreview()
    const appHome = preview ? '/preview?plan=' + preview.tier : '/app'
    const tenders = preview ? '/preview/discover?plan=' + preview.tier : '/app/discover'
    return (
        <header
            className="site-header"
            onKeyDown={(event) => {
                if (event.key === 'Escape' && open) {
                    setOpen(false)
                    menuToggle.current?.focus()
                }
            }}
        >
            <div className="site-header-inner">
                <a href="/" aria-label="Bidscope home">
                    <Brand />
                </a>
                <nav
                    ref={menu}
                    className={open ? 'site-nav is-open' : 'site-nav'}
                    aria-label="Website"
                    id="site-navigation"
                >
                    {[
                        ['/pricing', 'Pricing'],
                        ['/about', 'About'],
                        ['/faq', 'FAQ'],
                        ['/contact', 'Contact'],
                    ].map(([path, label]) => (
                        <a key={path} href={path} aria-current={pathname === path ? 'page' : undefined}>
                            {label}
                        </a>
                    ))}
                    <a className="mobile-login" href={workspace ? appHome : '/login'}>
                        {workspace ? 'Dashboard' : 'Log in'}
                    </a>
                </nav>
                <div className="site-header-actions">
                    <ThemeToggle />
                    <a className="login-link" href={workspace ? appHome : '/login'}>
                        {workspace ? 'Dashboard' : 'Log in'}
                    </a>
                    <a className="bs-button small" href={workspace ? tenders : '/join'}>
                        {workspace ? 'Browse tenders' : 'Get started'} {workspace && <ArrowRight size={15} />}
                    </a>
                    <button
                        className="mobile-menu"
                        ref={menuToggle}
                        aria-controls="site-navigation"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <X size={21} /> : <Menu size={21} />}
                    </button>
                </div>
            </div>
        </header>
    )
}
