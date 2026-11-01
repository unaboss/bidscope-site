import { Bookmark, CalendarDays, Crosshair, FileText } from 'lucide-react'

export function FeaturesSection() {
    return (
        <section aria-label="Features" id="features" className="features-section container">
            <div className="features-grid">
                {[
                    { icon: Crosshair, title: 'Smart matching', copy: 'See tenders that fit your services.' },
                    { icon: CalendarDays, title: 'Deadline tracking', copy: 'Get alerts for key dates.' },
                    {
                        icon: FileText,
                        title: 'Detailed information',
                        copy: 'Access requirements and documents.',
                    },
                    { icon: Bookmark, title: 'Save and organise', copy: 'Keep track of opportunities.' },
                ].map(({ icon: Icon, title, copy }) => (
                    <article key={title}>
                        <span className="feature-icon">
                            <Icon size={25} strokeWidth={1.6} />
                        </span>
                        <div>
                            <h3>{title}</h3>
                            <p>{copy}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
