import { useEffect, useState } from 'react'
import { getAccount, getSettings, saveSettings } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { SERVICE_LABELS } from '@/lib/service-lines'
import type { Account, Settings, SettingsInput } from '@/types'

const PROVINCES = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const SERVICE_CODES = Object.keys(SERVICE_LABELS)

interface FormState
{
    companyName: string
    ce: string
    gb: string
    sq: string
    serviceLines: string[]
    categories: string[]
    provinces: string[]
    notifyEmail: string
    notifyEnabled: boolean
    tenderLeadDays: string
    complianceLeadDays: string
    provider: string
    providerKey: string
}

function fromSettings(settings: Settings): FormState
{
    return {
        companyName: settings.companyName ?? '',
        ce: settings.cidbGrades.CE !== undefined ? String(settings.cidbGrades.CE) : '',
        gb: settings.cidbGrades.GB !== undefined ? String(settings.cidbGrades.GB) : '',
        sq: settings.cidbGrades.SQ !== undefined ? String(settings.cidbGrades.SQ) : '',
        serviceLines: settings.serviceLines,
        categories: settings.categories,
        provinces: settings.provinces,
        notifyEmail: settings.notifyEmail ?? '',
        notifyEnabled: settings.notifyEnabled,
        tenderLeadDays: settings.tenderLeadDays.join(', '),
        complianceLeadDays: settings.complianceLeadDays.join(', '),
        provider: settings.provider ?? '',
        providerKey: '',
    }
}

function parseDays(value: string, fallback: number[]): number[]
{
    const parsed = value.split(',').map((part) => Number(part.trim())).filter((n) => Number.isFinite(n) && n >= 0)

    return parsed.length > 0 ? parsed : fallback
}

function numberOrNull(value: string): number | null
{
    const n = Number(value)

    return value.trim() !== '' && Number.isFinite(n) ? Math.trunc(n) : null
}

function toInput(form: FormState): SettingsInput
{
    const cidbGrades: Record<string, number> = {}

    if (numberOrNull(form.ce) !== null) {
        cidbGrades.CE = numberOrNull(form.ce) ?? 0
    }

    if (numberOrNull(form.gb) !== null) {
        cidbGrades.GB = numberOrNull(form.gb) ?? 0
    }

    if (numberOrNull(form.sq) !== null) {
        cidbGrades.SQ = numberOrNull(form.sq) ?? 0
    }

    return {
        companyName: form.companyName.trim() === '' ? null : form.companyName.trim(),
        cidbGrades,
        serviceLines: form.serviceLines,
        categories: form.categories,
        provinces: form.provinces,
        notifyEmail: form.notifyEmail.trim() === '' ? null : form.notifyEmail.trim(),
        notifyEnabled: form.notifyEnabled,
        tenderLeadDays: parseDays(form.tenderLeadDays, [7, 3, 1]),
        complianceLeadDays: parseDays(form.complianceLeadDays, [60, 30, 7]),
        provider: form.provider.trim() === '' ? null : form.provider.trim(),
        ...(form.providerKey.trim() !== '' ? { providerKey: form.providerKey.trim() } : {}),
    }
}

