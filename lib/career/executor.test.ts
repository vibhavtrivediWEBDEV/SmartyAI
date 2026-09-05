import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findPlanById: vi.fn(),
  updatePlanStep: vi.fn(),
  updatePlan: vi.fn(),
  createLearningSession: vi.fn(),
  generateLearningPlanDirect: vi.fn(),
  createWorkspace: vi.fn(),
  createCareerTeachingSession: vi.fn(),
  generateCalendarEventsDirect: vi.fn(),
  findCalendarsByUserId: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  findTasksByMission: vi.fn(),
  upsertCareerInterview: vi.fn(),
  createInterviewSession: vi.fn()
}));

vi.mock('@/modules/career/career-plan.repository', () => ({
  findPlanById: mocks.findPlanById,
  updatePlanStep: mocks.updatePlanStep,
  updatePlan: mocks.updatePlan,
  createLearningSession: mocks.createLearningSession,
  createInterviewSession: mocks.createInterviewSession
}));

vi.mock('./ai-functions', () => ({
  extractJobProfileDirect: vi.fn(),
  generateNotesDirect: vi.fn(),
  generateCalendarEventsDirect: mocks.generateCalendarEventsDirect,
  generateLearningPlanDirect: mocks.generateLearningPlanDirect,
  generateInterviewSessionDirect: vi.fn()
}));

vi.mock('@/modules/workspace/workspace.repository', () => ({
  createWorkspace: mocks.createWorkspace
}));

vi.mock('@/modules/calendar/calendar.repository', () => ({
  createCalendar: vi.fn(),
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
  findCalendarsByUserId: mocks.findCalendarsByUserId
}));

vi.mock('@/modules/interviews/interview.repository', () => ({
  upsertCareerInterview: mocks.upsertCareerInterview
}));

vi.mock('@/modules/career/career.repository', () => ({
  createTask: mocks.createTask,
  updateTask: mocks.updateTask,
  findTasksByMission: mocks.findTasksByMission,
  updateMission: vi.fn()
}));

vi.mock('@/modules/users/user.repository', () => ({
  findUserById: vi.fn()
}));

vi.mock('@/modules/profile/atsDraft.repository', () => ({
  getATSDraft: vi.fn(),
  saveATSDraft: vi.fn()
}));

vi.mock('@/lib/ats/scoring', () => ({
  generatedResumeDiagnostic: vi.fn(),
  scoreResume: vi.fn()
}));

vi.mock('@/modules/teaching/teaching.repository', () => ({
  createCareerTeachingSession: mocks.createCareerTeachingSession
}));

vi.mock('@/lib/ai/userAIContext.server', () => ({
  getUserAIContextById: vi.fn()
}));

import { careerPlanExecutor, createCareerCodingWorkspaceSpec } from './executor';

describe('Career coding workspace inference', () => {
  it.each([
    ['React popup with hooks', 'Build a JSX modal using useState.', 'react', '.jsx', true],
    ['Typed React counter', 'Implement this component in TSX.', 'react-ts', '.tsx', true],
    ['Debounce utility', 'Implement the function in plain JavaScript.', 'node', '.js', false],
    ['Typed queue', 'Implement a generic queue in TypeScript.', 'typescript', '.ts', false],
    ['Accessible profile card', 'Build semantic HTML and CSS only.', 'html', '.html', false],
  ])('maps %s to its smallest correct workspace', (title, description, runtime, suffix, hasScaffold) => {
    const spec = createCareerCodingWorkspaceSpec({ title, description });

    expect(spec.runtime).toBe(runtime);
    expect(spec.entryPoint.endsWith(suffix)).toBe(true);
    expect(spec.files.some((file) => file.path === 'package.json')).toBe(hasScaffold);
    expect(spec.files.some((file) => file.path === spec.entryPoint)).toBe(true);
  });
});

