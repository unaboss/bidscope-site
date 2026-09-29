import { useCallback, useEffect, useMemo, useState } from 'react'
import { createCompliance, deleteCompliance, getAccount, listCompliance, listComplianceChecks, runComplianceCheck, updateCompliance } from '@/api'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/field'
import { IconPlus, IconShieldCheck } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate, relativeDays } from '@/lib/format'
import type {
    Account,
    ComplianceCheck,
    ComplianceCrossCheck,
    ComplianceDocumentView,
    ComplianceInput,
    ComplianceMode,
    ComplianceStatus,
    ComplianceTypeDef,
} from '@/types'

const STATUS_TONE: Record<ComplianceStatus, BadgeTone> = {
    expired: 'danger',
    recheck_due: 'warn',
    expiring: 'warn',
    valid: 'success',
}

const STATUS_LABEL: Record<ComplianceStatus, string> = {
    expired: 'Expired',
    recheck_due: 'Recheck due',
    expiring: 'Expiring',
    valid: 'Valid',
}

interface FormState
{
    type: string
    label: string
    number: string
    mode: ComplianceMode
    issueDate: string
    expiryDate: string
    recheckIntervalDays: string
    lastVerifiedDate: string
    notes: string
}

const EMPTY_FORM: FormState = {
    type: 'bbbee_certificate',
    label: '',
    number: '',
    mode: 'fixed_expiry',
    issueDate: '',
    expiryDate: '',
    recheckIntervalDays: '365',
    lastVerifiedDate: '',
    notes: '',
}

function formFromDocument(document: ComplianceDocumentView): FormState
{
    return {
        type: document.type,
        label: document.label ?? '',
        number: document.number ?? '',
        mode: document.mode,
        issueDate: document.issueDate ?? '',
        expiryDate: document.expiryDate ?? '',
        recheckIntervalDays: document.recheckIntervalDays !== null ? String(document.recheckIntervalDays) : '',
        lastVerifiedDate: document.lastVerifiedDate ?? '',
        notes: document.notes ?? '',
    }
}

function toInput(form: FormState): ComplianceInput
{
    const interval = Number(form.recheckIntervalDays)

    return {
        type: form.type,
        label: form.label.trim() === '' ? null : form.label.trim(),
        number: form.number.trim() === '' ? null : form.number.trim(),
        mode: form.mode,
        issueDate: form.issueDate === '' ? null : form.issueDate,
        expiryDate: form.expiryDate === '' ? null : form.expiryDate,
        recheckIntervalDays: form.recheckIntervalDays.trim() === '' || !Number.isFinite(interval) ? null : interval,
        lastVerifiedDate: form.lastVerifiedDate === '' ? null : form.lastVerifiedDate,
        notes: form.notes.trim() === '' ? null : form.notes.trim(),
    }
}

