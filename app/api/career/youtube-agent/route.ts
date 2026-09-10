import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { createMeteredAIService, CreditLimitError } from '@/lib/ai/metered';
import { recordVerifiedCareerEvidence } from '@/lib/career/recordCareerFeedback';
import { consumePlanUsage, refundPlanUsage } from '@/modules/users/user.repository';
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
    const usage = await consumePlanUsage(userId, 'youtubeSuggestions');
    if (!usage.allowed) {
      return NextResponse.json({ error: `Your plan includes ${usage.limit} YouTube suggestions per month.`, code: 'YOUTUBE_LIMIT_REACHED', usage }, { status: 429 });
    }
    try {
      const response = await createMeteredAIService(userId, { source: 'career', feature: 'youtube-quiz' }).complete(`You are the separate YouTube Learning Agent for a strict career game.
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
      return NextResponse.json({ questions: publicQuizQuestions(questions), usage });
    } catch (error) {
      await refundPlanUsage(userId, 'youtubeSuggestions');
      if (error instanceof CreditLimitError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  }

  if (action === 'submit') {
    const evidence = previousResult.youtubeEvidence;
    if (!evidence?.related || evidence?.status !== 'watched') {
      return NextResponse.json({ error: 'Valid watch evidence is required before submitting answers' }, { status: 409 });
    }
    const questions = previousResult.youtubeQuiz?.questions as YouTubeQuizQuestion[] | undefined;
    const answers = Array.isArray(body.answers) ? body.answers.map(Number) : [];
    if (!questions?.length || answers.length !== questions.length || answers.some((answer: number) => !Number.isInteger(answer))) {
      return NextResponse.json({ error: 'Answer every YouTube Agent question' }, { status: 400 });
    }
    const grade = gradeYouTubeQuiz(questions, answers);
    const attempt = { ...grade, answers, submittedAt: new Date().toISOString() };
    const attempts = [...(previousResult.youtubeQuiz?.attempts ?? []), attempt].slice(-10);
    await updateTask(taskId, {
      result: { ...previousResult, youtubeQuiz: { ...previousResult.youtubeQuiz, attempts, latest: attempt } },
      ...(!grade.passed ? { status: 'pending' as const } : {}),
    });
    const feedback = grade.passed
      ? await recordVerifiedCareerEvidence({
          userId,
          missionId,
          taskId,
          tool: 'youtube',
          evidenceKey: `${evidence.videoId || evidence.id || 'video'}:${previousResult.youtubeQuiz.generatedAt || 'quiz'}`,
          progress: 100,
          metadata: { score: grade.score, watchedPercent: evidence.watchedPercent, videoId: evidence.videoId || evidence.id },
        })
      : undefined;
    const progress = feedback?.missionProgress;
    return NextResponse.json({ ...grade, progress });
  }

  return NextResponse.json({ error: 'Unknown YouTube Agent action' }, { status: 400 });
}