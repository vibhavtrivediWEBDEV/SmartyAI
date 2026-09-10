import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/actions/auth.action"
import { createMeteredAIService, CreditLimitError } from "@/lib/ai/metered"
import { SUBSCRIPTION_PLANS } from "@/modules/subscription/plans"
import { consumeTableGeneration } from "@/modules/users/user.repository"

const MAX_ROWS_IN_CONTEXT = 500
const MAX_COLUMNS = 80

const systemPrompt = `You power a professional macOS table studio built with AG Grid. Turn natural-language requests and optional JSON data into polished, useful data tables. If the user supplies no data, infer their intent and generate realistic sample data.

Return ONLY valid JSON with this exact top-level shape:
{"title":"...","description":"...","columnDefs":[...],"rowData":[...],"gridOptions":{...},"theme":{"accent":"#...","density":"compact|normal|comfortable"},"message":"short confirmation"}

Rules:
- Return 6-20 realistic rows for generated examples. Preserve all supplied rows unless the user asks to filter or summarize them.
- Every column needs field and headerName. You may also use: width, minWidth, flex, editable, sortable, filter (boolean, agNumberColumnFilter, agDateColumnFilter, agTextColumnFilter), pinned, hide, valueFormatter (currency, percent, date, number), cellStyle (positive-negative, status, progress), and type (numericColumn).
- gridOptions may use pagination, paginationPageSize, rowSelection (singleRow or multiRow), selectAllByDefault (boolean), animateRows, enableCellTextSelection, pinnedTopRowData, and groupByField.
- Row checkboxes are provided automatically by rowSelection. NEVER add checkboxSelection to a column and never create a fake checkbox/selected column unless the user's source data genuinely contains that field. If the user asks to set all checkboxes to true, checked, or selected by default, set gridOptions.selectAllByDefault to true. If they ask to clear/uncheck them, set it to false.
- Prefer filters, sorting, pagination, sensible widths, clear labels, and a useful summary row for numeric business tables.
- For an edit request, use the current configuration as the source of truth and return the entire updated configuration. Make only the requested change while preserving unrelated data and settings.
- Never emit JavaScript functions, HTML, Markdown, comments, or unsupported AG Grid properties.`

function sanitizeContext(value: unknown) {
  if (!value || typeof value !== "object") return null
  const config = value as Record<string, unknown>
  return {
    title: config.title,
    description: config.description,
    columnDefs: Array.isArray(config.columnDefs) ? config.columnDefs.slice(0, MAX_COLUMNS) : [],
    rowData: Array.isArray(config.rowData) ? config.rowData.slice(0, MAX_ROWS_IN_CONTEXT) : [],
    gridOptions: config.gridOptions,
    theme: config.theme,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await request.json()
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
    if (!prompt) return NextResponse.json({ error: "Describe the table you want to create or change." }, { status: 400 })

    const plan = SUBSCRIPTION_PLANS[user.plan]
    const data = typeof body.data === "string" ? body.data.slice(0, 250_000) : ""
    const current = sanitizeContext(body.current)
    const completion = await createMeteredAIService(user.id, { source: "other", feature: "table-generation" }).chat([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${current ? `Current table configuration:\n${JSON.stringify(current)}\n` : ""}${data ? `User data (JSON/CSV-like text):\n${data}\n` : "No source data was supplied; generate appropriate data.\n"}Request: ${prompt}`,
      },
    ], { responseFormat: { type: "json_object" }, temperature: 0.2, maxTokens: 10000 })

    const cleaned = completion.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const result = JSON.parse(cleaned) as Record<string, unknown>
    if (!Array.isArray(result.columnDefs) || !Array.isArray(result.rowData)) {
      throw new Error("The table model returned an incomplete configuration")
    }

    let remaining: number | null = null
    if (plan.tableGenerationsPerMonth !== null) {
      const quota = await consumeTableGeneration(user.id, plan.tableGenerationsPerMonth)
      if (!quota.allowed) {
        return NextResponse.json({ error: "Free plan includes 50 AI table generations per month. Upgrade to continue.", code: "TABLE_LIMIT_REACHED", remaining: 0 }, { status: 429 })
      }
      remaining = quota.remaining
    }

    return NextResponse.json({ config: result, remaining })
  } catch (error) {
    if (error instanceof CreditLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Table AI error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Table AI failed" }, { status: 500 })
  }
}
