import { after, NextRequest, NextResponse } from "next/server";

import { chatOpenAIFirst } from "@/lib/ai/fallback";
import { resolveEducationalImage } from "@/lib/ai/educationalImage";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { SUBSCRIPTION_PLANS } from "@/modules/subscription/plans";
import { lessonContextSchema } from "@/modules/teaching/lesson.schema";
import {
  countTeacherBooksForPeriod,
  createTeacherBook,
  findTeacherBookBySession,
  listTeacherBooks,
  failTeacherBook,
  setTeacherBookImage,
  updateTeacherBookTranscript,
  updateTeacherBookContent,
  type TeacherBookMessage,
  type TeacherBookPage,
} from "@/modules/teacher-books/teacher-book.repository";

const monthStart = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const serializeBook = (book: Awaited<ReturnType<typeof listTeacherBooks>>[number]) => ({
  id: book._id.toHexString(), sessionId: book.sessionId, subject: book.subject, title: book.title, provider: book.provider || "unknown", model: book.model,
  messages: book.messages, pages: book.pages, status: book.status,
  isPublic: book.isPublic === true,
  publicMetadata: book.publicMetadata,
  context: book.context,
  lastError: book.lastError,
  createdAt: book.createdAt.toISOString(), updatedAt: book.updatedAt.toISOString(),
});

