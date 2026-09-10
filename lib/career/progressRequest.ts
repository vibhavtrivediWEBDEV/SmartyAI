const PROGRESS_CACHE_TTL_MS = 2_000;
const progressRequests = new Map<string, Promise<unknown | null>>();
const progressCache = new Map<string, { data: unknown | null; expiresAt: number }>();

export async function loadCareerProgress<T>(missionId: string): Promise<T | null> {
  const cached = progressCache.get(missionId);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T | null;

  const pending = progressRequests.get(missionId);
  if (pending) return pending as Promise<T | null>;

  const request = fetch(`/api/career/execute/progress?missionId=${missionId}`, {
    cache: 'no-store',
  }).then(async (response) => {
    if (!response.ok) throw new Error('Failed to load plan');

    const data = await response.json() as T & { steps?: unknown[] };
    const plan = data.steps ? data : null;
    progressCache.set(missionId, {
      data: plan,
      expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
    });
    return plan;
  }).finally(() => {
    progressRequests.delete(missionId);
  });

  progressRequests.set(missionId, request);
  return request;
}