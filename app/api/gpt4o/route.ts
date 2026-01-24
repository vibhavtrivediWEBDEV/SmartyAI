import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, grade, chapter, exercise, questionNumber, exactQuestion } = await request.json();

    // Validate required parameters
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Create a system message with context about NCERT
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
    };

    // Prepare messages for the API call
    const apiMessages = [systemMessage, ...messages.filter(msg => msg.role !== "system")];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract the response
    const response = completion.choices[0].message.content;

    // Return the response
    return NextResponse.json({ response });
    
  } catch (error) {
    console.error('Error getting GPT-4o response:', error);
    return NextResponse.json(
      { error: 'Failed to get response from GPT-4o' },
      { status: 500 }
    );
  }
}
