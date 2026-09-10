import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { requiredEvidenceTools } from "@/lib/career/feedbackAgent";
import { CareerFeedbackError, recordVerifiedCareerEvidence } from "@/lib/career/recordCareerFeedback";
import { observeCareerBookPage } from "@/modules/career/career-book-read.repository";
import { findTaskByIdForUser } from "@/modules/career/career.repository";
import { findTeacherBook } from "@/modules/teacher-books/teacher-book.repository";

type Context = { params: Promise<{ bookId: string }> };

export async function POST(request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { bookId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const taskId = typeof body?.taskId === "string" ? body.taskId : "";
  const missionId = typeof body?.missionId === "string" ? body.missionId : "";
  const pageIndex = Number(body?.pageIndex);
  if (!taskId || !missionId || !Number.isInteger(pageIndex) || pageIndex < 0) {
    return NextResponse.json({ error: "Invalid reading evidence." }, { status: 400 });
  }

  const [book, task] = await Promise.all([
    findTeacherBook(userId, bookId),
    findTaskByIdForUser(taskId, userId),
  ]);
  if (!book || !task || task.missionId !== missionId) {
    return NextResponse.json({ error: "Career book task not found." }, { status: 404 });
  }
  if (!requiredEvidenceTools(task).includes("ai-book")) {
    return NextResponse.json({ error: "AI Book is not required for this task." }, { status: 409 });
  }
  const expectedSessionId = `career:${missionId}:${new Date(task.scheduledDate).toISOString().slice(0, 10)}`;
  if (book.sessionId !== expectedSessionId || pageIndex >= book.pages.length) {
    return NextResponse.json({ error: "This book is not linked to the Career task." }, { status: 409 });
  }

  const reading = await observeCareerBookPage({
    userId,
    missionId,
    taskId,
    bookId,
    pageIndex,
    totalPages: book.pages.length,
  });
  try {
    const feedback = reading.progress > 0
      ? await recordVerifiedCareerEvidence({
          userId,
          missionId,
          taskId,
          tool: "ai-book",
          evidenceKey: `book-read:${bookId}`,
          progress: reading.progress,
          metadata: { bookId, verifiedPages: reading.verifiedPages, totalPages: book.pages.length },
        })
      : null;
    return NextResponse.json({ success: true, ...reading, feedback });
  } catch (error) {
    if (error instanceof CareerFeedbackError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "TASK_NOT_FOUND" ? 404 : 409 });
    }
    throw error;
  }
}