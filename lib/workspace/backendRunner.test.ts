import { describe, expect, it } from 'vitest';

import { executeNode } from './backendRunner';

describe('executeNode', () => {
  it('captures console output', async () => {
    const logs = await executeNode('console.log("visible output")');

    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'log', message: 'visible output' }),
    ]));
  });

  it('invokes legacy Career solution exports', async () => {
    const logs = await executeNode('function solution() { return 42; }\nmodule.exports = { solution };');

    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'log', message: '42' }),
    ]));
  });

  it('explains successful programs with no output', async () => {
    const logs = await executeNode('const answer = 42;');

    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'warn', message: expect.stringContaining('no output') }),
    ]));
  });

  it('returns an error log when execution throws', async () => {
    const logs = await executeNode('throw new Error("boom");');

    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'error', message: expect.stringContaining('boom') }),
    ]));
  });
});