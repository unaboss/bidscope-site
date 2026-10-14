import type { PricingTier } from '@/api'
import { BASIS_CIDB_BAND, BASIS_CLIENT, BASIS_CLIENT_CATEGORY, BASIS_SCOPE, BASIS_STATED } from '@/lib/estimate'
import { PROVINCES } from '@/lib/profile'
import type { Claim, GateState, MapPrecision, Settings } from '@/types'

/**
 * The sample company and tenders the public preview runs on. The tenders are
 * made up for the demo; their dates are set from today, so the preview never
 * goes stale.
 */

export const DEMO_COMPANY = 'Mvelo Projects (Pty) Ltd'

/** Real eTenders category labels, so the profile and matching read like the app's own. */
export const DEMO_CATEGORIES: readonly string[] = [
    'Services: Building',
    'Construction of buildings',
    'Civil engineering',
    'Services: Electrical',
    'Services to buildings and landscape activities',
]

/** Where the sample company works on each plan: one province, four, or all nine. */
export const DEMO_PROVINCES: Readonly<Record<PricingTier, readonly string[]>> = {
    single: ['Gauteng'],
    mid: ['Gauteng', 'KwaZulu-Natal', 'Mpumalanga', 'Limpopo'],
    all: PROVINCES,
}

const DAY_MS = 86_400_000

/** `YYYY-MM-DD`, `days` from today (negative for the past), counted the way the app counts days. */
export function dayFromToday(days: number): string
{
    const now = new Date()

    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) + days * DAY_MS).toISOString().slice(0, 10)
}

export function demoSettings(tier: PricingTier): Settings
{
    return {
        companyName: DEMO_COMPANY,
        cidbGrades: { GB: 5, CE: 4, EB: 3 },
        serviceLines: [],
        categories: [...DEMO_CATEGORIES],
        provinces: [...DEMO_PROVINCES[tier]],
        notifyEmail: 'tenders@yourcompany.co.za',
        notifyEnabled: true,
        tenderLeadDays: [7, 3, 1],
        complianceLeadDays: [60, 30, 7],
        provider: null,
        providerKeySet: false,
    }
}

export function demoClaims(): Claim[]
{
    const asAt = dayFromToday(-40)

    return [
        { id: 'demo-csd', claimType: 'csd', subjectKey: '', value: { registered: true }, status: 'verified', source: 'csd_pdf', asAt, validUntil: null },
        { id: 'demo-tax', claimType: 'tax', subjectKey: '', value: { compliant: true }, status: 'verified', source: 'csd_pdf', asAt, validUntil: null },
        { id: 'demo-bbee', claimType: 'bbee_level', subjectKey: '', value: { level: 1 }, status: 'declared', source: 'user', asAt, validUntil: null },
    ]
}

export interface DemoGate
{
    readonly type: string
    readonly label: string
    readonly state: GateState
}

export interface DemoTender
{
    readonly id: string
    readonly tenderNo: string
    readonly title: string
    readonly description: string
    readonly organ: string
    readonly department: string | null
    readonly sector: 'government' | 'state-owned' | 'external'
    readonly province: string
    readonly category: string
    /** The category's bucket, which is also the work type shown on cards. */
    readonly bucket: string
    readonly bidType: string
    readonly closesIn: number
    readonly publishedAgo: number
    readonly briefing: { readonly inDays: number, readonly compulsory: boolean } | null
    readonly reAdvert: boolean
    readonly estimate: {
        readonly value: number
        readonly low: number | null
        readonly high: number | null
        readonly basis: string
        readonly detail: string | null
    }
    readonly place: {
        readonly name: string
        readonly lat: number
        readonly lng: number
        readonly precision: MapPrecision
        readonly verified: boolean
    }
    readonly summary: string
    readonly deliverables: readonly string[]
    readonly skills: readonly string[]
    readonly gates: readonly DemoGate[]
}

const CSD: DemoGate = { type: 'csd', label: 'Registered on the Central Supplier Database (CSD)', state: 'meets_verified' }
const TAX: DemoGate = { type: 'tax', label: 'Tax compliant with SARS', state: 'meets_verified' }

