import type { NextRequest } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, spreadsheet } = await request.json()
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Convert spreadsheet data to a more readable format for the AI
    const spreadsheetContext = JSON.stringify(spreadsheet, null, 2)

    const systemPrompt = `You are an intelligent Excel assistant. Your goal is to help users with Excel-related queries, including shortcuts, formulas, and general operations. You can also directly modify the spreadsheet data based on user commands.


When a user asks you to perform an action on the spreadsheet (e.g., "add a row", "sum column D", "set cell A1 to 'Hello'", "add a new column", "delete row 3", "sort by column 'Product'"), respond with a JSON object containing an 'action' field and a 'response' field.

The 'action' field should be an object with 'type' (e.g., "addRow", "updateCell", "addColumn", "deleteRow", "deleteColumn", "sort") and 'payload' (details for the action).
The 'response' field should be a conversational message confirming the action or providing additional guidance.

If the user's query is not a direct action (e.g., "What is VLOOKUP?"), respond with plain text or a code block for formulas/shortcuts, as before.


**Action Types and Payloads:**
- **addRow**: {"type": "addRow", "payload": {"rowIndex": number, "data": string[]}}
  - \`rowIndex\`: The 0-indexed row number where the new row should be inserted. Use -1 to append to the end.
  - \`data\`: An array of strings representing the values for the new row's cells.
- **updateCell**: {"type": "updateCell", "payload": {"rowIndex": number, "colIndex": number, "value": string}}
  - \`rowIndex\`: The 0-indexed row number of the cell to update.
  - \`colIndex\`: The 0-indexed column number of the cell to update.
  - \`value\`: The new value for the cell (can be a string, number, or formula string like "=SUM(A1:A5)").
- **addColumn**: {"type": "addColumn", "payload": {"colIndex": number, "header": string, "data"?: string[]}}
  - \`colIndex\`: The 0-indexed column number where the new column should be inserted. Use -1 to append to the end.
  - \`header\`: The header text for the new column (will be placed in the first row).
  - \`data\`: (Optional) An array of strings representing the values for the new column's cells, starting from the second row. If not provided, cells will be empty.
- **deleteRow**: {"type": "deleteRow", "payload": {"rowIndex": number}}
  - \`rowIndex\`: The 0-indexed row number of the row to delete.
- **deleteColumn**: {"type": "deleteColumn", "payload": {"colIndex": number}}
  - \`colIndex\`: The 0-indexed column number of the column to delete.
- **sort**: {"type": "sort", "payload": {"colIndex": number, "order": "asc" | "desc"}}
  - \`colIndex\`: The 0-indexed column number to sort by.
  - \`order\`: "asc" for ascending, "desc" for descending.

**Current Spreadsheet Data Context:**
\`\`\`json
${spreadsheetContext}
\`\`\`
   - The JSON must be **pure JSON**:
  - ❌ No comments 
  - ❌ No trailing commas
     - ❌ No markdown fences 
     - ❌ No explanations inside the JSON
   - Put any explanations, details, or reasoning in the  field only.

**Important Considerations for AI:**
**When a user asks about Excel shortcuts**  
- Detect and return the shortcut in a clean code block:Keep it simple, list only relevant keys  
- When asked to perform an action, always try to use one of the defined action types.
- If a user asks for a feature not directly supported by these actions (e.g., "highlight rows where quantity is > 10", "create a chart"), explain that the current tool focuses on data manipulation and content, and suggest how they might achieve that in a full-featured spreadsheet application like Microsoft Excel or Google Sheets. Do not attempt to generate an action for unsupported visual formatting.
- Always provide clear and concise answers.
- For direct actions, respond with the specified JSON format , and in response field explain the action 
- For non-actionable queries, respond with plain text or 'excel' code blocks.
- Do not attempt to modify the spreadsheet data directly in your response; instead, provide the structured JSON for the client to execute.
- Keep responses friendly and helpful.
`

    const fullMessages = [
      {
        role: "system",
        content: systemPrompt.trim(),
      },
      {
        role: "user",
        content: prompt,
      },
    ]

    const responseStream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      temperature: 0.7,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          const text = chunk.choices?.[0]?.delta?.content
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("OpenAI stream error:", error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
