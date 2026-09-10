import { NextRequest, NextResponse } from 'next/server'
import { createMeteredAIService, CreditLimitError } from '@/lib/ai/metered'
import { getSessionUserId } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { question, subject } = await request.json()

    // Validate inputs
    if (!question) {
      return NextResponse.json({ error: 'Missing question parameter' }, { status: 400 })
    }

    // Create AI service (auto-detects provider from env)
    const aiService = createMeteredAIService(userId, { source: 'teacher', feature: 'legacy-tutor' })

    // Ask AI to answer the question in a beginner-friendly way
    const messages = [
      {
        role: 'system' as const,
        content: `
You are Smarty, a friendly and helpful teacher who explains concepts in a mix of Hindi and English (Hinglish).

Guidelines:
1. Explain concepts in simple terms as if talking to a beginner
2. Use a mix of Hindi and English (Hinglish) in your explanations
3. Add occasional light humor to make learning fun
4. Don't ask for specific textbook references, chapters, or exercise numbers
5. Provide real-world examples that students can relate to
6. If you don't know something, admit it honestly
7. Keep explanations concise but thorough
8. Use analogies to explain difficult concepts
9. Be encouraging and positive

Your tone should be warm, friendly and slightly playful - like a cool teacher who students love.
      `.trim(),
      },
      {
        role: 'user' as const,
        content: `
Question: ${question}
${subject ? `Subject area: ${subject}` : ''}
      `.trim(),
      }
    ]

    const response = await aiService.chat(messages, {
      temperature: 0.7,
      maxTokens: 800,
    })
    
    return NextResponse.json({
      success: true,
      answer: response.content,
      provider: response.provider,
      model: response.model,
      funFact: generateRandomFunFact(subject)
    })
    
  } catch (err: any) {
    if (err instanceof CreditLimitError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status })
    }
    console.error('❌ Error in smarty-ai:', err)
    return NextResponse.json(
      { 
        success: false,
        error: 'Oops! My brain had a little hiccup.',
        details: err.message 
      },
      { status: 500 }
    )
  }
}

// Generate a random fun fact based on subject
function generateRandomFunFact(subject?: string) {
  const generalFacts = [
    "Did you know your brain uses about 20% of your body's oxygen?",
    "The first computer bug was an actual real-life bug!",
    "Honey never spoils! Archaeologists found pots of honey in ancient Egyptian tombs that were over 3,000 years old!",
    "Laughing for 10-15 minutes can burn up to 40 calories!",
    "Octopuses have three hearts and blue blood!"
  ]
  
  const physicsFacts = [
    "Lightning is about 27,000°C, which is five times hotter than the sun's surface!",
    "Time passes faster at your head than at your feet due to Einstein's relativity!",
    "A teaspoonful of neutron star would weigh about 6 billion tons!",
    "Light from the Sun takes about 8 minutes to reach Earth!"
  ]
  
  const mathFacts = [
    "There's a number called 'Graham's Number' that's so big, if you tried to memorize it, your brain would collapse into a black hole!",
    "Zero wasn't always a number! Ancient Greeks didn't consider it a proper number.",
    "The symbol for infinity ∞ is called a lemniscate!",
    "If you shuffle a deck of cards properly, chances are that exact order has never existed before!"
  ]
  
  if (subject?.toLowerCase().includes('physics')) {
    return physicsFacts[Math.floor(Math.random() * physicsFacts.length)]
  } else if (subject?.toLowerCase().includes('math')) {
    return mathFacts[Math.floor(Math.random() * mathFacts.length)]
  } else {
    return generalFacts[Math.floor(Math.random() * generalFacts.length)]
  }
}