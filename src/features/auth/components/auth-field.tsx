import { useId, useState } from 'react'
import type { ComponentProps } from 'react'
import { EyeIcon, EyeSlashIcon, type Icon } from '@phosphor-icons/react'

export function AuthField({
    label,
    icon: Icon,
    type = 'text',
    error,
    hint,
    ...props
}: ComponentProps<'input'> & { readonly label: string; readonly icon: Icon; readonly error?: string; readonly hint?: string }) {
    const generatedId = useId()
    const id = props.id ?? generatedId
    const [visible, setVisible] = useState(false)
    const password = type === 'password'
    const description = [props['aria-describedby'], hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
    return (
        <div className="auth-field-group">
            <label className="auth-label" htmlFor={id}>{label}</label>
            <div className="auth-field">
                <Icon size={20} aria-hidden="true" />
                <input {...props} id={id} aria-describedby={description} aria-invalid={error ? true : props['aria-invalid']} type={password && visible ? 'text' : type} placeholder={props.placeholder ?? label} />
                {password && (
                    <button type="button" className="auth-password-toggle" aria-controls={id}
                        aria-label={visible ? 'Hide ' + label.toLowerCase() : 'Show ' + label.toLowerCase()}
                        aria-pressed={visible} onClick={() => setVisible(!visible)}>
                        {visible ? <EyeSlashIcon size={20} aria-hidden="true" /> : <EyeIcon size={20} aria-hidden="true" />}
                    </button>
                )}
            </div>
            {hint && <p className="auth-field-hint" id={`${id}-hint`}>{hint}</p>}
            {error && <p className="auth-field-error" id={`${id}-error`}>{error}</p>}
        </div>
    )
}
