import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { CaretDownIcon } from '@phosphor-icons/react'

export interface AccordionItem {
    readonly id: string
    readonly title: string
    readonly content: ReactNode
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
                        <div
                            className="ds-accordion-panel"
                            id={panelId}
                            role="region"
                            aria-labelledby={triggerId}
                            hidden={!expanded}
                        >
                            {item.content}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
