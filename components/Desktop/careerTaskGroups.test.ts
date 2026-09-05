import { describe, expect, it } from 'vitest';
import { careerTaskLaunchArgs, findCareerTaskForCalendarEvent, getCareerTaskDestinations, getCareerTaskKind, getCareerTaskTiming, groupCareerTasks, type CareerTaskItem } from './careerTaskGroups';

describe('groupCareerTasks', () => {
  it('sorts and groups tasks into overdue, current, and upcoming dates', () => {
    const tasks = [
      { id: '3', scheduledDate: '2026-09-05T12:00:00', title: 'Future' },
      { id: '1', scheduledDate: '2026-09-02T12:00:00', title: 'Past' },
      { id: '2', scheduledDate: '2026-09-03T18:00:00', title: 'Today' }
    ].map((task) => ({ ...task, missionId: 'mission', status: 'pending' })) as CareerTaskItem[];

    const groups = groupCareerTasks(tasks, new Date('2026-09-03T09:00:00'));

    expect(groups.map((group) => [group.state, group.tasks[0].id])).toEqual([
      ['overdue', '1'],
      ['current', '2'],
      ['upcoming', '3']
    ]);
    expect(groups[1].label).toBe('Today');
  });

  it('returns no groups for an empty task list', () => {
    expect(groupCareerTasks([])).toEqual([]);
  });

  it.each([
    ['upcoming', 'Starts in 30m', 'pending', '2026-09-03T10:00:00'],
    ['active', '30m left', 'running', '2026-09-03T09:00:00'],
    ['overdue', 'Overdue 30m', 'pending', '2026-09-03T08:00:00'],
    ['completed', 'Complete', 'completed', '2026-09-03T08:00:00'],
  ])('derives %s timing for a scheduled task', (state, label, status, scheduledDate) => {
    const task: CareerTaskItem = {
      id: 'task',
      missionId: 'mission',
      title: 'Practice',
      scheduledDate,
      duration: 60,
      status,
    };

    expect(getCareerTaskTiming(task, new Date('2026-09-03T09:30:00'))).toMatchObject({ state, label });
  });

  it('builds exact teacher launch context from the scheduled task', () => {
    const task: CareerTaskItem = {
      id: 'teacher-1',
      missionId: 'mission-1',
      title: 'System design fundamentals',
      topic: 'Distributed caching',
      type: 'teacher',
      scheduledDate: '2026-09-03T09:00:00.000Z',
      duration: 45,
      status: 'pending',
    };

    expect(getCareerTaskKind(task)).toBe('teacher');
    expect(careerTaskLaunchArgs(task)).toMatchObject({
      taskId: 'teacher-1',
      missionId: 'mission-1',
      title: 'System design fundamentals',
      topic: 'Distributed caching',
      scheduledAt: '2026-09-03T09:00:00.000Z',
      duration: 45,
      taskType: 'teacher',
      sessionId: 'career-task:teacher-1',
      task,
    });
  });

  it('never substitutes a career task ID for an interview ID', () => {
    const task: CareerTaskItem = {
      id: 'interview-task',
      missionId: 'mission-1',
      title: 'Mock interview',
      type: 'interview',
      scheduledDate: '2026-09-03T09:00:00.000Z',
      status: 'pending',
    };

    expect(careerTaskLaunchArgs(task)).not.toHaveProperty('interviewId');
    expect(careerTaskLaunchArgs({ ...task, result: { interviewId: 'interview-record' } })).toMatchObject({ interviewId: 'interview-record' });
  });

  it('passes generated workspace and file identity for coding tasks', () => {
    const task: CareerTaskItem = {
      id: 'coding-task',
      missionId: 'mission-1',
      title: 'React hooks practice',
      type: 'coding',
      scheduledDate: '2026-09-03T09:00:00.000Z',
      status: 'pending',
      result: { workspaceId: 'workspace-1', filePath: 'exercises/02-react-hooks.tsx', exerciseIndex: 1 },
    };

    expect(careerTaskLaunchArgs(task)).toMatchObject({
      workspaceId: 'workspace-1',
      initialFile: 'exercises/02-react-hooks.tsx',
    });
  });

  it('matches a Calendar event to its exact persisted task ID', () => {
    const tasks = [
      { id: 'wrong-task', missionId: 'mission-1', title: 'Same title', scheduledDate: '2026-09-04T09:00:00.000Z', status: 'pending', result: { calendarEventId: 'event-1' } },
      { id: 'selected-task', missionId: 'mission-1', title: 'Same title', scheduledDate: '2026-09-04T11:00:00.000Z', status: 'pending', result: { calendarEventId: 'event-2' } },
    ] satisfies CareerTaskItem[];

    expect(findCareerTaskForCalendarEvent(tasks, { _id: 'event-2', date: '2026-09-04', title: 'Same title' })?.id).toBe('selected-task');
  });

  it('uses every explicit app target and removes duplicates', () => {
    const task: CareerTaskItem = {
      id: 'multi-tool-task',
      missionId: 'mission-1',
      title: 'Review React and implement an exercise',
      type: 'coding',
      openIn: ['notes', 'ai-book', 'vscode', 'career', 'vscode'],
      scheduledDate: '2026-09-03T09:00:00.000Z',
      status: 'pending',
    };

    expect(getCareerTaskDestinations(task)).toEqual([
      { id: 'notes', app: 'Notes', label: 'Notes' },
      { id: 'ai-book', app: 'AI Book', label: 'AI Book' },
      { id: 'vscode', app: 'vscode', label: 'VS Code' },
      { id: 'career', app: 'Career', label: 'Career' },
    ]);
  });

  it('infers one app for tasks created before openIn was added', () => {
    const task: CareerTaskItem = {
      id: 'legacy-task',
      missionId: 'mission-1',
      title: 'Practice TypeScript',
      scheduledDate: '2026-09-03T09:00:00.000Z',
      status: 'pending',
    };

    expect(getCareerTaskDestinations(task)).toEqual([
      { id: 'vscode', app: 'vscode', label: 'VS Code' },
    ]);
  });
});