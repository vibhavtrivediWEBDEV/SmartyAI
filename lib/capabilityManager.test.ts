import { afterEach, describe, expect, it, vi } from 'vitest';

import capabilityManager from './capabilityManager';

describe('capabilityManager calendar permissions', () => {
  afterEach(() => {
    capabilityManager.denyCapability('calendar.write');
    capabilityManager.revokeCapability('calendar.write');
  });

  it('does not require write permission to open Calendar', () => {
    expect(capabilityManager.inferCapabilitiesForIntent('calendar.open')).not.toContain('calendar.write');
    expect(capabilityManager.inferCapabilitiesForIntent('calendar.add_event')).toContain('calendar.write');
  });

  it('clears the prompt and resumes a queued operation once after approval', async () => {
    const executor = vi.fn().mockResolvedValue(true);
    capabilityManager.requestCapabilities(['calendar.write']);
    capabilityManager.queueOperation({
      sequence: [],
      intent: 'calendar.add_event',
      requiredCapabilities: ['calendar.write'],
      executor,
    });

    capabilityManager.grantCapability('calendar.write');

    expect(capabilityManager.getPendingQueue()).not.toContainEqual(
      expect.objectContaining({ capability: 'calendar.write' }),
    );
    await vi.waitFor(() => expect(executor).toHaveBeenCalledTimes(1));
    expect(capabilityManager.getPendingOperations()).toHaveLength(0);
  });
});