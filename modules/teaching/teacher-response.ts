import { z } from "zod";

const safeLatex = z.string().trim().min(1).max(4000).refine(
  (value) => !/(?:\\html|\\href|\\url|\\includegraphics|<\/?[a-z])/i.test(value),
  "Unsafe LaTeX command",
);

export const boardItemSchema = z.object({
  type: z.enum(["latex", "chemistry", "code", "notation"]),
  latex: safeLatex,
  explanation: z.string().trim().min(1).max(2000),
  steps: z.array(safeLatex).max(20).default([]),
});

export const documentReferenceSchema = z.object({
  bookId: z.string().trim().min(1).max(120),
  bookTitle: z.string().trim().max(200).optional(),
  chapter: z.string().trim().max(80).optional(),
  exercise: z.string().trim().max(40).optional(),
  question: z.string().trim().max(40).optional(),
  printedPage: z.number().int().positive().optional(),
  pdfPage: z.number().int().positive().optional(),
  sourceUrl: z.string().url().refine((value) => new URL(value).hostname === "ncert.nic.in"),
  confidence: z.number().min(0).max(1),
}).nullable();

export const teacherResponseSchema = z.object({
  spokenAnswer: z.string().trim().min(1).max(5000),
  bookAnswer: z.string().trim().min(1).max(20000),
  boardItems: z.array(boardItemSchema).max(20).default([]),
  documentReference: documentReferenceSchema.default(null),
});

export type BoardItem = z.infer<typeof boardItemSchema>;
export type TeacherResponse = z.infer<typeof teacherResponseSchema> & { provider: string; model: string };

export function parseTeacherResponse(content: string, provider: string, model: string): TeacherResponse {
  const unfenced = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const candidate = JSON.parse(unfenced.slice(start, end + 1)) as Record<string, unknown>;
      const boardItems = Array.isArray(candidate.boardItems) ? candidate.boardItems.flatMap((item) => {
        const parsedItem = boardItemSchema.safeParse(item);
        return parsedItem.success ? [parsedItem.data] : [];
      }) : [];
      const reference = documentReferenceSchema.safeParse(candidate.documentReference);
      const parsed = teacherResponseSchema.safeParse({
        ...candidate,
        boardItems,
        documentReference: reference.success ? reference.data : null,
      });
      if (parsed.success) return { ...parsed.data, provider, model };
    } catch { /* Preserve the model's plain-text answer below. */ }
  }
  const fallback = content.trim() || "I could not prepare an answer. Please try asking in a different way.";
  return { spokenAnswer: fallback, bookAnswer: fallback, boardItems: [], documentReference: null, provider, model };
}