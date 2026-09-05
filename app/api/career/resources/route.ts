import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { findMissionById, findMissionsByUserId } from '@/modules/career/career.repository';
import { findPlanByMission } from '@/modules/career/career-plan.repository';

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const missionId = new URL(request.url).searchParams.get('missionId');
  if (missionId) {
    const mission = await findMissionById(missionId);
    if (!mission || mission.userId !== userId) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    const plan = await findPlanByMission(missionId);
    return NextResponse.json({ missionId, youtubeResources: plan?.learningResources?.youtubeResources || [] });
  }

  const missions = await findMissionsByUserId(userId);
  const playlists = (await Promise.all(missions.map(async (mission) => {
    const plan = await findPlanByMission(mission.id);
    return {
      missionId: mission.id,
      title: `${mission.company || ''} ${mission.role || 'Career'}`.trim(),
      youtubeResources: plan?.learningResources?.youtubeResources || [],
    };
  }))).filter((playlist) => playlist.youtubeResources.length > 0);
  return NextResponse.json({ playlists });
}