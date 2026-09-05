import { describe, expect, it } from 'vitest';

import { resolveSequence } from './helper/helper';
import { resolveUserIntent } from './resolveUserIntent';

describe.each([
  { app: 'telegram', target: 'Telegram' },
  { app: 'whatsapp', target: 'Messages' },
])('$app open intent', ({ app, target }) => {
  it.each([
    { command: app, action: 'open' },
    { command: `open ${app}`, action: 'open' },
    { command: `close ${app}`, action: 'close' },
  ])('resolves "$command" to the registered desktop app', async ({ command, action }) => {
    const resolved = await resolveUserIntent(command);
    const sequence = resolveSequence(resolved.intent, resolved.parameters);

    expect(resolved.intent).toBe(`${app}.${action}`);
    expect(sequence).toHaveLength(1);
    expect(sequence[0]).toMatchObject({ action, target });
  });
});

describe('unknown app commands', () => {
  it.each(['open rta', 'close rta'])('rejects "%s" with the confusion reaction', async (command) => {
    const result = await resolveUserIntent(command);

    expect(result).toMatchObject({
      intent: 'system.unknown_app',
      parameters: {
        appName: 'rta',
        message: 'Aayein (What?)',
        reactionSound: 'aayein-meme',
      },
      confidence: 'high',
    });
  });
});