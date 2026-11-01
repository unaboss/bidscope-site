import { FeatureCard } from './feature-card'
import {
    BookmarkIcon as Bookmark,
    CalendarDotsIcon as CalendarDays,
    CrosshairIcon as Crosshair,
    FileTextIcon as FileText,
} from '@phosphor-icons/react'

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
                    <FeatureCard key={title} icon={Icon} title={title}>
                        {copy}
                    </FeatureCard>
                ))}
            </div>
        </section>
    )
}
