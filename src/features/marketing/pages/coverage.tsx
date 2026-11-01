import { ArrowRightIcon, BuildingsIcon, GlobeHemisphereEastIcon, MapPinAreaIcon } from '@phosphor-icons/react'
import { PublicPage } from '../components/public-page'
import { FeatureCard } from '../components/feature-card'
import { SectionLabel } from '../components/section-label'
import { sourceSite } from '@/shared/lib/sources'

const sourceGroups = [
    { title: 'National publishing', keys: ['etenders', 'ocds'] },
    { title: 'Public entities', keys: ['sanral', 'eskom', 'transnet', 'prasa', 'sentech', 'sabc', 'dbsa', 'randwater'] },
    { title: 'Local publishing', keys: ['buffalocity', 'ekurhuleni', 'cticc'] },
]

export function CoveragePage() {
    return (
        <PublicPage title="A wider view of South African opportunities." description="Discover notices from national publishing channels and selected public entities and local buyers. Coverage follows the sources, not a promise to capture every tender.">
            <section className="marketing-coverage-intro container" aria-label="Understanding coverage">
                <FeatureCard icon={GlobeHemisphereEastIcon} title="South African focus">National channels can include notices across all nine provinces. Availability varies by source, buyer and publication date.</FeatureCard>
                <FeatureCard icon={BuildingsIcon} title="Selected direct sources">Alongside eTenders and National Treasury OCDS data, Bidscope recognises sources from public entities and selected local publishers.</FeatureCard>
                <FeatureCard icon={MapPinAreaIcon} title="Your plan sets your reach">Starter includes one province, Growth includes four and Pro includes all nine. See pricing for province add-ons and plan details.</FeatureCard>
            </section>
            <section className="marketing-source-section container">
                <div className="marketing-section-intro"><SectionLabel>Source directory</SectionLabel><h2>Start with the original publisher.</h2><p>Examples of sources recognised by Bidscope. These links open the publishers’ sites; they are not endorsements or integrations.</p></div>
                <div className="marketing-source-groups">{sourceGroups.map((group) => <article key={group.title}><h3>{group.title}</h3><ul>{group.keys.map((key) => { const source = sourceSite(key); return source && <li key={key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<ArrowRightIcon size={15} aria-hidden="true" /></a></li> })}</ul></article>)}</div>
            </section>
            <aside className="marketing-coverage-note container"><h2>A source-aware view, not an exhaustive register.</h2><p>Not every municipality or buyer is covered directly. Notices may be incomplete, change or be withdrawn, and a recognised source does not guarantee current listings. Check the original notice for the latest documents, amendments and closing dates.</p></aside>
            <section className="marketing-page-next container"><div><h2>Choose where you want to work.</h2><p>Compare plans by province coverage and workflow tools.</p></div><a className="bs-button" href="/pricing">See plans <ArrowRightIcon size={17} /></a></section>
        </PublicPage>
    )
}
