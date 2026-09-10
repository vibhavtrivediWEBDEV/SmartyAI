import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { deterministicRewriteFallback } from "@/lib/ats/rewrite"
import { consumeAtsCvUpdate, refundAtsCvUpdate } from "@/modules/users/user.repository"

const requestSchema = z.object({ selectedText: z.string().min(1).max(8_000), jobDescription: z.string().max(30_000).optional() })
const suggestionSchema = z.object({ suggestedRewrite: z.string(), reason: z.string(), keywordsAddressed: z.array(z.string()), factsRequiringInput: z.array(z.string()) })
const responseJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    suggestedRewrite: { type: "string" }, reason: { type: "string" },
    keywordsAddressed: { type: "array", items: { type: "string" } }, factsRequiringInput: { type: "array", items: { type: "string" } },
  },
  required: ["suggestedRewrite", "reason", "keywordsAddressed", "factsRequiringInput"],
} as const

function outputText(response: unknown) {
  const body = response as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> }
  if (typeof body?.output_text === "string") return body.output_text
  for (const output of body?.output ?? []) for (const content of output.content ?? []) if (typeof content.text === "string") return content.text
  throw new Error("Azure response did not contain output text")
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Select a valid resume bullet or section" }, { status: 400 })
  const apiKey = process.env.AWS_SERVER_API_KEY
  if (!apiKey) return NextResponse.json({ error: "Resume suggestion service is not configured" }, { status: 503 })
  const endpoint = process.env.AZURE_OPENAI_RESUME_ENDPOINT?.trim()
  const deployment = process.env.AZURE_OPENAI_RESUME_DEPLOYMENT?.trim() || "gpt-5.6-sol"
  if (!endpoint) return NextResponse.json({ error: "Resume suggestion service is not configured" }, { status: 503 })
  const usage = await consumeAtsCvUpdate(user.id)
  if (!usage.allowed) {
    return NextResponse.json({ error: "ATS CV update limit reached", usage }, { status: 402 })
  }
  try {
    const azure = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        model: deployment,
        input: [
          { role: "system", content: [{ type: "input_text", text: "Improve only the selected resume text. Preserve all facts. Never invent or infer metrics, dates, employers, titles, skills, tools, responsibilities, or outcomes. If a stronger rewrite requires a missing fact, list it in factsRequiringInput instead of inserting it. Job-description keywords may be used only when already supported by the selected text. Return strict JSON." }] },
          { role: "user", content: [{ type: "input_text", text: `SELECTED TEXT:\n${parsed.data.selectedText}\n\nOPTIONAL JOB DESCRIPTION CONTEXT:\n${parsed.data.jobDescription ?? ""}` }] },
        ],
        text: { format: { type: "json_schema", name: "ats_rewrite", strict: true, schema: responseJsonSchema } },
        max_output_tokens: 1_500,
      }),
    })
    if (!azure.ok) {
      console.warn(`ATS suggestion service failed (${azure.status}); using deterministic fallback`)
      await refundAtsCvUpdate(user.id)
      return NextResponse.json({ suggestion: deterministicRewriteFallback(parsed.data.selectedText), fallback: true })
    }
    const suggestion = suggestionSchema.parse(JSON.parse(outputText(await azure.json())))
    const sourceNumbers = new Set(parsed.data.selectedText.match(/\d+(?:\.\d+)?/g) ?? [])
    const introducedNumber = (suggestion.suggestedRewrite.match(/\d+(?:\.\d+)?/g) ?? []).some((number) => !sourceNumbers.has(number))
    if (introducedNumber) {
      await refundAtsCvUpdate(user.id)
      return NextResponse.json({ suggestion: deterministicRewriteFallback(parsed.data.selectedText), fallback: true })
    }
    return NextResponse.json({ suggestion, usage })
  } catch (error) {
    console.error("ATS suggestion parsing failed:", error)
    await refundAtsCvUpdate(user.id)
    return NextResponse.json({ suggestion: deterministicRewriteFallback(parsed.data.selectedText), fallback: true })
  }
}
