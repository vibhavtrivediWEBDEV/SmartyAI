import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/lib/ai'

export async function POST(request: NextRequest) {
  console.log('🔥 TEST STREAM ROUTE CALLED')
  
  try {
    const { prompt } = await request.json()
    console.log('📝 Prompt:', prompt)
    
    const aiService = createAIService()
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
    console.error('❌ ERROR:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
