/**
 * Reads a National Treasury CSD Registration Summary Report.
 *
 * The report is rendered by Microsoft Reporting Services as a two-column grid
 * of label/value cells, so fields are found by their label and the value cell
 * to its right (plus any wrapped lines below it). Only the fields Bidscope
 * needs are extracted: bank details, ID and tax numbers, contacts and
 * addresses are never read out, so they never leave the browser.
 */

/** One positioned run of text from the PDF (PDF units, y grows upwards). */
export interface TextCell
{
    readonly page: number
    readonly x: number
    readonly y: number
    readonly str: string
}

export interface CsdBbee
{
    readonly status: string
    /** ISO date (YYYY-MM-DD), or null when the report has none. */
    readonly expires: string | null
}

export interface CsdReport
{
    readonly supplierNumber: string
    readonly legalName: string
    readonly active: boolean
    readonly province: string | null
    readonly taxCompliant: boolean
    /** ISO date of CSD's last SARS check, or null. */
    readonly taxCheckedOn: string | null
    readonly commodities: string[]
    readonly bbee: CsdBbee | null
}

const ROW_TOLERANCE = 3
const COLUMN_TOLERANCE = 4
const MAX_LINE_GAP = 15

function norm(value: string): string
{
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** The value text for `label`, joined across wrapped lines. Null when the label is absent. */
function valueOf(cells: readonly TextCell[], label: string): string | null
{
    const target = norm(label)
    const anchor = cells.find((cell) => norm(cell.str) === target)

    if (anchor === undefined) {
        return null
    }

    const samePage = cells.filter((cell) => cell.page === anchor.page)
    const first = samePage
        .filter((cell) => Math.abs(cell.y - anchor.y) <= ROW_TOLERANCE && cell.x > anchor.x + COLUMN_TOLERANCE && cell.str.trim() !== '')
        .sort((a, b) => a.x - b.x)[0]

    if (first === undefined) {
        return null
    }

    const parts = [first.str.trim()]
    let lastY = first.y
    const below = samePage
        .filter((cell) => Math.abs(cell.x - first.x) <= COLUMN_TOLERANCE && cell.y < first.y - ROW_TOLERANCE)
        .sort((a, b) => b.y - a.y)

    for (const cell of below)
    {
        // A new label in the anchor's column, at or above this line, starts the next field.
        const nextField = samePage.some((other) => Math.abs(other.x - anchor.x) <= 20
            && other.y < anchor.y - ROW_TOLERANCE
            && other.y >= cell.y - ROW_TOLERANCE
            && other.str.trim() !== '')

        if (nextField || lastY - cell.y > MAX_LINE_GAP) {
            break
        }

        parts.push(cell.str.trim())
        lastY = cell.y
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim()
}

const MONTHS: Readonly<Record<string, string>> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** Parses CSD's "28 Aug 2026 09:31:00:000" into "2026-08-28". */
export function csdDate(value: string | null): string | null
{
    const match = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})/.exec(value?.trim() ?? '')
    const month = match === null ? undefined : MONTHS[match[2]?.toLowerCase() ?? '']

    if (match === null || month === undefined) {
        return null
    }

    return `${match[3]}-${month}-${(match[1] ?? '').padStart(2, '0')}`
}

/**
 * Extracts the profile fields from a CSD summary report's text cells.
 * Returns null when the cells are not a CSD summary report.
 */
export function parseCsdReport(cells: readonly TextCell[]): CsdReport | null
{
    const isReport = cells.some((cell) => norm(cell.str) === 'csd registration summary report')
    const supplierNumber = (valueOf(cells, 'Supplier number') ?? '').toUpperCase()
    const legalName = valueOf(cells, 'Legal name') ?? ''

    if (!isReport || !/^MAAA\d{4,}$/.test(supplierNumber) || legalName === '') {
        return null
    }

    const commodities = (valueOf(cells, 'Commodity family') ?? '')
        .split(';')
        .map((entry) => entry.trim().replace(/\s+/g, ' '))
        .filter((entry) => entry !== '')

    const bbeeStatus = valueOf(cells, 'Status')

    return {
        supplierNumber,
        legalName,
        active: norm(valueOf(cells, 'Is supplier active?') ?? '') === 'yes',
        province: valueOf(cells, 'Province'),
        taxCompliant: norm(valueOf(cells, 'Overall Tax Status') ?? '') === 'tax compliant',
        taxCheckedOn: csdDate(valueOf(cells, 'Last validation date')),
        commodities: [...new Set(commodities)],
        bbee: bbeeStatus === null ? null : { status: bbeeStatus, expires: csdDate(valueOf(cells, 'Certificate Expiry Date')) },
    }
}

/** True when a B-BBEE certificate on the report is still valid on `today` (YYYY-MM-DD). */
export function bbeeCertCurrent(bbee: CsdBbee | null, today: string): boolean
{
    if (bbee === null || norm(bbee.status) === 'expired') {
        return false
    }

    return bbee.expires !== null && bbee.expires >= today
}

/**
 * CSD commodity families (UNSPSC family names) → eTenders categories. Rules
 * are matched against the lower-cased family name; a family may hit several.
 */
