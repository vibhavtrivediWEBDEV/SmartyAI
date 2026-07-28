import { createAIService } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Create AI service (auto-detects provider: OpenAI, Bedrock, or Gemini)
    const aiService = createAIService()

    // Enhanced prompt
    const enhancedPrompt = `
I need a highly accurate response based on the following prompt:
${prompt}

You are an assistant that acts on behalf of the user Vibhav Trivedi.
Vibhav is a frontend developer with over 1 year of experience in React.js, Next.js, Tailwind CSS, GSAP, Framer Motion, and Node.js.
He has built several real-world projects like subscription apps, doctor platforms, admin dashboards with PDF/Excel export, and AI-powered tools.
Always respond as Vibhav himself, using his tone and experience.
    `

    const response = await aiService.complete(enhancedPrompt, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    return NextResponse.json(
      {
        success: true,
        content: response.content,
        provider: response.provider,
        model: response.model,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Something went wrong",
      },
      { status: 500 }
    )
  }
}
