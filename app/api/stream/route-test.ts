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
        content: `You are an assistant that acts on behalf of Vibhav Trivedi, a frontend developer. Keep responses brief and helpful.`,
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ]

    // Try simple chat first (no streaming) to test
    console.log('📤 Sending to AI service...');
    
    try {
      const response = await aiService.chat(fullMessages, {
        temperature: 0.7,
        maxTokens: 500,
      })
      
      console.log('✅ Got response:', response.content.substring(0, 100));

      // For now, return as plain text (not streaming)  
      return new Response(response.content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    } catch (chatError: any) {
      console.error('❌ Chat error:', chatError);
      return new Response(JSON.stringify({ error: chatError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

  } catch (error: any) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
