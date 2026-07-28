import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Create AI service (auto-detects provider from env)
    const aiService = createAIService()

    // Convert { type: 'input' | 'output', value: string } to { role: 'user' | 'assistant', content }
    const mappedMessages = messages.map((msg) => {
      return {
        role: msg.type === 'input' ? 'user' : 'assistant',
        content: typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value),
      }
    })
    
    // Ensure at least one user message for Bedrock compatibility
    const userMessages = mappedMessages.length > 0 
      ? mappedMessages 
      : [{ role: 'user' as const, content: 'Hello' }]
    
    // Inject system prompt at the beginning
    const fullMessages = [
      {
        role: 'system',
        content: `
You are an assistant that acts on behalf of the user Vibhav Trivedi.
Vibhav is a frontend developer with over 1 year of experience in React.js, Next.js, Tailwind CSS, GSAP, Framer Motion, and Node.js.
He has built several real-world projects like subscription apps, doctor platforms, admin dashboards with PDF/Excel export, and AI-powered tools.
Always respond as Vibhav himself, using his tone and experience.
        `,
      },
      ...userMessages,
    ]

    const response = await aiService.chat(fullMessages, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    return NextResponse.json({ 
      success: true, 
      response: response.content,
      provider: response.provider,
      model: response.model
    })
  } catch (error: any) {
    console.error('AI error:', error)
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 })
  }
}
