import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  updateTask: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspace: vi.fn(),
  createCareerCodingWorkspaceSpec: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/modules/career/career.repository', () => ({
  findTaskByIdForUser: mocks.findTaskByIdForUser,
  updateTask: mocks.updateTask,
}));
vi.mock('@/modules/workspace/workspace.repository', () => ({
  createWorkspace: mocks.createWorkspace,
  getWorkspace: mocks.getWorkspace,
}));
vi.mock('@/lib/career/executor', () => ({
  createCareerCodingWorkspaceSpec: mocks.createCareerCodingWorkspaceSpec,
}));

import { POST } from './route';

const context = { params: Promise.resolve({ taskId: 'task-1' }) };
const task = {
  id: 'task-1',
  missionId: 'mission-1',
  type: 'coding',
  title: 'Build a React popup',
  description: 'Use React hooks and JSX.',
  result: { workspaceId: 'html-workspace', filePath: 'exercise.html' },
};
const spec = {
  name: 'Career - Build a React popup',
  description: task.description,
  runtime: 'react',
  entryPoint: 'src/App.jsx',
  files: [{ path: 'package.json', content: '{}', language: 'json' }, { path: 'src/App.jsx', content: 'export default function App() {}', language: 'javascript' }],
};

describe('career task workspace route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTaskByIdForUser.mockResolvedValue(task);
    mocks.createCareerCodingWorkspaceSpec.mockReturnValue(spec);
    mocks.createWorkspace.mockResolvedValue({ id: 'react-workspace', name: spec.name, files: spec.files });
  });

  it('upgrades a mismatched legacy HTML workspace to the inferred React workspace', async () => {
    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(201);
    expect(mocks.createWorkspace).toHaveBeenCalledWith('user-1', expect.objectContaining({
      files: spec.files,
      settings: { runtime: 'react', entryPoint: spec.entryPoint },
    }));
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', {
      result: expect.objectContaining({ workspaceId: 'react-workspace', filePath: spec.entryPoint }),
    });
  });

  it('upgrades a legacy React workspace whose component is outside src', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({
      ...task,
      result: { workspaceId: 'legacy-react-workspace', filePath: 'exercises/01-build-a-react-popup.jsx' },
    });
    mocks.getWorkspace.mockResolvedValue({
      id: 'legacy-react-workspace',
      files: [{ path: 'exercises/01-build-a-react-popup.jsx', content: '', language: 'javascript' }],
    });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(201);
    expect(mocks.createWorkspace).toHaveBeenCalled();
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', {
      result: expect.objectContaining({ workspaceId: 'react-workspace', filePath: 'src/App.jsx' }),
    });
  });

  it('upgrades an older calendar-typed task that opens in VS Code', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({
      ...task,
      type: 'calendar',
      openIn: ['vscode'],
      result: { workspaceId: 'legacy-react-workspace', filePath: 'exercises/01-build-a-react-popup.jsx' },
    });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(201);
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', {
      result: expect.objectContaining({ workspaceId: 'react-workspace', filePath: 'src/App.jsx' }),
    });
  });

  it('reuses a compatible persisted workspace without creating another one', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({ ...task, result: { workspaceId: 'react-workspace', filePath: spec.entryPoint } });
    mocks.getWorkspace.mockResolvedValue({ id: 'react-workspace', files: spec.files });

    const response = await POST(new Request('http://localhost'), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ filePath: spec.entryPoint, upgraded: false });
    expect(mocks.createWorkspace).not.toHaveBeenCalled();
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });
});
