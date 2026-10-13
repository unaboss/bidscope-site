import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: 'rgb(var(--color-ink) / <alpha-value>)',
                navy: 'rgb(var(--color-navy) / <alpha-value>)',
                wax: 'rgb(var(--color-wax) / <alpha-value>)',
                cream: 'rgb(var(--color-cream) / <alpha-value>)',
                panel: 'rgb(var(--color-panel) / <alpha-value>)',
                night: 'rgb(var(--color-night) / <alpha-value>)',
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
                // shadcn/ui semantic names; the vars in `src/index.css` mirror
                // the tokens above.
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
                },
                border: 'hsl(var(--border) / <alpha-value>)',
                input: 'hsl(var(--input) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            // Tender Dossier type: Fraunces headlines, Source Serif 4 body,
            // Space Mono for references and dates.
            fontFamily: {
                sans: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
                serif: ['Fraunces', '"Source Serif 4"', 'Georgia', 'serif'],
                mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
            },
            boxShadow: {
                panel: '0 1px 2px rgb(0 0 0 / 0.25), 0 18px 40px -12px rgb(0 0 0 / 0.55)',
            },
        },
    },
    plugins: [animate],
}
