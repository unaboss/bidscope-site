import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getAccount, getCategories, getClaims, getSettings, saveClaims, saveSettings } from '@/api'
import { CategoryPicker } from '@/components/onboarding/category-picker'
import { CsdUpload, type CsdApplied } from '@/components/profile/csd-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Input, Select } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import {
    answersFromClaims,
    CIDB_CLASSES,
    claimsForSave,
    needsCidb,
    parseCidbGrades,
    PROVINCES,
    type CsdImport,
    type EligibilityAnswers,
} from '@/lib/profile'
import { SERVICE_LABELS } from '@/lib/service-lines'
import type { Account, Claim, Settings, SettingsInput, Taxonomy } from '@/types'

const CIDB_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const BBEE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8]

interface FormState
{
    companyName: string
    categories: string[]
    cidbGrades: Record<string, string>
    provinces: string[]
    eligibility: EligibilityAnswers
    notifyEmail: string
    notifyEnabled: boolean
    tenderLeadDays: string
    complianceLeadDays: string
}

function toForm(settings: Settings, claims: readonly Claim[]): FormState
{
    return {
        companyName: settings.companyName ?? '',
        categories: settings.categories,
        cidbGrades: Object.fromEntries(
            Object.entries(settings.cidbGrades).filter(([, grade]) => grade > 0).map(([code, grade]) => [code, String(grade)]),
        ),
        provinces: settings.provinces,
        eligibility: answersFromClaims(claims),
        notifyEmail: settings.notifyEmail ?? '',
        notifyEnabled: settings.notifyEnabled,
        tenderLeadDays: settings.tenderLeadDays.join(', '),
        complianceLeadDays: settings.complianceLeadDays.join(', '),
    }
}

function parseDays(value: string, fallback: number[]): number[]
{
    const parsed = value.split(',').map((part) => Number(part.trim())).filter((n) => Number.isFinite(n) && n >= 0)

    return parsed.length > 0 ? parsed : fallback
}

/** Settings fields this page does not edit (service lines, provider) are passed through as stored. */
function toSettingsInput(form: FormState, stored: Settings): SettingsInput
{
    return {
        companyName: form.companyName.trim() === '' ? null : form.companyName.trim(),
        cidbGrades: parseCidbGrades(form.cidbGrades),
        serviceLines: stored.serviceLines,
        categories: form.categories,
        provinces: form.provinces,
        notifyEmail: form.notifyEmail.trim() === '' ? null : form.notifyEmail.trim(),
        notifyEnabled: form.notifyEnabled,
        tenderLeadDays: parseDays(form.tenderLeadDays, [7, 3, 1]),
        complianceLeadDays: parseDays(form.complianceLeadDays, [60, 30, 7]),
        provider: stored.provider,
    }
}

