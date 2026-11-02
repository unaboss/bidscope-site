import type { ReactNode } from 'react'
import { ArrowRightIcon, FileTextIcon, UserCircleIcon, HeadsetIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'

export function PublicShell({ children }: { readonly children: ReactNode }) {
    const entrance = useSubtleReveal<HTMLElement>('mount', {
        duration: 0.48,
        y: 12,
        stagger: 0.06,
        selector: '.ref-hero-copy > *, .ref-visual, .ref-faq-hero h1, .ref-faq-hero .ref-faq-search',
    })
    return (
        <div className="marketing-page reference-site">
            <a className="market-skip" href="#main-content">
                Skip to content
            </a>
            <SiteHeader />
            <main id="main-content" ref={entrance}>
                {children}
            </main>
            <SiteFooter />
        </div>
    )
}

export function WaveDivider() {
    return (
        <svg className="ref-waves" viewBox="0 0 1440 150" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-20 54C180-15 243 140 473 85S727 13 914 64s305 88 553-96" stroke="#a9c8ad" strokeWidth="1" />
            <path
                d="M-30 140C157 11 262 130 454 65S653 157 890 117 1217 135 1470 19"
                stroke="#cba44b"
                strokeWidth="1"
            />
            <path d="M-15 78C200 39 319 179 514 81s163 5 381 41 303-43 575-85" stroke="#d4e1d5" strokeWidth=".8" />
        </svg>
    )
}

export function ReferenceVisual({ kind = 'tenders' }: { readonly kind?: 'tenders' | 'about' | 'support' | 'map' }) {
    return (
        <div className={'ref-visual ref-visual-' + kind} aria-hidden="true">
            <div className="ref-sun" />
            <img className="ref-country" src="/images/south-africa-green.svg" alt="" />
            {kind === 'map' ? null : (
                <div className="ref-preview">
                    <div className="ref-preview-bar">
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className="ref-preview-body">
                        <h2>{kind === 'support' ? 'Here to help' : 'Tender opportunities'}</h2>
                        {(kind === 'support'
                            ? ['Product questions', 'Account support']
                            : ['Infrastructure upgrade', 'ICT services', 'Facilities management']
                        ).map((label) => (
                            <div className="ref-preview-row" key={label}>
                                {kind === 'support' ? <UserCircleIcon size={26} /> : <FileTextIcon size={25} />}
                                <div>
                                    <strong>{label}</strong>
                                    <span />
                                    <span />
                                </div>
                                {kind !== 'support' && <small>Open</small>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {kind === 'tenders' && (
                <div className="ref-floating-stat">
                    <div>
                        <span>
                            Find your next
                            <br />
                            opportunity
                        </span>
                        <strong>
                            All 9 <small>provinces</small>
                        </strong>
                    </div>
                    <div className="ref-bars">
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>
                </div>
            )}
            {kind === 'support' && (
                <div className="ref-floating-stat">
                    <HeadsetIcon size={30} />
                    <div>
                        <strong>Email support</strong>
                        <span>Product and account help</span>
                    </div>
                    <EnvelopeSimpleIcon size={22} />
                </div>
            )}
            {kind === 'about' && <img className="ref-team" src="/images/team-illustration.webp" alt="" />}
            {kind !== 'map' && <span className="ref-illustration-label">Illustrative example</span>}
        </div>
    )
}

export function ReferenceHero({
    title,
    description,
    kind = 'tenders',
    children,
}: {
    readonly title: ReactNode
    readonly description: string
    readonly kind?: 'tenders' | 'about' | 'support' | 'map'
    readonly children?: ReactNode
}) {
    return (
        <section className="ref-hero">
            <div className="container ref-hero-inner">
                <div className="ref-hero-copy">
                    <h1>{title}</h1>
                    <p>{description}</p>
                    {children && <div className="ref-hero-actions">{children}</div>}
                </div>
                <ReferenceVisual kind={kind} />
            </div>
            <WaveDivider />
        </section>
    )
}

export function ReferenceCta({
    title = (
        <>
            Ready to find your
            <br />
            next opportunity?
        </>
    ),
}: {
    readonly title?: ReactNode
}) {
    return (
        <section className="ref-cta">
            <div>
                <h2>{title}</h2>
                <p>Join South African businesses using Bidscope to discover opportunities and stay organised.</p>
            </div>
            <a className="bs-button gold" href="/join">
                Get started <ArrowRightIcon size={21} />
            </a>
            <WaveDivider />
        </section>
    )
}
