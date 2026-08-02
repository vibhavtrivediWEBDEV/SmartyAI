import { NextResponse } from "next/server"
import { z } from "zod"
import { createAIService } from "@/lib/ai"

const requestSchema = z.object({
  subject: z.string().trim().min(2).max(200),
  recipient: z.string().trim().max(320).optional().default(""),
  senderName: z.string().trim().max(100).optional().default(""),
  tone: z.enum(["professional", "friendly", "concise", "persuasive", "warm"]).default("professional"),
  template: z.enum(["smart", "introduction", "follow-up", "meeting", "thank-you", "proposal"]).default("smart"),
  currentBody: z.string().max(50_000).optional().default(""),
  action: z.enum(["write", "improve", "shorten", "expand"]).default("write"),
})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "A valid subject is required." }, { status: 400 })
  }

  const { subject, recipient, senderName, tone, template, currentBody, action } = parsed.data
  const prompt = `
Write only the body of an email. Do not include a subject line, markdown, commentary, or placeholders.
Subject: ${subject}
Recipient context: ${recipient || "Unknown recipient"}
Sender name: ${senderName || "The sender"}
Tone: ${tone}
Template style: ${template}
Task: ${action}
${currentBody ? `Current editable draft:\n${currentBody}` : "Create a complete draft from the subject."}

Requirements:
- Sound natural and specific, not robotic.
- Include an appropriate greeting and closing signed with the sender name when provided.
- Keep it clear and ready to send.
- Never invent private facts, dates, prices, or commitments.
  `.trim()

  try {
    const ai = createAIService()
    const response = await ai.complete(prompt, { temperature: 0.65, maxTokens: 900 })
    const content = response.content.trim().replace(/^```(?:text)?\s*/i, "").replace(/```$/, "").trim()
    return NextResponse.json({ success: true, content })
  } catch (error) {
    console.error("Mail AI generation error:", error)
    return NextResponse.json(
      { success: false, error: "AI could not prepare the email. Please try again." },
      { status: 500 },
    )
  }
}
