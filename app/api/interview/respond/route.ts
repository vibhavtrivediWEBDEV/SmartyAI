import { createMeteredAIService, CreditLimitError } from "@/lib/ai/metered";
import { getSessionUserId } from "@/lib/auth/session";

interface InterviewResponseRequest {
  answer?: unknown;
  currentQuestion?: unknown;
  nextQuestion?: unknown;
  history?: unknown;
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ success: false, error: "You must be signed in." }, { status: 401 });
  }

  try {
    const body = await request.json() as InterviewResponseRequest;
    const answer = String(body.answer ?? "").trim().slice(0, 5000);
    const currentQuestion = String(body.currentQuestion ?? "").trim().slice(0, 2000);
    const nextQuestion = String(body.nextQuestion ?? "").trim().slice(0, 2000);
    const history = Array.isArray(body.history)
      ? body.history.slice(-6).map((message) => {
          const value = message as Record<string, unknown>;
          return {
            role: value.role === "assistant" ? "assistant" as const : "user" as const,
            content: String(value.content ?? "").slice(0, 3000),
          };
        })
      : [];

    if (!answer || !currentQuestion) {
      return Response.json({ success: false, error: "Answer and question are required." }, { status: 400 });
    }

    const instruction = nextQuestion
      ? `Briefly acknowledge the answer, give no score, then naturally ask this exact next interview question: ${nextQuestion}`
      : "Briefly acknowledge the answer, then politely explain that all interview questions are complete.";

    const response = await createMeteredAIService(userId, { source: "interview", feature: "response" }).chat([
      {
        role: "system",
        content: `You are a warm, concise professional interviewer. The candidate just answered: ${currentQuestion}\n${instruction} Do not answer the interview question for the candidate. Keep the response suitable for text-to-speech and under 90 words.`,
      },
      ...history,
      { role: "user", content: answer },
    ], { temperature: 0.5, maxTokens: 300 });

    return Response.json({ success: true, response: response.content.trim() });
  } catch (error) {
    if (error instanceof CreditLimitError) {
      return Response.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("Interview response generation failed:", error);
    return Response.json({ success: false, error: "The interviewer could not respond." }, { status: 500 });
  }
}