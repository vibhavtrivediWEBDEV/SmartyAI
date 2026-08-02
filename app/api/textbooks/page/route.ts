import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { NCERT_CATALOG, chapterPdfUrl } from "@/modules/textbooks/catalog";
import { extractOfficialPage } from "@/modules/textbooks/retrieval";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!consumeRateLimit(`textbook-page:${user.id}`, 30, 60_000).allowed) return NextResponse.json({ error: "Too many page requests." }, { status: 429 });
  const book = NCERT_CATALOG.find((entry) => entry.id === request.nextUrl.searchParams.get("bookId"));
  const chapter = Number(request.nextUrl.searchParams.get("chapter"));
  const pdfPage = Number(request.nextUrl.searchParams.get("pdfPage"));
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(pdfPage) || pdfPage < 1) return NextResponse.json({ error: "Invalid page request." }, { status: 400 });
  try {
    const sourceUrl = chapterPdfUrl(book, chapter);
    const page = await extractOfficialPage(`${book.id}:chapter-${chapter}`, sourceUrl, pdfPage);
    return NextResponse.json({ ...page, officialCatalogUrl: book.officialCatalogUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Page extraction unavailable.", recoverable: true }, { status: 502 });
  }
}