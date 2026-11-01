// Progressive enhancement only: native validation and direct Worker submission remain intact.
document.querySelectorAll('[data-toggle-password]').forEach((button) => { button.hidden = false })
document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-toggle-password]') : null
    if (!button) return
    const input = document.getElementById(button.getAttribute('data-toggle-password'))
    if (!(input instanceof HTMLInputElement)) return
    const visible = input.type === 'password'
    input.type = visible ? 'text' : 'password'
    button.setAttribute('aria-pressed', String(visible))
    button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password')
    const icon = button.querySelector('img')
    if (icon) icon.src = visible ? '/icons/eye-slash.svg' : '/icons/eye.svg'
})
const form = document.querySelector('[data-auth-login]')
if (form instanceof HTMLFormElement) {
    const button = form.querySelector('button[type="submit"]')
    const label = form.querySelector('[data-submit-label]')
    const status = form.querySelector('[data-submit-status]')
    form.addEventListener('submit', (event) => {
        if (!(button instanceof HTMLButtonElement)) return
        if (button.disabled) { event.preventDefault(); return }
        button.disabled = true
        button.setAttribute('aria-busy', 'true')
        if (label) label.textContent = 'Logging in…'
        if (status) status.textContent = 'Logging in. Please wait.'
    })
    // Restore controls when navigating back from a cached document.
    window.addEventListener('pageshow', () => {
        if (!(button instanceof HTMLButtonElement)) return
        button.disabled = false
        button.removeAttribute('aria-busy')
        if (label) label.textContent = 'Log in'
        if (status) status.textContent = ''
    })
}
