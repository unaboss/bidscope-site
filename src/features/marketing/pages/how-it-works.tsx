import { PublicPage } from '../components/public-page'
const steps = [
    ['Set your working area', 'Choose provinces and describe your services in your business profile. Keep this current as your business changes.', 'You need: the services you provide and the locations you cover.'],
    ['Find a notice worth reviewing', 'Explore matched opportunities or browse by province, category and buyer. Open a tender to read its scope and available dates.', 'Your decision: is this work relevant enough for a closer look?'],
    ['Verify the requirements', 'Read the original notice and available buyer documents. Check eligibility, briefing arrangements, closing times and amendments at the source.', 'The buyer’s documents take precedence over a summary.'],
    ['Save, plan and respond', 'Growth and Pro include saved tenders and the deadline calendar. Use your shortlist to organise preparation, then submit through the buyer’s official process.', 'Saving a tender does not submit a bid.'],
]
export function HowItWorksPage() {
    return <PublicPage title="A practical route from search to shortlist." description="Bidscope supports the research. You make the bid decision, and the publishing buyer sets the requirements.">
        <ol className="container market-process">{steps.map(([title, text, note], i) =>
            <li key={title}>
                <span className="market-process-number">{i + 1}</span>
                <h2>{title}</h2>
                <div>
                    <p>{text}</p>
                    <p className="market-process-note">{note}</p>
                </div>
            </li>)}</ol>
        <section className="container market-close">
            <div>
                <h2>Try the workflow before signing up.</h2>
                <p>The public preview lets you explore the workspace with demonstration data.</p>
            </div>
            <a className="bs-button" href="/preview">Open the preview</a>
        </section>
    </PublicPage>
}
