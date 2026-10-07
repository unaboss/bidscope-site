import type { Claim, ClaimInput } from '@/types'

export const PROVINCES: readonly string[] = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

/** CIDB classes offered when a construction/electrical category is selected. */
export const CIDB_CLASSES: ReadonlyArray<{ readonly code: string, readonly label: string }> = [
    { code: 'GB', label: 'GB — General building' },
    { code: 'CE', label: 'CE — Civil engineering' },
    { code: 'SQ', label: 'SQ — Specialist (non-structural)' },
    { code: 'ME', label: 'ME — Mechanical' },
    { code: 'EP', label: 'EP — Electrical (engineering)' },
    { code: 'EB', label: 'EB — Electrical (building)' },
    { code: 'SO', label: 'SO — Specialist (structural)' },
    { code: 'SF', label: 'SF — Specialist (functional)' },
    { code: 'SK', label: 'SK — Specialist (trade)' },
]

/** Category buckets whose tenders carry CIDB grade requirements. */
export const CONSTRUCTION_BUCKETS: ReadonlySet<string> = new Set(['CW', 'EE'])

/** The eligibility claims the profile page edits; other claim types are carried through untouched. */
export const PROFILE_CLAIM_TYPES: readonly string[] = ['bbee_level', 'csd', 'tax']

/** The editable eligibility answers. `null` means "not set". */
export interface EligibilityAnswers
{
    readonly bbeeLevel: number | null
    readonly csdRegistered: boolean
    readonly taxCompliant: boolean
}

/** Reads the profile's eligibility answers from the org's current claims. */
export function answersFromClaims(claims: readonly Claim[]): EligibilityAnswers
{
    const find = (type: string): Claim | undefined => claims.find((claim) => claim.claimType === type)
    const level = find('bbee_level')?.value['level']

    return {
        bbeeLevel: typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 8 ? level : null,
        csdRegistered: find('csd')?.value['registered'] === true,
        taxCompliant: find('tax')?.value['compliant'] === true,
    }
}

/**
 * The full claim set to PUT to `/api/claims`. The route replaces every claim
 * type it owns, so claims this page does not edit (and `cidb_grade`, which
 * settings owns) are carried through unchanged or left out respectively.
 * A "no" is sent as no claim at all: the eligibility gates treat any present
 * `csd`/`tax` claim as meeting the requirement.
 */
export function claimsForSave(current: readonly Claim[], answers: EligibilityAnswers): ClaimInput[]
{
    const carried = current
        .filter((claim) => claim.claimType !== 'cidb_grade' && !PROFILE_CLAIM_TYPES.includes(claim.claimType))
        .map((claim): ClaimInput => ({
            claimType: claim.claimType,
            subjectKey: claim.subjectKey,
            value: claim.value,
            validUntil: claim.validUntil,
        }))

    const keepExpiry = (type: string, value: Record<string, unknown>): string | null =>
    {
        const existing = current.find((claim) => claim.claimType === type)

        return existing !== undefined && JSON.stringify(existing.value) === JSON.stringify(value) ? existing.validUntil : null
    }

    const edited: ClaimInput[] = []

    if (answers.bbeeLevel !== null) {
        const value = { level: answers.bbeeLevel }
        edited.push({ claimType: 'bbee_level', subjectKey: '', value, validUntil: keepExpiry('bbee_level', value) })
    }

    if (answers.csdRegistered) {
        const value = { registered: true }
        edited.push({ claimType: 'csd', subjectKey: '', value, validUntil: keepExpiry('csd', value) })
    }

    if (answers.taxCompliant) {
        const value = { compliant: true }
        edited.push({ claimType: 'tax', subjectKey: '', value, validUntil: keepExpiry('tax', value) })
    }

    return [...carried, ...edited]
}

/** Converts the string grade inputs into the numeric record the API expects (blank = not graded). */
export function parseCidbGrades(input: Readonly<Record<string, string>>): Record<string, number>
{
    const grades: Record<string, number> = {}

    for (const [code, value] of Object.entries(input))
    {
        const grade = Number(value)

        if (value.trim() !== '' && Number.isFinite(grade) && grade >= 0) {
            grades[code] = Math.trunc(grade)
        }
    }

    return grades
}

/** True when any selected category falls in a bucket that uses CIDB grades. */
export function needsCidb(categories: readonly string[], bucketOf: (label: string) => string | undefined): boolean
{
    return categories.some((label) =>
    {
        const bucket = bucketOf(label)

        return bucket !== undefined && CONSTRUCTION_BUCKETS.has(bucket)
    })
}