function toggle(list: string[], value: string): string[]
{
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function SettingsPage()
{
    const [form, setForm] = useState<FormState | null>(null)
    const [account, setAccount] = useState<Account | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() =>
    {
        const controller = new AbortController()

        getAccount(controller.signal).then((result) => setAccount(result)).catch(() => undefined)

        getSettings(controller.signal)
            .then((settings) =>
            {
                setForm(fromSettings(settings))
            })
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load settings')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [])

    async function save(): Promise<void>
    {
        if (form === null) {
            return
        }

        setSaving(true)
        setError('')
        setMessage('')

        try {
            const settings = await saveSettings(toInput(form))
            setForm(fromSettings(settings))
            setMessage('Settings saved.')
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not save settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Workspace"
                title="Settings"
                description="Company profile and notifications."
            />

            {loading && <p className="text-sm text-ink/60">Loading settings…</p>}

            {!loading && error !== '' && (
                <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && form !== null && (
                <div className="flex max-w-3xl flex-col gap-8 rounded-xl border border-line bg-panel p-6 shadow-panel">
                    {account !== null && (
                        <section className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Plan &amp; features</h2>
                                <Badge tone="navy">{account.effectivePlan}</Badge>
                                {account.trialActive && account.trialDaysLeft !== null && (
                                    <Badge tone="warn">Trial · {account.trialDaysLeft} day{account.trialDaysLeft === 1 ? '' : 's'} left</Badge>
                                )}
                            </div>
                            <ul className="flex flex-col gap-2">
                                {account.features.map((feature) => (
                                    <li key={feature.key} className="flex items-start justify-between gap-3 rounded-md border border-line px-3 py-2">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-2 text-sm text-ink">
                                                {feature.label}
                                                {feature.billable && <Badge tone="warn">Billable</Badge>}
                                            </span>
                                            <span className="text-xs text-ink/55">{feature.description}</span>
                                        </div>
                                        <Badge tone={feature.enabled ? 'success' : 'neutral'}>{feature.enabled ? 'Included' : 'Locked'}</Badge>
                                    </li>
                                ))}
                            </ul>
                            {account.features.some((feature) => feature.billable && !feature.enabled) && (
                                <p className="text-sm text-ink/60">
                                    Locked features are available on a higher plan. Billing goes live in a later phase — contact North Tech to upgrade.
                                </p>
                            )}
                        </section>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2">
                        <Field label="Company name" htmlFor="set-name" className="sm:col-span-2">
                            <Input id="set-name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                        </Field>
                        <Field label="CIDB CE grade" htmlFor="set-ce" hint="Leave blank if not graded">
                            <Input id="set-ce" type="number" min={0} max={9} value={form.ce} onChange={(e) => setForm({ ...form, ce: e.target.value })} />
                        </Field>
                        <Field label="CIDB GB grade" htmlFor="set-gb">
                            <Input id="set-gb" type="number" min={0} max={9} value={form.gb} onChange={(e) => setForm({ ...form, gb: e.target.value })} />
                        </Field>
                        <Field label="CIDB SQ grade" htmlFor="set-sq">
                            <Input id="set-sq" type="number" min={0} max={9} value={form.sq} onChange={(e) => setForm({ ...form, sq: e.target.value })} />
                        </Field>
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Service lines</h2>
                        <div className="flex flex-wrap gap-3">
                            {SERVICE_CODES.map((code) => (
                                <label key={code} className="flex items-center gap-2 text-sm text-ink/80">
                                    <input
                                        type="checkbox"
                                        checked={form.serviceLines.includes(code)}
                                        onChange={() => setForm({ ...form, serviceLines: toggle(form.serviceLines, code) })}
                                        className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                                    />
                                    {SERVICE_LABELS[code]}
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Tender categories</h2>
                        {form.categories.length === 0 ? (
                            <p className="text-sm text-ink/60">No categories set yet. You choose these during sign-up; the editable picker arrives with the onboarding rebuild.</p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {form.categories.map((category) => (
                                    <li key={category} className="rounded-full border border-line px-3 py-1 text-xs text-ink/80">{category}</li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">Provinces</h2>
                        <div className="flex flex-wrap gap-3">
                            {PROVINCES.map((province) => (
                                <label key={province} className="flex items-center gap-2 text-sm text-ink/80">
                                    <input
                                        type="checkbox"
                                        checked={form.provinces.includes(province)}
                                        onChange={() => setForm({ ...form, provinces: toggle(form.provinces, province) })}
                                        className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                                    />
                                    {province}
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2">
                        <Field label="Notification email" htmlFor="set-email" className="sm:col-span-2">
                            <Input id="set-email" type="email" value={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })} />
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={form.notifyEnabled}
                                onChange={(e) => setForm({ ...form, notifyEnabled: e.target.checked })}
                                className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                            />
                            Email me deadline and compliance reminders
                        </label>
                        <Field label="Tender lead days" htmlFor="set-tender-days" hint="Comma-separated, e.g. 7, 3, 1">
                            <Input id="set-tender-days" value={form.tenderLeadDays} onChange={(e) => setForm({ ...form, tenderLeadDays: e.target.value })} />
                        </Field>
                        <Field label="Compliance lead days" htmlFor="set-comp-days" hint="Comma-separated, e.g. 60, 30, 7">
                            <Input id="set-comp-days" value={form.complianceLeadDays} onChange={(e) => setForm({ ...form, complianceLeadDays: e.target.value })} />
                        </Field>
                    </section>

                    <div className="flex items-center gap-4">
                        <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
                        {message !== '' && <span className="text-sm text-success">{message}</span>}
                    </div>
                </div>
            )}
        </div>
    )
}
