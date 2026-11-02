import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

/** Keep collapsing content mounted, but inert; restore natural height after each animation. */
export function useDisclosureMotion(open: boolean, duration: number, ease: string) {
    const ref = useRef<HTMLDivElement>(null)
    const height = useRef<number | null>(null)
    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return
        if (height.current === null && !open) element.hidden = true
        const media = gsap.matchMedia()
        media.add(
            { motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' },
            (context) => {
                if (!context.conditions?.motion) {
                    element.hidden = !open
                    return
                }
                const start = height.current ?? (open ? 0 : element.hidden ? 0 : element.scrollHeight)
                if (!open && start === 0) {
                    element.hidden = true
                    return
                }
                element.hidden = false
                gsap.fromTo(
                    element,
                    { height: start, opacity: open ? 0.5 : 1, overflow: 'hidden' },
                    {
                        height: open ? 'auto' : 0,
                        opacity: open ? 1 : 0,
                        duration,
                        ease,
                        onComplete: () => {
                            element.hidden = !open
                        },
                        clearProps: 'height,opacity,overflow',
                    },
                )
            },
            element,
        )
        return () => {
            height.current = element.hidden ? 0 : element.getBoundingClientRect().height
            media.revert()
        }
    }, [open, duration, ease])
    return ref
}
