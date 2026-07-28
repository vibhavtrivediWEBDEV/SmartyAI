// app/api/book/route.ts
import { createAIService } from '@/lib/ai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, messages, name } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Use AI abstraction layer (auto-detects: OpenAI, Bedrock, or Gemini)
    const aiService = createAIService()

    const systemPrompt = `
Create a concise interactive educational book about "${prompt}" by "${name}". 

Return ONLY valid JSON (no markdown fences). Maximum 6-8 sections with 3-5 lines each.

[
  {
    type: "cover",
    content: { title: "${prompt}", subtitle: "A Journey Through ${prompt}", author: "${name}" }
  },
  {
    type: "image",
    content: { src: "<image description>", alt: "<alt text>", caption: "<caption>" }
  },
  {
    type: "text",
    content: { title: "<section title>", body: "<3-5 line explanation>" }
  },
  { type: "text", content: { title: "<section>", body: "<content>" } },
  { type: "image", content: { src: "<desc>", alt: "<alt>", caption: "<cap>" } },
  { type: "text", content: { title: "<section>", body: "<content>" } },
  { type: "end", content: { message: "<closing>" } }
]

Rules:
- Maximum 8 items total
- 3-5 lines per explanation (not 10+)
- Valid JSON array only (no markdown)
- No URLs for images (just descriptions)
    `.trim()

    // Convert messages to chat format
    const chatMessages = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }))

    // Ensure there's at least one user message (required for Bedrock)
    // If no messages, add a user message with the prompt
    const userMessages = chatMessages.length > 0 
      ? chatMessages 
      : [{ role: 'user' as const, content: `Create an interactive book about ${prompt}` }]

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...userMessages,
    ]

    const response = await aiService.chat(allMessages, {
      temperature: 0.7,
      maxTokens: 4000, // Increased for complete book content
    })

    const rawContent = response.content.trim()

    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'Empty response from AI' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Remove markdown code fences if present (common in AI responses)
    let cleanedContent = rawContent
    
    // Check for markdown fences
    if (cleanedContent.startsWith('```')) {
      // Remove opening fence (```json or ```)
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, '')
      // Remove closing fence
      cleanedContent = cleanedContent.replace(/```$/,'')
    }
    
    cleanedContent = cleanedContent.trim()

    let parsedJSON
    try {
      parsedJSON = JSON.parse(cleanedContent)
    } catch (err) {
      console.error('❌ Invalid JSON from AI')
      console.error('Full length:', cleanedContent.length)
      console.error('First 500 chars:', cleanedContent.substring(0, 500))
      console.error('Last 200 chars:', cleanedContent.substring(cleanedContent.length - 200))
      console.error('Parse error:', err)
      return new Response(
        JSON.stringify({
          error: 'AI returned invalid JSON',
          details: cleanedContent.substring(0, 500),
          fullLength: cleanedContent.length,
          lastChars: cleanedContent.substring(cleanedContent.length - 100)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify(parsedJSON), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Book API Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
