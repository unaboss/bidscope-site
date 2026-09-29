import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-navy text-cream hover:bg-navy/90',
    secondary: 'border border-line bg-panel text-ink hover:bg-ink/5',
    ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
}

const SIZES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3',
    md: 'h-10 px-5',
}

const BASE =
    'inline-flex items-center justify-center gap-2 rounded-md font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ' +
    'disabled:pointer-events-none disabled:opacity-40 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream'

interface ButtonProps extends ComponentProps<'button'>
{
    readonly variant?: ButtonVariant
    readonly size?: ButtonSize
}

/** Design-system button. Defaults to `type="button"` so it never submits a form by accident. */
export function Button({ className, variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps)
{
    return <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />
}
