import {
    BellRingingIcon,
    BookmarkSimpleIcon,
    CalendarDotsIcon,
    FileTextIcon,
    MagnifyingGlassIcon,
    TargetIcon,
} from '@phosphor-icons/react'
import { PublicPage } from '@/features/marketing/components/public-page'
import { FeatureCard } from '@/features/marketing/components/feature-card'
import { CallToAction } from '@/features/marketing/components/call-to-action'

const FEATURES = [
    {
        icon: TargetIcon,
        title: 'Tenders that fit your business',
        copy: 'Your business profile, service categories and operating provinces help Bidscope rank relevant opportunities. Update your profile as your business changes.',
    },
    {
        icon: MagnifyingGlassIcon,
        title: 'Search without the noise',
        copy: 'Search tender titles, descriptions, references and buyers. Narrow the results by province, category or closing date, then open a notice for the full details.',
    },
    {
        icon: FileTextIcon,
        title: 'Understand the opportunity',
        copy: 'Read the tender description and available AI summaries, see the closing date, and find the original documents and buyer contact details in one place.',
    },
    {
        icon: BookmarkSimpleIcon,
        title: 'Build your watchlist',
        copy: 'Save tenders you want to pursue and keep your shortlist together. Watchlists and saved-tender tools are included with Growth and Pro.',
    },
    {
        icon: CalendarDotsIcon,
        title: 'See the dates that matter',
        copy: 'See briefing and closing dates for saved tenders on your calendar. Use the calendar feed to keep key dates visible alongside your other work.',
    },
    {
        icon: BellRingingIcon,
        title: 'Stay ahead of deadlines',
        copy: 'Deadline alerts help you keep track of saved tenders before briefings and closing dates. Review your plan and account settings to manage your coverage.',
    },
] as const

export function FeaturesPage() {
    return (
        <PublicPage
            title="Everything you need to move a bid forward."
            description="From finding the right notice to keeping track of its closing date."
        >
            <section className="feature-detail-grid container" aria-label="Bidscope features">
                {FEATURES.map(({ icon, title, copy }) => (
                    <FeatureCard key={title} icon={icon} title={title}>
                        {copy}
                    </FeatureCard>
                ))}
            </section>
            <section className="plan-note container">
                <h2>Choose the coverage that fits.</h2>
                <p>
                    Starter includes one province. Growth covers up to four, with watchlists and deadline tools. Pro
                    includes all nine provinces and all Growth features.
                </p>
                <a className="bs-button outline" href="/pricing">
                    Compare plans
                </a>
            </section>
            <CallToAction />
        </PublicPage>
    )
}
