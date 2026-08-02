import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { NCERT_CATALOG, chapterPdfUrl } from "@/modules/textbooks/catalog";
import { downloadOfficialPdf } from "@/modules/textbooks/retrieval";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!consumeRateLimit(`textbook:${user.id}`, 20, 60_000).allowed) return NextResponse.json({ error: "Too many textbook downloads. Please retry shortly." }, { status: 429 });
  const book = NCERT_CATALOG.find((entry) => entry.id === request.nextUrl.searchParams.get("bookId"));
  const chapter = Number(request.nextUrl.searchParams.get("chapter"));
  if (!book || !Number.isInteger(chapter)) return NextResponse.json({ error: "Invalid textbook request." }, { status: 400 });
  try {
    const pdf = await downloadOfficialPdf(chapterPdfUrl(book, chapter));
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${book.bookCode}-${chapter}.pdf"`, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Textbook unavailable.", recoverable: true }, { status: 502 });
  }
}