import { PublicPage } from '../components/public-page'
export function ProductPage() {
    return <PublicPage title="The information behind a bid decision." description="Move from a broad search to a considered shortlist, without losing sight of the original notice.">
        <section className="container market-product">
            <div>
                <h2>Search with your business in mind.</h2>
                <p>Set your provinces and services in your business profile. Explore matched tenders or browse by province, category and buyer when you want to look beyond your usual work.</p>
                <a className="quiet-link" href="/preview/discover">Explore tender discovery</a>
            </div>
            <div className="market-fields">
                <h3>Discovery tools</h3>
                <dl>
                    <div>
                        <dt>Province</dt>
                        <dd>Focus on where you can deliver</dd>
                    </div>
                    <div>
                        <dt>Category</dt>
                        <dd>Narrow the type of work</dd>
                    </div>
                    <div>
                        <dt>Buyer</dt>
                        <dd>Research a publishing organisation</dd>
                    </div>
                    <div>
                        <dt>Business profile</dt>
                        <dd>Give matching a relevant starting point</dd>
                    </div>
                </dl>
            </div>
        </section>
        <section className="market-band">
            <div className="container market-product">
                <div>
                    <h2>Read the tender as a case file.</h2>
                    <p>Bring the available scope, dates, requirements and documents into one review. Summaries help you orient yourself; the buyer’s original documents remain the authority.</p>
                    <a className="quiet-link" href="/preview">Open the workspace preview</a>
                </div>
                <div className="market-review">
                    <h3>Before you shortlist</h3>
                    <ul>
                        <li>Confirm the scope and delivery location.</li>
                        <li>Check briefing dates and closing times.</li>
                        <li>Read mandatory requirements in the source documents.</li>
                        <li>Check for amendments with the publishing buyer.</li>
                    </ul>
                </div>
            </div>
        </section>
        <section className="container market-product">
            <div>
                <h2>Keep the opportunities you choose.</h2>
                <p>On Growth and Pro, save tenders and use the deadline calendar to plan the next review. A saved tender is a shortlist item, not a submitted bid.</p>
            </div>
            <div className="market-review">
                <h3>Your team’s next step</h3>
                <p>Decide whether to pursue the work. Prepare and submit the response through the buyer’s official process.</p>
                <a className="quiet-link" href="/pricing">Compare included tools</a>
            </div>
        </section>
    </PublicPage>
}