const COMMODITY_RULES: ReadonlyArray<{ readonly match: RegExp, readonly categories: readonly string[] }> = [
    { match: /residential building|nonresidential building|permanent buildings|building construction|building and facility/, categories: ['Construction of buildings', 'Services: Building'] },
    { match: /heavy construction|civil|road|bridge|infrastructure/, categories: ['Civil engineering', 'Services: Civil'] },
    { match: /specialized trade construction|specialised trade construction/, categories: ['Specialised construction activities'] },
    { match: /concrete|cement|plaster|structural materials|building materials|construction/, categories: ['Construction'] },
    { match: /engineering services|architect|surveying|quantity survey/, categories: ['Architectural and engineering activities; technical testing and analysis'] },
    { match: /environmental/, categories: ['Remediation activities and other waste management services', 'Water supply; sewerage, waste management and remediation activities'] },
    { match: /water resources|water and wastewater|water treatment|water supply/, categories: ['Water collection, treatment and supply'] },
    { match: /sewage|sewerage/, categories: ['Sewerage'] },
    { match: /refuse|waste/, categories: ['Waste collection, treatment and disposal activities; materials recovery'] },
    { match: /paper products|paper materials|office supplies|stationery|printed media|printing/, categories: ['Supplies: Stationery/Printing'] },
    { match: /computer services|software|information technology|data services|internet services|information services/, categories: ['Computer programming, consultancy and related activities', 'Information service activities'] },
    { match: /computer equipment|computer hardware/, categories: ['Supplies: Computer Equipment'] },
    { match: /telecommunication|communications devices/, categories: ['Telecommunications'] },
    { match: /cleaning|janitorial/, categories: ['Services: Functional (Including Cleaning and Security Services)', 'Services to buildings and landscape activities'] },
    { match: /security|surveillance|safety services/, categories: ['Security and investigation activities', 'Services: Functional (Including Cleaning and Security Services)'] },
    { match: /landscap|gardening|lawn/, categories: ['Services to buildings and landscape activities'] },
    { match: /electrical (systems|services)|power (generation|distribution)|electric utilities/, categories: ['Services: Electrical', 'Electricity, gas, steam and air conditioning'] },
    { match: /electrical (equipment|components|wire)|lighting/, categories: ['Supplies: Electrical Equipment'] },
    { match: /management advisory|business administration|management consult/, categories: ['Activities of head offices; management consultancy activities', 'Services: Professional'] },
    { match: /accounting|bookkeeping|auditing|legal/, categories: ['Legal and accounting activities'] },
    { match: /financial|banking|insurance/, categories: ['Financial and insurance activities'] },
    { match: /human resources|staffing|personnel|recruitment/, categories: ['Employment activities'] },
    { match: /education|training/, categories: ['Education'] },
    { match: /medical|healthcare|health care|pharmaceutical|laboratory/, categories: ['Supplies: Medical', 'Human health activities'] },
    { match: /courier|mail|postal/, categories: ['Postal and courier activities'] },
    { match: /transport|freight|logistics|vehicle rental/, categories: ['Transportation and storage'] },
    { match: /travel|lodging|accommodation|hotel/, categories: ['Travel agency, tour operator, reservation service and related activities', 'Accommodation'] },
    { match: /food|beverage|catering|restaurant/, categories: ['Food and beverage service activities', 'Supplies: Perishable Provisions'] },
    { match: /clothing|apparel|uniform|textile|footwear/, categories: ['Supplies: Clothing/Textiles/Footwear'] },
    { match: /furniture|furnishings/, categories: ['Manufacture of furniture', 'Supplies: General'] },
    { match: /motor vehicle|vehicles/, categories: ['Wholesale and retail trade and repair of motor vehicles and motorcycles'] },
    { match: /mining|quarrying/, categories: ['Mining support service activities'] },
    { match: /agricultur|farming|livestock|seeds|fertili/, categories: ['Agricultural Products and Services'] },
    { match: /advertising|marketing|public relations/, categories: ['Advertising and market research'] },
    { match: /real estate|property management/, categories: ['Real estate activities'] },
    { match: /research/, categories: ['Scientific research and development'] },
    { match: /events|entertainment|arts/, categories: ['Arts, entertainment and recreation'] },
    { match: /sport|recreation/, categories: ['Sports activities and amusement and recreation activities'] },
    { match: /machinery|equipment repair|maintenance and repair/, categories: ['Repair and installation of machinery and equipment'] },
    { match: /rental|leasing/, categories: ['Rental and leasing activities'] },
    { match: /fuel|petroleum/, categories: ['Manufacture of coke and refined petroleum products'] },
    { match: /chemical/, categories: ['Manufacture of chemicals and chemical products'] },
    { match: /metal|steel/, categories: ['Manufacture of fabricated metal products, except machinery and equipment'] },
    { match: /tools|hardware/, categories: ['Supplies: General'] },
]

export interface CommodityMatch
{
    readonly categories: string[]
    /** Commodity families no rule recognised; the customer picks categories for these. */
    readonly unmatched: string[]
}

/** Maps CSD commodity families to eTenders category labels, keeping only labels in `known`. */
export function categoriesForCommodities(commodities: readonly string[], known: ReadonlySet<string>): CommodityMatch
{
    const categories = new Set<string>()
    const unmatched: string[] = []

    for (const commodity of commodities)
    {
        const lower = commodity.toLowerCase()
        const hits = COMMODITY_RULES.filter((rule) => rule.match.test(lower)).flatMap((rule) => rule.categories).filter((label) => known.has(label))

        if (hits.length === 0) {
            unmatched.push(commodity)
        }

        hits.forEach((label) => categories.add(label))
    }

    return { categories: [...categories], unmatched }
}
