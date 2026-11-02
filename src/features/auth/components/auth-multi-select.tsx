import { useEffect, useId, useRef, useState } from 'react'
import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/button'
import { AuthField } from './auth-field'
import { useDisclosureMotion } from '@/shared/lib/use-disclosure-motion'

/** Registration's searchable, multi-value field, composed from the existing auth controls. */
export function AuthMultiSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    hint,
}: {
    readonly label: string
    readonly options: readonly string[]
    readonly value: readonly string[]
    readonly onChange: (value: string[]) => void
    readonly placeholder: string
    readonly required?: boolean
    readonly disabled?: boolean
    readonly hint?: string
}) {
    const id = useId()
    const root = useRef<HTMLDivElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(false)
    const panel = useDisclosureMotion(open, 0.22, 'power2.out')
    const [query, setQuery] = useState('')
    const filtered = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))

    useEffect(() => {
        if (!open) return
        root.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
        function outside(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('pointerdown', outside)
        return () => document.removeEventListener('pointerdown', outside)
    }, [open])

    function close() {
        setOpen(false)
        trigger.current?.focus()
    }

    return (
        <div
            className="auth-multi-select"
            ref={root}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && open) {
                    event.preventDefault()
                    close()
                }
            }}
        >
            <div className="auth-multi-label">
                <label className="auth-label" htmlFor={`${id}-trigger`}>
                    {label}
                    {required && (
                        <span className="auth-required" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    )}
                </label>
                <span className="auth-selection-count" aria-live="polite">
                    {value.length} selected
                </span>
            </div>
            <div className="auth-multi-control" data-open={open}>
                {value.map((option) => (
                    <Button
                        key={option}
                        variant="ghost"
                        className="auth-selection-chip"
                        aria-label={`Remove ${option}`}
                        onClick={() => onChange(value.filter((item) => item !== option))}
                    >
                        <span>{option}</span>
                        <XIcon size={14} />
                    </Button>
                ))}
                <Button
                    ref={trigger}
                    id={`${id}-trigger`}
                    variant="ghost"
                    className="auth-multi-trigger"
                    disabled={disabled}
                    aria-label={`${label}${required ? ' (required)' : ''}`}
                    aria-expanded={open}
                    aria-controls={`${id}-panel`}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    onClick={() => {
                        setQuery('')
                        setOpen(!open)
                    }}
                >
                    {value.length === 0 && <span>{placeholder}</span>}
                    <CaretDownIcon size={19} />
                </Button>
            </div>
            {hint && (
                <p className="auth-field-hint" id={`${id}-hint`}>
                    {hint}
                </p>
            )}
            <div
                ref={panel}
                className="auth-multi-motion"
                id={`${id}-panel`}
                role="region"
                aria-label={`${label} options`}
                aria-hidden={!open}
                inert={!open}
            >
                <div className="auth-multi-panel">
                    <AuthField
                        label={`Search ${label.toLowerCase()}`}
                        icon={MagnifyingGlassIcon}
                        type="search"
                        placeholder={`Search ${label.toLowerCase()}…`}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <div className="auth-multi-options">
                        {filtered.map((option) => (
                            <label key={option} className="auth-multi-option">
                                <input
                                    type="checkbox"
                                    checked={value.includes(option)}
                                    onChange={() =>
                                        onChange(
                                            value.includes(option)
                                                ? value.filter((item) => item !== option)
                                                : [...value, option],
                                        )
                                    }
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                        {filtered.length === 0 && <p className="auth-multi-empty">No matches. Try another search.</p>}
                    </div>
                    <div className="auth-multi-footer">
                        <Button variant="ghost" onClick={() => onChange([])}>
                            Clear all
                        </Button>
                        <Button onClick={close}>Done ({value.length})</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
