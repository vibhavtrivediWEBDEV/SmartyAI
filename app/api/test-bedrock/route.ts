import { NextRequest, NextResponse } from 'next/server'
import { createMeteredAIService, CreditLimitError } from '@/lib/ai/metered'
import { getSessionUserId } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  console.log('🔥 TEST STREAM ROUTE CALLED')
  
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { prompt } = await request.json()
    console.log('📝 Prompt:', prompt)
    
    const aiService = createMeteredAIService(userId, { source: 'other', feature: 'provider-test' })
    console.log('🤖 AI Service created:', aiService.constructor.name)
    
    const response = await aiService.chat([
      { role: 'user', content: prompt || 'hello' }
    ], { maxTokens: 100 })
    
    console.log('✅ Response:', response.content.substring(0, 50))
    
    return NextResponse.json({ 
      success: true, 
      response: response.content 
    })
  } catch (error: any) {
    if (error instanceof CreditLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
    console.error('❌ ERROR:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
