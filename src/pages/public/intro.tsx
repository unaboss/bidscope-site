import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * The ad, in two cuts. Drop the files into `public/ad/` under these names; until
 * they exist the player shows a placeholder frame and still leads to pricing.
 */
const AD_WIDE = '/ad/bidscope-ad-16x9.mp4'
const AD_TALL = '/ad/bidscope-ad-9x16.mp4'

/**
 * Clearly tall screens (phones, a portrait tablet) get the 9:16 cut; anything
 * squarer, such as a desktop window snapped to half the screen, gets 16:9.
 */
const TALL_QUERY = '(max-aspect-ratio: 3/4)'

function useIsTall(): boolean
{
    const [tall, setTall] = useState(() => typeof window !== 'undefined' && window.matchMedia(TALL_QUERY).matches)

    useEffect(() =>
    {
        const query = window.matchMedia(TALL_QUERY)
        const onChange = () => setTall(query.matches)

        query.addEventListener('change', onChange)

        return () => query.removeEventListener('change', onChange)
    }, [])

    return tall
}

interface AdPlayerProps
{
    readonly onDone: () => void
    /** The corner button's label; by default "Skip ad", or "See pricing" while the ad is missing. */
    readonly closeLabel?: string
    /** Open on the title card before the video (the intro does; the pricing page's preview goes straight in). */
    readonly titleCard?: boolean
}

/** How long the "ad will play here" card holds before it fades into the ad. */
const CARD_MS = 2200

/**
 * Full-screen ad that hands off to pricing when it ends or is skipped. It opens
 * on a title card that fades out into the video; if the video file is missing
 * the card simply stays, with a way on to pricing.
 */
export function AdPlayer({ onDone, closeLabel, titleCard = true }: AdPlayerProps)
{
    const tall = useIsTall()
    const videoRef = useRef<HTMLVideoElement>(null)
    const skipRef = useRef<HTMLButtonElement>(null)
    const [missing, setMissing] = useState(false)
    const [showCard, setShowCard] = useState(titleCard)

    useEffect(() =>
    {
        skipRef.current?.focus()

        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key === 'Escape')
            {
                onDone()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () =>
        {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [onDone])

    useEffect(() =>
    {
        const timer = window.setTimeout(() => setShowCard(false), CARD_MS)

        return () => window.clearTimeout(timer)
    }, [])

    useEffect(() =>
    {
        const video = videoRef.current

        if (showCard || !video)
        {
            return
        }

        // The click on "Demo app" moments ago allows sound; if the browser refuses, play muted.
        video.play().catch(() =>
        {
            video.muted = true
            video.play().catch(() => undefined)
        })
    }, [showCard, tall])

    const cardVisible = showCard || missing

    return (
        <div role="dialog" aria-modal="true" aria-label="Bidscope ad" className="fixed inset-0 z-50 flex items-center justify-center bg-[#030B08]">
            {!missing && (
                <video
                    key={tall ? AD_TALL : AD_WIDE}
                    ref={videoRef}
                    src={tall ? AD_TALL : AD_WIDE}
                    className="h-full w-full object-contain"
                    playsInline
                    preload="auto"
                    onEnded={onDone}
                    onError={() => setMissing(true)}
                />
            )}

            <div
                aria-hidden={!cardVisible}
                className={cn(
                    'absolute inset-0 flex items-center justify-center bg-[#06140F] transition-opacity duration-1000 ease-out',
                    cardVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            >
                <div
                    className={cn(
                        'flex flex-col items-center justify-center gap-3 border border-[#B08D57]/[0.15] px-6 text-center',
                        tall ? 'aspect-[9/16] h-full max-h-[100dvh] max-w-full' : 'aspect-video w-full max-w-[min(100vw,177.78dvh)]',
                    )}
                >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B08D57]/80">
                        {missing ? 'Ad coming soon' : 'Bidscope by North Tech'}
                    </p>
                    <p className="max-w-sm font-serif text-xl text-[#E9DFC6]/85">The Bidscope ad will play here.</p>
                </div>
            </div>

            <button
                ref={skipRef}
                type="button"
                onClick={onDone}
                className="absolute right-4 top-4 rounded-md border border-[#B08D57]/50 bg-[#06140F]/70 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#E9DFC6]/70 backdrop-blur transition-colors hover:bg-[#B08D57]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E] sm:right-6 sm:top-6"
            >
                {closeLabel ?? (missing ? 'See pricing' : 'Skip ad')}
            </button>
        </div>
    )
}

/**
 * The front door: the name, one line on what it does, and a "Demo app" button
 * that plays the ad and then opens pricing.
 */
export function IntroPage()
{
    const navigate = useNavigate()
    const [playing, setPlaying] = useState(false)
    const toPricing = useCallback(() => navigate('/pricing'), [navigate])

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
                <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    className="h-12 rounded-md border border-[#B08D57]/60 bg-transparent px-10 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D9B97E] shadow-[0_0_40px_-8px_rgba(176,141,87,0.35)] transition-colors hover:border-[#D9B97E] hover:bg-[#B08D57] hover:text-[#06140F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06140F]"
                >
                    Demo app
                </button>
            </footer>

            {playing && <AdPlayer onDone={toPricing} />}
        </div>
    )
}
