import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCareerProgress } from '../../lib/career/progressRequest';

describe('loadCareerProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deduplicates concurrent and immediate repeated mission reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      missionId: 'mission-dedupe',
      status: 'completed',
      overallProgress: 100,
      steps: []
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const requests = await Promise.all([
      loadCareerProgress('mission-dedupe'),
      loadCareerProgress('mission-dedupe'),
      loadCareerProgress('mission-dedupe'),
      loadCareerProgress('mission-dedupe'),
      loadCareerProgress('mission-dedupe'),
      loadCareerProgress('mission-dedupe')
    ]);
    const cached = await loadCareerProgress('mission-dedupe');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(6);
    expect(cached?.overallProgress).toBe(100);
  });
});