import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

/** Short feedback for new content; GSAP reverts styles on interruption and preference changes. */
export function useSubtleReveal<T extends HTMLElement>(
    change: unknown,
    {
        duration,
        x = 0,
        y = 0,
        stagger = 0,
        selector,
        enabled = true,
    }: { duration: number; x?: number; y?: number; stagger?: number; selector?: string; enabled?: boolean },
) {
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
                    { opacity: 0, x, y },
                    {
                        opacity: 1,
                        y: 0,
                        x: 0,
                        duration,
                        stagger,
                        ease: 'power2.out',
                        clearProps: 'opacity,transform',
                    },
                )
            },
            root,
        )
        return () => media.revert()
    }, [change, selector, enabled, duration, x, y, stagger])
    return ref
}
