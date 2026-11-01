import type { ComponentProps } from 'react'

/** A plain section label, with normal casing and no decorative rule. */
export function SectionLabel({ className = '', ...props }: ComponentProps<'h3'>) {
    return <h3 className={'section-label ' + className} {...props} />
}
