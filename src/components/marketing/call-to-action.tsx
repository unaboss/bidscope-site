import { ArrowRight } from 'lucide-react'
import { ContourLines } from './contour-lines'

export function CallToAction() {
    return (
        <section className="cta-banner">
            <div>
                <h2>
                    Ready to find
                    <br />
                    better opportunities.
                </h2>
                <p>Join businesses across South Africa and save time on tenders.</p>
                <a className="bs-button gold" href="/join">
                    Start free trial <ArrowRight size={17} />
                </a>
            </div>
            <ContourLines />
        </section>
    )
}
