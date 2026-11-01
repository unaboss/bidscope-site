import type { ReactNode } from 'react'
import { SiteHeader } from '@/features/marketing/components/site-header'
import { SiteFooter } from '@/features/marketing/components/site-footer'

export function PublicPage({
    title,
    description,
    children,
}: {
    readonly title: string
    readonly description: string
    readonly children: ReactNode
}) {
    return (
        <div className="marketing-page">
            <a className="market-skip" href="#main-content">Skip to content</a>
            <SiteHeader />
            <main className="public-page" id="main-content">
                <header className="public-page-heading container">
                    <h1>{title}</h1>
                    <p>{description}</p>
                </header>
                {children}
            </main>
            <SiteFooter />
        </div>
    )
}
