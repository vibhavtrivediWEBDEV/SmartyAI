import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, name } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Convert { role: 'user' | 'assistant', content: string } to OpenAI format
    const mappedMessages = messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }))

    const systemPrompt = `
You are an assistant helping build an educational interactive book.
You will return JSON in the BOOK_PAGES format (as an array) for the topic "${subject}".
The response must follow this structure:

[
  {
    type: "cover",
    content: {
      title: "<title>",
      subtitle: "A Journey Through ${subject}",
      author: "${name}"
    }
  },
  {
    type: "image",
    content: {
      src: "<image description, not a URL>",
      alt: "<same as src>",
      caption: "<caption of image>"
    }
  },
  {
    type: "text",
    content: {
      title: "<section title>",
      body: "<detailed markdown/text explanation>"
    }
  },
  {
    type: "text",
    content: {
      title: "<another section>",
      body: "<another detailed part>"
    }
  },
  {
    type: "image",
    content: {
      src: "<another image description>",
      alt: "<same>",
      caption: "<caption>"
    }
  },
  {
    type: "end",
    content: {
      message: "End of Chapter"
    }
  }
]

Respond ONLY with valid JSON following that structure — no explanations, no markdown code blocks.
`.trim()

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...mappedMessages,
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseContent = completion.choices[0].message.content

    return NextResponse.json({ success: true, response: responseContent })
  } catch (error: any) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
