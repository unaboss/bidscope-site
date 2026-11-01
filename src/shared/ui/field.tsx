import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface FieldProps
{
    readonly label: string
    /** Id of the control this label describes. */
    readonly htmlFor: string
    readonly hint?: string
    /** Renders a visual required marker; the control must also set `required`. */
    readonly required?: boolean
    readonly className?: string
    readonly children: ReactNode
}

/** Labelled form row. The control carries `id={htmlFor}` for explicit association. */
export function Field({ label, htmlFor, hint, required = false, className, children }: FieldProps)
{
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label
                htmlFor={htmlFor}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60"
            >
                {label}
                {required && <span aria-hidden="true"> *</span>}
            </label>
            {children}
            {hint !== undefined && <p className="text-xs text-ink/50">{hint}</p>}
        </div>
    )
}
