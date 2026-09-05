import type { CareerTaskOpenTarget } from '@/modules/career/career.types';

export interface CareerTaskItem {
  id: string;
  missionId: string;
  title: string;
  description?: string;
  scheduledDate: string | Date;
  duration?: number;
  status: string;
  type?: string;
  openIn?: CareerTaskOpenTarget[];
  topic?: string;
  result?: { interviewId?: string; sessionId?: string; workspaceId?: string; filePath?: string; exerciseIndex?: number; calendarEventId?: string };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export type CareerTaskKind = 'notes' | 'video' | 'code' | 'interview' | 'teacher' | 'book' | 'other';

export interface CareerTaskDestination {
  id: CareerTaskOpenTarget;
  app: string;
  label: string;
}

const destinationByTarget: Record<CareerTaskOpenTarget, CareerTaskDestination> = {
  notes: { id: 'notes', app: 'Notes', label: 'Notes' },
  'ai-book': { id: 'ai-book', app: 'AI Book', label: 'AI Book' },
  interview: { id: 'interview', app: 'Start Interview', label: 'Interview' },
  vscode: { id: 'vscode', app: 'vscode', label: 'VS Code' },
  teacher: { id: 'teacher', app: 'Smarty Teacher', label: 'Teacher' },
  youtube: { id: 'youtube', app: 'Youtube', label: 'YouTube' },
  career: { id: 'career', app: 'Career', label: 'Career' },
};

export function getCareerTaskKind(task: CareerTaskItem): CareerTaskKind {
  const hint = `${task.type ?? ''} ${task.title} ${task.description ?? ''}`.toLowerCase();
  if (hint.includes('interview') || hint.includes('mock')) return 'interview';
  if (hint.includes('book') || hint.includes('read') || hint.includes('review')) return 'book';
  if (hint.includes('code') || hint.includes('coding') || hint.includes('practice') || hint.includes('problem')) return 'code';
  if (hint.includes('video') || hint.includes('youtube') || hint.includes('watch')) return 'video';
  if (hint.includes('note') || hint.includes('research')) return 'notes';
  if (task.type === 'teacher' || hint.includes('learn') || hint.includes('study') || hint.includes('concept')) return 'teacher';
  return 'other';
}

export function getCareerTaskDestinations(task: CareerTaskItem): CareerTaskDestination[] {
  if (task.openIn?.length) {
    return Array.from(new Set(task.openIn))
      .map((target) => destinationByTarget[target])
      .filter((destination): destination is CareerTaskDestination => Boolean(destination));
  }

  const inferredTarget: Record<CareerTaskKind, CareerTaskOpenTarget | undefined> = {
    notes: 'notes',
    video: 'youtube',
    code: 'vscode',
    interview: 'interview',
    teacher: 'teacher',
    book: 'ai-book',
    other: 'career',
  };
  const target = inferredTarget[getCareerTaskKind(task)];
  return target ? [destinationByTarget[target]] : [];
}

export function findCareerTaskForCalendarEvent(
  tasks: CareerTaskItem[],
  event: { _id: string; date: string; title: string }
): CareerTaskItem | undefined {
  const exactTask = tasks.find((task) => task.result?.calendarEventId === event._id);
  if (exactTask) return exactTask;

  const tasksOnDate = tasks.filter((task) => careerTaskDateKey(task.scheduledDate) === event.date);
  return tasksOnDate.find((task) => task.title.trim().toLowerCase() === event.title.trim().toLowerCase());
}

export function careerTaskLaunchArgs(task: CareerTaskItem): Record<string, unknown> {
  const args: Record<string, unknown> = {
    missionId: task.missionId,
    taskId: task.id,
    task,
    title: task.title,
    topic: task.topic || task.title,
    description: task.description,
    scheduledAt: new Date(task.scheduledDate).toISOString(),
    duration: task.duration ?? 60,
    taskType: task.type,
  };
  const kind = getCareerTaskKind(task);
  if (kind === 'code') {
    if (task.result?.workspaceId) args.workspaceId = task.result.workspaceId;
    if (task.result?.filePath) args.initialFile = task.result.filePath;
  }
  if (kind === 'interview' && task.result?.interviewId) args.interviewId = task.result.interviewId;
  if (kind === 'book') {
    args.sessionId = task.result?.sessionId ?? `career:${task.missionId}:${new Date(task.scheduledDate).toISOString().slice(0, 10)}`;
  } else if (kind === 'teacher') {
    args.sessionId = task.result?.sessionId ?? `career-task:${task.id}`;
  }
  return args;
}

export async function prepareCareerTaskLaunch(task: CareerTaskItem): Promise<Record<string, unknown>> {
  if (getCareerTaskKind(task) !== 'code') return careerTaskLaunchArgs(task);

  const response = await fetch(`/api/career/tasks/${encodeURIComponent(task.id)}/workspace`, { method: 'POST' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to prepare coding workspace');

  return careerTaskLaunchArgs({
    ...task,
    result: {
      ...(task.result || {}),
      workspaceId: result.data.id,
      filePath: result.filePath,
    },
  });
}

export type CareerTaskTimingState = 'upcoming' | 'active' | 'overdue' | 'completed';

export interface CareerTaskTiming {
  state: CareerTaskTimingState;
  label: string;
  start: Date;
  end: Date;
}

export type CareerTaskDateState = 'overdue' | 'current' | 'upcoming';

export interface CareerTaskGroup {
  dateKey: string;
  label: string;
  state: CareerTaskDateState;
  tasks: CareerTaskItem[];
}

export function careerTaskDateKey(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function compactDuration(milliseconds: number): string {
  const seconds = Math.max(1, Math.ceil(milliseconds / 1_000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function getCareerTaskTiming(task: CareerTaskItem, now = new Date()): CareerTaskTiming {
  const start = new Date(task.scheduledDate);
  const end = new Date(start.getTime() + Math.max(task.duration ?? 60, 1) * 60_000);

  if (task.status === 'completed') return { state: 'completed', label: 'Complete', start, end };
  if (now < start) return { state: 'upcoming', label: `Starts in ${compactDuration(start.getTime() - now.getTime())}`, start, end };
  if (now <= end) return { state: 'active', label: `${compactDuration(end.getTime() - now.getTime())} left`, start, end };
  return { state: 'overdue', label: `Overdue ${compactDuration(now.getTime() - end.getTime())}`, start, end };
}

export function groupCareerTasks(tasks: CareerTaskItem[], now = new Date()): CareerTaskGroup[] {
  const todayKey = careerTaskDateKey(now);
  const groups = new Map<string, CareerTaskItem[]>();

  [...tasks]
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .forEach((task) => {
      const dateKey = careerTaskDateKey(task.scheduledDate);
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), task]);
    });

  return Array.from(groups, ([dateKey, groupedTasks]) => {
    const date = new Date(groupedTasks[0].scheduledDate);
    const state: CareerTaskDateState = dateKey < todayKey ? 'overdue' : dateKey === todayKey ? 'current' : 'upcoming';
    const label = state === 'current'
      ? 'Today'
      : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return { dateKey, label, state, tasks: groupedTasks };
  });
}