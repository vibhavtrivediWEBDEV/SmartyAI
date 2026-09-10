import { NextResponse } from "next/server";

import { findLatestPublicTeacherBook } from "@/modules/teacher-books/teacher-book.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const book = await findLatestPublicTeacherBook();
    if (!book) {
      return NextResponse.json({ error: "No published book is available." }, { status: 404 });
    }

    return NextResponse.json(
      {
        book: {
          id: book.id,
          subject: book.subject,
          title: book.title,
          pages: book.pages,
          pageCount: book.pageCount,
          publishedAt: book.publishedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Latest public library book failed:", error);
    return NextResponse.json({ error: "The published book is temporarily unavailable." }, { status: 500 });
  }
}