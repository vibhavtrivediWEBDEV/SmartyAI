import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/actions/auth.action"
import { createAIService } from "@/lib/ai"
import { SUBSCRIPTION_PLANS } from "@/modules/subscription/plans"
import { consumeExcelOperation } from "@/modules/users/user.repository"

const MAX_CONTEXT_ROWS = 250
const MAX_CONTEXT_COLUMNS = 60

const systemPrompt = `You are the AI engine inside a macOS-style spreadsheet application. Create and edit professional spreadsheets from natural-language instructions.

Return ONLY a valid JSON object with this shape:
{"actions":[{"type":"...","payload":{...}}],"response":"short confirmation"}

Supported actions:
- replaceSheet: {"data":[[cell,...],...]}. Use this to create a complete table, report, tracker, schedule, invoice, budget, or other requested spreadsheet.
- updateCell: {"rowIndex":0,"colIndex":0,"value":"text, number, boolean, or an Excel formula beginning with ="}
- updateCells: {"updates":[{"rowIndex":0,"colIndex":0,"value":"..."}]}
- addRow: {"rowIndex":-1,"data":[...]}
- addColumn: {"colIndex":-1,"header":"...","data":[...]}
- deleteRow: {"rowIndex":0}
- deleteColumn: {"colIndex":0}
- sort: {"colIndex":0,"order":"asc or desc"}
- clearRange: {"startRow":0,"endRow":1,"startCol":0,"endCol":1}

Rules:
- Indices are zero-based. The first row is normally a header row.
- You may return multiple actions and they run in order.
- Preserve unrelated data. Prefer updateCells for focused edits and replaceSheet for creation or broad transformations.
- Generate Excel-compatible formulas when requested. Never wrap JSON in Markdown.
- For a question that does not modify data, return an empty actions array and answer briefly in response.`

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await request.json()
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
    if (!prompt) return NextResponse.json({ error: "Prompt must be a non-empty string" }, { status: 400 })

    const plan = SUBSCRIPTION_PLANS[user.plan]
    const spreadsheet = Array.isArray(body.spreadsheet)
      ? body.spreadsheet.slice(0, MAX_CONTEXT_ROWS).map((row: unknown) => Array.isArray(row) ? row.slice(0, MAX_CONTEXT_COLUMNS) : [])
      : []
    const activeSheet = typeof body.activeSheet === "string" ? body.activeSheet : "Sheet1"
    const completion = await createAIService().chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Active sheet: ${activeSheet}\nCurrent cells: ${JSON.stringify(spreadsheet)}\nRequest: ${prompt}` },
      ],
      { responseFormat: { type: "json_object" }, temperature: 0.2, maxTokens: 6000 },
    )

    const content = completion.content
    if (!content) throw new Error("The Excel model returned no content")
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const result = JSON.parse(cleaned)

    let remaining: number | null = null
    if (plan.excelOperationsPerMonth !== null) {
      const quota = await consumeExcelOperation(user.id, plan.excelOperationsPerMonth)
      if (!quota.allowed) {
        return NextResponse.json(
          { error: "Free plan includes 10 Excel AI operations per month. Upgrade to continue.", code: "EXCEL_LIMIT_REACHED", remaining: 0 },
          { status: 429 },
        )
      }
      remaining = quota.remaining
    }
    return NextResponse.json({
      actions: Array.isArray(result.actions) ? result.actions : result.action ? [result.action] : [],
      response: typeof result.response === "string" ? result.response : "Spreadsheet updated.",
      remaining,
    })
  } catch (error) {
    console.error("Excel AI error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Excel AI failed" }, { status: 500 })
  }
}
