import {
    ArrowRightIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    UsersThreeIcon,
    StackIcon,
    PlantIcon,
} from '@phosphor-icons/react'
import { PublicShell, ReferenceHero, ReferenceCta } from '../components/reference-layout'

export function AboutPage() {
    return (
        <PublicShell>
            <ReferenceHero
                kind="about"
                title={
                    <>
                        Making procurement
                        <br />
                        more accessible.
                    </>
                }
                description="Our purpose is to help South African businesses discover and assess opportunities in one clear, connected workspace."
            >
                <a className="bs-button" href="/start">
                    Get started <ArrowRightIcon size={21} />
                </a>
                <a className="bs-button outline" href="#our-approach">
                    Learn more about us
                </a>
            </ReferenceHero>
            <section id="our-approach" className="container ref-section">
                <div className="ref-section-heading">
                    <h2>Our purpose and the values behind it</h2>
                    <p>A clearer view of opportunity. A more informed decision about what comes next.</p>
                </div>
                <div className="ref-benefit-grid three">
                    {[
                        {
                            icon: MagnifyingGlassIcon,
                            title: 'Clarity',
                            text: 'Make it easier to find, understand and assess relevant opportunities across the public sector.',
                        },
                        {
                            icon: ShieldCheckIcon,
                            title: 'Trust',
                            text: 'Keep original notices and documents close, and distinguish source information from estimates.',
                        },
                        {
                            icon: ChartBarIcon,
                            title: 'Progress',
                            text: 'Help businesses spend less time searching and more time preparing for the right work.',
                        },
                    ].map(({ icon: Icon, title, text }) => (
                        <article key={title}>
                            <span className="ref-icon">
                                <Icon size={34} />
                            </span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>
            <section className="ref-tint ref-section">
                <div className="container">
                    <div className="ref-section-heading">
                        <h2>Built around South African opportunity</h2>
                        <p>Focused tools, practical coverage and room to grow with your business.</p>
                    </div>
                    <div className="ref-impact">
                        <div>
                            <strong>All 9 provinces</strong>
                            <span>Province-based plans, including nationwide coverage.</span>
                        </div>
                        <div>
                            <strong>3 clear plans</strong>
                            <span>Starter, Growth and Pro for different coverage needs.</span>
                        </div>
                        <div>
                            <strong>One workspace</strong>
                            <span>Discovery, source documents and your shortlist together.</span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="container ref-coverage ref-section">
                <div>
                    <h2>Why Bidscope exists</h2>
                    <p>
                        Tender notices are spread across a fragmented publishing landscape. Bidscope brings discovery
                        and organisation together so businesses can make informed decisions about the work they pursue.
                    </p>
                    <p>
                        Bidscope is a North Tech product. Official requirements and submissions remain with the
                        publishing buyer.
                    </p>
                </div>
                <img src="/images/south-africa-green.svg" alt="South Africa’s nine provinces" />
                <ul>
                    {[
                        { icon: UsersThreeIcon, text: 'Designed around the research businesses do before a bid' },
                        { icon: StackIcon, text: 'Source information and working tools in one place' },
                        { icon: PlantIcon, text: 'Focused on relevant opportunities and informed decisions' },
                    ].map(({ icon: Icon, text }) => (
                        <li key={text}>
                            <span className="ref-icon">
                                <Icon size={30} />
                            </span>
                            {text}
                        </li>
                    ))}
                </ul>
            </section>
            <ReferenceCta
                title={
                    <>
                        Be part of a more accessible
                        <br />
                        procurement ecosystem.
                    </>
                }
            />
        </PublicShell>
    )
}
