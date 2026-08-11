import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/lib/ai'
import { getUserAIContextServer } from '@/lib/ai/userAIContext.server'
import { generateDesktopAssistantPrompt } from '@/lib/ai/userAIContext'

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json()

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
    
    // Get user context for personalized assistant
    let systemContent = 'You are a helpful terminal assistant.';
    
    // Try to get user context (from userId parameter or auth session)
    try {
      console.log('🎯 Loading user context for terminal AI (userId:', userId || 'from auth', ')');
      const userContext = await getUserAIContextServer();
      if (userContext) {
        systemContent = generateDesktopAssistantPrompt(userContext) + '\n\nYou are responding in the Terminal app. Keep responses brief and technical. You know about the user\'s projects, skills, and experience.';
        console.log('✅ User context loaded for:', userContext.displayName, '- Skills:', userContext.skills?.length || 0, '- Projects:', userContext.projects?.length || 0);
      } else {
        console.warn('⚠️ User context was null');
      }
    } catch (error) {
      console.error('❌ Could not load user context:', error);
    }
    
    // Inject system prompt at the beginning
    const fullMessages = [
      {
        role: 'system',
        content: systemContent,
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
