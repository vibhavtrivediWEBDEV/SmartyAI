// app/api/book/route.ts
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, messages } = await request.json()

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

    const mappedMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content),
    }))

    const systemPrompt = `
You are an assistant helping build an educational interactive book.
You will return JSON in the BOOK_PAGES format (as an array) for the topic "${prompt}".

The response must follow this structure:

[
  {
    type: "cover",
    content: {
      title: "<title>",
      subtitle: "A Journey Through <prompt>",
      author: "Vibhav Trivedi"
    }
  },
  {
    type: "image",
    content: {
      src: "<perfect Image short title, not a URL>",
      alt: "<same as src>",
      caption: "<caption of image>"
    }
  },
  {
    type: "text",
    content: {
      title: "<section title>",
      body: "<detailed markdown/text explanation alteast 10 lines>"
    }
  },
  ...
  {
    type: "text",
    content: {
      title: "<another section>",
      body: "<another detailed part atleast 10 lines>"
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
  ...

  // Multiple Q&A objects created from all user messages
  {
    type: "text",
    content: {
      question: "<first user question in detail>",
      answer: "<detailed answer atleast 10 lines>"
    }
  },
  {
    type: "text",
    content: {
      question: "<second user question>",
      answer: "<detailed answer atleast 10 lines>"
    }
  },

   // Multiple Important questions - TOP IMPORTANT 
  {
    type: "text",
    content: {
      question: "<first user question in detail>",
      answer: "<detailed answer atleast 10 lines>"
    }
  },
  {
    type: "text",
    content: {
      question: "<second user question>",
      answer: "<detailed answer with atleast 20 lines>"
    }
  },
  ...
  {
    type: "end",
    content: {
      message: "End of Chapter with slogan wht you understant with this ."
    }
  }
]

Important:
- return more details so book is atleast 10-30  pages and when its image dont give url give a short accurate title like if that title i search in google i got the image 
-very clean begginer friendly answers with example with accurate details
- Extract ALL user questions from the provided messages array .(make sure is there any typo in User Question Anylise with assistant response then create a valid question and its answer)
- Each question must have its own { type: "text", content: { question, answer } } object.
- Keep everything valid JSON, no markdown, no explanations outside of JSON.
    `.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...mappedMessages,
      ],
      temperature: 0.7,
    })

    const rawContent = completion.choices[0]?.message?.content?.trim()

    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'Empty response from OpenAI' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let parsedJSON
    try {
      parsedJSON = JSON.parse(rawContent)
    } catch (err) {
      console.error('Invalid JSON from OpenAI:', rawContent)
      return new Response(
        JSON.stringify({
          error: 'OpenAI returned invalid JSON',
          details: rawContent,
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
