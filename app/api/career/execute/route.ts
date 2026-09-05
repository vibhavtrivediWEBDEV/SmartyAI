import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSessionUserId } from '@/lib/auth/session';
import * as careerPlanRepo from '@/modules/career/career-plan.repository';
import * as careerMissionRepo from '@/modules/career/career.repository';
import { careerPlanExecutor } from '@/lib/career/executor';
import { CAREER_PLAN_STEPS } from '@/lib/career/types';
import { emitCareerProgress } from '../../../../lib/career/careerEvents';

// POST /api/career/execute - Execute career plan steps
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { missionId } = body;
    
    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID required' }, { status: 400 });
    }
    
    // Get mission details
    const mission = await careerMissionRepo.findMissionById(missionId);
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    // Verify user owns this mission
    if (mission.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get or create plan
    let plan = await careerPlanRepo.findPlanByMission(missionId);
    
    if (!plan) {
      // Create new plan with initial steps
      const steps = CAREER_PLAN_STEPS.map((step, index) => ({
        id: new ObjectId().toString(),
        ...step,
        order: index + 1,
        status: 'pending' as const,
        progress: 0
      }));
      
      plan = await careerPlanRepo.createPlan({
        missionId: new ObjectId(missionId) as any,
        userId,
        status: 'planning',
        overallProgress: 0,
        steps,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Execute steps one by one
    const context = {
      planId: plan._id!.toString(),
      missionId: missionId,
      userId: mission.userId,
      company: mission.company,
      role: mission.role,
      jobDescription: mission.jobDescription,
      interviewDate: mission.interviewDate,
      jobProfile: (plan as any).jobProfile,
      userProfile: plan.userProfile
    };

    await careerMissionRepo.updateMission(missionId, { status: 'EXECUTING' });
    emitCareerProgress(userId, { missionId, reason: 'mission', progress: 0 });
    
    // Execute each step
    const executionResults = [];
    for (const step of plan.steps) {
      if (step.status === 'completed') {
        executionResults.push({
          stepId: step.id,
          stepName: step.name,
          status: 'completed',
          output: step.output,
          reused: true
        });
        continue;
      }

      try {
        const output = await careerPlanExecutor.executeStep(
          step.id, 
          plan._id!.toString(), 
          context
        );
        executionResults.push({
          stepId: step.id,
          stepName: step.name,
          status: 'completed',
          output
        });
        const currentPlan = await careerPlanRepo.findPlanById(plan._id!.toString());
        emitCareerProgress(userId, {
          missionId,
          reason: step.stepType === 'setup_learning' ? 'resources' : 'plan',
          progress: currentPlan?.overallProgress || 0
        });

        if (step.stepType === 'analyze_profile') {
          context.jobProfile = {
            ...(output.jobProfile || {}),
            skillGaps: output.skillGaps || []
          };
          context.userProfile = output.userProfile || context.userProfile;
        }
      } catch (error: any) {
        executionResults.push({
          stepId: step.id,
          stepName: step.name,
          status: 'failed',
          error: error.message
        });
        break; // Stop execution on failure
      }
    }
    
    // Get updated plan
    const updatedPlan = await careerPlanRepo.findPlanById(plan._id!.toString());
    const completed = updatedPlan?.overallProgress === 100;

    await careerMissionRepo.updateMission(missionId, {
      status: completed ? 'READY' : 'FAILED',
      progress: completed ? 0 : updatedPlan?.overallProgress || 0
    });
    emitCareerProgress(userId, {
      missionId,
      reason: 'mission',
      progress: updatedPlan?.overallProgress || 0
    });
    
    return NextResponse.json({
      success: completed,
      plan: updatedPlan,
      executionResults,
      message: 'Career plan execution completed'
    });
  } catch (error: any) {
    console.error('Error executing career plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/career/execute/progress?missionId=xxx
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
    
    const plan = await careerPlanRepo.findPlanByMission(missionId);
    
    if (!plan) {
      return NextResponse.json({ plan: null, message: 'No plan found' });
    }
    
    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Error fetching plan progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
