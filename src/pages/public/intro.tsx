import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BUTTON_GOLD, EYEBROW, FOCUS, GOLD_TEXT } from './brand'

/** The date after which pilot prices may change. */
export const PILOT_PRICES_UNTIL = '31 August 2027'

/**
 * The front door: Bidscope is in its pilot, prices may change after it, and
 * clients who join during it keep their price. Continue opens the site.
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
                    className={cn('rounded-sm font-mono text-[11px] uppercase tracking-[0.14em] text-[#E9DFC6]/35 transition-colors hover:text-[#D9B97E]', FOCUS)}
                >
                    Sign in
                </a>
            </header>

            <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-6 text-center [@media(max-height:560px)]:py-2">
                <span
                    aria-hidden="true"
                    className="mb-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#B08D57]/40 font-serif text-xl font-semibold text-[#B08D57] [@media(max-height:560px)]:hidden"
                >
                    B
                </span>
                <p className={EYEBROW}>Pilot phase</p>
                <h1 className={cn('mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl [@media(max-height:560px)]:mt-2 [@media(max-height:560px)]:text-3xl', GOLD_TEXT)}>
                    Bidscope is in its pilot.
                </h1>
                <p className="mt-6 text-[15px] leading-relaxed text-[#E9DFC6]/60 [@media(max-height:560px)]:mt-3">
                    Prices may change after {PILOT_PRICES_UNTIL}. Clients who join during the pilot keep their price for life.
                </p>
            </main>

            <footer className="relative flex flex-col items-center pb-8 pt-4 sm:pb-10 [@media(max-height:560px)]:pb-5 [@media(max-height:560px)]:pt-0">
                <Link to="/pricing" className={cn(BUTTON_GOLD, 'h-12 px-12')}>
                    Continue
                </Link>
                <p className="mt-8 max-w-xs text-center text-[11px] leading-relaxed text-[#E9DFC6]/30 sm:max-w-none [@media(max-height:560px)]:mt-4">
                    The lifetime price lock is a North Tech policy, which North Tech may change.
                </p>
            </footer>
        </div>
    )
}
