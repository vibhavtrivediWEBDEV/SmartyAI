import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findMissionById: vi.fn(),
  findMissionsByUserId: vi.fn(),
  findPlanByMission: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/modules/career/career.repository', () => ({ findMissionById: mocks.findMissionById, findMissionsByUserId: mocks.findMissionsByUserId }));
vi.mock('@/modules/career/career-plan.repository', () => ({ findPlanByMission: mocks.findPlanByMission }));

import { GET } from './route';

describe('career resources route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects another owner mission without reading its plan', async () => {
    mocks.getSessionUserId.mockResolvedValue('owner-a');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-1', userId: 'owner-b' });
    const response = await GET(new Request('http://localhost/api/career/resources?missionId=mission-1'));
    expect(response.status).toBe(404);
    expect(mocks.findPlanByMission).not.toHaveBeenCalled();
  });

  it('returns the exact owned mission playlist', async () => {
    mocks.getSessionUserId.mockResolvedValue('owner-a');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-2', userId: 'owner-a' });
    mocks.findPlanByMission.mockResolvedValue({ learningResources: { youtubeResources: [{ title: 'React', searchQuery: 'React interview', url: 'https://www.youtube.com/results?search_query=React' }] } });
    const response = await GET(new Request('http://localhost/api/career/resources?missionId=mission-2'));
    expect(await response.json()).toMatchObject({ missionId: 'mission-2', youtubeResources: [{ searchQuery: 'React interview' }] });
    expect(mocks.findPlanByMission).toHaveBeenCalledWith('mission-2');
  });

  it('groups persisted playlists for every owned mission', async () => {
    mocks.getSessionUserId.mockResolvedValue('owner-a');
    mocks.findMissionsByUserId.mockResolvedValue([{ id: 'm1', userId: 'owner-a', company: 'Acme', role: 'Engineer' }, { id: 'm2', userId: 'owner-a', company: 'Beta', role: 'Designer' }]);
    mocks.findPlanByMission.mockImplementation(async (id) => ({ learningResources: { youtubeResources: [{ title: id, searchQuery: `${id} search`, url: `https://youtube.test/${id}` }] } }));
    const response = await GET(new Request('http://localhost/api/career/resources'));
    const body = await response.json();
    expect(body.playlists).toHaveLength(2);
    expect(body.playlists[1]).toMatchObject({ missionId: 'm2', title: 'Beta Designer', youtubeResources: [{ searchQuery: 'm2 search' }] });
  });
});