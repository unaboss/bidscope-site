import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { CaretDownIcon } from '@phosphor-icons/react'
import { useSubtleReveal } from '@/shared/lib/use-subtle-reveal'

export interface AccordionItem {
    readonly id: string
    readonly title: string
    readonly content: ReactNode
}

function AccordionPanel({
    expanded,
    id,
    labelledBy,
    children,
}: {
    readonly expanded: boolean
    readonly id: string
    readonly labelledBy: string
    readonly children: ReactNode
}) {
    const reveal = useSubtleReveal<HTMLDivElement>(expanded, undefined, expanded)
    return (
        <div
            ref={reveal}
            className="ds-accordion-panel"
            id={id}
            role="region"
            aria-labelledby={labelledBy}
            hidden={!expanded}
        >
            {children}
        </div>
    )
}

/** Native buttons provide Enter/Space activation; each panel has an explicit label. */
export function Accordion({ items }: { readonly items: readonly AccordionItem[] }) {
    const prefix = useId()
    const [openId, setOpenId] = useState<string | null>(null)
    return (
        <div className="ds-accordion">
            {items.map((item) => {
                const expanded = openId === item.id
                const triggerId = prefix + '-' + item.id + '-trigger'
                const panelId = prefix + '-' + item.id + '-panel'
                return (
                    <div key={item.id} className="ds-accordion-item">
                        <h3 className="ds-accordion-heading">
                            <button
                                className="ds-accordion-trigger"
                                id={triggerId}
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                onClick={() => setOpenId(expanded ? null : item.id)}
                            >
                                {item.title}
                                <CaretDownIcon size={20} aria-hidden="true" />
                            </button>
                        </h3>
                        <AccordionPanel id={panelId} labelledBy={triggerId} expanded={expanded}>
                            {item.content}
                        </AccordionPanel>
                    </div>
                )
            })}
        </div>
    )
}
