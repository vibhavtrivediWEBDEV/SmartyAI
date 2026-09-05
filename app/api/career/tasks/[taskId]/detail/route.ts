import { createAIService } from '@/lib/ai';
import { getSessionUserId } from '@/lib/auth/session';
import { findTasksByUserId, updateTask } from '@/modules/career/career.repository';
import { jsonrepair } from 'jsonrepair';
import { fallbackPreparationBrief, normalizeGeneratedPreparationBrief, preparationBriefSchema } from '../../../../../../lib/career/preparationBrief';

type Context = { params: Promise<{ taskId: string }> };

function parseBrief(content: string) {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return normalizeGeneratedPreparationBrief(JSON.parse(jsonrepair(normalized)));
}

export async function POST(_request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ success: false, error: 'You must be signed in.' }, { status: 401 });

  const { taskId } = await params;
  const task = (await findTasksByUserId(userId)).find((item) => item.id === taskId);
  if (!task) return Response.json({ success: false, error: 'Preparation task not found.' }, { status: 404 });

  const cached = preparationBriefSchema.safeParse(task.result?.preparationBrief);
  if (cached.success) {
    return Response.json({ success: true, source: 'cached', brief: cached.data });
  }

  try {
    const response = await createAIService().chat([
      {
        role: 'system',
        content: `You create practical interview-preparation lesson briefs. Return only valid JSON with this exact shape: {"summary":"...","objective":"...","agenda":[{"title":"...","detail":"...","minutes":15}],"keyConcepts":[{"name":"...","explanation":"..."}],"practice":[{"task":"...","expectedOutcome":"..."}],"completionCriteria":["..."],"encouragement":"..."}. Make it specific, actionable, accurate, and suitable for one focused session. Do not include markdown fences.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          title: task.title,
          description: task.description || '',
          topic: task.topic || '',
          type: task.type,
          durationMinutes: task.duration || 60,
        }),
      },
    ], { temperature: 0.35, maxTokens: 1400, responseFormat: { type: 'json_object' } });

    const brief = parseBrief(response.content);
    await updateTask(task.id, { result: { ...(task.result || {}), preparationBrief: brief } });
    return Response.json({ success: true, source: 'ai', brief });
  } catch (error) {
    console.error('Preparation brief generation failed:', error);
    return Response.json({ success: true, source: 'fallback', brief: fallbackPreparationBrief(task) });
  }
}