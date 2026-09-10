import { beforeEach, describe, expect, it, vi } from 'vitest';

const { bundleReact, executeNode } = vi.hoisted(() => ({
  bundleReact: vi.fn(),
  executeNode: vi.fn(),
}));

vi.mock('../utils/reactBundler', () => ({ bundleReact }));

vi.mock('./backendRunner', () => ({
  executeNode,
  executePython: vi.fn(),
  executeJava: vi.fn(),
}));

import type { WorkspaceFile, WorkspaceSettings } from '../types/workspace';
import { runWorkspace } from './runner';

function settings(runtime: WorkspaceSettings['runtime'], entryPoint: string): WorkspaceSettings {
  return { runtime, entryPoint, autoSave: true };
}

describe('runWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bundleReact.mockResolvedValue({ code: 'function App() { return null; }' });
    executeNode.mockResolvedValue([]);
  });

  it('executes the selected JavaScript exercise', async () => {
    const files: WorkspaceFile[] = [
      { path: 'first.js', content: 'console.log("first")', language: 'javascript' },
      { path: 'second.js', content: 'console.log("second")', language: 'javascript' },
    ];

    await runWorkspace(files, settings('node', 'second.js'));

    expect(executeNode).toHaveBeenCalledWith('console.log("second")', false);
  });

  it('sends the selected TypeScript file through transpilation', async () => {
    const files: WorkspaceFile[] = [
      { path: 'answer.ts', content: 'const answer: number = 42', language: 'typescript' },
    ];

    await runWorkspace(files, settings('node', 'answer.ts'));

    expect(executeNode).toHaveBeenCalledWith('const answer: number = 42', true);
  });

  it('marks backend execution errors as failed runs', async () => {
    executeNode.mockResolvedValue([{
      id: 'node-error',
      type: 'error',
      message: 'Node.js Error: boom',
      timestamp: new Date().toISOString(),
    }]);

    const result = await runWorkspace(
      [{ path: 'answer.js', content: 'throw new Error("boom")', language: 'javascript' }],
      settings('node', 'answer.js')
    );

    expect(result.error).toBe('Node.js Error: boom');
  });

  it('bundles only the selected React coding exercise', async () => {
    const files: WorkspaceFile[] = [
      { path: 'exercises/01-first.tsx', content: 'function App() { return <p>First</p> }', language: 'typescript' },
      { path: 'exercises/02-second.tsx', content: 'function App() { return <p>Second</p> }', language: 'typescript' },
    ];

    await runWorkspace(files, settings('react-ts', 'exercises/02-second.tsx'));

    expect(bundleReact).toHaveBeenCalledWith('exercises/02-second.tsx', [{
      name: 'exercises/02-second.tsx',
      content: 'function App() { return <p>Second</p> }',
    }]);
  });

  it('transforms TypeScript before executing the React preview', async () => {
    bundleReact.mockResolvedValue({
      code: 'function App(): React.ReactElement { const values = new Map<number, number>(); return <p>{values.size}</p>; }',
    });

    const result = await runWorkspace(
      [{ path: 'src/App.tsx', content: '', language: 'typescript' }],
      settings('react-ts', 'src/App.tsx')
    );

    expect(result.preview).toContain("Babel.transform(source");
    expect(result.preview).toContain("presets: ['typescript', 'react']");
    expect(result.preview).not.toContain('type="text/babel"');
  });

  it('validates SQL playground statements', async () => {
    const result = await runWorkspace(
      [{ path: 'query.sql', content: 'SELECT * FROM users;', language: 'sql' }],
      settings('sql', 'query.sql')
    );

    expect(result.error).toBeUndefined();
    expect(result.logs[0].message).toContain('1 statement');
  });

  it('rejects malformed MongoDB aggregation stages', async () => {
    const result = await runWorkspace(
      [{ path: 'pipeline.mongodb', content: '[{"match": {}}]', language: 'json' }],
      settings('mongodb', 'pipeline.mongodb')
    );

    expect(result.error).toContain('$ operator');
  });
});