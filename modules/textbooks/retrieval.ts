import { createHash } from "node:crypto";
import { PdfReader } from "pdfreader";

import { assertApprovedTextbookUrl } from "./security";
import { cacheTextbookPages, findCachedPage, findRelevantCachedPage, type TextbookPageDocument } from "./textbook.repository";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 12_000;

export async function downloadOfficialPdf(sourceUrl: string): Promise<Buffer> {
  const url = assertApprovedTextbookUrl(sourceUrl);
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS), headers: { Accept: "application/pdf" } });
  if (!response.ok) throw new Error(`Official textbook returned HTTP ${response.status}.`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_PDF_BYTES) throw new Error("Official textbook PDF is too large.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_PDF_BYTES || bytes.subarray(0, 4).toString() !== "%PDF") throw new Error("Official source did not return an allowed PDF.");
  return bytes;
}

async function parsePdfPages(bytes: Buffer) {
  return new Promise<Map<number, string[]>>((resolve, reject) => {
    const result = new Map<number, string[]>();
    let currentPage = 0;
    new PdfReader().parseBuffer(bytes, (error, item) => {
      if (error) return reject(new Error("The official PDF could not be parsed."));
      if (!item) return resolve(result);
      if (item.page) { currentPage = item.page; result.set(currentPage, []); }
      if (item.text && currentPage) result.get(currentPage)?.push(item.text);
    });
  });
}

function pageDocuments(editionId: string, sourceUrl: string, bytes: Buffer, pageTexts: Map<number, string[]>): TextbookPageDocument[] {
  const pageCount = Math.max(...pageTexts.keys());
  const hash = createHash("sha256").update(bytes).digest("hex");
  return [...pageTexts].map(([pdfPage, items]) => ({ editionId, pdfHash: hash, pdfPage, text: items.join(" ").replace(/\s+/g, " ").trim(), sourceUrl, pageCount, createdAt: new Date(), updatedAt: new Date() }));
}

export async function extractOfficialPage(editionId: string, sourceUrl: string, pdfPage: number) {
  const cached = await findCachedPage(editionId, pdfPage);
  if (cached) return cached;
  const bytes = await downloadOfficialPdf(sourceUrl);
  const pageTexts = await parsePdfPages(bytes);
  const pageCount = Math.max(...pageTexts.keys());
  if (pdfPage > pageCount) throw new Error(`This PDF has only ${pageCount} pages.`);
  const documents = pageDocuments(editionId, sourceUrl, bytes, pageTexts);
  const extracted = documents.filter((page) => Math.abs(page.pdfPage - pdfPage) <= 1);
  await cacheTextbookPages(extracted);
  return extracted.find((page) => page.pdfPage === pdfPage)!;
}

export async function findOfficialQuestionPage(editionId: string, sourceUrl: string, exercise?: string, question?: string) {
  const terms = [exercise ? `EXERCISE ${exercise}` : "", question ? `${question}.` : ""].filter(Boolean);
  const cached = await findRelevantCachedPage(editionId, terms);
  if (cached) return cached;
  const bytes = await downloadOfficialPdf(sourceUrl);
  const documents = pageDocuments(editionId, sourceUrl, bytes, await parsePdfPages(bytes));
  await cacheTextbookPages(documents);
  const normalizedTerms = terms.map((term) => term.toLowerCase());
  return documents.find((page) => normalizedTerms.every((term) => page.text.toLowerCase().includes(term))) ?? null;
}