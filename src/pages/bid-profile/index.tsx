import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getBidProfile, saveBidProfile } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/controls'
import { Field } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate } from '@/lib/format'
import { usePreview } from '@/lib/preview'
import type { BidDirector, BidPerson, BidProfile, BidReference } from '@/types'
import {
    BBBEE_EVIDENCE,
    BBBEE_EVIDENCE_LABELS,
    ENTITY_TYPE_LABELS,
    ENTITY_TYPES,
    emptyBidProfile,
    profileEssentials,
} from '../../../worker/domain/bid-profile'

type Company = BidProfile['company']
type Contact = BidProfile['contact']
type Signatory = BidProfile['signatory']
type Bank = BidProfile['bank']
type Declarations = BidProfile['declarations']
type Narrative = BidProfile['narrative']

const CHECKBOX = 'size-4 rounded border-line text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy'

function Section(props: { readonly title: string, readonly description?: string, readonly children: ReactNode })
{
    return (
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-panel sm:p-6">
            <div className="flex flex-col gap-1">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-wax">{props.title}</h2>
                {props.description !== undefined && <p className="text-sm text-ink/60">{props.description}</p>}
            </div>
            {props.children}
        </section>
    )
}

/** A text field bound to one key of a profile section. */
function TextField<T extends Record<string, unknown>>(props: {
    readonly id: string
    readonly label: string
    readonly value: T
    readonly name: keyof T & string
    readonly onChange: (next: T) => void
    readonly hint?: string
    readonly type?: string
    readonly multiline?: boolean
    readonly className?: string
    readonly disabled?: boolean
})
{
    const current = props.value[props.name]
    const text = typeof current === 'string' ? current : ''
    const update = (value: string): void => props.onChange({ ...props.value, [props.name]: value })

    return (
        <Field label={props.label} htmlFor={props.id} hint={props.hint} className={props.className}>
            {props.multiline === true
                ? <Textarea id={props.id} value={text} disabled={props.disabled} onChange={(event) => update(event.target.value)} />
                : <Input id={props.id} type={props.type ?? 'text'} value={text} disabled={props.disabled} onChange={(event) => update(event.target.value)} />}
        </Field>
    )
}

/** Yes / No / not answered. Unanswered prints as empty boxes on the form. */
function YesNo(props: { readonly id: string, readonly label: string, readonly value: boolean | null | undefined, readonly onChange: (next: boolean | null) => void, readonly disabled?: boolean })
{
    const current = props.value === true ? 'yes' : props.value === false ? 'no' : ''

    return (
        <Field label={props.label} htmlFor={props.id}>
            <Select
                id={props.id}
                value={current}
                disabled={props.disabled}
                onChange={(event) => props.onChange(event.target.value === 'yes' ? true : event.target.value === 'no' ? false : null)}
            >
                <option value="">Not answered</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
            </Select>
        </Field>
    )
}

function numberOrNull(value: string): number | null
{
    const parsed = Number(value)

    return value.trim() === '' || !Number.isFinite(parsed) ? null : parsed
}

function replaceAt<T>(list: readonly T[], index: number, item: T): T[]
{
    return list.map((current, position) => (position === index ? item : current))
}

function RemoveButton(props: { readonly onClick: () => void, readonly disabled?: boolean })
{
    return <Button variant="danger" size="sm" onClick={props.onClick} disabled={props.disabled}>Remove</Button>
}

