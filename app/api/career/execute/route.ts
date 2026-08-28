import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSessionUserId } from '@/lib/auth/session';
import * as careerPlanRepo from '@/modules/career/career-plan.repository';
import * as careerMissionRepo from '@/modules/career/career.repository';
import { careerPlanExecutor } from '@/lib/career/executor';
import { CAREER_PLAN_STEPS } from '@/lib/career/types';

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
      interviewDate: mission.interviewDate
    };
    
    // Execute each step
    const executionResults = [];
    for (const step of plan.steps) {
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
    
    return NextResponse.json({
      success: true,
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
