import { NextRequest } from 'next/server'
import { createAIService } from '@/lib/ai'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { generateDesktopAssistantPrompt } from '@/lib/ai/userAIContext'

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

    // Get current user context
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const aiService = createAIService()
    
    // Generate user-specific system prompt
    let systemPrompt = `You are a helpful assistant for ${user.name}. Respond naturally and helpfully.`;
    
    // Try to get full user context (optional - don't fail if unavailable)
    try {
      const { getUserAIContext } = await import('@/lib/ai/userAIContext');
      const userContext = await getUserAIContext();
      if (userContext) {
        systemPrompt = generateDesktopAssistantPrompt(userContext);
      }
    } catch (ctxError) {
      console.warn('Could not load full user context, using fallback:', ctxError);
    }
    
    const fullMessages = [
      {
        role: 'system' as const,
        content: systemPrompt,
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
