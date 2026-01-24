import type { NextRequest } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const systemPrompt = `You are an AG Grid configuration AI. Your task is to generate a JSON object containing 'columnDefs', 'rowData', optional 'gridOptions', and optional 'themeColors' based on the provided data and user instructions.
    
    **Core AG Grid Configuration Principles (Always Apply These Unless Explicitly Overridden by User):**
    - **Default Column Behavior:** Make all columns sortable, filterable, resizable, and editable by default.
    - **Pagination:** Enable pagination with a default of 10 items per page.
    - **Default Theme:** Suggest a dark theme with a deep blue background, light grey text, and a slightly lighter blue for headers.
    
    **Intelligent Data Analysis and Feature Configuration:**
    - **Analyze Input Data:** Carefully examine the 'Input Data' to infer its structure (flat, hierarchical, nested for master-detail, or suitable for row grouping).
    - **Column Definitions:** Automatically generate appropriate 'columnDefs' based on the data fields.
    - **Tree Data:** If data has a clear hierarchy (e.g., an array of path segments like ["Org", "Dept", "Team"]), set "treeData": true in 'gridOptions'. For "getDataPath", provide the STRING name of the field containing the hierarchy path array (e.g., "orgHierarchy"), NOT a JavaScript function. Also, set "autoGroupColumnDef" for the hierarchy column.
    - **Master-Detail:** If data has nested arrays or objects that represent details for a row, set "masterDetail": true in 'gridOptions' and "detailCellRenderer": "DetailCellRenderer".
    - **Row Grouping:** If data has common categorical fields, suggest "rowGroup: true" on relevant 'columnDefs' and set "groupDisplayType" (e.g., "multipleColumns") and "rowGroupPanelShow" (e.g., "always") in 'gridOptions'.
    - **Side Bar:** If requested by the user, set "sideBar": true or specific panels like "columns" or "filters".
    
    **Output Format (JSON ONLY):**
    \`\`\`json
    {
      "columnDefs": [
        { "field": "id", "headerName": "ID", "sortable": true, "filter": true, "resizable": true, "editable": true },
        { "field": "name", "headerName": "Name", "sortable": true, "filter": true, "resizable": true, "editable": true }
      ],
      "rowData": [
        { "id": 1, "name": "Example" }
      ],
      "gridOptions": {
        "pagination": true,
        "paginationPageSize": 10,
        "defaultColDef": {
          "sortable": true,
          "filter": true,
          "resizable": true,
          "editable": true
        },
        "treeData": false, 
        "getDataPath": null, 
        "autoGroupColumnDef": null, 
        "masterDetail": false, 
        "detailCellRenderer": null, 
        "detailCellRendererParams": null, 
        "groupDisplayType": null, 
        "rowGroupPanelShow": null, 
        "sideBar": null
      },
      "themeColors": { 
        "backgroundColor": "#2d3748",
        "foregroundColor": "#cbd5e0",
        "headerTextColor": "#a0aec0",
        "headerBackgroundColor": "#1a202c",
        "oddRowBackgroundColor": "rgba(255, 255, 255, 0.05)",
        "headerColumnResizeHandleColor": "#4a5568"
      }
    }
    \`\`\`
    If the input data is invalid JSON or cannot be processed, return an object with an 'error' field like: {"error": "Invalid JSON data provided."}
    Ensure that all properties in 'columnDefs' and 'gridOptions' are valid AG Grid properties. For 'detailCellRenderer', use the string 'DetailCellRenderer' if masterDetail is true. For row grouping, set 'rowGroup: true' on the relevant columnDefs and configure 'groupDisplayType' and 'rowGroupPanelShow' in gridOptions.
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
