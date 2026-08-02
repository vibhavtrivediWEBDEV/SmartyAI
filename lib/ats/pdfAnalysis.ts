import "server-only"

import { join, sep } from "node:path"
import type { PDFDiagnostic } from "./types"

type TextItem = { str?: string; width?: number; height?: number; transform?: number[]; fontName?: string }
const STANDARD_FONT_DATA_URL = `${join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts")}${sep}`

export async function analyzePDF(buffer: Buffer): Promise<PDFDiagnostic> {
  const [pdfjs, workerImport] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.js"),
    import("pdfjs-dist/legacy/build/pdf.worker.js"),
  ])
  ;(globalThis as typeof globalThis & { pdfjsWorker: typeof workerImport }).pdfjsWorker = workerImport
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise
  const pages = document.numPages
  let textCharacters = 0
  let imageHeavyPages = 0
  let imageOnlyPages = 0
  let columnVotes = 0
  let tableVotes = 0
  let brokenVotes = 0
  const fontSizes: number[] = []
  const details: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const [content, operators] = await Promise.all([page.getTextContent(), page.getOperatorList()])
    const items = (content.items as TextItem[]).filter((item) => item.str?.trim() && item.transform)
    const pageCharacters = items.reduce((sum, item) => sum + (item.str?.length ?? 0), 0)
    textCharacters += pageCharacters
    const imageOperators = operators.fnArray.filter((operator: number) => operator === pdfjs.OPS.paintImageXObject || operator === pdfjs.OPS.paintInlineImageXObject).length
    if (imageOperators >= 3 || (imageOperators > 0 && pageCharacters < 250)) imageHeavyPages += 1
    if (imageOperators > 0 && pageCharacters < 30) imageOnlyPages += 1

    const viewport = page.getViewport({ scale: 1 })
    const left = items.filter((item) => (item.transform?.[4] ?? 0) < viewport.width * 0.45).length
    const right = items.filter((item) => (item.transform?.[4] ?? 0) > viewport.width * 0.55).length
    const centerGap = items.filter((item) => { const x = item.transform?.[4] ?? 0; return x >= viewport.width * 0.45 && x <= viewport.width * 0.55 }).length
    if (left > 8 && right > 8 && centerGap < Math.min(left, right) * 0.25) columnVotes += 1

    const rows = new Map<number, number>()
    let previousY = Number.POSITIVE_INFINITY
    let upwardJumps = 0
    for (const item of items) {
      const transform = item.transform!
      const size = Math.max(Math.abs(transform[0]), Math.abs(transform[3]), item.height ?? 0)
      fontSizes.push(size)
      const y = Math.round(transform[5] / 3) * 3
      rows.set(y, (rows.get(y) ?? 0) + 1)
      if (transform[5] > previousY + 15) upwardJumps += 1
      previousY = transform[5]
    }
    if ([...rows.values()].filter((count) => count >= 4).length >= 4) tableVotes += 1
    if (upwardJumps > Math.max(4, items.length * 0.08)) brokenVotes += 1
  }
  await document.destroy()

  const distinctSizes = new Set(fontSizes.map((size) => Math.round(size))).size
  const tinyText = fontSizes.some((size) => size > 0 && size < 7)
  const probableMultiColumn = columnVotes > 0
  const tableLikePositioning = tableVotes > Math.max(0, pages / 3)
  const probableBrokenReadingOrder = brokenVotes > Math.max(0, pages / 3)
  if (probableMultiColumn) details.push("Separated left/right text clusters suggest multiple columns.")
  if (tableLikePositioning) details.push("Repeated aligned text fragments suggest table-like positioning.")
  if (tinyText) details.push("At least one text run appears smaller than 7 PDF points.")
  if (imageOnlyPages) details.push(`${imageOnlyPages} page(s) contain images with almost no extractable text.`)
  if (!details.length) details.push("No major coordinate-based layout risks were detected.")

  return {
    pages,
    textCharacters,
    extractionSucceeded: textCharacters >= 40,
    probableMultiColumn,
    tableLikePositioning,
    tinyText,
    excessiveFontVariation: distinctSizes > 8,
    imageHeavyPages,
    imageOnlyPages,
    probableBrokenReadingOrder,
    confidence: textCharacters > 800 ? "medium" : "low",
    limitations: "PDF coordinate analysis is heuristic. Decorative elements, unusual encodings, and scanned text can cause false positives or missed issues; visual layout and actual vendor parsing may differ.",
    details,
  }
}
