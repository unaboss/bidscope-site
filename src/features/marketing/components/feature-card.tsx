import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'

export function FeatureCard({
    icon: Icon,
    title,
    children,
}: {
    readonly icon: Icon
    readonly title: string
    readonly children: ReactNode
}) {
    return (
        <article>
            <span className="feature-icon">
                <Icon size={26} />
            </span>
            <div>
                <h3>{title}</h3>
                <p>{children}</p>
            </div>
        </article>
    )
}
