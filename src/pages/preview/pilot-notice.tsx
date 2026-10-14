import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { BUTTON_GOLD, EYEBROW, FOCUS, GOLD_TEXT } from '../public/brand'

/** The date after which pilot prices may change. */
export const PILOT_PRICES_UNTIL = '31 August 2027'

export interface PreviewExit
{
    readonly href: string
    readonly label: string
}

interface PilotNoticeProps
{
    /** Where the visitor was going when they left the preview. */
    readonly next: PreviewExit
    readonly onBack: () => void
}

/**
 * The page at the end of the preview: Bidscope is in its pilot, prices may
 * change after the pilot, and clients who join during it keep their price.
 */
export function PilotNotice({ next, onBack }: PilotNoticeProps)
{
    const go = useRef<HTMLAnchorElement>(null)

    useEffect(() =>
    {
        go.current?.focus()

        function onKeyDown(event: KeyboardEvent): void
        {
            if (event.key === 'Escape') {
                onBack()
            }
        }

        document.addEventListener('keydown', onKeyDown)

        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onBack])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pilot-title"
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#06140F] px-6 text-[#E9DFC6]"
        >
            {/* The intro's lamplight. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_44%,rgba(22,66,50,0.55),rgba(6,20,15,0)_70%),radial-gradient(ellipse_110%_90%_at_50%_50%,rgba(6,20,15,0)_45%,rgba(1,6,4,0.95)_100%)]"
            />

            <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-10 text-center">
                <p className={EYEBROW}>Pilot phase</p>
                <h1 id="pilot-title" className={cn('mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl', GOLD_TEXT)}>
                    Bidscope is in its pilot.
                </h1>
                <p className="mt-5 text-[15px] leading-relaxed text-[#E9DFC6]/65">
                    Prices may change after {PILOT_PRICES_UNTIL}. Clients who join during the pilot keep their price for life.
                </p>
                <a ref={go} href={next.href} className={cn(BUTTON_GOLD, 'mt-8 h-11 px-8')}>
                    {next.label}
                </a>
                <button
                    type="button"
                    onClick={onBack}
                    className={cn('mt-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.18em] text-[#E9DFC6]/45 transition-colors hover:text-[#D9B97E]', FOCUS)}
                >
                    Back to the preview
                </button>
            </main>

            <footer className="relative pb-6 text-center text-[11px] leading-relaxed text-[#E9DFC6]/30">
                The lifetime price lock is a North Tech policy, which North Tech may change.
            </footer>
        </div>
    )
}
