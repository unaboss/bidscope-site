import { sourceSite } from '@/shared/lib/sources'

export const COVERAGE_PROVINCES = [
    { id: 'EC', name: 'Eastern Cape' },
    { id: 'FS', name: 'Free State' },
    { id: 'GP', name: 'Gauteng' },
    { id: 'KZN', name: 'KwaZulu-Natal' },
    { id: 'LP', name: 'Limpopo' },
    { id: 'MP', name: 'Mpumalanga' },
    { id: 'NC', name: 'Northern Cape' },
    { id: 'NW', name: 'North West' },
    { id: 'WC', name: 'Western Cape' },
] as const

export type ProvinceId = (typeof COVERAGE_PROVINCES)[number]['id']

export interface CoverageSource {
    readonly key: string
    readonly name: string
    readonly url: string
    readonly kind: string
    readonly description: string
    readonly province?: ProvinceId
}

/** These associations follow the explicit province fields in worker/ingest/soe.ts.
 * A configured adapter is not evidence that a source is currently syncing or exhaustive. */
export const LOCAL_SOURCES: readonly CoverageSource[] = [
    {
        key: 'cticc',
        name: 'CTICC',
        province: 'WC',
        kind: 'Public entity',
        description: 'Cape Town International Convention Centre',
        url: 'https://www.cticc.co.za/supplier/cticc-tenders-rfqs/',
    },
    {
        key: 'ekurhuleni',
        name: 'City of Ekurhuleni',
        province: 'GP',
        kind: 'Municipal publisher',
        description: 'Tender advertisements and procurement notices',
        url: 'https://www.ekurhuleni.gov.za/tenders/',
    },
    {
        key: 'buffalocity',
        name: 'Buffalo City',
        province: 'EC',
        kind: 'Municipal publisher',
        description: 'Buffalo City Metropolitan Municipality',
        url: 'https://www.buffalocity.gov.za/tender_documents.php',
    },
]

export const NATIONAL_SOURCES: readonly CoverageSource[] = [
    {
        key: 'etenders',
        name: 'eTenders',
        kind: 'National portal',
        description: 'Tender notices published by participating public bodies',
        url: sourceSite('etenders')!.url,
    },
    {
        key: 'ocds',
        name: 'National Treasury',
        kind: 'Open contracting data',
        description: 'Procurement data published through the OCDS channel',
        url: 'https://data.etenders.gov.za/',
    },
]

/** Existing recognised publishers retained from the previous Coverage directory.
 * Their geographic reach is not inferred from headquarters or a national remit. */
export const OTHER_PUBLISHERS = ['sanral', 'eskom', 'transnet', 'prasa', 'sentech', 'sabc', 'dbsa', 'randwater'].map(
    (key) => ({ key, ...sourceSite(key)! }),
)

export function provinceById(id: string | null) {
    return COVERAGE_PROVINCES.find((province) => province.id === id) ?? COVERAGE_PROVINCES[8]
}

export function sourcesForProvince(province: ProvinceId, query = '') {
    const search = query.trim().toLocaleLowerCase('en-ZA')
    const matches = (source: CoverageSource) =>
        `${source.name} ${source.kind} ${source.description}`.toLocaleLowerCase('en-ZA').includes(search)
    return {
        local: LOCAL_SOURCES.filter((source) => source.province === province && matches(source)),
        national: NATIONAL_SOURCES.filter(matches),
    }
}

export interface ProvinceGeometry {
    readonly id: ProvinceId
    readonly path: string
    readonly label: readonly [number, number]
}
export interface CoverageGeometry {
    readonly viewBox: '0 0 760 620'
    readonly provinces: readonly ProvinceGeometry[]
}

export function isCoverageGeometry(value: unknown): value is CoverageGeometry {
    if (!value || typeof value !== 'object') return false
    const data = value as Partial<CoverageGeometry>
    return (
        data.viewBox === '0 0 760 620' &&
        Array.isArray(data.provinces) &&
        data.provinces.length === 9 &&
        COVERAGE_PROVINCES.every(({ id }) => data.provinces!.filter((province) => province?.id === id).length === 1) &&
        data.provinces.every(
            (province) =>
                typeof province.path === 'string' &&
                /^M[\d.,LZM\s-]+Z$/.test(province.path) &&
                Array.isArray(province.label) &&
                province.label.length === 2 &&
                province.label.every(Number.isFinite),
        )
    )
}

/** Spatial arrow-key navigation; the separate province buttons are the touch-size alternative. */
export function adjacentProvince(geometry: CoverageGeometry, current: ProvinceId, key: string): ProvinceId {
    const origin = geometry.provinces.find((province) => province.id === current)!
    const vector = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key]
    if (!vector) return current
    const candidates = geometry.provinces
        .filter((province) => province.id !== current)
        .map((province) => {
            const dx = province.label[0] - origin.label[0]
            const dy = province.label[1] - origin.label[1]
            const forward = dx * vector[0]! + dy * vector[1]!
            const across = Math.abs(dx * vector[1]! - dy * vector[0]!)
            return { id: province.id, forward, score: forward + across * 2 }
        })
        .filter((province) => province.forward > 0)
    return candidates.sort((a, b) => a.score - b.score)[0]?.id ?? current
}
