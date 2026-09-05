import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { createCareerCodingWorkspaceSpec } from "@/lib/career/executor";
import { codingExercisePrompt, isCodingBookPage } from "@/lib/teacher-books/codingExercise";
import { findPublicTeacherBook, findTeacherBook } from "@/modules/teacher-books/teacher-book.repository";
import { createWorkspace, listWorkspaces } from "@/modules/workspace/workspace.repository";

type Context = { params: Promise<{ bookId: string }> };

export async function POST(request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const { pageIndex } = await request.json() as { pageIndex?: number };
  if (!Number.isInteger(pageIndex) || pageIndex! < 0) {
    return NextResponse.json({ error: "A valid coding page is required." }, { status: 400 });
  }

  const book = await findTeacherBook(userId, bookId) || await findPublicTeacherBook(bookId);
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const page = book.pages[pageIndex!];
  if (!page || page.type !== "text" || !isCodingBookPage(page.content)) {
    return NextResponse.json({ error: "This page is not a coding exercise." }, { status: 400 });
  }

  const workspaceTag = `ai-book:${bookId}:page:${pageIndex}`;
  const existing = (await listWorkspaces(userId, { includePublic: false, includeTemplates: false }))
    .find((workspace) => workspace.tags?.includes(workspaceTag));
  if (existing) {
    return NextResponse.json({ data: existing, filePath: existing.settings.entryPoint, created: false });
  }

  const prompt = codingExercisePrompt(page.content);
  const title = page.content.title || `${book.subject} Coding Exercise`;
  const spec = createCareerCodingWorkspaceSpec({
    title,
    description: prompt,
    topic: page.content.language || book.subject,
    type: "coding",
  });
  const workspace = await createWorkspace(userId, {
    name: `AI Book - ${title}`,
    description: prompt,
    files: spec.files,
    settings: { runtime: spec.runtime, entryPoint: spec.entryPoint },
    tags: ["ai-book", "coding-practice", bookId, workspaceTag],
  });

  return NextResponse.json({ data: workspace, filePath: spec.entryPoint, created: true }, { status: 201 });
}