export function BidProfilePage()
{
    const [profile, setProfile] = useState<BidProfile>(emptyBidProfile())
    const [updatedAt, setUpdatedAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [dirty, setDirty] = useState(false)
    const csdInput = useRef<HTMLInputElement>(null)
    const readOnly = usePreview() !== null

    useEffect(() =>
    {
        if (readOnly) {
            setLoading(false)

            return
        }

        const controller = new AbortController()

        getBidProfile(controller.signal)
            .then((result) =>
            {
                setProfile(result.profile)
                setUpdatedAt(result.updatedAt)
            })
            .catch((cause: unknown) =>
            {
                if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                    setError(cause instanceof Error ? cause.message : 'Failed to load the bid profile')
                }
            })
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [readOnly])

    function change(next: BidProfile): void
    {
        setProfile(next)
        setDirty(true)
        setMessage('')
    }

    const company = (next: Company): void => change({ ...profile, company: next })
    const contact = (next: Contact): void => change({ ...profile, contact: next })
    const signatory = (next: Signatory): void => change({ ...profile, signatory: next })
    const bank = (next: Bank): void => change({ ...profile, bank: next })
    const declarations = (next: Declarations): void => change({ ...profile, declarations: next })
    const narrative = (next: Narrative): void => change({ ...profile, narrative: next })
    const directors = (next: BidDirector[]): void => change({ ...profile, directors: next })
    const references = (next: BidReference[]): void => change({ ...profile, references: next })
    const personnel = (next: BidPerson[]): void => change({ ...profile, personnel: next })

    async function save(): Promise<void>
    {
        setSaving(true)
        setError('')
        setMessage('')

        try {
            const result = await saveBidProfile(profile)
            setProfile(result.profile)
            setUpdatedAt(result.updatedAt)
            setDirty(false)
            setMessage('Saved. Every bid pack now uses these details.')
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save the bid profile')
        } finally {
            setSaving(false)
        }
    }

    /** Fills the name, CSD number and B-BBEE expiry from a CSD summary report, read in the browser. */
    async function importCsd(file: File): Promise<void>
    {
        setError('')
        setMessage('')

        // Loaded on demand, as the profile page's CSD upload does, so pdf.js stays out of the main bundle.
        const { CsdReadError, readCsdPdf } = await import('@/lib/csd-pdf')

        try {
            const report = await readCsdPdf(file)
            change({
                ...profile,
                company: {
                    ...profile.company,
                    legalName: report.legalName !== '' ? report.legalName : profile.company.legalName,
                    csdNumber: report.supplierNumber !== '' ? report.supplierNumber : profile.company.csdNumber,
                    bbbeeExpiry: report.bbee?.expires ?? profile.company.bbbeeExpiry,
                },
            })
            setMessage(`Read ${report.legalName} (${report.supplierNumber}) from the CSD report. Check the details and save.`)
        } catch (cause) {
            setError(cause instanceof CsdReadError ? cause.message : 'That file could not be read as a CSD summary report.')
        }
    }

    const essentials = profileEssentials(profile)
    const done = essentials.filter((item) => item.done).length
    const disabled = readOnly || saving

    const saveBar = (
        <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void save()} disabled={disabled || !dirty}>{saving ? 'Saving…' : 'Save bid profile'}</Button>
            {message !== '' && <span className="text-sm text-success" role="status">{message}</span>}
            {dirty && message === '' && <span className="text-sm text-ink/55">Unsaved changes</span>}
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Bid packs"
                title="Bid profile"
                description="Enter your company's details once. Every tender's bid pack (SBD forms, cover letter, company profile, CVs and checklist) is filled from them. Anything left blank prints as a blank line to complete by hand."
                actions={readOnly ? undefined : saveBar}
            />

            {readOnly && (
                <p className="max-w-3xl rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink/70">
                    Bid packs are part of a signed-in account. The preview cannot show or change a company's bid details.
                </p>
            )}

            {error !== '' && (
                <p className="max-w-3xl rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
            )}

            {loading && <p className="text-sm text-ink/60">Loading…</p>}

            {!loading && !readOnly && (
                <>
                    <Section title={`Readiness: ${done} of ${essentials.length}`} description={updatedAt !== null ? `Last saved ${formatDate(updatedAt)}.` : 'Not saved yet.'}>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                            {essentials.map((item) => (
                                <li key={item.label} className="flex items-center gap-2 text-sm">
                                    <Badge tone={item.done ? 'success' : 'warn'} dot className="shrink-0 whitespace-nowrap">{item.done ? 'Done' : 'To do'}</Badge>
                                    <span className={item.done ? 'text-ink/60' : 'text-ink'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                            <input
                                ref={csdInput}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(event) =>
                                {
                                    const file = event.target.files?.[0]

                                    if (file !== undefined) {
                                        void importCsd(file)
                                    }

                                    event.target.value = ''
                                }}
                            />
                            <Button variant="secondary" onClick={() => csdInput.current?.click()}>Fill from CSD report</Button>
                            <span className="text-xs text-ink/55">Reads your CSD summary PDF in the browser for the registered name, MAAA number and B-BBEE expiry. Nothing is uploaded.</span>
                        </div>
                    </Section>

                    <Section title="Company registration">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField id="bp-legal" label="Registered name" value={profile.company} name="legalName" onChange={company} />
                            <TextField id="bp-trading" label="Trading name" value={profile.company} name="tradingName" onChange={company} />
                            <TextField id="bp-reg" label="CIPC registration number" value={profile.company} name="registrationNumber" onChange={company} hint="e.g. 2021/123456/07" />
                            <Field label="Company type" htmlFor="bp-type">
                                <Select id="bp-type" value={profile.company.entityType ?? ''} onChange={(event) => company({ ...profile.company, entityType: event.target.value === '' ? null : event.target.value as Company['entityType'] })}>
                                    <option value="">Choose…</option>
                                    {ENTITY_TYPES.map((type) => <option key={type} value={type}>{ENTITY_TYPE_LABELS[type]}</option>)}
                                </Select>
                            </Field>
                            <TextField id="bp-year" label="Year established" value={profile.company} name="yearEstablished" onChange={company} />
                            <TextField id="bp-employees" label="Number of employees" value={profile.company} name="employees" onChange={company} />
                            <TextField id="bp-physical" label="Physical address" value={profile.company} name="physicalAddress" onChange={company} multiline />
                            <TextField id="bp-postal" label="Postal address" value={profile.company} name="postalAddress" onChange={company} multiline hint="Leave blank if the same as the physical address." />
                            <TextField id="bp-web" label="Website" value={profile.company} name="website" onChange={company} />
                            <TextField id="bp-turnover" label="Annual turnover" value={profile.company} name="annualTurnover" onChange={company} hint="Only used on the company profile if filled." />
                        </div>
                    </Section>

                    <Section title="Tax, CSD and B-BBEE">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField id="bp-csd" label="CSD supplier number" value={profile.company} name="csdNumber" onChange={company} hint="MAAA…" />
                            <TextField id="bp-pin" label="Tax compliance status PIN" value={profile.company} name="taxPin" onChange={company} />
                            <TextField id="bp-pin-exp" label="Tax PIN valid until" type="date" value={profile.company} name="taxPinExpiry" onChange={company} />
                            <TextField id="bp-vat" label="VAT registration number" value={profile.company} name="vatNumber" onChange={company} hint="Leave blank if not VAT registered: prices are then quoted without VAT." />
                            <TextField id="bp-itax" label="Income tax reference number" value={profile.company} name="incomeTaxNumber" onChange={company} />
                            <TextField id="bp-bbbee" label="B-BBEE status level" value={profile.company} name="bbbeeLevel" onChange={company} hint="1 to 8" />
                            <Field label="B-BBEE evidence" htmlFor="bp-bbbee-ev" hint="An EME/QSE affidavit is generated in the pack for you to have commissioned.">
                                <Select id="bp-bbbee-ev" value={profile.company.bbbeeEvidence ?? ''} onChange={(event) => company({ ...profile.company, bbbeeEvidence: event.target.value === '' ? null : event.target.value as Company['bbbeeEvidence'] })}>
                                    <option value="">Choose…</option>
                                    {BBBEE_EVIDENCE.map((type) => <option key={type} value={type}>{BBBEE_EVIDENCE_LABELS[type]}</option>)}
                                </Select>
                            </Field>
                            <TextField id="bp-bbbee-exp" label="B-BBEE evidence valid until" type="date" value={profile.company} name="bbbeeExpiry" onChange={company} />
                        </div>
                    </Section>

                    <Section title="Contact and signatory" description="The signatory signs every form and is the deponent on the B-BBEE affidavit.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField id="bp-c-name" label="Contact person" value={profile.contact} name="name" onChange={contact} />
                            <TextField id="bp-c-pos" label="Position" value={profile.contact} name="position" onChange={contact} />
                            <TextField id="bp-c-tel" label="Telephone" type="tel" value={profile.contact} name="telephone" onChange={contact} />
                            <TextField id="bp-c-cell" label="Cellphone" type="tel" value={profile.contact} name="cellphone" onChange={contact} />
                            <TextField id="bp-c-email" label="Email for bids" type="email" value={profile.contact} name="email" onChange={contact} className="sm:col-span-2" />
                            <TextField id="bp-s-name" label="Authorised signatory" value={profile.signatory} name="name" onChange={signatory} />
                            <TextField id="bp-s-cap" label="Signs in the capacity of" value={profile.signatory} name="capacity" onChange={signatory} hint="e.g. Director" />
                            <TextField id="bp-s-id" label="Signatory ID number" value={profile.signatory} name="idNumber" onChange={signatory} />
                        </div>
                    </Section>

                    <Section title="Directors and ownership" description="Used for SBD 4 (with ID numbers), the preference points claim and the B-BBEE affidavit.">
                        {profile.directors.map((director, index) =>
                        {
                            const set = (next: BidDirector): void => directors(replaceAt(profile.directors, index, next))
                            const flag = (key: 'black' | 'woman' | 'youth' | 'disability' | 'militaryVeteran', label: string) => (
                                <label className="flex items-center gap-2 text-sm text-ink/80">
                                    <input type="checkbox" className={CHECKBOX} checked={director[key] === true} onChange={(event) => set({ ...director, [key]: event.target.checked })} />
                                    {label}
                                </label>
                            )

                            return (
                                <div key={index} className="flex flex-col gap-3 rounded-lg border border-line p-4">
                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <TextField id={`bp-d-${index}-name`} label="Full name" value={director} name="fullName" onChange={set} className="sm:col-span-2" />
                                        <TextField id={`bp-d-${index}-id`} label="ID number" value={director} name="idNumber" onChange={set} />
                                        <TextField id={`bp-d-${index}-pos`} label="Position" value={director} name="position" onChange={set} />
                                        <Field label="Ownership %" htmlFor={`bp-d-${index}-pct`}>
                                            <Input id={`bp-d-${index}-pct`} type="number" min={0} max={100} value={director.ownershipPercent ?? ''} onChange={(event) => set({ ...director, ownershipPercent: numberOrNull(event.target.value) })} />
                                        </Field>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                        {flag('black', 'Black')}
                                        {flag('woman', 'Woman')}
                                        {flag('youth', 'Youth (under 35)')}
                                        {flag('disability', 'Living with a disability')}
                                        {flag('militaryVeteran', 'Military veteran')}
                                        <span className="ml-auto"><RemoveButton onClick={() => directors(profile.directors.filter((_, position) => position !== index))} /></span>
                                    </div>
                                </div>
                            )
                        })}
                        <div>
                            <Button variant="secondary" onClick={() => directors([...profile.directors, { black: false, woman: false, youth: false, disability: false, militaryVeteran: false }])}>Add director / owner</Button>
                        </div>
                    </Section>

                    <Section title="Declarations" description="Your answers print on SBD 4 (all tenders) and MBD 8 (municipal tenders). Unanswered questions print with empty boxes.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <YesNo id="bp-dec-state" label="Is any director or owner employed by the state?" value={profile.declarations.stateEmployee} onChange={(next) => declarations({ ...profile.declarations, stateEmployee: next })} />
                            {profile.declarations.stateEmployee === true && <TextField id="bp-dec-state-d" label="Details" value={profile.declarations} name="stateEmployeeDetails" onChange={declarations} multiline />}
                            <YesNo id="bp-dec-rel" label="Any relationship with staff of a buyer you bid to?" value={profile.declarations.procuringRelationship} onChange={(next) => declarations({ ...profile.declarations, procuringRelationship: next })} />
                            {profile.declarations.procuringRelationship === true && <TextField id="bp-dec-rel-d" label="Details" value={profile.declarations} name="procuringRelationshipDetails" onChange={declarations} multiline />}
                            <YesNo id="bp-dec-ent" label="Do directors have interests in related enterprises?" value={profile.declarations.relatedEnterprise} onChange={(next) => declarations({ ...profile.declarations, relatedEnterprise: next })} />
                            {profile.declarations.relatedEnterprise === true && <TextField id="bp-dec-ent-d" label="Details" value={profile.declarations} name="relatedEnterpriseDetails" onChange={declarations} multiline />}
                            <YesNo id="bp-dec-restr" label="Listed on the database of restricted suppliers?" value={profile.declarations.restrictedSupplier} onChange={(next) => declarations({ ...profile.declarations, restrictedSupplier: next })} />
                            <YesNo id="bp-dec-def" label="Listed on the Register for Tender Defaulters?" value={profile.declarations.tenderDefaulter} onChange={(next) => declarations({ ...profile.declarations, tenderDefaulter: next })} />
                            <YesNo id="bp-dec-fraud" label="Convicted of fraud or corruption in the past 5 years?" value={profile.declarations.fraudConviction} onChange={(next) => declarations({ ...profile.declarations, fraudConviction: next })} />
                            <YesNo id="bp-dec-term" label="A state contract terminated for non-performance in 5 years?" value={profile.declarations.contractTerminated} onChange={(next) => declarations({ ...profile.declarations, contractTerminated: next })} />
                            <YesNo id="bp-dec-arrears" label="Municipal rates or charges over 3 months in arrears?" value={profile.declarations.municipalArrears} onChange={(next) => declarations({ ...profile.declarations, municipalArrears: next })} />
                        </div>
                    </Section>

                    <Section title="Banking details" description="Printed on the compliance summary. Attach a stamped bank letter separately.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField id="bp-b-bank" label="Bank" value={profile.bank} name="bankName" onChange={bank} />
                            <TextField id="bp-b-holder" label="Account holder" value={profile.bank} name="accountHolder" onChange={bank} />
                            <TextField id="bp-b-num" label="Account number" value={profile.bank} name="accountNumber" onChange={bank} />
                            <TextField id="bp-b-branch" label="Branch code" value={profile.bank} name="branchCode" onChange={bank} />
                            <TextField id="bp-b-type" label="Account type" value={profile.bank} name="accountType" onChange={bank} />
                        </div>
                    </Section>

                    <Section title="Company story" description="Used in the cover letter and the company profile.">
                        <div className="grid gap-4">
                            <TextField id="bp-n-over" label="Overview" value={profile.narrative} name="overview" onChange={narrative} multiline hint="Two or three short paragraphs. The first paragraph opens the cover letter." />
                            <TextField id="bp-n-serv" label="Services" value={profile.narrative} name="services" onChange={narrative} multiline />
                            <TextField id="bp-n-diff" label="Why choose us" value={profile.narrative} name="differentiators" onChange={narrative} multiline />
                        </div>
                    </Section>

                    <Section title="Past projects and references">
                        {profile.references.map((reference, index) =>
                        {
                            const set = (next: BidReference): void => references(replaceAt(profile.references, index, next))

                            return (
                                <div key={index} className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-3">
                                    <TextField id={`bp-r-${index}-client`} label="Client" value={reference} name="client" onChange={set} />
                                    <TextField id={`bp-r-${index}-project`} label="Project" value={reference} name="project" onChange={set} className="sm:col-span-2" />
                                    <TextField id={`bp-r-${index}-year`} label="Year" value={reference} name="year" onChange={set} />
                                    <TextField id={`bp-r-${index}-value`} label="Contract value" value={reference} name="value" onChange={set} />
                                    <TextField id={`bp-r-${index}-cname`} label="Reference contact" value={reference} name="contactName" onChange={set} />
                                    <TextField id={`bp-r-${index}-cphone`} label="Contact phone" value={reference} name="contactPhone" onChange={set} />
                                    <TextField id={`bp-r-${index}-cemail`} label="Contact email" value={reference} name="contactEmail" onChange={set} />
                                    <div className="flex items-end"><RemoveButton onClick={() => references(profile.references.filter((_, position) => position !== index))} /></div>
                                </div>
                            )
                        })}
                        <div>
                            <Button variant="secondary" onClick={() => references([...profile.references, {}])}>Add project</Button>
                        </div>
                    </Section>

                    <Section title="Key personnel" description="Each person gets a one-page CV in the pack. On each tender you choose who to put forward.">
                        {profile.personnel.map((person, index) =>
                        {
                            const set = (next: BidPerson): void => personnel(replaceAt(profile.personnel, index, next))

                            return (
                                <div key={index} className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
                                    <TextField id={`bp-p-${index}-name`} label="Full name" value={person} name="fullName" onChange={set} />
                                    <TextField id={`bp-p-${index}-role`} label="Role" value={person} name="role" onChange={set} />
                                    <TextField id={`bp-p-${index}-qual`} label="Qualifications" value={person} name="qualifications" onChange={set} />
                                    <Field label="Years of experience" htmlFor={`bp-p-${index}-years`}>
                                        <Input id={`bp-p-${index}-years`} type="number" min={0} max={70} value={person.yearsExperience ?? ''} onChange={(event) => set({ ...person, yearsExperience: numberOrNull(event.target.value) })} />
                                    </Field>
                                    <TextField id={`bp-p-${index}-bodies`} label="Professional registrations" value={person} name="professionalBodies" onChange={set} className="sm:col-span-2" />
                                    <TextField id={`bp-p-${index}-summary`} label="Profile summary" value={person} name="summary" onChange={set} multiline />
                                    <TextField id={`bp-p-${index}-exp`} label="Relevant experience" value={person} name="experience" onChange={set} multiline />
                                    <div><RemoveButton onClick={() => personnel(profile.personnel.filter((_, position) => position !== index))} /></div>
                                </div>
                            )
                        })}
                        <div>
                            <Button variant="secondary" onClick={() => personnel([...profile.personnel, {}])}>Add person</Button>
                        </div>
                    </Section>

                    {saveBar}
                </>
            )}
        </div>
    )
}
