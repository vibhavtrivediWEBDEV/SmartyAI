import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db/mongodb';
import { CAREER_PLAN_STEPS } from '@/lib/career/types';
import type { CareerPlan, PlanStep } from '@/lib/career/types';

// GET /api/career/plan?missionId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    
    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID required' }, { status: 400 });
    }
    
    const db = await getDatabase();
    const plan = await db.collection('career_plans').findOne({ 
      missionId: new ObjectId(missionId) 
    });
    
    if (!plan) {
      return NextResponse.json({ 
        plan: null,
        message: 'No plan found for this mission' 
      });
    }
    
    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error('Error fetching career plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/career/plan - Create new career plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missionId, userId, jobDescription, userResume } = body;
    
    if (!missionId || !userId) {
      return NextResponse.json({ error: 'Mission ID and User ID required' }, { status: 400 });
    }
    
    const db = await getDatabase();
    
    // Check if plan already exists
    const existingPlan = await db.collection('career_plans').findOne({
      missionId: new ObjectId(missionId)
    });
    
    if (existingPlan) {
      return NextResponse.json({ 
        plan: existingPlan,
        message: 'Plan already exists' 
      });
    }
    
    // Create new plan with initial steps
    const steps: PlanStep[] = CAREER_PLAN_STEPS.map((step, index) => ({
      id: new ObjectId().toString(),
      ...step,
      status: 'pending' as const,
      progress: 0
    }));
    
    const newPlan: CareerPlan = {
      missionId: new ObjectId(missionId),
      userId,
      status: 'planning',
      overallProgress: 0,
      steps,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('career_plans').insertOne(newPlan);
    
    // Update mission status
    await db.collection('career_missions').updateOne(
      { _id: new ObjectId(missionId) },
      { 
        $set: { 
          hasPlan: true,
          planId: result.insertedId,
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({ 
      plan: { ...newPlan, _id: result.insertedId },
      message: 'Career plan created successfully'
    });
  } catch (error: any) {
    console.error('Error creating career plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/career/plan - Update plan step
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, stepId, status, progress, output } = body;
    
    if (!planId || !stepId) {
      return NextResponse.json({ error: 'Plan ID and Step ID required' }, { status: 400 });
    }
    
    const db = await getDatabase();
    
    // Find the plan
    const plan = await db.collection('career_plans').findOne({
      _id: new ObjectId(planId)
    });
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Update specific step
    const updatedSteps = plan.steps.map((step: PlanStep) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: status || step.status,
          progress: progress !== undefined ? progress : step.progress,
          output: output || step.output,
          startedAt: status === 'in_progress' ? new Date() : step.startedAt,
          completedAt: status === 'completed' ? new Date() : step.completedAt
        };
      }
      return step;
    });
    
    // Calculate overall progress
    const completedSteps = updatedSteps.filter((s: PlanStep) => s.status === 'completed').length;
    const overallProgress = Math.round((completedSteps / updatedSteps.length) * 100);
    
    // Update plan
    await db.collection('career_plans').updateOne(
      { _id: new ObjectId(planId) },
      {
        $set: {
          steps: updatedSteps,
          overallProgress,
          status: overallProgress === 100 ? 'completed' : 'in_progress',
          updatedAt: new Date()
        }
      }
    );
    
    // Update mission progress
    await db.collection('career_missions').updateOne(
      { _id: plan.missionId },
      {
        $set: {
          progress: overallProgress,
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({ 
      success: true,
      plan: {
        ...plan,
        steps: updatedSteps,
        overallProgress
      }
    });
  } catch (error: any) {
    console.error('Error updating career plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
