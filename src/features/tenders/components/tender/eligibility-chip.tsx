import type { ReactElement } from 'react'
import { Badge, type BadgeTone } from '@/shared/ui/badge'
import type { GateState } from '@/shared/types'

interface ChipCopy
{
    readonly label: string
    readonly tone: BadgeTone
}

/**
 * Deliberately non-committal: this is a reading of stated requirements against
 * the profile, never a statement that the company qualifies.
 */
export function chipCopy(state: GateState): ChipCopy | null
{
    switch (state) {
        case 'meets_verified':
            return { label: 'Meets stated requirements', tone: 'success' }
        case 'meets_declared':
            return { label: 'Meets (self-declared)', tone: 'neutral' }
        case 'profile_unknown':
            return { label: 'Needs your input', tone: 'warn' }
        case 'requirement_not_found':
            return { label: 'Not stated', tone: 'neutral' }
        case 'tender_unreadable':
            return { label: 'Check document', tone: 'neutral' }
        case 'fails':
            return { label: 'Check requirements', tone: 'danger' }
    }
}

export function EligibilityChip({ state }: { readonly state: GateState | undefined }): ReactElement | null
{
    const copy = state === undefined ? null : chipCopy(state)

    return copy === null ? null : <Badge tone={copy.tone} dot>{copy.label}</Badge>
}
