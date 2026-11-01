import { ArrowRight, Check } from 'lucide-react'
import { ContourLines } from './contour-lines'
import { SectionLabel } from './section-label'

export function HeroSection() {
    return (
        <section className="hero">
            <div className="hero-inner container">
                <div className="hero-copy">
                    <SectionLabel>South African tenders</SectionLabel>
                    <h1>
                        Find tenders
                        <br />
                        <span>worth your time.</span>
                    </h1>
                    <p className="hero-description">Relevant South African tenders, all in one place.</p>
                    <div className="hero-actions">
                        <a className="bs-button" href="/join">
                            Start free trial <ArrowRight size={18} />
                        </a>
                        <a className="bs-button outline neutral" href="#how-it-works">
                            See how it works
                        </a>
                    </div>
                    <div className="trial-promises">
                        {['7-day free trial', 'No credit card required', 'Cancel anytime'].map((text) => (
                            <span key={text}>
                                <span className="check-circle">
                                    <Check size={11} />
                                </span>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="hero-image">
                <img
                    src="/images/cape-town-office.webp"
                    alt="Modern South African architecture beneath the Cape Town mountains"
                />
            </div>
            <ContourLines />
        </section>
    )
}
