/**
 * The front door: the name, one line on what it does, and a "Demo app" button
 * that opens the app itself on sample data (its Close leads on to pricing).
 */
export function IntroPage()
{
    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#06140F] px-6 text-[#E9DFC6]">
            {/* Low lamplight: a warm glow at the centre falling off into near-black green at the edges. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_44%,rgba(22,66,50,0.55),rgba(6,20,15,0)_70%),radial-gradient(ellipse_30%_22%_at_50%_44%,rgba(176,141,87,0.07),rgba(6,20,15,0)_70%),radial-gradient(ellipse_110%_90%_at_50%_50%,rgba(6,20,15,0)_45%,rgba(1,6,4,0.95)_100%)]"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-sm border border-[#B08D57]/20 sm:inset-5" />

            <header className="relative flex justify-end py-6 sm:px-4 sm:py-8 [@media(max-height:560px)]:py-4">
                <a
                    href="/login"
                    className="rounded-sm font-mono text-[11px] uppercase tracking-[0.14em] text-[#E9DFC6]/35 transition-colors hover:text-[#D9B97E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E]"
                >
                    Sign in
                </a>
            </header>

            <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-6 text-center [@media(max-height:560px)]:py-2">
                <span
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full [@media(max-height:560px)]:hidden border border-[#B08D57]/40 font-serif text-xl font-semibold text-[#B08D57]"
                >
                    B
                </span>
                <h1 className="mt-7 font-serif text-5xl [@media(max-height:560px)]:mt-0 [@media(max-height:560px)]:text-4xl font-semibold tracking-tight text-[#D9B97E] sm:text-6xl bg-gradient-to-b from-[#F0D9A4] via-[#C9A464] to-[#8A6A3F] bg-clip-text text-transparent">Bidscope</h1>
                <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                    <span className="h-px w-10 bg-[#B08D57]/35" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#B08D57]/80">by North Tech</span>
                    <span className="h-px w-10 bg-[#B08D57]/35" />
                </div>
                <p className="sr-only">by North Tech</p>
                <p className="mt-9 max-w-md text-base [@media(max-height:560px)]:mt-5 leading-relaxed text-[#E9DFC6]/50">
                    Every South African tender that fits your business, ranked in one feed,
                    with reminders before briefings and closing dates.
                </p>
            </main>

            <footer className="relative flex justify-center pb-14 pt-4 sm:pb-20 [@media(max-height:560px)]:pb-8">
                <a
                    href="/preview"
                    className="inline-flex h-12 items-center rounded-md border border-[#B08D57]/60 bg-transparent px-10 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D9B97E] shadow-[0_0_40px_-8px_rgba(176,141,87,0.35)] transition-colors hover:border-[#D9B97E] hover:bg-[#B08D57] hover:text-[#06140F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06140F]"
                >
                    Demo app
                </a>
            </footer>
        </div>
    )
}
