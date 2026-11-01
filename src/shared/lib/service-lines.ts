/**
 * Display labels for service-line ("work type") codes.
 *
 * Codes are assigned per client profile (`worker/profiles/*.json`); this map
 * covers the codes actually in use — Gochi's works classes (GB/CE/…) and North
 * Tech's service lines (SW/UX/AU/CL). Replace the raw code fallback with the
 * human label on cards.
 */
export const SERVICE_LABELS: Record<string, string> = {
    // Gochi Trading — CIDB works classes
    GB: 'General Building',
    CE: 'Civil Engineering',
    SQ: 'Fencing',
    ME: 'Mechanical',
    EP: 'Electrical Infrastructure',
    EB: 'Electrical Building',
    SO: 'Plumbing & Drainage',
    SF: 'Fire Protection',
    SK: 'Road Markings',
    // North Tech Africa — service lines
    SW: 'Software & Web Development',
    UX: 'Web & UI Design',
    AU: 'Automation',
    CL: 'Cloud & Hosting',
    // Category buckets (category-based profiles — see worker/domain/categories.ts)
    CW: 'Construction & civil works',
    EE: 'Electrical & energy',
    IT: 'IT & telecommunications',
    PR: 'Professional & consulting',
    CS: 'Cleaning, security & facilities',
    MH: 'Medical & health',
    TL: 'Transport & logistics',
    SP: 'Supplies & equipment',
    AW: 'Agriculture, water & environment',
    EC: 'Education, arts & community',
    MM: 'Mining & manufacturing',
    GO: 'General & other services',
    // Shared
    OT: 'Other',
}

/** Human label for a service-line code, or null when absent. */
export function serviceLabel(code: string | null | undefined): string | null
{
    if (code === null || code === undefined) {
        return null
    }

    return SERVICE_LABELS[code] ?? code
}
