import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { lessonContextSchema } from "@/modules/teaching/lesson.schema";
import { chapterPdfUrl, mapPrintedPage, resolveCatalog } from "@/modules/textbooks/catalog";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = lessonContextSchema.safeParse(body?.context);
  if (!parsed.success || (body?.query != null && typeof body.query !== "string")) return NextResponse.json({ error: "Invalid textbook lookup." }, { status: 400 });
  const resolved = resolveCatalog(parsed.data, body?.query?.slice(0, 500) || "");
  if (!resolved.entry || !resolved.query.chapter) return NextResponse.json({ error: "No verified official NCERT chapter matched this lesson.", recoverable: true }, { status: 404 });
  const sourceUrl = chapterPdfUrl(resolved.entry, resolved.query.chapter);
  const mapping = resolved.query.printedPage ? mapPrintedPage(resolved.entry, resolved.query.chapter, resolved.query.printedPage) : { confidence: 0.72 };
  return NextResponse.json({
    book: { id: resolved.entry.id, title: resolved.entry.title, subject: resolved.entry.subject, classNumber: resolved.entry.classNumber, edition: resolved.entry.edition },
    chapter: resolved.query.chapter, exercise: resolved.query.exercise, question: resolved.query.question, printedPage: resolved.query.printedPage,
    pdfPage: mapping.pdfPage, confidence: mapping.confidence, sourceUrl, officialCatalogUrl: resolved.entry.officialCatalogUrl,
  });
}