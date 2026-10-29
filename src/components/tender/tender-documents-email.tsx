import { useState } from 'react'
import { emailTenderDocuments, requestTenderDocuments, type BidPackEmailResult } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { formatDate } from '@/lib/format'
import type { BidPackEmailState } from '@/types'

interface TenderDocumentsEmailProps
{
    readonly tenderId: string
    readonly state: BidPackEmailState
    /** Called after a send so the page can refresh the log. */
    readonly onSent: () => void
}

function outcome(result: BidPackEmailResult, sentText: string): { ok: boolean, text: string }
{
    if (result.status === 'sent') {
        return { ok: true, text: sentText }
    }

    return { ok: false, text: result.status === 'disabled' ? 'Email is not set up on this server yet.' : `Not sent: ${result.detail}` }
}

/**
 * "Get the documents by email": the server downloads the tender's own files and
 * mails them with the pre-filled pack to the bid team. When the source lists no
 * files, the buyer can be asked for them instead, after the person has read the
 * exact email that will go out.
 */
export function TenderDocumentsEmail({ tenderId, state, onSent }: TenderDocumentsEmailProps)
{
    const [to, setTo] = useState(state.recipients[0] ?? '')
    const [busy, setBusy] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [result, setResult] = useState<{ ok: boolean, text: string } | null>(null)

    async function run(action: () => Promise<{ ok: boolean, text: string }>): Promise<void>
    {
        setBusy(true)
        setResult(null)

        try {
            setResult(await action())
            onSent()
        } catch (cause) {
            setResult({ ok: false, text: cause instanceof Error ? cause.message : 'Could not send' })
        } finally {
            setBusy(false)
            setConfirming(false)
        }
    }

    const sendDocuments = (): Promise<void> => run(async () =>
    {
        const sent = await emailTenderDocuments(tenderId, to)
        const files = sent.attached ?? 0
        const links = sent.linked ?? 0

        return outcome(sent, `Sent to ${to}: the bid pack${files > 0 ? ` and ${files} tender file${files === 1 ? '' : 's'}` : ''}${links > 0 ? `, with ${links} link${links === 1 ? '' : 's'} for files too large or unavailable` : ''}. Check your inbox in a minute.`)
    })

    const sendRequest = (): Promise<void> => run(async () =>
        outcome(await requestTenderDocuments(tenderId), `Request sent to ${state.request?.to ?? 'the buyer'}. Their reply comes to ${state.request?.replyTo ?? 'your bid email'}.`))

    return (
        <div className="flex flex-col gap-3">
            {!state.configured && (
                <p className="text-xs text-ink/60">Email isn't set up on this server yet, so nothing can be sent from here. The live app sends once its email key is set.</p>
            )}

            {state.recipients.length === 0 ? (
                <p className="text-sm text-ink/70">Add an email address to your bid profile to get documents by email.</p>
            ) : (
                <>
                    <p className="text-sm text-ink/70">
                        {state.documentCount > 0
                            ? `The buyer lists ${state.documentCount} file${state.documentCount === 1 ? '' : 's'}. We download them and email them to you with your pre-filled pack.`
                            : 'The source lists no files for this tender. We can still email you the pre-filled pack.'}
                    </p>
                    {state.recipients.length > 1 && (
                        <Field label="Send to" htmlFor="pack-email-to">
                            <Select id="pack-email-to" value={to} onChange={(event) => setTo(event.target.value)}>
                                {state.recipients.map((email) => <option key={email} value={email}>{email}</option>)}
                            </Select>
                        </Field>
                    )}
                    <Button onClick={() => void sendDocuments()} disabled={busy || to === '' || !state.configured}>
                        {busy && !confirming ? 'Sending…' : `Email ${state.documentCount > 0 ? 'documents and pack' : 'the pack'} to ${state.recipients.length > 1 ? 'me' : to}`}
                    </Button>
                </>
            )}

            {state.documentCount === 0 && state.request !== null && (
                <div className="flex flex-col gap-2 border-t border-line pt-3">
                    <p className="text-sm text-ink/70">Ask the buyer to email you the bid documents. You'll see the exact email before it goes.</p>
                    {!confirming ? (
                        <Button variant="secondary" onClick={() => setConfirming(true)} disabled={busy || !state.configured}>Request documents from buyer</Button>
                    ) : (
                        <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55">To {state.request.to} · copy and replies to {state.request.replyTo}</p>
                            <p className="text-sm font-medium text-ink">{state.request.subject}</p>
                            <pre className="whitespace-pre-wrap font-sans text-sm text-ink/80">{state.request.text}</pre>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => void sendRequest()} disabled={busy}>{busy ? 'Sending…' : 'Send to buyer'}</Button>
                                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {result !== null && (
                <p className={result.ok ? 'text-sm text-success' : 'text-sm text-danger'} role={result.ok ? 'status' : 'alert'}>{result.text}</p>
            )}

            {state.sent.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-line pt-3">
                    {state.sent.map((entry) => (
                        <li key={`${entry.createdAt}-${entry.recipient}-${entry.kind}`} className="flex flex-wrap items-center gap-2 text-xs text-ink/70">
                            <Badge tone={entry.status === 'sent' ? 'success' : 'danger'}>{entry.status}</Badge>
                            {entry.kind === 'request' ? 'Requested from' : 'Emailed to'} {entry.recipient} · {formatDate(entry.createdAt)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
