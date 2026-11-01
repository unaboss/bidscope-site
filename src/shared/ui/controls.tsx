import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

const CONTROL =
    'nt-control w-full rounded-md border border-line bg-panel text-sm text-ink placeholder:text-ink/35 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:ring-offset-cream ' +
    'disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ className, ...props }: ComponentProps<'input'>)
{
    return <input className={cn(CONTROL, 'h-10 px-3', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>)
{
    return <select className={cn(CONTROL, 'h-10 px-3', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>)
{
    return <textarea className={cn(CONTROL, 'min-h-24 px-3 py-2', className)} {...props} />
}
