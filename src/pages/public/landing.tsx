import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface MockScreen
{
    readonly eyebrow: string
    readonly title: string
    readonly rows: ReadonlyArray<{ readonly label: string, readonly detail: string }>
}

/** Abstract on-brand representations of the four core views — replaceable by real captures. */
const SCREENS: readonly MockScreen[] = [
    {
        eyebrow: 'Discover',
        title: 'For-You deck',
        rows: [
            { label: 'Water reticulation, Emfuleni', detail: 'Closes in 3 days' },
            { label: 'Fencing upgrade, Polokwane', detail: 'Up to R3m' },
            { label: 'Clinic refurbishment, Gauteng', detail: 'Matches GB' },
        ],
    },
    {
        eyebrow: 'Dashboard',
        title: 'By province & buyer',
        rows: [
            { label: 'Gauteng · 128', detail: 'Government' },
            { label: 'Limpopo · 54', detail: 'State-owned' },
            { label: 'North West · 31', detail: 'External' },
        ],
    },
    {
        eyebrow: 'Dossier',
        title: 'One tender, fully read',
        rows: [
            { label: 'Scope & description', detail: 'Parsed' },
            { label: 'Buyer profile', detail: 'Median R4.2m' },
            { label: 'Documents & contacts', detail: 'Linked' },
        ],
    },
    {
        eyebrow: 'Calendar',
        title: 'Briefings & closings',
        rows: [
            { label: 'Briefing · 12 Oct', detail: 'Compulsory' },
            { label: 'Closing · 18 Oct', detail: 'Bookmarked' },
            { label: 'Clash warned', detail: 'Two closings' },
        ],
    },
]

export function LandingPage()
{
    const navigate = useNavigate()

    return (
        <div className="min-h-dvh bg-cream text-ink">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">North Tech</span>
                <a href="/login" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/70 hover:text-ink">
                    Sign in
                </a>
            </header>

            <main className="mx-auto max-w-6xl px-6 pb-24">
                <section className="mx-auto max-w-3xl pt-16 text-center sm:pt-24">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/50">Procurement Screener</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                        Every South African tender that actually fits your business.
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/70">
                        eTenders plus SOE and municipal sources in one feed, ranked against
                        your service lines, provinces and CIDB grades.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button onClick={() => navigate('/join')}>Start 1-week free trial</Button>
                        <a href="#tour" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 hover:text-ink">
                            See how it works
                        </a>
                    </div>
                </section>

                <section id="tour" className="mt-24">
                    <h2 className="text-center text-2xl font-semibold sm:text-3xl">Four views, one workspace</h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-ink/60">
                        Rank what fits, see who is buying, read the dossier, and never miss a
                        briefing or closing date.
                    </p>

                    <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
                        {SCREENS.map((screen) => (
                            <article
                                key={screen.title}
                                className="w-[80%] flex-none snap-center rounded-xl border border-line bg-panel p-5 shadow-panel sm:w-[46%] lg:w-[32%]"
                            >
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/70">{screen.eyebrow}</p>
                                <h3 className="mt-2 text-lg font-semibold">{screen.title}</h3>
                                <ul className="mt-5 space-y-3">
                                    {screen.rows.map((row) => (
                                        <li key={row.label} className="rounded-lg border border-line/70 bg-cream/60 px-3 py-2">
                                            <p className="text-sm leading-snug">{row.label}</p>
                                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">{row.detail}</p>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24 rounded-2xl border border-line bg-panel px-6 py-12 text-center shadow-panel">
                    <h2 className="text-2xl font-semibold sm:text-3xl">Try it free for a week</h2>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink/60">
                        Answer a few questions about your business and see exactly how many
                        live tenders you qualify for — before you pay anything.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button onClick={() => navigate('/join')}>Start 1-week free trial</Button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-line/60">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40 sm:flex-row">
                    <span>North Tech Africa (Pty) Ltd</span>
                    <a href="https://northtech.africa/privacy" className="hover:text-ink/70">Privacy</a>
                </div>
            </footer>
        </div>
    )
}
