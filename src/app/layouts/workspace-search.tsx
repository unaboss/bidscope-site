import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Kbd } from '@/shared/ui/kbd'

/**
 * Global tender search.
 *
 * It is the real query the Tenders page runs, not a decorative field: the term
 * is submitted as `?search=` on `/discover`, so a search started here can be
 * refined there with the province and category filters. Pressing `/` focuses it
 * from anywhere that is not already an input.
 */
export function WorkspaceSearch() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const [term, setTerm] = useState(params.get('search') ?? '')
    const input = useRef<HTMLInputElement>(null)

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null
            const typing =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target?.isContentEditable === true

            if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
                event.preventDefault()
                input.current?.focus()
            }
        }

        document.addEventListener('keydown', onKeyDown)

        return () => document.removeEventListener('keydown', onKeyDown)
    }, [])

    return (
        <form
            role="search"
            className="workspace-search"
            onSubmit={(event) => {
                event.preventDefault()
                const query = term.trim()

                navigate(query === '' ? '/discover' : `/discover?search=${encodeURIComponent(query)}`)
                input.current?.blur()
            }}
        >
            <MagnifyingGlassIcon size={16} aria-hidden="true" className="workspace-search-icon" />
            <input
                ref={input}
                type="search"
                name="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search tenders, buyers or reference numbers"
                aria-label="Search tenders"
                autoComplete="off"
            />
            <Kbd className="workspace-search-hint" aria-hidden="true">
                /
            </Kbd>
        </form>
    )
}
