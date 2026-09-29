/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: 'rgb(var(--color-ink) / <alpha-value>)',
                navy: 'rgb(var(--color-navy) / <alpha-value>)',
                wax: 'rgb(var(--color-wax) / <alpha-value>)',
                cream: 'rgb(var(--color-cream) / <alpha-value>)',
                panel: 'rgb(var(--color-panel) / <alpha-value>)',
                line: 'rgb(var(--color-neutral-200) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                warn: 'rgb(var(--color-warn) / <alpha-value>)',
                danger: 'rgb(var(--color-danger) / <alpha-value>)',
                neutral: {
                    50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
                    100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
                    200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
                    300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
                    400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
                    500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
                    600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
                    700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
                    800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
                    900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
                },
            },
            // Tender Dossier type: Fraunces headlines, Source Serif 4 body,
            // Space Mono for references and dates.
            fontFamily: {
                sans: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
                serif: ['Fraunces', '"Source Serif 4"', 'Georgia', 'serif'],
                mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
            },
            boxShadow: {
                panel: '0 1px 2px rgb(var(--color-ink) / 0.04), 0 10px 30px rgb(var(--color-ink) / 0.06)',
            },
        },
    },
    plugins: [],
}
