import {
    ArrowRightIcon,
    MagnifyingGlassIcon,
    BellIcon,
    FolderSimpleIcon,
    ChartBarIcon,
    LaptopIcon,
    CheckSquareIcon,
    BankIcon,
    StackIcon,
    MapPinIcon,
} from '@phosphor-icons/react'
import { PublicShell, ReferenceHero, ReferenceCta } from '../components/reference-layout'

export function LandingPage() {
    return (
        <PublicShell>
            <ReferenceHero
                title={
                    <>
                        Find the right
                        <br />
                        tenders, faster.
                    </>
                }
                description="Bidscope helps South African businesses discover, assess and organise tender opportunities in one simple workspace."
            >
                <a className="bs-button" href="/join">
                    Get started <ArrowRightIcon size={21} />
                </a>
                <a className="bs-button outline" href="/how-it-works">
                    See how it works
                </a>
            </ReferenceHero>
            <section className="container ref-section">
                <div className="ref-section-heading">
                    <h2>Everything you need to find better opportunities</h2>
                    <p>A focused platform for businesses researching the South African public sector.</p>
                </div>
                <div className="ref-benefit-grid">
                    {[
                        {
                            icon: MagnifyingGlassIcon,
                            title: 'Discover opportunities',
                            text: 'Find relevant tenders from national, provincial and municipal publishing sources.',
                        },
                        {
                            icon: BellIcon,
                            title: 'Stay informed',
                            text: 'Keep key dates visible with saved-tender alerts and the deadline calendar.',
                        },
                        {
                            icon: FolderSimpleIcon,
                            title: 'Organise your shortlist',
                            text: 'Keep opportunities and their documents together in your watchlist.',
                        },
                        {
                            icon: ChartBarIcon,
                            title: 'Make informed decisions',
                            text: 'Review the scope, buyer and requirements before deciding what to pursue.',
                        },
                    ].map(({ icon: Icon, title, text }) => (
                        <article key={title}>
                            <span className="ref-icon">
                                <Icon size={32} />
                            </span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="ref-tint">
                <div className="container ref-section">
                    <div className="ref-section-heading">
                        <h2>How Bidscope works</h2>
                        <p>Set up your profile and start finding opportunities that fit your business.</p>
                    </div>
                    <div className="ref-steps">
                        {[
                            {
                                icon: LaptopIcon,
                                title: 'Create your account',
                                text: 'Set up your business profile and tell us what you do.',
                            },
                            {
                                icon: BellIcon,
                                title: 'Get matched tenders',
                                text: 'Explore relevant notices and the details behind each opportunity.',
                            },
                            {
                                icon: CheckSquareIcon,
                                title: 'Keep track',
                                text: 'Save your shortlist and stay on top of important dates.',
                            },
                        ].map(({ icon: Icon, title, text }, index) => (
                            <article key={title}>
                                <div className="ref-step-icon">
                                    <span>{index + 1}</span>
                                    <Icon size={40} />
                                </div>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>
                                {index < 2 && <ArrowRightIcon className="ref-step-arrow" size={27} />}
                            </article>
                        ))}
                    </div>
                    <p className="ref-plan-note">
                        Watchlists and calendar tools come with Growth and Pro. Saving a tender does not submit a bid.
                    </p>
                </div>
            </section>
            <section className="container ref-coverage ref-section">
                <div>
                    <h2>
                        Tender coverage across
                        <br />
                        South Africa
                    </h2>
                    <p>
                        Explore national notices and selected direct sources from municipalities, state-owned entities
                        and other public-sector organisations.
                    </p>
                    <a className="coverage-link" href="/coverage">
                        Explore source coverage <ArrowRightIcon size={17} />
                    </a>
                </div>
                <img src="/images/south-africa-green.svg" alt="South Africa’s nine provinces" />
                <ul>
                    {[
                        { icon: BankIcon, text: 'National, provincial and municipal publishing sources' },
                        { icon: StackIcon, text: 'Selected state-owned entities and public organisations' },
                        { icon: MapPinIcon, text: 'Province-based plans across all nine provinces' },
                    ].map(({ icon: Icon, text }) => (
                        <li key={text}>
                            <span className="ref-icon">
                                <Icon size={29} />
                            </span>
                            {text}
                        </li>
                    ))}
                </ul>
            </section>
            <ReferenceCta />
        </PublicShell>
    )
}
