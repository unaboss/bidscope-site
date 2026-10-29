import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bidPackPrintUrl, getBidPack, getBidProfile, saveBidPack } from '@/api'
import { BuyerDocuments } from '@/components/tender/buyer-documents'
import { TenderDocumentsEmail } from '@/components/tender/tender-documents-email'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/controls'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/field'
import { IconDownload, IconQuote } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { daysUntil, formatDate, formatZAR, relativeDays } from '@/lib/format'
import { usePreview } from '@/lib/preview'
import type { BidPackInputs, BidPackSummary, PackAttachment } from '@/types'

/** A price line as typed: numbers stay strings until saved, so a half-typed value is not lost. */
interface LineDraft
{
    description: string
    quantity: string
    unit: string
    unitPrice: string
}

const ATTACHMENT_STATUS: Readonly<Record<PackAttachment['status'], { readonly label: string, readonly tone: BadgeTone }>> = {
    have: { label: 'On file', tone: 'success' },
    expired: { label: 'Expired', tone: 'danger' },
    missing: { label: 'Not on file', tone: 'warn' },
    manual: { label: 'Prepare', tone: 'neutral' },
}

function Panel(props: { readonly title: string, readonly description?: string, readonly children: ReactNode })
{
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex flex-col gap-1">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">{props.title}</h2>
                {props.description !== undefined && <p className="text-sm text-ink/60">{props.description}</p>}
            </div>
            {props.children}
        </section>
    )
}

function toDrafts(inputs: BidPackInputs): LineDraft[]
{
    return inputs.lines.map((line) => ({
        description: line.description,
        quantity: String(line.quantity),
        unit: line.unit,
        unitPrice: String(line.unitPrice),
    }))
}