describe('CareerPlanExecutor learning artifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findPlanById.mockResolvedValue({
      steps: [{ id: 'learning', name: 'Learning', stepType: 'setup_learning' }]
    });
    mocks.generateLearningPlanDirect.mockResolvedValue({
      lessons: [{ topic: 'React rendering', concepts: ['memoization'], exercises: ['Profile a component'] }],
      codingExercises: [{ title: 'Debounced Search', difficulty: 'medium', topics: ['React'], description: 'Build a debounced search input.' }],
      topics: ['React'],
      courses: [],
      practiceProblems: []
    });
    mocks.createCareerTeachingSession.mockResolvedValue({ id: 'teacher-session-1' });
    mocks.createWorkspace.mockResolvedValue({ id: 'workspace-1' });
    mocks.createLearningSession.mockResolvedValue('learning-session-1');
    mocks.findTasksByMission.mockResolvedValue([]);
  });

  it('creates an owned preparation task for every scheduled calendar event', async () => {
    mocks.findPlanById.mockResolvedValue({
      steps: [{ id: 'schedule', name: 'Schedule', stepType: 'schedule_sessions' }]
    });
    mocks.findCalendarsByUserId.mockResolvedValue([{ _id: { toHexString: () => 'calendar-1' } }]);
    mocks.generateCalendarEventsDirect.mockResolvedValue({
      events: [{
        title: 'Practice React rendering',
        date: '2099-09-08',
        startTime: '18:00',
        endTime: '19:00',
        description: 'Complete a focused rendering exercise.',
        taskType: 'coding',
        openIn: ['vscode', 'notes', 'career', 'unknown-app'],
        duration: 60
      }]
    });
    mocks.createEvent.mockResolvedValue('event-1');

    await careerPlanExecutor.executeStep('schedule', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Frontend Engineer',
      interviewDate: new Date('2099-09-10T00:00:00.000Z'),
      jobProfile: { skillGaps: [{ skill: 'React' }], technologies: ['HTML', 'CSS', 'React'] }
    });

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      title: 'Practice React rendering',
      type: 'coding',
      openIn: ['vscode', 'notes', 'career'],
      status: 'pending'
    }));
  });

  it('moves stale AI event dates into the preparation window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2099-09-03T14:00:00.000Z'));
    mocks.findPlanById.mockResolvedValue({
      steps: [{ id: 'schedule', name: 'Schedule', stepType: 'schedule_sessions' }]
    });
    mocks.findCalendarsByUserId.mockResolvedValue([{ _id: { toHexString: () => 'calendar-1' } }]);
    mocks.generateCalendarEventsDirect.mockResolvedValue({
      events: [
        { title: 'Day 1', date: '2025-01-20', startTime: '09:00', endTime: '10:00' },
        { title: 'Day 1 evening', date: '2025-01-20', startTime: '18:00', endTime: '19:00' },
        { title: 'Day 2', date: '2025-01-21', startTime: '09:00', endTime: '10:00' }
      ]
    });

    await careerPlanExecutor.executeStep('schedule', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      interviewDate: new Date('2099-09-10T00:00:00.000Z')
    });

    expect(mocks.createEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({ date: '2099-09-03' }));
    expect(mocks.createEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ date: '2099-09-03' }));
    expect(mocks.createEvent).toHaveBeenNthCalledWith(3, expect.objectContaining({ date: '2099-09-04' }));
    vi.useRealTimers();
  });

  it('creates mock interview events as explicitly linked interview tasks', async () => {
    mocks.findPlanById.mockResolvedValue({ steps: [{ id: 'schedule', name: 'Schedule', stepType: 'schedule_sessions' }] });
    mocks.findCalendarsByUserId.mockResolvedValue([{ _id: { toHexString: () => 'calendar-1' } }]);
    mocks.generateCalendarEventsDirect.mockResolvedValue({
      events: [{ title: 'Mock Interview - Acme', date: '2099-09-08', startTime: '18:00', endTime: '19:00', description: 'Mock interview practice.' }]
    });
    mocks.createEvent.mockResolvedValue('event-1');

    await careerPlanExecutor.executeStep('schedule', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Frontend Engineer',
      interviewDate: new Date('2099-09-10T00:00:00.000Z')
    });

    expect(mocks.createTask).toHaveBeenCalledWith(expect.objectContaining({
      type: 'interview',
      result: { calendarEventId: 'event-1', scheduledAt: new Date('2099-09-08T18:00:00.000Z') }
    }));
  });

  it('updates existing preparation artifacts when scheduling is retried', async () => {
    mocks.findPlanById.mockResolvedValue({
      steps: [{ id: 'schedule', name: 'Schedule', stepType: 'schedule_sessions' }]
    });
    mocks.findCalendarsByUserId.mockResolvedValue([{ _id: { toHexString: () => 'calendar-1' } }]);
    mocks.generateCalendarEventsDirect.mockResolvedValue({
      events: [{ title: 'Practice React', date: '2099-09-08', startTime: '18:00', endTime: '19:00', description: 'Practice.' }]
    });
    mocks.findPlanById
      .mockResolvedValueOnce({ steps: [{ id: 'schedule', name: 'Schedule', stepType: 'schedule_sessions' }] })
      .mockResolvedValueOnce({ calendarEvents: { events: [{ eventId: 'event-1', title: 'Practice React' }] } });
    mocks.findTasksByMission.mockResolvedValue([{
      id: 'task-1',
      title: 'Practice React',
      scheduledDate: new Date('2099-09-01T18:00:00')
    }]);

    await careerPlanExecutor.executeStep('schedule', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Frontend Engineer',
      interviewDate: new Date('2099-09-10T00:00:00.000Z')
    });

    expect(mocks.updateEvent).toHaveBeenCalledWith('event-1', expect.objectContaining({ date: '2099-09-08' }));
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
      scheduledDate: new Date('2099-09-08T18:00:00.000Z')
    }));
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it('creates visible Teacher sessions and a coding workspace for one mission', async () => {
    const result = await careerPlanExecutor.executeStep('learning', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Frontend Engineer',
      interviewDate: new Date('2099-09-10T00:00:00.000Z'),
      jobProfile: { skillGaps: [{ skill: 'React' }] }
    });

    expect(mocks.createCareerTeachingSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: '507f1f77bcf86cd799439011',
      missionId: '507f1f77bcf86cd799439012',
      topic: 'React rendering'
    }));
    expect(mocks.createWorkspace).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.objectContaining({
        tags: ['career', 'coding-practice', '507f1f77bcf86cd799439012'],
        settings: expect.objectContaining({ runtime: 'react', entryPoint: 'src/App.jsx' }),
        files: expect.arrayContaining([
          expect.objectContaining({ path: 'package.json' }),
          expect.objectContaining({ path: 'index.html' }),
          expect.objectContaining({ path: 'src/main.jsx' }),
          expect.objectContaining({ path: 'src/styles.css' }),
          expect.objectContaining({ path: 'src/App.jsx' })
        ])
      })
    );
    const generatedWorkspace = mocks.createWorkspace.mock.calls[0][1];
    expect(generatedWorkspace.files).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'exercises/01-debounced-search.jsx' })
    ]));
    expect(generatedWorkspace.files.find((file: { path: string }) => file.path === 'src/main.jsx')?.content)
      .toContain("import App from './App';");
    expect(result).toMatchObject({
      sessionId: 'learning-session-1',
      teacherSessionIds: ['teacher-session-1'],
      workspaceId: 'workspace-1'
    });
  });

  it('persists an interview against the exact owned task and calendar event', async () => {
    const { generateInterviewSessionDirect } = await import('./ai-functions');
    mocks.findPlanById.mockResolvedValue({ steps: [{ id: 'interview', name: 'Interview', stepType: 'mock_interview' }] });
    mocks.findTasksByMission.mockResolvedValue([{
      id: '507f1f77bcf86cd799439014',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      type: 'interview',
      scheduledDate: new Date('2099-09-08T18:00:00.000Z'),
      result: { calendarEventId: 'event-1' }
    }]);
    vi.mocked(generateInterviewSessionDirect).mockResolvedValue({ questions: [{ id: 'q1', question: 'Explain React rendering.', category: 'technical' }] } as any);
    mocks.upsertCareerInterview.mockResolvedValue('507f1f77bcf86cd799439015');

    const result = await careerPlanExecutor.executeStep('interview', 'plan-1', {
      planId: 'plan-1',
      missionId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Frontend Engineer'
    });

    expect(mocks.upsertCareerInterview).toHaveBeenCalledWith(expect.objectContaining({
      careerTaskId: expect.objectContaining({}),
      calendarEventId: 'event-1',
      scheduledAt: new Date('2099-09-08T18:00:00.000Z')
    }));
    expect(mocks.updateTask).toHaveBeenCalledWith('507f1f77bcf86cd799439014', expect.objectContaining({
      result: expect.objectContaining({ interviewId: '507f1f77bcf86cd799439015', calendarEventId: 'event-1' })
    }));
    expect(result).toMatchObject({ interviewId: '507f1f77bcf86cd799439015', calendarEventId: 'event-1' });
  });
});