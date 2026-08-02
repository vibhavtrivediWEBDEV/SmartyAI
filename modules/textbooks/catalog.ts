import type { LessonContext } from "@/modules/teaching/lesson.schema";

export type TextbookCatalogEntry = {
  id: string;
  title: string;
  subject: string;
  classNumber: number;
  language: "English" | "Hindi";
  edition: string;
  bookCode: string;
  chapterRange: [number, number];
  officialCatalogUrl: string;
  printedPageStarts?: Record<number, number>;
};

export const NCERT_CATALOG: TextbookCatalogEntry[] = [
  { id: "ncert-11-physics-1-en", title: "Physics Part I", subject: "Physics", classNumber: 11, language: "English", edition: "2026", bookCode: "keph1", chapterRange: [1, 7], officialCatalogUrl: "https://ncert.nic.in/textbook.php?keph1=0-7", printedPageStarts: { 1: 1, 2: 13, 3: 27, 4: 49, 5: 71, 6: 92, 7: 127 } },
  { id: "ncert-11-physics-2-en", title: "Physics Part II", subject: "Physics", classNumber: 11, language: "English", edition: "current", bookCode: "keph2", chapterRange: [9, 15], officialCatalogUrl: "https://ncert.nic.in/textbook.php?keph2=0-7" },
  { id: "ncert-12-physics-1-en", title: "Physics Part I", subject: "Physics", classNumber: 12, language: "English", edition: "current", bookCode: "leph1", chapterRange: [1, 8], officialCatalogUrl: "https://ncert.nic.in/textbook.php?leph1=0-8" },
  { id: "ncert-11-mathematics-en", title: "Mathematics", subject: "Mathematics", classNumber: 11, language: "English", edition: "current", bookCode: "kemh1", chapterRange: [1, 16], officialCatalogUrl: "https://ncert.nic.in/textbook.php?kemh1=0-16" },
  { id: "ncert-12-mathematics-1-en", title: "Mathematics Part I", subject: "Mathematics", classNumber: 12, language: "English", edition: "current", bookCode: "lemh1", chapterRange: [1, 6], officialCatalogUrl: "https://ncert.nic.in/textbook.php?lemh1=0-6" },
  { id: "ncert-11-chemistry-1-en", title: "Chemistry Part I", subject: "Chemistry", classNumber: 11, language: "English", edition: "current", bookCode: "kech1", chapterRange: [1, 7], officialCatalogUrl: "https://ncert.nic.in/textbook.php?kech1=0-7" },
  { id: "ncert-11-biology-en", title: "Biology", subject: "Biology", classNumber: 11, language: "English", edition: "current", bookCode: "kebo1", chapterRange: [1, 22], officialCatalogUrl: "https://ncert.nic.in/textbook.php?kebo1=0-22" },
];

export type TextbookQuery = { chapter?: number; exercise?: string; question?: string; printedPage?: number };

export function parseTextbookQuery(input: string): TextbookQuery {
  const chapter = input.match(/(?:chapter|ch\.?)[\s:#-]*(\d+)/i)?.[1];
  const exercise = input.match(/(?:exercise|ex\.?)[\s:#-]*(\d+(?:\.\d+)?)/i)?.[1];
  const question = input.match(/(?:question|q\.?)[\s:#-]*(\d+(?:\.\d+)?)/i)?.[1];
  const page = input.match(/(?:page|pg\.?)[\s:#-]*(\d+)/i)?.[1];
  return { chapter: chapter ? Number(chapter) : undefined, exercise, question, printedPage: page ? Number(page) : undefined };
}

export function resolveCatalog(context: LessonContext, query = "") {
  const classNumber = Number(context.standard?.match(/\d+/)?.[0]);
  const requested = parseTextbookQuery(`${context.topic} ${context.chapter} ${query}`);
  let chapter = requested.chapter || Number(context.chapter) || undefined;
  const candidates = NCERT_CATALOG.filter((entry) =>
    entry.subject === context.subject && entry.classNumber === classNumber &&
    (!chapter || (chapter >= entry.chapterRange[0] && chapter <= entry.chapterRange[1])) &&
    (context.language.toLowerCase().startsWith(entry.language.toLowerCase()) || entry.language === "English"),
  );
  const entry = candidates[0] ?? null;
  if (!chapter && requested.printedPage && entry?.printedPageStarts) {
    const inferred = Object.entries(entry.printedPageStarts).reverse().find(([, start]) => requested.printedPage! >= start);
    if (inferred) chapter = Number(inferred[0]);
  }
  return { entry, query: { ...requested, chapter } };
}

export function chapterPdfUrl(entry: TextbookCatalogEntry, chapter: number): string {
  if (chapter < entry.chapterRange[0] || chapter > entry.chapterRange[1]) throw new Error("Chapter is outside this book.");
  return `https://ncert.nic.in/textbook/pdf/${entry.bookCode}${String(chapter).padStart(2, "0")}.pdf`;
}

export function mapPrintedPage(entry: TextbookCatalogEntry, chapter: number, printedPage: number): { pdfPage?: number; confidence: number } {
  const start = entry.printedPageStarts?.[chapter];
  const nextStart = entry.printedPageStarts?.[chapter + 1];
  if (!start || printedPage < start || (nextStart && printedPage >= nextStart)) return { confidence: 0.25 };
  return { pdfPage: printedPage - start + 1, confidence: 0.95 };
}