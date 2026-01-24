import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, conversation } = await request.json();

    // Validate inputs
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt parameter' }, { status: 400 });
    }

    // Use ChatGPT to analyze the conversation and refine the image prompt
    let refinedPrompt = prompt;
    
    if (conversation) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an educational assistant. Your task is to analyze a conversation and create a clear, specific prompt for generating an educational diagram. Focus on the main educational concept being discussed."
            },
            {
              role: "user",
              content: `Based on this conversation:\n\n${conversation}\n\nCreate a specific, detailed prompt for generating an educational diagram about "${context}". The prompt should be clear about what elements to include in the diagram.`
            }
          ],
          max_tokens: 300,
        });

        if (completion.choices[0]?.message?.content) {
          refinedPrompt = completion.choices[0].message.content;
        }
      } catch (error) {
        console.error("Error refining prompt with ChatGPT:", error);
        // Continue with original prompt if ChatGPT fails
      }
    }

    // Call OpenAI API for image generation
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Educational diagram: ${refinedPrompt}. Make sure all text is clearly readable. Include labels and explanations. Use vibrant colors and clear visual hierarchy.`,
      n: 1,
      size: "1024x1024",
    });
    
    // Return the image URL and revised prompt
    return NextResponse.json({
      success: true,
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    });
    
  } catch (err: any) {
    console.error('❌ Error generating image:', err);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate image',
        details: err.message 
      },
      { status: 500 }
    );
  }
}