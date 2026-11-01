export const FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white'
export const GOLD_TEXT = 'text-ink'
export const PANEL = 'rounded-xl border border-line bg-white shadow-panel'
export const PANEL_HOVER = 'transition-colors hover:border-navy/30'
const BUTTON_BASE =
    'inline-flex items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
export const BUTTON_GOLD = BUTTON_BASE + ' bg-navy text-white hover:bg-navy/90 ' + FOCUS
export const BUTTON_OUTLINE = BUTTON_BASE + ' border border-navy/40 text-navy hover:bg-navy/5 ' + FOCUS
export const EYEBROW = 'text-[10px] font-medium uppercase tracking-[0.2em] text-wax'
export const INPUT =
    'h-11 w-full rounded-lg border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-ink/35 transition-colors focus-visible:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20'
export function formatRands(cents: number): string {
    const rands = cents / 100
    const [whole, part] = (Number.isInteger(rands) ? String(rands) : rands.toFixed(2)).split('.')
    const grouped = (whole ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')
    return part === undefined ? 'R' + grouped : 'R' + grouped + '.' + part
}
