import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './pricing-motion.css'

/** Two clipped rows roll in opposite directions when the billing amount changes. */
export function RollingPrice({ amount, yearly }: { readonly amount: number; readonly yearly: boolean }) {
    const root = useRef<HTMLDivElement>(null)
    const previous = useRef(amount)
    const formatted = 'R' + amount.toLocaleString('en-ZA')
    useLayoutEffect(() => {
        const element = root.current
        const oldAmount = previous.current
        previous.current = amount
        if (!element || oldAmount === amount) return
        const outgoing = element.querySelector<HTMLElement>('.price-outgoing')!
        const incoming = element.querySelector<HTMLElement>('.price-incoming')!
        outgoing.textContent = 'R' + oldAmount.toLocaleString('en-ZA')
        const direction = amount > oldAmount ? 1 : -1
        const media = gsap.matchMedia()
        media.add(
            '(prefers-reduced-motion: no-preference)',
            () => {
                gsap.timeline({ defaults: { duration: 0.36, ease: 'power2.inOut' } })
                    .fromTo(
                        outgoing,
                        { yPercent: 0, visibility: 'visible' },
                        {
                            yPercent: -110 * direction,
                            onComplete: () => {
                                outgoing.style.visibility = 'hidden'
                            },
                        },
                        0,
                    )
                    .fromTo(incoming, { yPercent: 110 * direction }, { yPercent: 0, clearProps: 'transform' }, 0)
            },
            element,
        )
        return () => media.revert()
    }, [amount])
    return (
        <div className="ref-price" ref={root}>
            <span className="sr-only" role="status">
                {formatted} per {yearly ? 'year' : 'month'}
            </span>
            <div className="price-roller" aria-hidden="true">
                <div className="price-outgoing" />
                <div className="price-incoming">{formatted}</div>
            </div>{' '}
            <span aria-hidden="true">/{yearly ? 'year' : 'month'}</span>
        </div>
    )
}
