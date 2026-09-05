import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAIService } from '@/lib/ai';
import { requireFinderSubscription } from '@/lib/auth/finder-access';
import {
  buildCodingAssistantPrompt,
  parseCodingAssistantResponse,
} from '@/lib/workspace/aiAssistant';

const requestSchema = z.object({
  action: z.enum(['explain', 'fix', 'generate']),
  path: z.string().min(1).max(500),
  language: z.string().min(1).max(100),
  code: z.string().max(200_000),
  instruction: z.string().max(2_000).optional(),
});

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coding assistant request' }, { status: 400 });
  }

  if (parsed.data.action === 'generate' && !parsed.data.instruction?.trim()) {
    return NextResponse.json({ error: 'Describe what you want to generate' }, { status: 400 });
  }

  try {
    const aiService = createAIService();
    const response = await aiService.complete(buildCodingAssistantPrompt(parsed.data), {
      temperature: 0.2,
      maxTokens: 3000,
    });
    const result = parseCodingAssistantResponse(response.content, parsed.data.action);

    return NextResponse.json({
      success: true,
      ...result,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Coding assistant failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}