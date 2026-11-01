import type { ReactNode } from 'react'
import { ArrowLeftIcon, BellIcon, FolderSimpleIcon, ChartBarIcon } from '@phosphor-icons/react'
import { Brand } from '../../marketing/components/site-header'

export function AuthLayout({ children }: { readonly children: ReactNode }) {
    return (
        <div className="auth-page ref-auth">
            <div className="auth-card">
                <a className="auth-brand" href="/" aria-label="Bidscope home">
                    <Brand />
                </a>
                <a className="ref-auth-back" href="/">
                    <ArrowLeftIcon size={19} />
                    Back to home
                </a>
                <div className="auth-content">{children}</div>
                <aside className="auth-art" aria-label="Built for South African opportunity">
                    <div className="ref-auth-copy">
                        <h2>
                            One account.
                            <br />A world of tender
                            <br />
                            opportunities.
                        </h2>
                        <p>Explore public-sector opportunities and keep your next move in focus.</p>
                    </div>
                    <div className="ref-auth-map">
                        <img src="/images/south-africa-green.svg" alt="" />
                    </div>
                    <div className="ref-auth-benefits">
                        {[
                            {
                                icon: BellIcon,
                                title: 'Stay informed',
                                text: 'Keep an eye on relevant opportunities and key dates.',
                            },
                            {
                                icon: FolderSimpleIcon,
                                title: 'Organise your shortlist',
                                text: 'Keep the tenders you want to pursue together.',
                            },
                            {
                                icon: ChartBarIcon,
                                title: 'Make your next move',
                                text: 'Review the details and choose what to bid.',
                            },
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title}>
                                <span>
                                    <Icon size={31} />
                                </span>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <svg className="ref-auth-waves" viewBox="0 0 600 500" fill="none" aria-hidden="true">
                        <path d="M-20 302C200 190 280 390 640 150M-20 360C270 250 300 480 640 250" stroke="#d1b466" />
                        <path d="M-20 400C200 260 310 430 640 350" stroke="#78a78b" />
                    </svg>
                </aside>
            </div>
        </div>
    )
}
