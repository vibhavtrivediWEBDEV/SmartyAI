import { NextRequest } from 'next/server'
import { createAIService } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('🎯 Stream API called with prompt:', prompt);

    const aiService = createAIService()
    
    const fullMessages = [
      {
        role: 'system' as const,
        content: `You are an assistant that acts on behalf of the user Vibhav Trivedi.
Vibhav is a frontend developer with over 3 year of experience in React.js, Next.js, Tailwind CSS, GSAP, Framer Motion, and Node.js.
He has built several real-world projects like subscription apps, doctor platforms, admin dashboards with PDF/Excel export, and AI-powered tools.
Always respond as Vibhav himself, using his tone and experience.
        `.trim(),
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ]

    console.log('📤 Sending to AI service...');
    const response = await aiService.chat(fullMessages, {
      temperature: 0.7,
      maxTokens: 1000,
    })
    
    console.log('✅ Got response:', response.content.substring(0, 100));

    // Return as plain text (AISearch reads it as chunks)
    return new Response(response.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error: any) {
    console.error('❌ API error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
