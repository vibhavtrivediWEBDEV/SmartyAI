import { createMeteredAIService, CreditLimitError } from '@/lib/ai/metered'
import { getSessionUserId } from '@/lib/auth/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Create AI service (auto-detects provider: OpenAI, Bedrock, or Gemini)
    const aiService = createMeteredAIService(userId, { source: 'other', feature: 'legacy-generate' })

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
    if (error instanceof CreditLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status })
    }
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
