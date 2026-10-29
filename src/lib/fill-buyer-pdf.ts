import type { BidProfile } from '../../worker/domain/bid-profile'
import { formPageNumbers, planFill, type FillPlan, type FillRule, type FillTextItem } from '../../worker/domain/form-fill'
import type { TenderPdf } from '@/lib/tender-pdf'

/** Render scale for finding table borders: two pixels per point. */
const SCALE = 2

/** A pixel this dark (0-255 luminance) is ink. */
const INK = 170

/** Shortest vertical rule in points: taller than a capital letter. */
const MIN_VERTICAL = 10

/** Shortest horizontal rule in points. */
const MIN_HORIZONTAL = 24

/** Ink colour of the filled-in values: a dark blue, like a pen. */
const INK_RGB = [0.05, 0.2, 0.55] as const

export interface FilledPdf
{
    readonly plan: FillPlan
    /** The buyer's document with the values written in; null when nothing was filled. */
    readonly blob: Blob | null
}

function inside(x: number, y: number, items: readonly FillTextItem[]): boolean
{
    return items.some((item) => x >= item.x - 1 && x <= item.x + item.width + 1 && y >= item.y - item.height * 0.3 - 1 && y <= item.y + item.height + 1)
}

/**
 * Finds the ruled lines on a page by rendering it and looking for long straight
 * runs of ink. Strokes inside text are ignored, so letters never count as lines.
 */
async function pageRules(page: import('pdfjs-dist').PDFPageProxy, number: number, items: readonly FillTextItem[]): Promise<FillRule[]>
{
    const viewport = page.getViewport({ scale: SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (context === null) {
        return []
    }

    await page.render({ canvas, canvasContext: context, viewport }).promise

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
    const ink = (x: number, y: number): boolean =>
    {
        const at = (y * width + x) * 4

        return (data[at] ?? 255) * 0.3 + (data[at + 1] ?? 255) * 0.59 + (data[at + 2] ?? 255) * 0.11 < INK
    }
    const rules: FillRule[] = []
    const add = (ax: number, ay: number, bx: number, by: number): void =>
    {
        const [x0, y0] = viewport.convertToPdfPoint(ax, ay) as [number, number]
        const [x1, y1] = viewport.convertToPdfPoint(bx, by) as [number, number]

        if (!inside((x0 + x1) / 2, (y0 + y1) / 2, items)) {
            rules.push({ page: number, x0, y0, x1, y1 })
        }
    }

    for (let x = 0; x < width; x++) {
        let run = 0

        for (let y = 0; y <= height; y++) {
            if (y < height && ink(x, y)) {
                run++
            } else {
                if (run >= MIN_VERTICAL * SCALE) {
                    add(x, y - run, x, y - 1)
                }

                run = 0
            }
        }
    }

    for (let y = 0; y < height; y++) {
        let run = 0

        for (let x = 0; x <= width; x++) {
            if (x < width && ink(x, y)) {
                run++
            } else {
                if (run >= MIN_HORIZONTAL * SCALE) {
                    add(x - run, y, x - 1, y)
                }

                run = 0
            }
        }
    }

    canvas.width = 0
    canvas.height = 0

    return rules
}

/**
 * Writes the bid profile's answers onto the buyer's own PDF: plans the
 * placements beside the printed labels, then draws them with pdf-lib. Rotated
 * pages are left alone. Both libraries load on demand.
 */
export async function fillBuyerPdf(pdf: TenderPdf, profile: BidProfile, tenderNo: string | null): Promise<FilledPdf>
{
    const [pdfjs, worker, { PDFDocument, rgb, StandardFonts }] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        import('pdf-lib'),
    ])

    pdfjs.GlobalWorkerOptions.workerSrc = worker.default

    const out = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true })
    const font = await out.embedFont(StandardFonts.Helvetica)
    const rotated = new Set(out.getPages().flatMap((page, index) => (page.getRotation().angle % 360 !== 0 ? [index + 1] : [])))
    const pages = pdf.pages.filter((page) => !rotated.has(page.page))
    const items = pdf.items.filter((item) => !rotated.has(item.page))
    const rules: FillRule[] = []
    const source = await pdfjs.getDocument({ data: pdf.bytes.slice() }).promise

    try {
        for (const number of formPageNumbers(pages, items)) {
            rules.push(...await pageRules(await source.getPage(number), number, items.filter((item) => item.page === number)))
        }
    } finally {
        await source.destroy()
    }

    // The standard font covers Western European text; anything else prints as "?".
    const supported = new Set(font.getCharacterSet())
    const printable = (text: string): string => [...text].map((char) => (supported.has(char.codePointAt(0) ?? 0) ? char : '?')).join('')
    const plan = planFill({ profile, tenderNo, pages, items, rules, measure: (text, size) => font.widthOfTextAtSize(printable(text), size) })

    for (const placement of plan.placements) {
        out.getPage(placement.page - 1).drawText(printable(placement.text), {
            x: placement.x,
            y: placement.y,
            size: placement.size,
            font,
            color: rgb(...INK_RGB),
        })
    }

    if (plan.placements.length === 0) {
        return { plan, blob: null }
    }

    const bytes = await out.save()

    return { plan, blob: new Blob([bytes.slice().buffer], { type: 'application/pdf' }) }
}