function amount(value: string): number
{
    const parsed = Number(value.replace(/[\s,]/g, ''))

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function BidPackPage()
{
    const { id } = useParams()
    const readOnly = usePreview() !== null
    const [pack, setPack] = useState<BidPackSummary | null>(null)
    const [people, setPeople] = useState<string[]>([])
    const [lines, setLines] = useState<LineDraft[]>([])
    const [deliveryPeriod, setDeliveryPeriod] = useState('')
    const [coverNote, setCoverNote] = useState('')
    const [chosen, setChosen] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    function load(summary: BidPackSummary): void
    {
        setPack(summary)
        setLines(toDrafts(summary.inputs))
        setDeliveryPeriod(summary.inputs.deliveryPeriod)
        setCoverNote(summary.inputs.coverNote)
        setChosen([...summary.inputs.personnel])
        setDirty(false)
    }

    useEffect(() =>
    {
        if (id === undefined || readOnly) {
            setLoading(false)

            return
        }

        const controller = new AbortController()

        Promise.all([getBidPack(id, controller.signal), getBidProfile(controller.signal)])
            .then(([summary, profile]) =>
            {
                load(summary)
                setPeople(profile.profile.personnel.map((person) => person.fullName ?? '').filter((name) => name.trim() !== ''))
            })
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to build the bid pack')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [id, readOnly])

    function edit<T>(setter: (value: T) => void): (value: T) => void
    {
        return (value) =>
        {
            setter(value)
            setDirty(true)
            setMessage('')
        }
    }

    const setLinesDirty = edit(setLines)

    /** Saves the typed inputs; `goals` replaces the accepted specific goals when given. */
    async function save(goals?: Pick<BidPackInputs, 'preferenceSystem' | 'goals'>): Promise<void>
    {
        if (id === undefined || pack === null) {
            return
        }

        setSaving(true)
        setError('')

        try {
            const inputs: BidPackInputs = {
                preferenceSystem: goals?.preferenceSystem ?? pack.inputs.preferenceSystem,
                goals: goals?.goals ?? pack.inputs.goals,
                lines: lines
                    .filter((line) => line.description.trim() !== '')
                    .map((line) => ({ description: line.description.trim(), quantity: amount(line.quantity), unit: line.unit.trim(), unitPrice: amount(line.unitPrice) })),
                deliveryPeriod: deliveryPeriod.trim(),
                coverNote: coverNote.trim(),
                personnel: chosen,
            }
            load(await saveBidPack(id, inputs))
            setMessage(goals !== undefined ? 'Saved. The preference points claim form now uses these goals.' : 'Saved. The printed pack now uses these figures.')
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save the pack')

            if (goals !== undefined) {
                throw cause
            }
        } finally {
            setSaving(false)
        }
    }

    const back = id !== undefined
        ? <Link to={`/tenders/${encodeURIComponent(id)}`} className="w-fit font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60 hover:text-ink">← Back to tender</Link>
        : null

    if (readOnly) {
        return (
            <div className="flex flex-col gap-6">
                {back}
                <EmptyState icon={<IconQuote className="size-5" />} title="Bid packs need an account" description="Sign in to generate a bid pack from your company's own details." hint="Preview" />
            </div>
        )
    }

    if (loading) {
        return <div className="flex flex-col gap-6">{back}<p className="text-sm text-ink/60">Building the bid pack…</p></div>
    }

    if (pack === null || id === undefined) {
        return (
            <div className="flex flex-col gap-6">
                {back}
                <EmptyState icon={<IconQuote className="size-5" />} title="Bid pack unavailable" description={error !== '' ? error : 'This tender could not be loaded.'} hint="Bid pack" />
            </div>
        )
    }

    const ready = pack.documents.filter((doc) => doc.missing.length === 0).length
    const profileGaps = pack.documents.some((doc) => doc.missing.some((label) => !label.endsWith('(on this page)')))
    const closingIn = pack.tender.closingDate !== null ? daysUntil(pack.tender.closingDate) : null
    const draftTotal = lines.reduce((sum, line) => sum + amount(line.quantity) * amount(line.unitPrice), 0)
    const draftVat = pack.totals.vatRegistered ? draftTotal * 0.15 : 0

    return (
        <div className="flex flex-col gap-6">
            {back}

            <PageHeader
                eyebrow={`Bid pack${pack.municipal ? ' · municipal (MBD forms)' : ''}`}
                title={pack.tender.title ?? 'Untitled tender'}
                description={[
                    pack.tender.organOfState,
                    pack.tender.tenderNo,
                    pack.tender.closingDate !== null ? `closes ${formatDate(pack.tender.closingDate)}${closingIn !== null ? ` (${relativeDays(closingIn)})` : ''}` : null,
                ].filter((part): part is string => part !== null).join(' · ')}
                actions={(
                    <Button asChild>
                        <a href={bidPackPrintUrl(id)} target="_blank" rel="noopener noreferrer">
                            <IconDownload className="size-4" />
                            Open full pack
                        </a>
                    </Button>
                )}
            />

            {pack.warnings.length > 0 && (
                <div className="flex flex-col gap-1 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
                    {pack.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
            )}

            {error !== '' && <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <Panel
                        title={`Documents · ${ready} of ${pack.documents.length} fully pre-filled`}
                        description="Open the full pack to print every document in order, or save it as one PDF from the print dialog. Blank lines are left for anything your profile does not hold."
                    >
                        {profileGaps && (
                            <p className="text-sm text-ink/70">
                                Some details are missing from your company record. <Link to="/bid-profile" className="text-navy underline">Complete the bid profile</Link> once and every pack fills in.
                            </p>
                        )}
                        <ul className="flex flex-col divide-y divide-line">
                            {pack.documents.map((doc) => (
                                <li key={doc.key} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {doc.code !== null && <span className="font-mono text-[11px] font-semibold text-navy">{doc.code}</span>}
                                            <span className="text-sm font-medium text-ink">{doc.title}</span>
                                            {doc.missing.length === 0 ? <Badge tone="success">Pre-filled</Badge> : <Badge tone="warn">{doc.missing.length} to complete</Badge>}
                                            {doc.needsSignature && <Badge>Sign</Badge>}
                                            {doc.needsCommissioner && <Badge tone="danger">Commissioner of Oaths</Badge>}
                                        </div>
                                        <p className="text-xs text-ink/60">{doc.purpose}</p>
                                        {doc.missing.length > 0 && <p className="text-xs text-ink/70">Missing: {doc.missing.join(', ')}</p>}
                                    </div>
                                    <a href={bidPackPrintUrl(id, doc.key)} target="_blank" rel="noopener noreferrer" className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-navy underline">Open</a>
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <Panel title="Pricing schedule and cover letter" description="Prices exclude VAT. VAT at 15% is added when your profile has a VAT number. If the tender has its own BOQ, use it and copy the totals.">
                        <div className="flex flex-col gap-2">
                            {lines.map((line, index) =>
                            {
                                const set = (patch: Partial<LineDraft>): void => setLinesDirty(lines.map((current, position) => (position === index ? { ...current, ...patch } : current)))

                                return (
                                    <div key={index} className="flex flex-col gap-2 rounded-lg border border-line p-3">
                                        <Input aria-label={`Line ${index + 1} description`} placeholder="Description" value={line.description} onChange={(event) => set({ description: event.target.value })} />
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
                                            <Input aria-label={`Line ${index + 1} quantity`} placeholder="Qty" inputMode="decimal" value={line.quantity} onChange={(event) => set({ quantity: event.target.value })} />
                                            <Input aria-label={`Line ${index + 1} unit`} placeholder="Unit" value={line.unit} onChange={(event) => set({ unit: event.target.value })} />
                                            <Input aria-label={`Line ${index + 1} unit price`} placeholder="Unit price (R)" inputMode="decimal" value={line.unitPrice} onChange={(event) => set({ unitPrice: event.target.value })} />
                                            <Button variant="danger" size="sm" className="h-10 shrink-0" onClick={() => setLinesDirty(lines.filter((_, position) => position !== index))}>Remove</Button>
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Button variant="secondary" size="sm" onClick={() => setLinesDirty([...lines, { description: '', quantity: '1', unit: 'each', unitPrice: '' }])}>Add line</Button>
                                <span className="font-mono text-xs text-ink/70">
                                    Sub-total {formatZAR(draftTotal)}{pack.totals.vatRegistered ? ` · VAT ${formatZAR(draftVat)}` : ' · not VAT registered'} · <strong>Total {formatZAR(draftTotal + draftVat)}</strong>
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Delivery / completion period" htmlFor="pack-delivery">
                                <Input id="pack-delivery" value={deliveryPeriod} placeholder="e.g. 12 weeks from appointment" onChange={(event) => edit(setDeliveryPeriod)(event.target.value)} />
                            </Field>
                            <Field label="Cover letter note" htmlFor="pack-note" hint="Optional paragraph for this tender only." className="sm:col-span-2">
                                <Textarea id="pack-note" value={coverNote} onChange={(event) => edit(setCoverNote)(event.target.value)} />
                            </Field>
                        </div>
                        {people.length > 0 && (
                            <Field label="Key personnel to put forward" htmlFor="pack-people" hint="None ticked puts everyone forward.">
                                <div id="pack-people" className="flex flex-wrap gap-x-5 gap-y-2">
                                    {people.map((name) => (
                                        <label key={name} className="flex items-center gap-2 text-sm text-ink/80">
                                            <input
                                                type="checkbox"
                                                className="size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                                                checked={chosen.includes(name)}
                                                onChange={(event) => edit(setChosen)(event.target.checked ? [...chosen, name] : chosen.filter((item) => item !== name))}
                                            />
                                            {name}
                                        </label>
                                    ))}
                                </div>
                            </Field>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button onClick={() => void save()} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save pack'}</Button>
                            {message !== '' && <span className="text-sm text-success" role="status">{message}</span>}
                            {dirty && message === '' && <span className="text-sm text-ink/55">Save before opening the pack to print these changes.</span>}
                        </div>
                    </Panel>
                </div>

                <div className="flex flex-col gap-6">
                    <Panel title="The buyer's documents" description="Read the scoring goals from the tender's own PDF and put them on the preference points claim form.">
                        <BuyerDocuments
                            tenderId={id}
                            sources={pack.sources}
                            accepted={pack.inputs.goals}
                            acceptedSystem={pack.inputs.preferenceSystem}
                            onAccept={(preferenceSystem, goals) => save({ preferenceSystem, goals })}
                        />
                    </Panel>

                    <Panel title="Get the documents by email">
                        <TenderDocumentsEmail
                            tenderId={id}
                            state={pack.email}
                            onSent={() => void getBidPack(id).then(setPack).catch(() => undefined)}
                        />
                    </Panel>

                    <Panel title="Attachments" description="Supporting documents to add behind the forms. Keep your certificates in the compliance vault to track expiry.">
                        <ul className="flex flex-col gap-2.5">
                            {pack.attachments.map((item) => (
                                <li key={item.label} className="flex flex-col gap-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={ATTACHMENT_STATUS[item.status].tone}>{ATTACHMENT_STATUS[item.status].label}</Badge>
                                        <span className="text-sm text-ink">{item.label}</span>
                                        {item.requiredByTender && <Badge tone="navy">In tender</Badge>}
                                    </div>
                                    <p className="text-xs text-ink/60">{item.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <Panel title="Still to do by hand" description="The pack can't sign, commission or submit for you.">
                        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink/80">
                            {pack.manualSteps.map((step) => <li key={step}>{step}</li>)}
                        </ol>
                    </Panel>
                </div>
            </div>
        </div>
    )
}
