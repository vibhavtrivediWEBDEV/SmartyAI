import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import {
  listPublicTeacherBooks,
  type PublicTeacherBookCursor,
} from "@/modules/teacher-books/teacher-book.repository";

export const dynamic = "force-dynamic";

function decodeCursor(value: string | null): PublicTeacherBookCursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { publishedAt?: string; id?: string };
    const publishedAt = new Date(parsed.publishedAt || "");
    if (Number.isNaN(publishedAt.getTime()) || !parsed.id || !ObjectId.isValid(parsed.id)) return undefined;
    return { publishedAt, id: new ObjectId(parsed.id) };
  } catch {
    return undefined;
  }
}

function encodeCursor(cursor: PublicTeacherBookCursor | null): string | null {
  if (!cursor) return null;
  return Buffer.from(JSON.stringify({
    publishedAt: cursor.publishedAt.toISOString(),
    id: cursor.id.toHexString(),
  })).toString("base64url");
}

export async function GET(request: NextRequest) {
  try {
    const cursorValue = request.nextUrl.searchParams.get("cursor");
    const cursor = decodeCursor(cursorValue);
    if (cursorValue && !cursor) {
      return NextResponse.json({ error: "Invalid library cursor." }, { status: 400 });
    }
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || 24);
    const limit = Number.isInteger(requestedLimit) ? requestedLimit : 24;
    const result = await listPublicTeacherBooks(limit, cursor);
    return NextResponse.json(
      { books: result.books, nextCursor: encodeCursor(result.nextCursor) },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Public library catalog failed:", error);
    return NextResponse.json({ error: "The library is temporarily unavailable.", books: [] }, { status: 500 });
  }
}
