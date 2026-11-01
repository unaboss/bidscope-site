import { useState } from 'react'
import { ArrowRightIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react'

/** Prepares an email draft; no message is reported as sent without a delivery service. */
export function ContactInquiry() {
    const [draft, setDraft] = useState('')
    const [error, setError] = useState('')
    return (
        <form
            className="ds-contact-form"
            onInvalid={() =>
                setError(
                    'Please complete the required fields with a valid email address and a message of at least 10 characters.',
                )
            }
            onInput={() => {
                setError('')
                setDraft('')
            }}
            onSubmit={(event) => {
                event.preventDefault()
                setError('')
                const data = new FormData(event.currentTarget)
                const name = String(data.get('name') ?? '').trim()
                const email = String(data.get('email') ?? '').trim()
                const message = String(data.get('message') ?? '').trim()
                const body = message + '\n\nFrom: ' + name + '\nReply email: ' + email
                setDraft(
                    'mailto:support@northtech.africa?subject=' +
                        encodeURIComponent('Bidscope enquiry from ' + name) +
                        '&body=' +
                        encodeURIComponent(body),
                )
            }}
        >
            <h2>Send us a message</h2>
            <p>Write your enquiry, then open the prepared draft in your email app to send it.</p>
            <div className="ds-contact-fields">
                <label htmlFor="inquiry-name">
                    Full name
                    <input
                        id="inquiry-name"
                        name="name"
                        autoComplete="name"
                        required
                        aria-required="true"
                        maxLength={120}
                    />
                </label>
                <label htmlFor="inquiry-email">
                    Work email
                    <input
                        id="inquiry-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        aria-required="true"
                        maxLength={254}
                    />
                </label>
                <label htmlFor="inquiry-message">
                    Message
                    <textarea
                        id="inquiry-message"
                        name="message"
                        required
                        aria-required="true"
                        minLength={10}
                        maxLength={4000}
                    />
                </label>
            </div>
            <button className="bs-button" type="submit">
                Prepare email <ArrowRightIcon size={18} />
            </button>
            {error && (
                <p className="auth-error" role="alert">
                    {error}
                </p>
            )}
            {draft && (
                <div className="ds-contact-status" role="status">
                    Your draft is ready. It has not been sent.
                    <br />
                    <a href={draft}>
                        <EnvelopeSimpleIcon size={18} />
                        Open email draft
                    </a>
                </div>
            )}
        </form>
    )
}
