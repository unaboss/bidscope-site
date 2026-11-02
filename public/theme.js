/* Shared by React pages and the progressively enhanced sign-in page. Runs before paint. */
;(() => {
    const key = 'bidscope-theme'
    const system = window.matchMedia('(prefers-color-scheme: dark)')
    let preference
    try {
        preference = localStorage.getItem(key)
    } catch {
        /* Storage may be disabled. */
    }
    function apply(theme) {
        document.documentElement.dataset.theme = theme
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.setAttribute('aria-pressed', String(theme === 'dark'))
            button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
        })
        window.dispatchEvent(new Event('bidscope-theme-change'))
    }
    apply(preference === 'dark' || preference === 'light' ? preference : system.matches ? 'dark' : 'light')
    document.addEventListener('DOMContentLoaded', () => apply(document.documentElement.dataset.theme), { once: true })
    document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element) || !event.target.closest('[data-theme-toggle]')) return
        preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
        try {
            localStorage.setItem(key, preference)
        } catch {
            /* Keep the switch usable without persistence. */
        }
        apply(preference)
    })
    system.addEventListener('change', () => {
        if (preference !== 'dark' && preference !== 'light') apply(system.matches ? 'dark' : 'light')
    })
    window.addEventListener('storage', (event) => {
        if (event.key !== key && event.key !== null) return
        preference = event.newValue
        apply(preference === 'dark' || preference === 'light' ? preference : system.matches ? 'dark' : 'light')
    })
})()
