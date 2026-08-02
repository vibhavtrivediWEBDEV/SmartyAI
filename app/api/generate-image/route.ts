import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { resolveEducationalImage } from '@/lib/ai/educationalImage';

export async function POST(request: NextRequest) {
  let fallbackQuery = 'education';
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { prompt, context, conversation } = await request.json() as { prompt?: string; context?: string; conversation?: string };

    // Validate inputs
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 1500 || (conversation && (typeof conversation !== 'string' || conversation.length > 10000))) {
      return NextResponse.json({ error: 'Missing prompt parameter' }, { status: 400 });
    }
    fallbackQuery = context?.trim() || prompt.trim();

    const result = await resolveEducationalImage(`${fallbackQuery}. ${conversation ? `Lesson context: ${conversation.slice(-2000)}` : ''}`);
    
    // Return the image URL and revised prompt
    return NextResponse.json({
      success: true,
      url: result.url,
      revisedPrompt: result.revisedPrompt || prompt,
      provider: result.provider,
    });
    
  } catch (err) {
    console.error('Image generation unavailable:', err instanceof Error ? err.name : 'unknown error');
    return NextResponse.json({ success: false, error: 'Image generation is temporarily unavailable.' }, { status: 503 });
  }
}