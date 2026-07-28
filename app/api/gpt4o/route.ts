import { NextRequest, NextResponse } from 'next/server'
import { createAIService } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, grade, chapter, exercise, questionNumber, exactQuestion } = await request.json()

    // Validate required parameters
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Create AI service (auto-detects provider from env)
    const aiService = createAIService()

    // Create system message with context about NCERT
    const systemMessage = {
      role: "system",
      content: `You are an expert NCERT textbook assistant for ${subject} (Grade ${grade}).
      ${chapter ? `You are focusing on Chapter ${chapter}.` : ''}
      ${exercise ? `Specifically on Exercise ${exercise}.` : ''}
      ${questionNumber ? `Question number ${questionNumber}.` : ''}
      ${exactQuestion ? `The exact question is: "${exactQuestion}"` : ''}
      
      Provide clear, accurate, and educational explanations suitable for students.
      Include step-by-step solutions for mathematical or scientific problems.
      Mention relevant NCERT concepts and refer to specific sections of the textbook when appropriate.`
    }

    // Filter out system messages and ensure at least one user message
    const nonSystemMessages = messages.filter(msg => msg.role !== "system")
    const userMessages = nonSystemMessages.length > 0 
      ? nonSystemMessages 
      : [{ role: 'user' as const, content: `Help me with ${subject} grade ${grade}${chapter ? ` chapter ${chapter}` : ''}` }]
    
    // Prepare messages for API call
    const apiMessages = [systemMessage, ...userMessages]

    // Call AI service
    const response = await aiService.chat(apiMessages, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Return the response
    return NextResponse.json({ 
      response: response.content,
      provider: response.provider,
      model: response.model
    })
    
  } catch (error: any) {
    console.error('Error getting AI response:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get response from AI' },
      { status: 500 }
    )
  }
}
