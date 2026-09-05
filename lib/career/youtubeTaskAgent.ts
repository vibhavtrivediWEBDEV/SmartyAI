import { extractLearningTopic, isVideoTitleRelevant } from '../youtubeLearningSearch';

export const YOUTUBE_PASS_SCORE = 67;
export const YOUTUBE_MIN_WATCH_RATIO = 0.8;

export interface YouTubeVideoEvidence {
  id: string;
  title: string;
  channelTitle: string;
  durationSeconds: number;
  watchedSeconds: number;
  related: boolean;
  status: 'watching' | 'watched' | 'skipped';
  startedAt: string;
  endedAt?: string;
  skippedAt?: string;
}

export interface YouTubeQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export function isYouTubeAssessmentTask(task: { type?: string; openIn?: string[] }) {
  return task.type === 'youtube' || task.type === 'calendar' || task.openIn?.includes('youtube') === true;
}

export function buildVideoEvidence(params: {
  topic: string;
  video: { id: string; title: string; channelTitle?: string };
  event: 'started' | 'ended' | 'skipped';
  watchedSeconds?: number;
  durationSeconds?: number;
  previous?: YouTubeVideoEvidence;
  now?: Date;
}): YouTubeVideoEvidence {
  const now = (params.now ?? new Date()).toISOString();
  const durationSeconds = Math.max(0, params.durationSeconds ?? params.previous?.durationSeconds ?? 0);
  const watchedSeconds = Math.max(0, params.watchedSeconds ?? params.previous?.watchedSeconds ?? 0);
  const related = isVideoTitleRelevant(params.topic, params.video.title);
  const watchRatio = durationSeconds > 0 ? watchedSeconds / durationSeconds : 0;
  const watched = params.event === 'ended' && related && watchRatio >= YOUTUBE_MIN_WATCH_RATIO;

  return {
    id: params.video.id,
    title: params.video.title,
    channelTitle: params.video.channelTitle ?? '',
    durationSeconds,
    watchedSeconds,
    related,
    status: watched ? 'watched' : params.event === 'skipped' ? 'skipped' : 'watching',
    startedAt: params.previous?.startedAt ?? now,
    ...(params.event === 'ended' ? { endedAt: now } : {}),
    ...(params.event === 'skipped' ? { skippedAt: now } : {}),
  };
}

export function publicQuizQuestions(questions: YouTubeQuizQuestion[]) {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}

export function gradeYouTubeQuiz(questions: YouTubeQuizQuestion[], answers: number[]) {
  const correct = questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctOptionIndex ? 1 : 0),
    0
  );
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return {
    correct,
    total: questions.length,
    score,
    passed: questions.length > 0 && answers.length === questions.length && score >= YOUTUBE_PASS_SCORE,
    feedback: questions.map((question, index) => ({
      questionId: question.id,
      selectedOptionIndex: answers[index],
      correct: answers[index] === question.correctOptionIndex,
      explanation: question.explanation,
    })),
  };
}

export function youtubeTaskTopic(task: { topic?: string; title: string }) {
  return extractLearningTopic(task.topic || task.title);
}