import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

/** Short feedback for new content; GSAP reverts styles on interruption and preference changes. */
export function useSubtleReveal<T extends HTMLElement>(change: unknown, selector?: string, enabled = true) {
    const ref = useRef<T>(null)
    useLayoutEffect(() => {
        const root = ref.current
        if (!root || !enabled) return
        const media = gsap.matchMedia()
        media.add(
            '(prefers-reduced-motion: no-preference)',
            () => {
                const targets = selector ? root.querySelectorAll(selector) : root
                gsap.fromTo(
                    targets,
                    { opacity: 0.85, y: 4 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.2,
                        ease: 'power1.out',
                        clearProps: 'opacity,transform',
                    },
                )
            },
            root,
        )
        return () => media.revert()
    }, [change, selector, enabled])
    return ref
}