function cidb(grade: number, cls: string, state: GateState): DemoGate
{
    return { type: 'cidb', label: `CIDB grade ${grade} ${cls} or higher`, state }
}

function bbee(level: number): DemoGate
{
    return { type: 'bbee', label: `B-BBEE level ${level} or better`, state: 'meets_declared' }
}

export const DEMO_TENDERS: readonly DemoTender[] = [
    // Gauteng
    {
        id: 'demo-gp-01',
        tenderNo: 'GDE/2026/0142',
        title: 'Refurbishment of ablution facilities at 14 schools in the Johannesburg East district',
        description: 'Repair and refurbishment of learner and staff ablution blocks, including plumbing, tiling, partitions and accessible toilets, at 14 public schools.',
        organ: 'Gauteng Department of Education',
        department: 'Infrastructure Delivery',
        sector: 'government',
        province: 'Gauteng',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 9,
        publishedAgo: 3,
        briefing: { inDays: 3, compulsory: true },
        reAdvert: false,
        estimate: { value: 4_200_000, low: 3_100_000, high: 5_600_000, basis: BASIS_CIDB_BAND, detail: '5GB' },
        place: { name: 'Johannesburg East', lat: -26.17, lng: 28.13, precision: 'town', verified: true },
        summary: 'Fix up the toilet blocks at 14 schools so they are safe, working and accessible, with the work done around the school day.',
        deliverables: ['Strip out and replace sanitary fittings', 'New plumbing and drainage where needed', 'Wall and floor tiling', 'Accessible toilet at each school', 'Close-out report per school'],
        skills: ['Plumbing', 'Tiling', 'General building'],
        gates: [cidb(5, 'GB', 'meets_declared'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-gp-02',
        tenderNo: 'COJ/EL/2026/033',
        title: 'Maintenance of streetlights and high-mast lighting in Region D',
        description: 'Routine and reactive maintenance of streetlights and high-mast lights for 24 months, with a 48-hour repair turnaround.',
        organ: 'City of Johannesburg',
        department: 'City Power',
        sector: 'government',
        province: 'Gauteng',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Bid',
        closesIn: 5,
        publishedAgo: 2,
        briefing: null,
        reAdvert: false,
        estimate: { value: 2_800_000, low: 2_100_000, high: 3_500_000, basis: BASIS_CLIENT_CATEGORY, detail: '6 awards' },
        place: { name: 'Soweto', lat: -26.27, lng: 27.86, precision: 'town', verified: true },
        summary: 'Keep the streetlights and high masts in Region D working for two years, fixing faults within 48 hours of a call-out.',
        deliverables: ['Monthly night patrols and fault logs', 'Lamp, fitting and cable repairs', 'High-mast servicing', 'Monthly maintenance report'],
        skills: ['Electrical', 'Cherry-picker operation'],
        gates: [cidb(3, 'EB', 'meets_declared'), CSD, TAX],
    },
    {
        id: 'demo-gp-03',
        tenderNo: 'TSH/FM/2026/018',
        title: 'Cleaning and grounds maintenance at Tshwane regional offices for 36 months',
        description: 'Daily cleaning, hygiene services and garden maintenance at four regional office buildings.',
        organ: 'City of Tshwane',
        department: 'Facilities Management',
        sector: 'government',
        province: 'Gauteng',
        category: 'Services to buildings and landscape activities',
        bucket: 'CS',
        bidType: 'Request for Bid',
        closesIn: 16,
        publishedAgo: 6,
        briefing: { inDays: 7, compulsory: false },
        reAdvert: false,
        estimate: { value: 6_500_000, low: null, high: null, basis: BASIS_CLIENT, detail: '4 awards' },
        place: { name: 'Pretoria', lat: -25.75, lng: 28.19, precision: 'town', verified: true },
        summary: 'Clean four office buildings every working day and look after their gardens for three years.',
        deliverables: ['Daily office cleaning', 'Hygiene consumables and sanitary bins', 'Weekly garden maintenance', 'Monthly quality inspections'],
        skills: ['Cleaning', 'Landscaping'],
        gates: [CSD, TAX, bbee(1)],
    },
    {
        id: 'demo-gp-04',
        tenderNo: 'JRA/2026/RD/07',
        title: 'Upgrade of gravel roads to paved standard in Ward 21, Soweto',
        description: 'Upgrading 3.2 km of gravel roads to block paving, with stormwater drainage and kerbs.',
        organ: 'Johannesburg Roads Agency',
        department: null,
        sector: 'state-owned',
        province: 'Gauteng',
        category: 'Civil engineering',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 22,
        publishedAgo: 10,
        briefing: { inDays: 8, compulsory: true },
        reAdvert: false,
        estimate: { value: 12_400_000, low: 10_000_000, high: 20_000_000, basis: BASIS_CIDB_BAND, detail: '6CE' },
        place: { name: 'Ward 21, Soweto', lat: -26.24, lng: 27.9, precision: 'site', verified: true },
        summary: 'Turn 3.2 km of gravel streets into paved roads with proper drainage.',
        deliverables: ['Earthworks and layer works', 'Interlocking block paving', 'Kerbs and stormwater channels', 'Road markings and signage'],
        skills: ['Civil works', 'Paving'],
        gates: [cidb(6, 'CE', 'fails'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-gp-05',
        tenderNo: 'EKU/HLT/2026/112',
        title: 'Repairs to roof waterproofing at Ekurhuleni clinics',
        description: 'Waterproofing repairs and gutter replacement at five primary health clinics.',
        organ: 'City of Ekurhuleni',
        department: 'Health and Social Development',
        sector: 'government',
        province: 'Gauteng',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Quotation',
        closesIn: 3,
        publishedAgo: 8,
        briefing: null,
        reAdvert: true,
        estimate: { value: 950_000, low: 600_000, high: 1_300_000, basis: BASIS_SCOPE, detail: null },
        place: { name: 'Germiston', lat: -26.22, lng: 28.17, precision: 'town', verified: false },
        summary: 'Stop the leaks at five clinics: new waterproofing, flashings and gutters.',
        deliverables: ['Roof inspection report', 'Torch-on waterproofing', 'Gutter and downpipe replacement'],
        skills: ['Waterproofing', 'Roofing'],
        gates: [cidb(2, 'GB', 'meets_declared'), CSD, TAX],
    },
    {
        id: 'demo-gp-06',
        tenderNo: 'RW/2026/ELEC/09',
        title: 'Electrical reticulation repairs at the Vereeniging pump station',
        description: 'Replacement of distribution boards, cabling and lighting at a bulk water pump station.',
        organ: 'Rand Water',
        department: null,
        sector: 'state-owned',
        province: 'Gauteng',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Bid',
        closesIn: 12,
        publishedAgo: 4,
        briefing: null,
        reAdvert: false,
        estimate: { value: 1_600_000, low: 1_200_000, high: 2_000_000, basis: BASIS_STATED, detail: null },
        place: { name: 'Vereeniging', lat: -26.67, lng: 27.93, precision: 'town', verified: true },
        summary: 'Replace worn electrical boards, cables and lights at a pump station without stopping the pumps.',
        deliverables: ['New distribution boards', 'Cable replacement', 'LED lighting', 'Certificate of compliance'],
        skills: ['Electrical', 'Industrial installations'],
        gates: [cidb(3, 'EB', 'meets_declared'), CSD, TAX],
    },
    {
        id: 'demo-gp-07',
        tenderNo: 'GDH/2026/MED/051',
        title: 'Supply of laboratory consumables to provincial hospitals',
        description: 'Supply and delivery of laboratory consumables on an as-and-when basis for 24 months.',
        organ: 'Gauteng Department of Health',
        department: 'Supply Chain Management',
        sector: 'government',
        province: 'Gauteng',
        category: 'Supplies: Medical',
        bucket: 'MH',
        bidType: 'Request for Bid',
        closesIn: 11,
        publishedAgo: 5,
        briefing: null,
        reAdvert: false,
        estimate: { value: 3_300_000, low: null, high: null, basis: BASIS_CLIENT, detail: '9 awards' },
        place: { name: 'Johannesburg', lat: -26.2, lng: 28.05, precision: 'buyer', verified: false },
        summary: 'Deliver laboratory consumables to provincial hospitals when they order them, for two years.',
        deliverables: ['Price schedule for 120 items', 'Delivery within 5 working days'],
        skills: ['Medical supplies'],
        gates: [CSD, TAX],
    },
    // KwaZulu-Natal
    {
        id: 'demo-kz-01',
        tenderNo: 'MSU/CS/2026/044',
        title: 'Construction of a community hall in Ward 7, Msunduzi',
        description: 'Construction of a 300-seat community hall with kitchen, ablutions, parking and fencing.',
        organ: 'Msunduzi Local Municipality',
        department: 'Community Services',
        sector: 'government',
        province: 'KwaZulu-Natal',
        category: 'Construction of buildings',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 18,
        publishedAgo: 9,
        briefing: { inDays: 6, compulsory: true },
        reAdvert: false,
        estimate: { value: 8_900_000, low: 6_000_000, high: 10_000_000, basis: BASIS_CIDB_BAND, detail: '5GB' },
        place: { name: 'Pietermaritzburg', lat: -29.6, lng: 30.38, precision: 'town', verified: true },
        summary: 'Build a new 300-seat community hall with a kitchen, toilets and parking.',
        deliverables: ['Foundations and structure', 'Roof and ceilings', 'Kitchen and ablutions', 'Paved parking and fencing'],
        skills: ['General building', 'Plumbing', 'Electrical'],
        gates: [cidb(5, 'GB', 'meets_declared'), CSD, TAX, bbee(1)],
    },
    {
        id: 'demo-kz-02',
        tenderNo: 'TNPA/DBN/2026/0217',
        title: 'Electrical maintenance of port buildings in Durban',
        description: 'Three-year maintenance contract for electrical installations in port office and workshop buildings.',
        organ: 'Transnet National Ports Authority',
        department: null,
        sector: 'state-owned',
        province: 'KwaZulu-Natal',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Proposal',
        closesIn: 11,
        publishedAgo: 12,
        briefing: null,
        reAdvert: false,
        estimate: { value: 3_400_000, low: 3_000_000, high: 6_000_000, basis: BASIS_CIDB_BAND, detail: '4EB' },
        place: { name: 'Port of Durban', lat: -29.87, lng: 31.03, precision: 'site', verified: true },
        summary: 'Look after the electrical installations in the port\'s offices and workshops for three years.',
        deliverables: ['Planned maintenance schedule', 'Fault response within 4 hours', 'Annual compliance testing'],
        skills: ['Electrical', 'Industrial installations'],
        gates: [cidb(4, 'EB', 'fails'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-kz-03',
        tenderNo: 'UMH/2026/FM/12',
        title: 'Cleaning and hygiene services at Richards Bay civic offices',
        description: 'Cleaning and hygiene services at the civic centre and two satellite offices for 24 months.',
        organ: 'City of uMhlathuze',
        department: 'Corporate Services',
        sector: 'government',
        province: 'KwaZulu-Natal',
        category: 'Services to buildings and landscape activities',
        bucket: 'CS',
        bidType: 'Request for Bid',
        closesIn: 25,
        publishedAgo: 1,
        briefing: null,
        reAdvert: false,
        estimate: { value: 2_200_000, low: null, high: null, basis: BASIS_CLIENT, detail: '3 awards' },
        place: { name: 'Richards Bay', lat: -28.78, lng: 32.04, precision: 'town', verified: true },
        summary: 'Keep the civic centre and two smaller offices clean and stocked every working day.',
        deliverables: ['Daily cleaning', 'Hygiene services', 'Window cleaning each quarter'],
        skills: ['Cleaning'],
        gates: [CSD, TAX, bbee(1)],
    },
    {
        id: 'demo-kz-04',
        tenderNo: 'DPWI/KZN/2026/038',
        title: 'Renovation of the Newcastle magistrate\'s court',
        description: 'Renovation of courtrooms, holding cells and offices, including new finishes and fire detection.',
        organ: 'Department of Public Works and Infrastructure',
        department: 'Durban Regional Office',
        sector: 'government',
        province: 'KwaZulu-Natal',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 7,
        publishedAgo: 14,
        briefing: { inDays: -2, compulsory: false },
        reAdvert: false,
        estimate: { value: 5_100_000, low: 3_000_000, high: 6_000_000, basis: BASIS_CIDB_BAND, detail: '5GB' },
        place: { name: 'Newcastle', lat: -27.76, lng: 29.93, precision: 'town', verified: true },
        summary: 'Renovate a working magistrate\'s court in phases, so it stays open while you work.',
        deliverables: ['Phasing plan agreed with the court', 'New floor, wall and ceiling finishes', 'Fire detection system', 'Holding cell repairs'],
        skills: ['General building', 'Fire protection'],
        gates: [cidb(5, 'GB', 'meets_declared'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-kz-05',
        tenderNo: 'KZNDOE/2026/CAT/07',
        title: 'Catering for learner winter camps',
        description: 'Meals and refreshments for three winter camps of 400 learners each.',
        organ: 'KwaZulu-Natal Department of Education',
        department: null,
        sector: 'government',
        province: 'KwaZulu-Natal',
        category: 'Food and beverage service activities',
        bucket: 'EC',
        bidType: 'Request for Quotation',
        closesIn: 4,
        publishedAgo: 3,
        briefing: null,
        reAdvert: false,
        estimate: { value: 680_000, low: 500_000, high: 900_000, basis: BASIS_SCOPE, detail: null },
        place: { name: 'Durban', lat: -29.86, lng: 31.02, precision: 'buyer', verified: false },
        summary: 'Feed 400 learners three meals a day at three week-long winter camps.',
        deliverables: ['Menus approved by a dietician', 'Three meals and two snacks a day'],
        skills: ['Catering'],
        gates: [CSD, TAX],
    },
    // Mpumalanga
    {
        id: 'demo-mp-01',
        tenderNo: 'DPWRT/MP/2026/091',
        title: 'Rehabilitation of road D2296 near Mbombela',
        description: 'Patching, resealing and drainage repairs over 6 km of district road D2296.',
        organ: 'Mpumalanga Department of Public Works, Roads and Transport',
        department: 'Roads',
        sector: 'government',
        province: 'Mpumalanga',
        category: 'Civil engineering',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 20,
        publishedAgo: 7,
        briefing: { inDays: 5, compulsory: true },
        reAdvert: false,
        estimate: { value: 4_800_000, low: 3_000_000, high: 6_000_000, basis: BASIS_CIDB_BAND, detail: '4CE' },
        place: { name: 'Road D2296, Mbombela', lat: -25.42, lng: 30.9, precision: 'site', verified: true },
        summary: 'Repair 6 km of district road: patch the potholes, reseal the surface and clear the drains.',
        deliverables: ['Pothole patching', 'Surface reseal', 'Drainage repairs', 'Traffic accommodation'],
        skills: ['Road works'],
        gates: [cidb(4, 'CE', 'meets_declared'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-mp-02',
        tenderNo: 'ELM/2026/ENG/23',
        title: 'Installation of solar street lighting in eMalahleni townships',
        description: 'Supply and installation of 220 solar streetlights in three wards.',
        organ: 'Emalahleni Local Municipality',
        department: 'Technical Services',
        sector: 'government',
        province: 'Mpumalanga',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Bid',
        closesIn: 13,
        publishedAgo: 5,
        briefing: { inDays: 4, compulsory: false },
        reAdvert: false,
        estimate: { value: 2_600_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3EB' },
        place: { name: 'eMalahleni', lat: -25.87, lng: 29.23, precision: 'town', verified: true },
        summary: 'Put up 220 solar streetlights across three wards, with a one-year maintenance period.',
        deliverables: ['Supply of 220 solar lights', 'Foundations and installation', '12-month maintenance'],
        skills: ['Electrical', 'Solar'],
        gates: [cidb(3, 'EB', 'meets_declared'), CSD, TAX],
    },
    {
        id: 'demo-mp-03',
        tenderNo: 'GMM/2026/SCM/40',
        title: 'Supply of protective clothing for municipal staff',
        description: 'Supply and delivery of overalls, boots and rain suits for 650 staff.',
        organ: 'Govan Mbeki Local Municipality',
        department: null,
        sector: 'government',
        province: 'Mpumalanga',
        category: 'Supplies: Clothing/Textiles/Footwear',
        bucket: 'SP',
        bidType: 'Request for Quotation',
        closesIn: 8,
        publishedAgo: 2,
        briefing: null,
        reAdvert: false,
        estimate: { value: 900_000, low: null, high: null, basis: BASIS_CLIENT, detail: '2 awards' },
        place: { name: 'Secunda', lat: -26.55, lng: 29.17, precision: 'buyer', verified: false },
        summary: 'Supply protective clothing for 650 municipal workers.',
        deliverables: ['Samples for approval', 'Delivery in two batches'],
        skills: ['Clothing supply'],
        gates: [CSD, TAX],
    },
    // Limpopo
    {
        id: 'demo-lp-01',
        tenderNo: 'LDOE/2026/INF/16',
        title: 'Construction of six classrooms at a secondary school near Thohoyandou',
        description: 'Construction of a six-classroom block with a covered walkway and ramps.',
        organ: 'Limpopo Department of Education',
        department: 'Infrastructure',
        sector: 'government',
        province: 'Limpopo',
        category: 'Construction of buildings',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 15,
        publishedAgo: 6,
        briefing: { inDays: 4, compulsory: true },
        reAdvert: false,
        estimate: { value: 7_300_000, low: 6_000_000, high: 10_000_000, basis: BASIS_CIDB_BAND, detail: '5GB' },
        place: { name: 'Thohoyandou', lat: -22.95, lng: 30.48, precision: 'town', verified: true },
        summary: 'Build a six-classroom block with ramps and a covered walkway at a rural secondary school.',
        deliverables: ['Six classrooms', 'Covered walkway and ramps', 'Electrical installation', 'Site clean-up'],
        skills: ['General building'],
        gates: [cidb(5, 'GB', 'meets_declared'), CSD, TAX, bbee(1)],
    },
    {
        id: 'demo-lp-02',
        tenderNo: 'PLK/2026/WS/08',
        title: 'Building maintenance at Polokwane water treatment works',
        description: 'Repairs to roofs, doors, windows and painting of buildings at the water treatment works.',
        organ: 'Polokwane Local Municipality',
        department: 'Water and Sanitation',
        sector: 'government',
        province: 'Limpopo',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Quotation',
        closesIn: 10,
        publishedAgo: 3,
        briefing: null,
        reAdvert: false,
        estimate: { value: 1_900_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3GB' },
        place: { name: 'Polokwane', lat: -23.9, lng: 29.45, precision: 'town', verified: true },
        summary: 'Repair and repaint the buildings at the water treatment works.',
        deliverables: ['Roof repairs', 'Doors and windows', 'Painting inside and out'],
        skills: ['General building', 'Painting'],
        gates: [cidb(3, 'GB', 'meets_declared'), CSD, TAX],
    },
    // Western Cape
    {
        id: 'demo-wc-01',
        tenderNo: 'CCT/2026/FAC/119',
        title: 'Refurbishment of public toilets along the Atlantic seaboard',
        description: 'Refurbishment of eight public toilet blocks at beaches between Sea Point and Camps Bay.',
        organ: 'City of Cape Town',
        department: 'Recreation and Parks',
        sector: 'government',
        province: 'Western Cape',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 14,
        publishedAgo: 4,
        briefing: { inDays: 5, compulsory: true },
        reAdvert: false,
        estimate: { value: 2_400_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3GB' },
        place: { name: 'Sea Point to Camps Bay', lat: -33.93, lng: 18.38, precision: 'site', verified: true },
        summary: 'Refurbish eight beach toilet blocks before the summer season.',
        deliverables: ['New fittings and partitions', 'Waterproofing', 'Painting', 'Accessible cubicles'],
        skills: ['General building', 'Plumbing'],
        gates: [cidb(3, 'GB', 'meets_declared'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-wc-02',
        tenderNo: 'WCDHW/2026/EL/14',
        title: 'Electrical upgrades at George Regional Hospital',
        description: 'Upgrading distribution boards and emergency lighting in two hospital wards.',
        organ: 'Western Cape Department of Health and Wellness',
        department: 'Engineering and Technical Support',
        sector: 'government',
        province: 'Western Cape',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Bid',
        closesIn: 19,
        publishedAgo: 8,
        briefing: null,
        reAdvert: false,
        estimate: { value: 2_700_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3EB' },
        place: { name: 'George', lat: -33.96, lng: 22.46, precision: 'town', verified: true },
        summary: 'Upgrade the electrical boards and emergency lights in two wards while the hospital stays open.',
        deliverables: ['New distribution boards', 'Emergency lighting', 'Testing and certificate of compliance'],
        skills: ['Electrical'],
        gates: [cidb(3, 'EB', 'meets_declared'), CSD, TAX],
    },
    {
        id: 'demo-wc-03',
        tenderNo: 'STB/2026/ICT/05',
        title: 'Development of an online building plan submission system',
        description: 'Design, build and support of a web system for submitting and tracking building plans.',
        organ: 'Stellenbosch Municipality',
        department: 'Planning and Development',
        sector: 'government',
        province: 'Western Cape',
        category: 'Computer programming, consultancy and related activities',
        bucket: 'IT',
        bidType: 'Request for Proposal',
        closesIn: 21,
        publishedAgo: 9,
        briefing: null,
        reAdvert: false,
        estimate: { value: 1_800_000, low: null, high: null, basis: BASIS_CLIENT, detail: '2 awards' },
        place: { name: 'Stellenbosch', lat: -33.93, lng: 18.86, precision: 'buyer', verified: false },
        summary: 'Build and support a website where residents submit and track building plans.',
        deliverables: ['System design', 'Web application', 'Training', 'Two years of support'],
        skills: ['Software development'],
        gates: [CSD, TAX],
    },
    // Eastern Cape
    {
        id: 'demo-ec-01',
        tenderNo: 'ECDOE/2026/ORT/22',
        title: 'Repairs to storm-damaged schools in the OR Tambo district',
        description: 'Roof, window and ceiling repairs at nine schools damaged in the winter storms.',
        organ: 'Eastern Cape Department of Education',
        department: 'Infrastructure',
        sector: 'government',
        province: 'Eastern Cape',
        category: 'Services: Building',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 8,
        publishedAgo: 5,
        briefing: { inDays: 2, compulsory: true },
        reAdvert: false,
        estimate: { value: 6_200_000, low: 6_000_000, high: 10_000_000, basis: BASIS_CIDB_BAND, detail: '5GB' },
        place: { name: 'Mthatha', lat: -31.59, lng: 28.78, precision: 'town', verified: true },
        summary: 'Repair roofs, ceilings and windows at nine storm-damaged schools.',
        deliverables: ['Damage assessment per school', 'Roof and ceiling repairs', 'Glazing', 'Close-out report'],
        skills: ['General building', 'Roofing'],
        gates: [cidb(5, 'GB', 'meets_declared'), CSD, TAX, bbee(2)],
    },
    {
        id: 'demo-ec-02',
        tenderNo: 'NMBM/2026/INF/31',
        title: 'Construction of a public transport facility in Motherwell',
        description: 'Construction of a taxi rank with shelters, ablutions and paved holding areas.',
        organ: 'Nelson Mandela Bay Metropolitan Municipality',
        department: 'Infrastructure and Engineering',
        sector: 'government',
        province: 'Eastern Cape',
        category: 'Civil engineering',
        bucket: 'CW',
        bidType: 'Request for Bid',
        closesIn: 27,
        publishedAgo: 11,
        briefing: { inDays: 9, compulsory: true },
        reAdvert: false,
        estimate: { value: 5_600_000, low: 3_000_000, high: 6_000_000, basis: BASIS_CIDB_BAND, detail: '4CE' },
        place: { name: 'Motherwell, Gqeberha', lat: -33.8, lng: 25.59, precision: 'site', verified: true },
        summary: 'Build a taxi rank with shelters, toilets and paved holding bays.',
        deliverables: ['Earthworks and paving', 'Shelters', 'Ablution block', 'Lighting'],
        skills: ['Civil works', 'General building'],
        gates: [cidb(4, 'CE', 'meets_declared'), CSD, TAX, bbee(1)],
    },
    // Free State
    {
        id: 'demo-fs-01',
        tenderNo: 'MMM/2026/WM/06',
        title: 'Fencing and guardhouse at the Northern landfill site',
        description: 'Palisade fencing around the landfill site and a new guardhouse at the entrance.',
        organ: 'Mangaung Metropolitan Municipality',
        department: 'Waste Management',
        sector: 'government',
        province: 'Free State',
        category: 'Construction of buildings',
        bucket: 'CW',
        bidType: 'Request for Quotation',
        closesIn: 17,
        publishedAgo: 2,
        briefing: null,
        reAdvert: false,
        estimate: { value: 1_200_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3GB' },
        place: { name: 'Bloemfontein', lat: -29.12, lng: 26.21, precision: 'town', verified: true },
        summary: 'Fence the landfill site and build a guardhouse at the gate.',
        deliverables: ['1.8 km palisade fence', 'Guardhouse', 'Access gates'],
        skills: ['Fencing', 'General building'],
        gates: [cidb(3, 'GB', 'meets_declared'), CSD, TAX],
    },
    // North West
    {
        id: 'demo-nw-01',
        tenderNo: 'RLM/2026/TS/19',
        title: 'Air-conditioning maintenance at Rustenburg licensing offices',
        description: 'Servicing and repair of split units and a central air-conditioning plant for 12 months.',
        organ: 'Rustenburg Local Municipality',
        department: 'Technical Services',
        sector: 'government',
        province: 'North West',
        category: 'Services: Electrical',
        bucket: 'EE',
        bidType: 'Request for Quotation',
        closesIn: 6,
        publishedAgo: 4,
        briefing: null,
        reAdvert: false,
        estimate: { value: 780_000, low: 500_000, high: 1_000_000, basis: BASIS_SCOPE, detail: null },
        place: { name: 'Rustenburg', lat: -25.67, lng: 27.24, precision: 'town', verified: true },
        summary: 'Service and repair the air-conditioning at the licensing offices for a year.',
        deliverables: ['Quarterly servicing', 'Breakdown repairs', 'Service records'],
        skills: ['HVAC', 'Electrical'],
        gates: [{ type: 'cidb', label: 'CIDB grade 1 ME or higher', state: 'profile_unknown' }, CSD, TAX],
    },
    // Northern Cape
    {
        id: 'demo-nc-01',
        tenderNo: 'ESK/NC/2026/0088',
        title: 'Construction of a guardhouse and perimeter wall at the Kimberley depot',
        description: 'A new guardhouse, boom gates and 400 m of precast perimeter wall.',
        organ: 'Eskom Holdings SOC Ltd',
        department: 'Distribution, Northern Cape',
        sector: 'state-owned',
        province: 'Northern Cape',
        category: 'Construction of buildings',
        bucket: 'CW',
        bidType: 'Request for Quotation',
        closesIn: 24,
        publishedAgo: 6,
        briefing: { inDays: 10, compulsory: false },
        reAdvert: false,
        estimate: { value: 1_400_000, low: 1_000_000, high: 3_000_000, basis: BASIS_CIDB_BAND, detail: '3GB' },
        place: { name: 'Kimberley', lat: -28.74, lng: 24.77, precision: 'town', verified: true },
        summary: 'Build a guardhouse, boom gates and a precast wall around a depot.',
        deliverables: ['Guardhouse', 'Boom gates', '400 m precast wall'],
        skills: ['General building'],
        gates: [cidb(3, 'GB', 'meets_declared'), CSD, TAX, bbee(2)],
    },
]

/** Tenders the sample company has bookmarked (Growth and Pro). */
export const DEMO_BOOKMARKS: readonly string[] = ['demo-gp-01', 'demo-gp-02', 'demo-kz-01', 'demo-mp-02']
