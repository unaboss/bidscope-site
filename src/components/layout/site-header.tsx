import { useState } from 'react'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import { usePreview } from '@/lib/preview'

export function Brand() {
    return (
        <span className="brand">
            <span className="brand-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
            </span>
            <span>Bidscope</span>
        </span>
    )
}

/** Full-document links keep the public, workspace and preview routers separate. */
export function SiteHeader({ workspace = false }: { readonly workspace?: boolean }) {
    const [open, setOpen] = useState(false)
    const preview = usePreview()
    const appHome = preview ? '/preview?plan=' + preview.tier : '/app'
    const tenders = preview ? '/preview/discover?plan=' + preview.tier : '/app/discover'
    return (
        <header className="site-header">
            <div className="site-header-inner">
                <a href="/" aria-label="Bidscope home">
                    <Brand />
                </a>
                <nav className={open ? 'site-nav is-open' : 'site-nav'} aria-label="Website">
                    <a href="/#how-it-works" onClick={() => setOpen(false)}>
                        Product <ChevronDown size={12} />
                    </a>
                    <a href="/pricing">Pricing</a>
                    <a href="/#coverage" onClick={() => setOpen(false)}>
                        About
                    </a>
                    <a href="mailto:support@northtech.africa">Contact</a>
                </nav>
                <div className="site-header-actions">
                    <a className="login-link" href={workspace ? appHome : '/login'}>
                        {workspace ? 'Dashboard' : 'Log in'}
                    </a>
                    <a className="bs-button small" href={workspace ? tenders : '/join'}>
                        {workspace ? 'Browse tenders' : 'Start free trial'} <ArrowRight size={15} />
                    </a>
                    <button
                        className="mobile-menu"
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