export function CompliancePage()
{
    const [documents, setDocuments] = useState<ComplianceDocumentView[]>([])
    const [crossChecks, setCrossChecks] = useState<ComplianceCrossCheck[]>([])
    const [types, setTypes] = useState<ComplianceTypeDef[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [open, setOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [checks, setChecks] = useState<ComplianceCheck[]>([])
    const [checking, setChecking] = useState(false)
    const [checkMessage, setCheckMessage] = useState('')
    const [account, setAccount] = useState<Account | null>(null)

    const loadChecks = useCallback(async (signal?: AbortSignal) =>
    {
        setChecks(await listComplianceChecks(signal))
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()
        loadChecks(controller.signal).catch(() => undefined)
        getAccount(controller.signal).then((result) => setAccount(result)).catch(() => undefined)

        return () => controller.abort()
    }, [loadChecks])

    // Unknown while loading: show the check as available until we know otherwise.
    const complianceEnabled = account === null || account.features.some((feature) => feature.key === 'compliance_monitoring' && feature.enabled)

    async function runCheck(): Promise<void>
    {
        setChecking(true)
        setCheckMessage('')

        try {
            const result = await runComplianceCheck()
            setCheckMessage(result.detail)
            await loadChecks()
        } catch (cause: unknown) {
            setCheckMessage(cause instanceof Error ? cause.message : 'Check failed')
        } finally {
            setChecking(false)
        }
    }

    const load = useCallback(async (signal?: AbortSignal) =>
    {
        const result = await listCompliance(signal)
        setDocuments(result.documents)
        setCrossChecks(result.crossChecks)
        setTypes(result.types)
    }, [])

    useEffect(() =>
    {
        const controller = new AbortController()

        load(controller.signal)
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load compliance')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [load])

    function openCreate(): void
    {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setOpen(true)
    }

    function openEdit(document: ComplianceDocumentView): void
    {
        setEditingId(document.id)
        setForm(formFromDocument(document))
        setOpen(true)
    }

    function applyType(value: string): void
    {
        const definition = types.find((item) => item.value === value)

        setForm((current) => ({
            ...current,
            type: value,
            mode: definition?.mode ?? current.mode,
            recheckIntervalDays: definition?.intervalDays !== null && definition?.intervalDays !== undefined
                ? String(definition.intervalDays)
                : current.recheckIntervalDays,
        }))
    }

    async function save(): Promise<void>
    {
        setSaving(true)
        setError('')

        try {
            const input = toInput(form)

            if (editingId === null) {
                await createCompliance(input)
            } else {
                await updateCompliance(editingId, input)
            }

            setOpen(false)
            await load()
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not save document')
        } finally {
            setSaving(false)
        }
    }

    async function remove(id: string): Promise<void>
    {
        await deleteCompliance(id)
        await load()
    }

    const crossChecksByDoc = useMemo(() =>
    {
        const map = new Map<string, ComplianceCrossCheck[]>()

        for (const check of crossChecks) {
            const list = map.get(check.docId) ?? []
            list.push(check)
            map.set(check.docId, list)
        }

        return map
    }, [crossChecks])

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Compliance"
                description="Your company documents in one vault, with expiry and re-check reminders cross-checked against bid deadlines."
                actions={<Button onClick={openCreate}><IconPlus className="size-4" />Add document</Button>}
            />

            {complianceEnabled
                ? (
                    <section className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-panel">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="secondary" onClick={() => void runCheck()} disabled={checking}>
                                {checking ? 'Checking…' : 'Check registration status'}
                            </Button>
                            {checkMessage !== '' && <span className="text-sm text-ink/60">{checkMessage}</span>}
                        </div>
                        {checks.length > 0 && (
                            <ul className="flex flex-col gap-1 text-sm text-ink/70">
                                {checks.slice(0, 5).map((check) => (
                                    <li key={check.id} className="flex items-center justify-between gap-3">
                                        <span>{check.detail ?? check.status}</span>
                                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">
                                            {check.source} · {formatDate(check.checkedAt.slice(0, 10))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )
                : (
                    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-line bg-panel p-5 shadow-panel">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-base font-semibold text-ink">Compliance monitoring</span>
                            <Badge tone="warn">Billable</Badge>
                            <Badge tone="neutral">Locked</Badge>
                        </div>
                        <p className="max-w-2xl text-sm text-ink/60">
                            A daily watch of your company registration and document expiry, with reminders and a
                            registration-status check. Available on a higher plan — billing goes live in a later phase;
                            contact North Tech to enable it.
                        </p>
                    </section>
                )}

            {loading && <p className="text-sm text-ink/60">Loading compliance…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
                    {error}
                </p>
            )}

            {!loading && documents.length === 0 && (
                <EmptyState
                    icon={<IconShieldCheck className="size-5" />}
                    title="No documents on file"
                    description="Store CIDB, tax clearance, B-BBEE and COIDA records once; we warn you before they lapse and before a bid relies on an expired one."
                    hint="Phase 3 · compliance vault"
                />
            )}

            {!loading && documents.length > 0 && (
                <ul className="flex flex-col gap-3">
                    {documents.map((document) =>
                    {
                        const state = document.state
                        const checks = crossChecksByDoc.get(document.id) ?? []

                        return (
                            <li key={document.id} className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-panel">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-ink">{document.label ?? document.type}</span>
                                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                                            {document.mode === 'rolling_recheck' ? 'Rechecked periodically' : 'Fixed expiry'}
                                            {document.number !== null && ` · ${document.number}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge tone={STATUS_TONE[state.status]}>{STATUS_LABEL[state.status]}</Badge>
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(document)}>Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => void remove(document.id)}>Delete</Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/70">
                                    {state.dueDate !== null && state.daysUntil !== null && (
                                        <span>
                                            Due {formatDate(state.dueDate)} ({relativeDays(state.daysUntil)})
                                        </span>
                                    )}
                                    {document.issueDate !== null && <span>Issued {formatDate(document.issueDate)}</span>}
                                </div>

                                {checks.length > 0 && (
                                    <ul className="flex flex-col gap-1 rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
                                        {checks.map((check) => (
                                            <li key={check.tenderId}>
                                                Expires {formatDate(check.dueDate)} — bookmarked “{check.tenderTitle}” closes {formatDate(check.closingDate)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}

            <Dialog open={open} title={editingId === null ? 'Add document' : 'Edit document'} onClose={() => setOpen(false)} size="lg">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Type" htmlFor="doc-type" className="sm:col-span-2">
                        <Select id="doc-type" value={form.type} onChange={(event) => applyType(event.target.value)}>
                            {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </Select>
                    </Field>

                    <Field label="Label" htmlFor="doc-label">
                        <Input id="doc-label" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="e.g. B-BBEE level 4" />
                    </Field>

                    <Field label="Number / reference" htmlFor="doc-number">
                        <Input id="doc-number" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
                    </Field>

                    <Field label="Tracking mode" htmlFor="doc-mode">
                        <Select id="doc-mode" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as ComplianceMode })}>
                            <option value="fixed_expiry">Fixed expiry date</option>
                            <option value="rolling_recheck">Rolling re-check</option>
                        </Select>
                    </Field>

                    <Field label="Issue date" htmlFor="doc-issue" hint="Optional">
                        <Input id="doc-issue" type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} />
                    </Field>

                    {form.mode === 'fixed_expiry'
                        ? (
                            <Field label="Expiry date" htmlFor="doc-expiry" className="sm:col-span-2">
                                <Input id="doc-expiry" type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
                            </Field>
                        )
                        : (
                            <>
                                <Field label="Last verified" htmlFor="doc-verified">
                                    <Input id="doc-verified" type="date" value={form.lastVerifiedDate} onChange={(event) => setForm({ ...form, lastVerifiedDate: event.target.value })} />
                                </Field>
                                <Field label="Re-check every (days)" htmlFor="doc-interval">
                                    <Input id="doc-interval" type="number" min={0} max={3650} value={form.recheckIntervalDays} onChange={(event) => setForm({ ...form, recheckIntervalDays: event.target.value })} />
                                </Field>
                            </>
                        )}

                    <Field label="Notes" htmlFor="doc-notes" className="sm:col-span-2">
                        <Textarea id="doc-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                    </Field>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save document'}</Button>
                </div>
            </Dialog>
        </div>
    )
}
