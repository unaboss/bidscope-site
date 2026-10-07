import { parseCsdReport, type CsdReport, type TextCell } from '@/lib/csd'

/** Largest PDF we try to read; CSD summary reports are well under 1 MB. */
const MAX_BYTES = 5 * 1024 * 1024

export class CsdReadError extends Error {}

/**
 * Reads a CSD summary report PDF entirely in the browser. pdf.js is loaded on
 * demand so it never weighs on the main bundle.
 */
export async function readCsdPdf(file: File): Promise<CsdReport>
{
    if (file.size > MAX_BYTES) {
        throw new CsdReadError('That file is too large to be a CSD summary report.')
    }

    const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])

    pdfjs.GlobalWorkerOptions.workerSrc = worker.default

    let cells: TextCell[]

    try {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
        cells = []

        for (let page = 1; page <= Math.min(doc.numPages, 5); page++)
        {
            const content = await (await doc.getPage(page)).getTextContent()

            for (const item of content.items)
            {
                if ('str' in item && item.str.trim() !== '') {
                    cells.push({ page, x: item.transform[4] as number, y: item.transform[5] as number, str: item.str })
                }
            }
        }

        await doc.destroy()
    } catch {
        throw new CsdReadError('We could not open that PDF. Please upload the CSD summary report as downloaded from csd.gov.za.')
    }

    const report = parseCsdReport(cells)

    if (report === null) {
        throw new CsdReadError('This does not look like a CSD Registration Summary Report. Download it from csd.gov.za under Reports.')
    }

    return report
}
