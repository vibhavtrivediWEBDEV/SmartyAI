import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import type { ChatMessage } from "@/lib/ai";
import { chatOpenAIFirst } from "@/lib/ai/fallback";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { lessonContextSchema } from "@/modules/teaching/lesson.schema";
import { parseTeacherResponse } from "@/modules/teaching/teacher-response";
import { chapterPdfUrl, mapPrintedPage, resolveCatalog } from "@/modules/textbooks/catalog";
import { extractOfficialPage, findOfficialQuestionPage } from "@/modules/textbooks/retrieval";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!consumeRateLimit(`teacher:${user.id}`, 30, 60_000).allowed) return NextResponse.json({ error: "Too many teacher requests. Please retry shortly." }, { status: 429 });
    const body = await request.json().catch(() => null);
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
    const contextResult = lessonContextSchema.safeParse(body?.context ?? { subject: body?.subject });
    const messages = body?.messages as ChatMessage[] | undefined;
    if (!contextResult.success || !Array.isArray(messages) || !messages.length || messages.length > 100) {
      return NextResponse.json({ error: "A valid question is required." }, { status: 400 });
    }
    const context = contextResult.data;
    const cleanMessages = messages.filter((message) =>
      message && ["system", "user", "assistant"].includes(message.role) && typeof message.content === "string" && message.content.length <= 10000
    ).slice(-30);
    if (!cleanMessages.some((message) => message.role === "user")) return NextResponse.json({ error: "A valid question is required." }, { status: 400 });

    const sessionRef = sessionId ? db.collection("teachingSessions").doc(sessionId) : null;
    if (sessionRef) {
      const session = await sessionRef.get();
      if (!session.exists || session.data()?.userId !== user.id) {
        return NextResponse.json({ error: "Teaching session not found." }, { status: 404 });
      }
    }

    const latestContent = [...cleanMessages].reverse().find((message) => message.role === "user")?.content;
    const latestQuestion = typeof latestContent === "string" ? latestContent : "";
    const resolved = context.board === "NCERT/CBSE" ? resolveCatalog(context, latestQuestion) : { entry: null, query: {} };
    let textbookContext = "";
    let serverReference: Record<string, unknown> | null = null;
    if (resolved.entry && resolved.query.chapter) {
      const sourceUrl = chapterPdfUrl(resolved.entry, resolved.query.chapter);
      const mapping: { pdfPage?: number; confidence: number } = resolved.query.printedPage ? mapPrintedPage(resolved.entry, resolved.query.chapter, resolved.query.printedPage) : { confidence: 0.72 };
      if (!mapping.pdfPage && (resolved.query.exercise || resolved.query.question)) {
        try {
          const matched = await findOfficialQuestionPage(`${resolved.entry.id}:chapter-${resolved.query.chapter}`, sourceUrl, resolved.query.exercise, resolved.query.question);
          if (matched) { mapping.pdfPage = matched.pdfPage; mapping.confidence = 0.8; }
        } catch { /* Continue without textbook grounding. */ }
      }
      if (mapping.pdfPage) {
        try {
          const page = await extractOfficialPage(`${resolved.entry.id}:chapter-${resolved.query.chapter}`, sourceUrl, mapping.pdfPage);
          textbookContext = `Verified official NCERT page text (PDF page ${page.pdfPage}):\n${page.text.slice(0, 10000)}`;
        } catch { textbookContext = "The official NCERT source was resolved, but its page text is temporarily unavailable. Do not quote or invent its contents."; }
      }
      serverReference = { bookId: resolved.entry.id, bookTitle: resolved.entry.title, chapter: String(resolved.query.chapter), exercise: resolved.query.exercise, question: resolved.query.question, printedPage: resolved.query.printedPage, pdfPage: mapping.pdfPage, sourceUrl, confidence: mapping.confidence };
    }

    const response = await chatOpenAIFirst([
      {
        role: "system",
        content: `You are Smarty Teacher, a warm expert private tutor. Lesson context: ${JSON.stringify(context)}.
Return ONLY JSON matching: {"spokenAnswer":"short natural speech","bookAnswer":"complete explanation","boardItems":[{"type":"latex|chemistry|code|notation","latex":"...","explanation":"...","steps":["..."]}],"documentReference":null}.
Always create at least one concise board item as excellent student notes: a clear definition or key idea, its meaning, and short numbered working/key points. Use type "notation" with plain text in latex for definitions, and use type "latex" or "chemistry" for actual symbolic expressions. Put every equation, derivation, reaction, code fragment, or symbolic notation in boardItems. SpokenAnswer must never read long symbols aloud; say naturally that you wrote it on the board. Use safe KaTeX only for symbolic items, without HTML, URLs, or executable commands. Keep board notes scannable rather than copying the full book answer. Use a concrete example and check-for-understanding when useful. Never invent textbook pages, quotations, questions, or citations. If source confidence is low, explicitly ask the student to confirm their edition/page.
      The sourceMaterial in lesson context contains the student's notes and is your primary grounding. Answer the student's interruption first, completely and directly, then state the exact idea you will continue from. Do not restart or jump ahead.
${textbookContext}`,
      },
      ...cleanMessages,
    ], { temperature: 0.5, maxTokens: 1800, openAIModel: process.env.TEACHER_MODEL?.trim() || "gpt-5.6-sol", responseFormat: { type: "json_object" }, metering: { userId: user.id, source: "teacher", feature: "lesson-response" } });

    const structured = parseTeacherResponse(response.content, response.provider, response.model);
    if (serverReference) structured.documentReference = serverReference as NonNullable<typeof structured.documentReference>;
    if (sessionRef) {
      const exchangeKey = createHash("sha256").update(`${sessionId}:${latestQuestion.trim()}`).digest("hex");
      await sessionRef.update({
        verifiedExchangeKeys: FieldValue.arrayUnion(exchangeKey),
        lastVerifiedExchangeAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ...structured, answer: structured.bookAnswer });
  } catch (error) {
    console.error("Teacher response failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Teacher response failed. Please retry; your transcript is preserved." }, { status: 500 });
  }
}