function toggle(list: readonly string[], value: string): string[]
{
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/** One titled panel of the profile form. */
function Section(props: { readonly title: string, readonly description?: string, readonly children: ReactNode })
{
    return (
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6 shadow-panel">
            <div className="flex flex-col gap-1">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">{props.title}</h2>
                {props.description !== undefined && <p className="text-sm text-ink/60">{props.description}</p>}
            </div>
            {props.children}
        </section>
    )
}

function VerifiedBadge(props: { readonly claims: readonly Claim[], readonly type: string })
{
    return props.claims.some((claim) => claim.claimType === props.type && claim.status === 'verified')
        ? <Badge tone="success">Verified</Badge>
        : null
}

export function ProfilePage()
{
    const [stored, setStored] = useState<Settings | null>(null)
    const [claims, setClaims] = useState<Claim[]>([])
    const [csdImport, setCsdImport] = useState<CsdImport | null>(null)
    const [form, setForm] = useState<FormState | null>(null)
    const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null)
    const [account, setAccount] = useState<Account | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() =>
    {
        const controller = new AbortController()

        getAccount(controller.signal).then(setAccount).catch(() => undefined)
        getCategories(controller.signal).then(setTaxonomy).catch(() => undefined)

        Promise.all([getSettings(controller.signal), getClaims(controller.signal)])
            .then(([settings, current]) =>
            {
                setStored(settings)
                setClaims(current)
                setForm(toForm(settings, current))
            })
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load your profile')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [])

    const showCidb = useMemo(() =>
    {
        if (form === null) {
            return false
        }

        const bucketOf = (label: string): string | undefined => taxonomy?.categories.find((entry) => entry.label === label)?.bucket

        return needsCidb(form.categories, bucketOf) || Object.values(form.cidbGrades).some((grade) => grade !== '')
    }, [form, taxonomy])

    // Grades held in classes outside the standard list still get a row, so saving never drops them.
    const cidbRows = useMemo(() =>
    {
        const known = new Set(CIDB_CLASSES.map((entry) => entry.code))
        const extra = Object.keys(form?.cidbGrades ?? {})
            .filter((code) => !known.has(code))
            .map((code) => ({ code, label: code }))

        return [...CIDB_CLASSES, ...extra]
    }, [form?.cidbGrades])

    function applyCsd(applied: CsdApplied): void
    {
        if (form === null) {
            return
        }

        const { report } = applied

        setForm({
            ...form,
            companyName: report.legalName,
            categories: [...new Set([...form.categories, ...applied.categories])],
            eligibility: { ...form.eligibility, csdRegistered: report.active, taxCompliant: report.taxCompliant },
        })
        setCsdImport({
            supplierNumber: report.supplierNumber,
            taxCompliant: report.taxCompliant,
            bbeeCert: applied.bbeeCurrent && report.bbee !== null && report.bbee.expires !== null
                ? { status: report.bbee.status, expires: report.bbee.expires }
                : null,
        })
        setError('')
        setMessage('Filled in from your CSD report. Check the details, add any CIDB grades and your B-BBEE level, then save.')
    }

    async function save(): Promise<void>
    {
        if (form === null || stored === null) {
            return
        }

        if (form.categories.length === 0 && stored.serviceLines.length === 0) {
            setError('Choose at least one tender category so we know which tenders to show you.')
            return
        }

        setSaving(true)
        setError('')
        setMessage('')

        try {
            const settings = await saveSettings(toSettingsInput(form, stored))
            const result = await saveClaims(claimsForSave(claims, form.eligibility, csdImport))

            setStored(settings)
            setClaims(result.claims)
            setCsdImport(null)
            setForm(toForm(settings, result.claims))
            setMessage(result.skipped.length > 0
                ? 'Profile saved. Some details were already verified from your documents and were kept as verified.'
                : 'Profile saved. Your feed now reflects these details.')
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : 'Could not save your profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 pb-24">
            <PageHeader
                eyebrow="Workspace"
                title="Company profile"
                description="What you do, where you work and what you hold. Bidscope uses this to match tenders and check whether you meet their requirements."
            />

            {loading && <p className="text-sm text-ink/60">Loading your profile…</p>}

            {!loading && error !== '' && (
                <p className="max-w-3xl rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {!loading && form !== null && stored !== null && (
                <div className="flex max-w-3xl flex-col gap-6">
                    <Section
                        title="Set up from your CSD report"
                        description="Upload your CSD Registration Summary Report (csd.gov.za → Reports) and we fill in your company, tender categories, CSD and tax status for you to check."
                    >
                        <CsdUpload taxonomy={taxonomy} onApply={applyCsd} />
                    </Section>

                    <Section title="Company" description="The kinds of work you do drive which tenders appear in your feed.">
                        <Field label="Company name" htmlFor="profile-name">
                            <Input
                                id="profile-name"
                                value={form.companyName}
                                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                                autoComplete="organization"
                            />
                        </Field>

                        <CategoryPicker
                            taxonomy={taxonomy}
                            value={form.categories}
                            onChange={(categories) => setForm({ ...form, categories })}
                        />

                        {stored.serviceLines.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">Legacy service lines</span>
                                <ul className="flex flex-wrap gap-2">
                                    {stored.serviceLines.map((code) => (
                                        <li key={code} className="rounded-full border border-line px-3 py-1 text-xs text-ink/70">{SERVICE_LABELS[code] ?? code}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-ink/50">Set up by North Tech for your account. Choosing categories above switches matching to categories.</p>
                            </div>
                        )}
                    </Section>

                    {showCidb && (
                        <Section title="CIDB grades" description="Your grade per class of works. Tenders that need a higher grade are flagged before you spend time on them.">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {cidbRows.map((entry) => (
                                    <Field key={entry.code} label={entry.label} htmlFor={`profile-cidb-${entry.code}`}>
                                        <Select
                                            id={`profile-cidb-${entry.code}`}
                                            value={form.cidbGrades[entry.code] ?? ''}
                                            onChange={(event) => setForm({ ...form, cidbGrades: { ...form.cidbGrades, [entry.code]: event.target.value } })}
                                        >
                                            <option value="">Not graded</option>
                                            {CIDB_GRADES.map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
                                        </Select>
                                    </Field>
                                ))}
                            </div>
                        </Section>
                    )}

                    <Section title="Where you work" description="Leave every province off to see tenders nationwide.">
                        <ChipGroup
                            label="Provinces"
                            options={PROVINCES.map((province) => ({ value: province, text: province }))}
                            selected={form.provinces}
                            onToggle={(value) => setForm({ ...form, provinces: toggle(form.provinces, value) })}
                        />
                    </Section>

                    <Section
                        title="Eligibility"
                        description="Common tender requirements. What you declare here marks matching requirements as met on each tender; leave anything you are unsure of unset."
                    >
                        <Field label="B-BBEE level" htmlFor="profile-bbee" hint="From your B-BBEE certificate or sworn affidavit.">
                            <div className="flex items-center gap-3">
                                <Select
                                    id="profile-bbee"
                                    value={form.eligibility.bbeeLevel === null ? '' : String(form.eligibility.bbeeLevel)}
                                    onChange={(event) => setForm({
                                        ...form,
                                        eligibility: { ...form.eligibility, bbeeLevel: event.target.value === '' ? null : Number(event.target.value) },
                                    })}
                                >
                                    <option value="">Not set</option>
                                    {BBEE_LEVELS.map((level) => <option key={level} value={level}>Level {level}</option>)}
                                </Select>
                                <VerifiedBadge claims={claims} type="bbee_level" />
                            </div>
                        </Field>

                        <label className="flex items-center gap-2 text-sm text-ink/80">
                            <input
                                type="checkbox"
                                checked={form.eligibility.csdRegistered}
                                onChange={(event) => setForm({ ...form, eligibility: { ...form.eligibility, csdRegistered: event.target.checked } })}
                                className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                            />
                            Registered on the Central Supplier Database (CSD)
                            <VerifiedBadge claims={claims} type="csd" />
                        </label>

                        <label className="flex items-center gap-2 text-sm text-ink/80">
                            <input
                                type="checkbox"
                                checked={form.eligibility.taxCompliant}
                                onChange={(event) => setForm({ ...form, eligibility: { ...form.eligibility, taxCompliant: event.target.checked } })}
                                className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                            />
                            Tax compliant with SARS (valid tax compliance status PIN)
                            <VerifiedBadge claims={claims} type="tax" />
                        </label>
                    </Section>

                    <Section title="Notifications">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Notification email" htmlFor="profile-email" className="sm:col-span-2">
                                <Input id="profile-email" type="email" value={form.notifyEmail} onChange={(event) => setForm({ ...form, notifyEmail: event.target.value })} />
                            </Field>
                            <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={form.notifyEnabled}
                                    onChange={(event) => setForm({ ...form, notifyEnabled: event.target.checked })}
                                    className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                                />
                                Email me deadline reminders
                            </label>
                            <Field label="Tender reminder days" htmlFor="profile-tender-days" hint="Days before closing, e.g. 7, 3, 1">
                                <Input id="profile-tender-days" value={form.tenderLeadDays} onChange={(event) => setForm({ ...form, tenderLeadDays: event.target.value })} />
                            </Field>
                        </div>
                    </Section>

                    {account !== null && (
                        <Section title="Plan">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge tone="navy">{account.effectivePlan}</Badge>
                                {account.trialActive && account.trialDaysLeft !== null && (
                                    <Badge tone="warn">Trial · {account.trialDaysLeft} day{account.trialDaysLeft === 1 ? '' : 's'} left</Badge>
                                )}
                            </div>
                        </Section>
                    )}

                    <div className="sticky bottom-0 -mx-1 flex items-center gap-4 border-t border-line bg-cream/95 px-1 py-4 backdrop-blur">
                        <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
                        {message !== '' && <span className="text-sm text-success" role="status">{message}</span>}
                    </div>
                </div>
            )}
        </div>
    )
}
