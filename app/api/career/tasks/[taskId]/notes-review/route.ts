import { getSessionUserId } from '@/lib/auth/session';
import { CareerFeedbackError, recordVerifiedCareerEvidence } from '@/lib/career/recordCareerFeedback';
import { findTaskByIdForUser } from '@/modules/career/career.repository';
import { preparationBriefSchema } from '../../../../../../lib/career/preparationBrief';

type Context = { params: Promise<{ taskId: string }> };

export async function POST(_request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const task = await findTaskByIdForUser(taskId, userId);
  if (!task) return Response.json({ error: 'Career task not found' }, { status: 404 });

  const brief = preparationBriefSchema.safeParse(task.result?.preparationBrief);
  if (!brief.success) {
    return Response.json({ error: 'Open and prepare this note before reviewing it.' }, { status: 409 });
  }

  try {
    const feedback = await recordVerifiedCareerEvidence({
      userId,
      missionId: task.missionId,
      taskId: task.id,
      tool: 'notes',
      evidenceKey: `preparation-brief:${task.id}`,
      progress: 100,
      metadata: {
        agendaItems: brief.data.agenda.length,
        keyConcepts: brief.data.keyConcepts.length,
        completionCriteria: brief.data.completionCriteria.length,
      },
    });
    return Response.json({ success: true, feedback });
  } catch (error) {
    if (error instanceof CareerFeedbackError) {
      const status = error.code === 'TASK_NOT_FOUND' ? 404 : 409;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}