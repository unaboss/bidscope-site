import { useSyncExternalStore } from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'

function subscribe(listener: () => void) {
    window.addEventListener('bidscope-theme-change', listener)
    return () => window.removeEventListener('bidscope-theme-change', listener)
}

export function ThemeToggle() {
    const dark = useSyncExternalStore(
        subscribe,
        () => document.documentElement.dataset.theme === 'dark',
        () => false,
    )
    return (
        <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={dark}
        >
            {dark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </button>
    )
}
