import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Joins conditional class names and resolves Tailwind conflicts, last one wins
 * (the shadcn/ui implementation), so callers can override a component's
 * defaults through `className`.
 */
export function cn(...classes: ReadonlyArray<string | false | null | undefined>): string
{
    return twMerge(clsx(...classes))
}
