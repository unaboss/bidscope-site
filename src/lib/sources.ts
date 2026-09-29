/** Where each source publishes, so the tender page can link back to the origin. */
const SOURCE_SITES: Record<string, { name: string; url: string }> = {
    etenders: { name: 'eTenders', url: 'https://www.etenders.gov.za/' },
    ocds: { name: 'OCDS · National Treasury', url: 'https://www.etenders.gov.za/' },
    sanral: { name: 'SANRAL', url: 'https://www.nra.co.za/' },
    eskom: { name: 'Eskom', url: 'https://www.eskom.co.za/' },
    transnet: { name: 'Transnet', url: 'https://www.transnet.net/' },
    sentech: { name: 'Sentech', url: 'https://www.sentech.co.za/' },
    sabc: { name: 'SABC', url: 'https://www.sabc.co.za/' },
    prasa: { name: 'PRASA', url: 'https://www.prasa.com/' },
    dbsa: { name: 'DBSA', url: 'https://www.dbsa.org/' },
    cidb: { name: 'CIDB', url: 'https://www.cidb.org.za/' },
    sassa: { name: 'SASSA', url: 'https://www.sassa.gov.za/' },
    armscor: { name: 'Armscor', url: 'https://www.armscor.co.za/' },
    cbrta: { name: 'C-BRTA', url: 'https://www.cbrta.co.za/' },
    randwater: { name: 'Rand Water', url: 'https://www.randwater.co.za/' },
    nhls: { name: 'NHLS', url: 'https://www.nhls.ac.za/' },
    pic: { name: 'PIC', url: 'https://www.pic.gov.za/' },
    nrf: { name: 'NRF', url: 'https://www.nrf.ac.za/' },
    buffalocity: { name: 'Buffalo City', url: 'https://www.buffalocity.gov.za/' },
    ekurhuleni: { name: 'Ekurhuleni', url: 'https://www.ekurhuleni.gov.za/' },
    satenders: { name: 'SA-Tenders', url: 'https://sa-tenders.co.za/' },
    cticc: { name: 'CTICC', url: 'https://www.cticc.co.za/' },
}

/** A tender's best outbound link: the tender itself, or just the source site. */
export interface DeepLink
{
    readonly url: string
    readonly isSpecific: boolean
}

/** Display name and site URL for a source key. */
export function sourceSite(source: string | null): { name: string; url: string } | null
{
    if (source === null) {
        return null
    }

    return SOURCE_SITES[source] ?? { name: source, url: `https://${source}` }
}

/**
 * The first tender-specific URL captured for a tender, or `null`.
 *
 * Ingest stores a source's own per-tender link (or document link) inside
 * `support_documents`; eTenders hardcodes none (`url: null`) while OCDS may carry
 * a real blob URL. This mirrors the legacy `Tender.source_url`.
 */
export function tenderSourceUrl(supportDocuments: string | null): string | null
{
    if (supportDocuments === null || supportDocuments === '') {
        return null
    }

    try {
        const parsed = JSON.parse(supportDocuments) as unknown

        if (!Array.isArray(parsed)) {
            return null
        }

        for (const entry of parsed) {
            if (typeof entry !== 'object' || entry === null) {
                continue
            }

            const url = (entry as Record<string, unknown>).url

            if (typeof url === 'string' && url.trim() !== '') {
                return url.trim()
            }
        }

        return null
    } catch {
        return null
    }
}

/**
 * Returns the URL only when it is `http:`/`https:`, else `null`.
 *
 * Scraped `support_documents` values are untrusted input: a `javascript:` or
 * `data:` href would execute when clicked. `rel="noopener"` does not stop that,
 * so the scheme is allowlisted here — the one place every deep link passes
 * through.
 */
function httpUrl(value: string): string | null
{
    try {
        const parsed = new URL(value)

        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
    } catch {
        return null
    }
}

/** Resolves a possibly site-relative href against the homepage, http(s) only. */
function resolveUrl(raw: string, homepage: string): string | null
{
    try {
        return httpUrl(new URL(raw, homepage).toString())
    } catch {
        return null
    }
}

/**
 * The best link to open for a tender — ported from the legacy `build_deep_link`.
 *
 * A tender-specific URL is preferred and marked specific; otherwise the source's
 * homepage is returned, marked non-specific (eTenders always take this path
 * because they publish no per-tender page). Only `http(s)` links are ever
 * returned; an unknown source with no usable URL yields `null`.
 */
export function buildDeepLink(source: string | null, supportDocuments: string | null): DeepLink | null
{
    const homepage = source === null ? undefined : SOURCE_SITES[source]?.url
    const raw = tenderSourceUrl(supportDocuments)

    if (raw !== null) {
        const url = homepage === undefined ? httpUrl(raw) : resolveUrl(raw, homepage)

        if (url !== null) {
            return { url, isSpecific: true }
        }
    }

    return homepage === undefined ? null : { url: homepage, isSpecific: false }
}

const ALL_ZERO = /^0+$/
const MIN_VERIFIED_REF_LENGTH = 4

/**
 * False for references that are empty, all-zero, or too short — placeholder
 * values that came straight from a source's own data and are not usable.
 */
export function isVerifiedRef(tenderNo: string | null | undefined): boolean
{
    if (tenderNo === null || tenderNo === undefined) {
        return false
    }

    const value = tenderNo.trim()

    if (value.length < MIN_VERIFIED_REF_LENGTH) {
        return false
    }

    return !ALL_ZERO.test(value)
}

/** Friendly label for an estimate basis code. */
export function estimateBasisLabel(basis: string | null | undefined): string
{
    const labels: Record<string, string> = {
        'client similar awards': 'this client\u2019s similar awards',
        'client history': 'this client\u2019s award history',
        'market median': 'the market median',
    }

    return basis !== null && basis !== undefined ? labels[basis] ?? basis : ''
}
