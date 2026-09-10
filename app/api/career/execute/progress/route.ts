import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import * as careerPlanRepo from '@/modules/career/career-plan.repository';
import * as careerMissionRepo from '@/modules/career/career.repository';

/**
 * GET /api/career/execute/progress?missionId=xxx
 * 
 * Get execution progress for a career mission
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    
    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID required' }, { status: 400 });
    }
    
    // Get mission details
    const mission = await careerMissionRepo.findMissionById(missionId);
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (mission.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const [plan, preparationTasks] = await Promise.all([
      careerPlanRepo.findPlanByMission(missionId),
      careerMissionRepo.findTasksByMission(missionId)
    ]);
    const completedTasks = preparationTasks.filter((task) => task.status === 'completed').length;
    const learnerProgress = preparationTasks.length > 0
      ? Math.round((completedTasks / preparationTasks.length) * 100)
      : 0;
    
    if (!plan) {
      // No plan yet - return initial state
      return NextResponse.json({
        missionId,
        status: 'not_started',
        overallProgress: 0,
        steps: []
      });
    }
    
    // Return plan progress
    return NextResponse.json({
      missionId,
      planId: plan._id,
      status: plan.status,
      overallProgress: plan.overallProgress,
      steps: plan.steps,
      userProfile: plan.userProfile,
      generatedNotes: plan.generatedNotes,
      calendarEvents: plan.calendarEvents,
      learningResources: plan.learningResources,
      preparationTasks,
      learnerProgress,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    });
    
  } catch (error: any) {
    console.error('[Career Execute Progress] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
