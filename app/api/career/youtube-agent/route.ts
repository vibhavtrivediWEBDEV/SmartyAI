import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getAIService } from '@/lib/ai';
import { emitCareerProgress } from '../../../../lib/career/careerEvents';
import {
  buildVideoEvidence,
  gradeYouTubeQuiz,
  isYouTubeAssessmentTask,
  publicQuizQuestions,
  youtubeTaskTopic,
  type YouTubeQuizQuestion,
} from '../../../../lib/career/youtubeTaskAgent';
import {
  findMissionById,
  findTasksByMission,
  updateMission,
  updateTask,
} from '@/modules/career/career.repository';

async function ownedTask(userId: string, missionId: string, taskId: string) {
  const mission = await findMissionById(missionId);
  if (!mission || mission.userId !== userId) return null;
  const tasks = await findTasksByMission(missionId);
  const task = tasks.find((item) => item.id === taskId);
  if (!task || !isYouTubeAssessmentTask(task)) return null;
  return { task, tasks };
}

function parseQuestions(content: string): YouTubeQuizQuestion[] {
  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('YouTube Agent returned no question data');
  const parsed = JSON.parse(json) as { questions?: unknown[] };
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
    throw new Error('YouTube Agent must return exactly three questions');
  }

  return parsed.questions.map((item, index) => {
    const question = item as Partial<YouTubeQuizQuestion>;
    const options = Array.isArray(question.options) ? question.options.map(String).slice(0, 4) : [];
    const correctOptionIndex = Number(question.correctOptionIndex);
    if (!question.prompt || options.length < 2 || !Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw new Error('YouTube Agent returned a malformed question');
    }
    return {
      id: `q${index + 1}`,
      prompt: String(question.prompt),
      options,
      correctOptionIndex,
      explanation: String(question.explanation || 'Review this concept and try again.'),
    };
  });
}

async function refreshMissionProgress(userId: string, missionId: string) {
  const tasks = await findTasksByMission(missionId);
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  await updateMission(missionId, {
    progress,
    status: progress === 100 ? 'COMPLETED' : 'READY',
    completedAt: progress === 100 ? new Date() : null,
  });
  emitCareerProgress(userId, { missionId, reason: 'task', progress });
  return progress;
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { action, missionId, taskId } = body || {};
  if (!action || !missionId || !taskId) {
    return NextResponse.json({ error: 'Action, mission ID, and task ID are required' }, { status: 400 });
  }

  const owned = await ownedTask(userId, missionId, taskId);
  if (!owned) return NextResponse.json({ error: 'YouTube task not found' }, { status: 404 });
  const { task } = owned;
  const previousResult = task.result ?? {};
  const topic = youtubeTaskTopic(task);

  if (action === 'record') {
    const { event, video, watchedSeconds, durationSeconds } = body;
    if (!['started', 'ended', 'skipped'].includes(event) || !video?.id || !video?.title) {
      return NextResponse.json({ error: 'Valid video evidence is required' }, { status: 400 });
    }
    const evidence = buildVideoEvidence({
      topic,
      video,
      event,
      watchedSeconds,
      durationSeconds,
      previous: previousResult.youtubeEvidence,
    });
    const attempts = [
      ...(Array.isArray(previousResult.youtubeAttempts) ? previousResult.youtubeAttempts : []),
      ...(event === 'skipped' ? [evidence] : []),
    ].slice(-20);
    await updateTask(taskId, {
      result: { ...previousResult, youtubeEvidence: evidence, youtubeAttempts: attempts },
    });
    return NextResponse.json({ evidence });
  }

  if (action === 'questions') {
    const evidence = previousResult.youtubeEvidence;
    if (!evidence?.related || evidence?.status !== 'watched') {
      return NextResponse.json({ error: 'Finish at least 80% of a related video before the check-in' }, { status: 409 });
    }
    const response = await getAIService().complete(`You are the separate YouTube Learning Agent for a strict career game.
Create exactly 3 multiple-choice questions that verify understanding of this learning topic and watched video.
Topic: ${topic}
Video title: ${evidence.title}
Return only JSON: {"questions":[{"prompt":"...","options":["...","...","...","..."],"correctOptionIndex":0,"explanation":"..."}]}
Questions must test concepts, not ask for the video title or channel.`);
    const questions = parseQuestions(response.content);
    await updateTask(taskId, {
      result: {
        ...previousResult,
        youtubeQuiz: { questions, generatedAt: new Date().toISOString(), attempts: previousResult.youtubeQuiz?.attempts ?? [] },
      },
    });
    return NextResponse.json({ questions: publicQuizQuestions(questions) });
  }

  if (action === 'submit') {
    const evidence = previousResult.youtubeEvidence;
    if (!evidence?.related || evidence?.status !== 'watched') {
      return NextResponse.json({ error: 'Valid watch evidence is required before submitting answers' }, { status: 409 });
    }
    const questions = previousResult.youtubeQuiz?.questions as YouTubeQuizQuestion[] | undefined;
    const answers = Array.isArray(body.answers) ? body.answers.map(Number) : [];
    if (!questions?.length || answers.length !== questions.length || answers.some((answer) => !Number.isInteger(answer))) {
      return NextResponse.json({ error: 'Answer every YouTube Agent question' }, { status: 400 });
    }
    const grade = gradeYouTubeQuiz(questions, answers);
    const attempt = { ...grade, answers, submittedAt: new Date().toISOString() };
    const attempts = [...(previousResult.youtubeQuiz?.attempts ?? []), attempt].slice(-10);
    await updateTask(taskId, {
      result: { ...previousResult, youtubeQuiz: { ...previousResult.youtubeQuiz, attempts, latest: attempt } },
      ...(grade.passed ? { status: 'completed' as const, completedAt: new Date() } : { status: 'pending' as const }),
    });
    const progress = grade.passed ? await refreshMissionProgress(userId, missionId) : undefined;
    return NextResponse.json({ ...grade, progress });
  }

  return NextResponse.json({ error: 'Unknown YouTube Agent action' }, { status: 400 });
}