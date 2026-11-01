import { ArrowRightIcon, EnvelopeSimpleIcon, HeadsetIcon, MapPinIcon, HandshakeIcon } from '@phosphor-icons/react'
import { PublicShell, ReferenceHero, ReferenceCta } from '../components/reference-layout'
import { ContactInquiry } from '../components/contact-inquiry'

export function ContactPage() {
    return (
        <PublicShell>
            <ReferenceHero
                kind="support"
                title="Let’s talk."
                description="Have a question, need support, or want to learn more about Bidscope? We’re here to help."
            >
                <a className="bs-button" href="/join">
                    Get started <ArrowRightIcon size={21} />
                </a>
                <a className="bs-button outline" href="/faq">
                    View FAQs
                </a>
            </ReferenceHero>
            <section className="container ref-contact-grid ref-section">
                <ContactInquiry />
                <div className="ref-connect">
                    <h2>Other ways to connect</h2>
                    <p>Choose the best way to reach the Bidscope team.</p>
                    {[
                        {
                            icon: EnvelopeSimpleIcon,
                            title: 'General enquiries',
                            text: 'Questions about the platform, features or your account.',
                            link: 'mailto:support@northtech.africa',
                            label: 'support@northtech.africa',
                        },
                        {
                            icon: HandshakeIcon,
                            title: 'Plans and coverage',
                            text: 'Compare the tools and province coverage that fit your business.',
                            link: '/pricing',
                            label: 'Explore pricing',
                        },
                        {
                            icon: HeadsetIcon,
                            title: 'Account support',
                            text: 'Tell us the page you were using and what you expected to happen.',
                            link: 'mailto:support@northtech.africa?subject=Bidscope%20account%20support',
                            label: 'Email support',
                        },
                        {
                            icon: MapPinIcon,
                            title: 'Built for South Africa',
                            text: 'Province-based tender research for businesses across South Africa.',
                            link: '/coverage',
                            label: 'See source coverage',
                        },
                    ].map(({ icon: Icon, title, text, link, label }) => (
                        <article key={title}>
                            <span className="ref-icon">
                                <Icon size={33} />
                            </span>
                            <div>
                                <h3>{title}</h3>
                                <p>{text}</p>
                                <a href={link}>{label}</a>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <ReferenceCta />
        </PublicShell>
    )
}
