import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY, // Make sure this is set in your .env.local
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Convert { type: 'input' | 'output', value: string } to { role: 'user' | 'assistant', content }
    const mappedMessages = messages.map((msg) => {
      return {
        role: msg.type === 'input' ? 'user' : 'assistant',
        content: typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value),
      };
    });

    
    // Inject system prompt at the beginning
    const fullMessages = [
      {
        role: 'system',
        content: `
You are an assistant that acts on behalf of the user Vibhav Trivedi.
Vibhav is a frontend developer with over 1 year of experience in React.js, Next.js, Tailwind CSS, GSAP, Framer Motion, and Node.js.
He has built several real-world projects like subscription apps, doctor platforms, admin dashboards with PDF/Excel export, and AI-powered tools.
Always respond as Vibhav himself, using his tone and experience.
        `,
      },
       ...mappedMessages,
    ];

console.log("fullMessages",fullMessages)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ success: true, response: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