function parseBookPages(content: string): TeacherBookPage[] {
  const unfenced = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = unfenced.indexOf("[");
  const end = unfenced.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("The book agent did not return a JSON page array.");
  const parsed: unknown = JSON.parse(unfenced.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("The book agent returned invalid pages.");
  const pages = parsed.filter((page): page is TeacherBookPage => {
    if (!page || typeof page !== "object") return false;
    const candidate = page as Partial<TeacherBookPage>;
    return Boolean(candidate.content && ["cover", "text", "image", "end"].includes(candidate.type || ""));
  });
  if (pages.length < 10) throw new Error("The book agent returned fewer than 10 valid pages.");
  return pages.slice(0, 25);
}

async function enrichBook(input: {
  userId: string; bookId: string; subject: string; studentName: string;
  messages: TeacherBookMessage[];
}) {
  const systemPrompt = `Turn the completed lesson and source notes about "${input.subject}" into an exceptionally polished, accurate private study book for ${input.studentName}.
Return ONLY a valid JSON array with 10-25 substantial pages. Preserve every meaningful source-note fact, student question, and teacher answer. Improve clarity without inventing facts.
Allowed shapes:
{"type":"cover","content":{"title":"...","subtitle":"...","author":"..."}}
{"type":"text","content":{"title":"...","body":"..."}}
{"type":"text","content":{"question":"...","answer":"..."}}
{"type":"text","content":{"kind":"coding","language":"javascript|typescript|python|java|sql|mongodb|html","title":"Coding exercise","question":"A complete standalone coding problem for the student to solve"}}
{"type":"image","content":{"src":"specific educational image search phrase","alt":"...","caption":"..."}}
{"type":"end","content":{"message":"..."}}
Build a coherent progression: editorial introduction, foundations, key terms, deep explanations, worked examples, practical applications, common misconceptions, recall questions with answers, applied exercises, a one-page revision map, and a final mastery checklist. When the subject includes programming, include standalone coding exercises using kind "coding" and omit their solutions so the student can solve them in VS Code. Include a cover and end page, every useful Q&A, and 2-4 purposeful image pages. Keep each page focused and information-rich. Image src is a search description, never a URL. Output JSON only.`;
  try {
    const response = await chatOpenAIFirst(
      [{ role: "system", content: systemPrompt }, ...input.messages],
      { temperature: 0.45, maxTokens: 7000, openAIModel: "gpt-5.6-sol" },
    );
    const pages = parseBookPages(response.content);
    const title = pages.find((page) => page.type === "cover")?.content.title || `${input.subject} Learning Book`;
    const hasImages = pages.some((page) => page.type === "image");
    const status = hasImages ? "enriching" as const : "complete" as const;
    await updateTeacherBookContent(input.userId, input.bookId, {
      title, provider: response.provider, model: response.model, pages, status,
    });
    if (hasImages) {
      const illustratedPages = await Promise.all(pages.map(async (page) => {
        if (page.type !== "image") return page;
        try {
          const image = await resolveEducationalImage(page.content.src || `${input.subject} educational diagram`);
          return { ...page, content: { ...page.content, imageUrl: image.url } };
        } catch {
          return page;
        }
      }));
      const allImagesFinished = illustratedPages.filter((page) => page.type === "image").every((page) => Boolean(page.content.imageUrl));
      await updateTeacherBookContent(input.userId, input.bookId, {
        title, provider: response.provider, model: response.model, pages: illustratedPages,
        status: allImagesFinished ? "complete" : "failed",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Book enrichment failed.";
    await failTeacherBook(input.userId, input.bookId, message);
    console.error("Teacher book enrichment failed:", error instanceof Error ? error.name : "unknown error");
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [books, used] = await Promise.all([listTeacherBooks(user.id), countTeacherBooksForPeriod(user.id, monthStart())]);
    const limit = SUBSCRIPTION_PLANS[user.plan].teacherBooksPerMonth;
    return NextResponse.json({ books: books.map(serializeBook), usage: { used, limit, remaining: Math.max(0, limit - used) } });
  } catch (error) {
    console.error("Teacher book history failed:", error);
    return NextResponse.json({ error: "Book history is temporarily unavailable.", books: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body: unknown = await request.json();
    const { prompt, messages, name, sessionId, context } = (body && typeof body === "object" ? body : {}) as { prompt?: string; messages?: TeacherBookMessage[]; name?: string; sessionId?: string; context?: unknown };
    if (!prompt?.trim() || prompt.length > 300 || !Array.isArray(messages) || messages.length > 200) {
      return NextResponse.json({ error: "A subject and lesson messages are required." }, { status: 400 });
    }
    const cleanMessages = messages
      .filter((message) => ["user", "assistant", "system"].includes(message.role) && typeof message.content === "string")
      .slice(-80);
    const parsedContext = context ? lessonContextSchema.safeParse(context) : null;
    if (parsedContext && !parsedContext.success) return NextResponse.json({ error: "Invalid lesson context." }, { status: 400 });
    const stableSessionId = sessionId?.trim() || `${user.id}:${prompt}:${messages[0]?.content || "lesson"}`;
    const existing = await findTeacherBookBySession(user.id, stableSessionId);
    if (existing) {
      const updated = await updateTeacherBookTranscript(user.id, stableSessionId, cleanMessages, parsedContext?.success ? parsedContext.data : undefined);
      return NextResponse.json(serializeBook(updated || existing));
    }

    const limit = SUBSCRIPTION_PLANS[user.plan].teacherBooksPerMonth;
    const used = await countTeacherBooksForPeriod(user.id, monthStart());
    if (used >= limit) {
      return NextResponse.json({ error: `Your ${user.plan} plan includes ${limit} teacher books per month.`, code: "BOOK_LIMIT_REACHED", usage: { used, limit, remaining: 0 } }, { status: 429 });
    }

    const livePages: TeacherBookPage[] = [
      { type: "cover", content: { title: `${prompt} Learning Book`, subtitle: "Complete live lesson transcript", author: name || user.name } },
      ...cleanMessages.filter((message) => message.role !== "system").map((message) => ({
        type: "text" as const,
        content: message.role === "user" ? { title: "Student question", body: message.content } : { title: "Teacher explanation", body: message.content },
      })),
      { type: "end", content: { message: "This lesson has been saved. AI enrichment is continuing." } },
    ];
    const pendingId = await createTeacherBook({
      userId: user.id,
      sessionId: stableSessionId,
      subject: prompt.trim(),
      context: parsedContext?.success ? parsedContext.data : undefined,
      title: `${prompt} Learning Book`,
      provider: "pending",
      model: "pending",
      messages: cleanMessages,
      pages: livePages,
      status: "generating",
    });
    after(() => enrichBook({ userId: user.id, bookId: pendingId, subject: prompt.trim(), studentName: name?.trim().slice(0, 100) || user.name, messages: cleanMessages }));
    return NextResponse.json({ id: pendingId, subject: prompt.trim(), title: `${prompt.trim()} Learning Book`, provider: "pending", model: "pending", messages: cleanMessages, pages: livePages, status: "generating", usage: { used: used + 1, limit, remaining: Math.max(0, limit - used - 1) } }, { status: 201 });
  } catch (error) {
    console.error("Teacher book generation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Book generation failed." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { bookId, pageIndex, imageUrl } = await request.json() as { bookId?: string; pageIndex?: number; imageUrl?: string };
  if (!bookId || !Number.isInteger(pageIndex) || typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) {
    return NextResponse.json({ error: "Invalid image update." }, { status: 400 });
  }
  const updated = await setTeacherBookImage(user.id, bookId, pageIndex!, imageUrl);
  return updated ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Book page not found." }, { status: 404 });
}
