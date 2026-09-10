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

    // 🚀 PERFORMANCE: Execute steps in parallel where possible
    // Independent steps (analyze_profile, generate_notes) run first
    // Dependent steps (setup_learning, schedule_sessions, mock_interview) run after

    const executionResults: Array<{
      stepId: string;
      stepName: string;
      status: string;
      reused?: boolean;
      output?: unknown;
      error?: string;
    }> = plan.steps
      .filter((step) => step.status === 'completed')
      .map((step) => ({
        stepId: step.id,
        stepName: step.name,
        status: 'completed',
        reused: true,
        output: step.output
      }));

    // Phase 1: Analyze profile (must complete first)
    const analyzeStep = plan.steps.find(s => s.stepType === 'analyze_profile');
    if (analyzeStep && analyzeStep.status !== 'completed') {
      try {
        const output = await careerPlanExecutor.executeStep(
          analyzeStep.id,
          plan._id!.toString(),
          context
        );
        executionResults.push({
          stepId: analyzeStep.id,
          stepName: analyzeStep.name,
          status: 'completed',
          output
        });

        // Update context with job profile
        context.jobProfile = {
          ...(output.jobProfile || {}),
          skillGaps: output.skillGaps || []
        };
        context.userProfile = output.userProfile || context.userProfile;

        // Emit progress
        const currentPlan = await careerPlanRepo.findPlanById(plan._id!.toString());
        emitCareerProgress(userId, {
          missionId,
          reason: 'plan',
          progress: currentPlan?.overallProgress || 0
        });
      } catch (error: any) {
        executionResults.push({
          stepId: analyzeStep.id,
          stepName: analyzeStep.name,
          status: 'failed',
          error: error.message
        });
        // Stop if profile analysis fails
        await careerMissionRepo.updateMission(missionId, { status: 'FAILED' });
        return NextResponse.json({
          success: false,
          plan: await careerPlanRepo.findPlanById(plan._id!.toString()),
          executionResults,
          message: 'Career plan execution failed at profile analysis'
        }, { status: 500 });
      }
    }

    // Phase 2: Run independent steps in parallel (generate_notes, setup_learning)
    const parallelSteps = plan.steps.filter(s =>
      ['generate_notes', 'setup_learning'].includes(s.stepType) && s.status !== 'completed'
    );

    if (parallelSteps.length > 0) {
      const parallelResults = await Promise.allSettled(
        parallelSteps.map(async (step) => {
          const output = await careerPlanExecutor.executeStep(
            step.id,
            plan._id!.toString(),
            context
          );
          return { step, output };
        })
      );

      parallelResults.forEach((result, index) => {
        const step = parallelSteps[index];
        if (result.status === 'fulfilled') {
          executionResults.push({
            stepId: step.id,
            stepName: step.name,
            status: 'completed',
            output: result.value.output
          });
        } else {
          executionResults.push({
            stepId: step.id,
            stepName: step.name,
            status: 'failed',
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          });
        }
      });

      // Emit progress
      const currentPlan = await careerPlanRepo.findPlanById(plan._id!.toString());
      emitCareerProgress(userId, {
        missionId,
        reason: 'resources',
        progress: currentPlan?.overallProgress || 0
      });
    }

    // Phase 3: Run remaining dependent steps in parallel
    const dependentSteps = plan.steps.filter(s =>
      ['schedule_sessions', 'mock_interview'].includes(s.stepType) && s.status !== 'completed'
    );

    if (dependentSteps.length > 0) {
      const dependentResults = await Promise.allSettled(
        dependentSteps.map(async (step) => {
          const output = await careerPlanExecutor.executeStep(
            step.id,
            plan._id!.toString(),
            context
          );
          return { step, output };
        })
      );

      dependentResults.forEach((result, index) => {
        const step = dependentSteps[index];
        if (result.status === 'fulfilled') {
          executionResults.push({
            stepId: step.id,
            stepName: step.name,
            status: 'completed',
            output: result.value.output
          });
        } else {
          executionResults.push({
            stepId: step.id,
            stepName: step.name,
            status: 'failed',
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          });
        }
      });
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
