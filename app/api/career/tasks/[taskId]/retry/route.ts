import { getSessionUserId } from '@/lib/auth/session';
import { retryFailedTaskForUser } from '@/modules/career/career.repository';

type Context = { params: Promise<{ taskId: string }> };

export async function POST(_request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const result = await retryFailedTaskForUser(taskId, userId);

  if (result.status === 'not_found') {
    return Response.json(
      { error: 'Career task not found', code: 'TASK_NOT_FOUND' },
      { status: 404 },
    );
  }
  if (result.status === 'not_failed') {
    return Response.json(
      { error: 'Only failed tasks can be retried', code: 'TASK_NOT_FAILED' },
      { status: 409 },
    );
  }
  if (result.status === 'limit_reached') {
    return Response.json(
      { error: 'Retry limit reached', code: 'RETRY_LIMIT_REACHED' },
      { status: 409 },
    );
  }

  return Response.json({ success: true, task: result.task });
}