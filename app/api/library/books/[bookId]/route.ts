import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  findPublicTeacherBook,
  publishTeacherBook,
  unpublishTeacherBook,
} from "@/modules/teacher-books/teacher-book.repository";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ bookId: string }> };

const visibilitySchema = z.discriminatedUnion("isPublic", [
  z.object({
    isPublic: z.literal(true),
    summary: z.string().trim().min(20).max(360),
    coverImageUrl: z.string().url().max(2000).optional(),
    interview: z.object({
      label: z.string().trim().min(2).max(140),
      company: z.string().trim().max(100).optional(),
      role: z.string().trim().max(100).optional(),
    }).optional(),
  }),
  z.object({ isPublic: z.literal(false) }),
]);

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { bookId } = await params;
    const book = await findPublicTeacherBook(bookId);
    if (!book) return NextResponse.json({ error: "Public book not found." }, { status: 404 });
    return NextResponse.json(
      { book },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("Public library book failed:", error);
    return NextResponse.json({ error: "This book is temporarily unavailable." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = visibilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid publication details." }, { status: 400 });
  }

  const { bookId } = await params;
  const updated = parsed.data.isPublic
    ? await publishTeacherBook(user.id, bookId, {
        creatorName: user.name.trim().slice(0, 80),
        summary: parsed.data.summary,
        coverImageUrl: parsed.data.coverImageUrl,
        interview: parsed.data.interview,
      })
    : await unpublishTeacherBook(user.id, bookId);

  if (!updated) {
    return NextResponse.json(
      { error: parsed.data.isPublic ? "Only a completed book can be published by its owner." : "Book not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, isPublic: parsed.data.isPublic });
}
