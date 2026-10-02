import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Design-system button, in the shadcn/ui shape (`cva` + `asChild`) but keeping
 * the original variant names, so every existing call site renders unchanged.
 */
export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-md font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ' +
    'disabled:pointer-events-none disabled:opacity-40 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
    {
        variants: {
            variant: {
                primary: 'bg-navy text-cream hover:bg-navy/90',
                secondary: 'border border-line bg-panel text-ink hover:bg-ink/5',
                ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
                /** Quiet until hovered, then unmistakably destructive. */
                danger: 'border border-line bg-panel text-ink/55 hover:border-danger/35 hover:bg-danger/[0.07] hover:text-danger',
                /** Inline text action; size classes still apply, so pass `h-auto px-1` where it sits in copy. */
                link: 'text-navy underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3',
                md: 'h-10 px-5',
                /** Square, for icon-only buttons — always pair with `aria-label`. */
                icon: 'size-9 shrink-0 p-0',
                'icon-sm': 'size-8 shrink-0 p-0',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
)

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants>
{
    /** Render the single child (e.g. a router `Link`) with button styling. */
    readonly asChild?: boolean
}

/** Defaults to `type="button"` so it never submits a form by accident. */
export function Button({ className, variant, size, asChild = false, type = 'button', ...props }: ButtonProps)
{
    if (asChild) {
        return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />
    }

    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
