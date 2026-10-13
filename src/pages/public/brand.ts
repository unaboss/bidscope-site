/**
 * The intro screen's palette, carried through the public site: near-black
 * green, brass gold and a warm parchment ink.
 */
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06140F]'

export const GOLD_TEXT = 'bg-gradient-to-b from-[#F0D9A4] via-[#C9A464] to-[#8A6A3F] bg-clip-text text-transparent'

export const PANEL = 'rounded-xl border border-[#B08D57]/20 bg-[#0B1F18]/70 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]'
export const PANEL_HOVER = 'transition-colors hover:border-[#B08D57]/40'

const BUTTON_BASE = 'inline-flex items-center justify-center rounded-md font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60'
export const BUTTON_GOLD = `${BUTTON_BASE} bg-gradient-to-b from-[#D9B97E] to-[#B08D57] text-[#06140F] shadow-[0_0_40px_-10px_rgba(176,141,87,0.55)] hover:from-[#F0D9A4] hover:to-[#C9A464] ${FOCUS}`
export const BUTTON_OUTLINE = `${BUTTON_BASE} border border-[#B08D57]/55 text-[#D9B97E] hover:border-[#D9B97E] hover:bg-[#B08D57] hover:text-[#06140F] ${FOCUS}`

export const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.28em] text-[#B08D57]/85'

/** A text input on the dark green ground. */
export const INPUT = 'h-11 w-full rounded-md border border-[#B08D57]/30 bg-[#06140F]/70 px-3.5 text-[15px] text-[#E9DFC6] placeholder:text-[#E9DFC6]/30 transition-colors hover:border-[#B08D57]/50 focus-visible:border-[#D9B97E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B97E]/30'

/** Formats ZAR cents for display: whole rands stay whole (R699), others keep cents (R349.50). */
export function formatRands(cents: number): string
{
    const rands = cents / 100
    const [whole, part] = (Number.isInteger(rands) ? String(rands) : rands.toFixed(2)).split('.')
    // South African style: a thin space between thousands (R3 990).
    const grouped = (whole ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')

    return part === undefined ? `R${grouped}` : `R${grouped}.${part}`
}
