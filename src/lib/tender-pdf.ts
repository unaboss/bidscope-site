import type { PdfTextItem } from '../../worker/domain/specific-goals'

/** Largest buyer document read in the browser (matches the server's pass-through cap). */
const MAX_BYTES = 25 * 1024 * 1024

/** A page with less text than this is treated as an image (a scan). */
const MIN_TEXT_CHARS = 80

export class TenderPdfError extends Error {}

export interface TenderPdfPage
{
    readonly page: number
    readonly width: number
    readonly height: number
    readonly hasText: boolean
}

export interface TenderPdf
{
    readonly bytes: Uint8Array
    readonly pages: readonly TenderPdfPage[]
    /** Text items in PDF user space (origin bottom-left), with each item's width and height. */
    readonly items: ReadonlyArray<PdfTextItem & { readonly width: number, readonly height: number }>
    /** True when most pages carry no text layer. */
    readonly scanned: boolean
}

/**
 * Downloads a buyer's document through the server and reads its text with
 * pdf.js, loaded on demand so it never weighs on the main bundle.
 */
export async function readTenderPdf(url: string, signal?: AbortSignal): Promise<TenderPdf>
{
    const response = await fetch(url, { signal })

    if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null

        throw new TenderPdfError(body?.error ?? `Could not download the document (${response.status})`)
    }

    const bytes = new Uint8Array(await response.arrayBuffer())

    if (bytes.length > MAX_BYTES) {
        throw new TenderPdfError('That document is too large to read here.')
    }

    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
        throw new TenderPdfError('This document is not a PDF. Word and Excel files cannot be read here yet.')
    }

    const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])

    pdfjs.GlobalWorkerOptions.workerSrc = worker.default

    const pages: TenderPdfPage[] = []
    const items: Array<PdfTextItem & { width: number, height: number }> = []

    try {
        // pdf.js takes ownership of the buffer it is given, so it reads a copy.
        const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise

        for (let number = 1; number <= doc.numPages; number++)
        {
            const page = await doc.getPage(number)
            const viewport = page.getViewport({ scale: 1 })
            const content = await page.getTextContent()
            let chars = 0

            for (const item of content.items)
            {
                if ('str' in item && item.str.trim() !== '') {
                    chars += item.str.trim().length
                    items.push({ page: number, x: item.transform[4] as number, y: item.transform[5] as number, str: item.str, width: item.width, height: item.height })
                }
            }

            pages.push({ page: number, width: viewport.width, height: viewport.height, hasText: chars >= MIN_TEXT_CHARS })
        }

        await doc.destroy()
    } catch {
        throw new TenderPdfError('We could not open that PDF.')
    }

    const textPages = pages.filter((page) => page.hasText).length

    return { bytes, pages, items, scanned: textPages * 2 < pages.length }
}
