/**
 * Career Mission API Routes
 * 
 * RESTful endpoints for Career Agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import * as careerRepository from '@/modules/career/career.repository';

/**
 * GET /api/career/mission
 * Get all missions for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const missionId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    
    if (missionId) {
      // Get single mission
      const mission = await careerRepository.findMissionById(missionId);
      
      if (!mission || mission.userId !== userId) {
        return NextResponse.json(
          { error: 'Mission not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ mission });
    } else {
      const missions = status === 'active'
        ? (await careerRepository.findActiveMissions(userId)).slice(0, 1)
        : await careerRepository.findMissionsByUserId(userId);
      
      return NextResponse.json({ missions });
    }
    
  } catch (error: any) {
    console.error('Get mission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get missions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/career/mission
 * Create new career mission
 * 
 * CRITICAL: Prevents duplicate missions and enforces one active mission per user
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { company, role, jobDescription, interviewDate, priority } = body;
    
    if (!company || !role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      );
    }
    
    if (!interviewDate) {
      return NextResponse.json(
        { error: 'Interview date is required' },
        { status: 400 }
      );
    }
    
    // Check for existing active missions
    const activeMissions = await careerRepository.findActiveMissions(userId);
    
    // If there are active missions, check date overlap
    const newInterviewDate = new Date(interviewDate);
    const existingOverlap = activeMissions.find(mission => {
      const missionDate = new Date(mission.interviewDate);
      const timeDiff = Math.abs(missionDate.getTime() - newInterviewDate.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff < 30; // Overlap if within 30 days
    });
    
    if (existingOverlap) {
      // Cancel existing mission and create new one
      await careerRepository.updateMission(existingOverlap.id, { status: 'CANCELLED' });
      console.log(`[CAREER API] Cancelled overlapping mission: ${existingOverlap.id}`);
    }
    
    // Cancel all other active missions (only one active at a time)
    await Promise.all(
      activeMissions
        .filter(m => m.id !== existingOverlap?.id && m.status !== 'CANCELLED')
        .map(m => careerRepository.updateMission(m.id, { status: 'CANCELLED' }))
    );
    
    // Create mission using repository directly
    const missionId = await careerRepository.createCareerMission({
      userId,
      company,
      role,
      jobDescription,
      interviewDate: newInterviewDate,
      status: 'CREATED',
      priority: priority || 'medium',
      progress: 0
    });
    
    // Get the created mission
    const mission = await careerRepository.findMissionById(missionId);
    
    if (!mission) {
      return NextResponse.json(
        { error: 'Failed to create mission' },
        { status: 500 }
      );
    }
    
    console.log(`[CAREER API] Mission created: ${missionId} for user ${userId}`);
    console.log(`[CAREER API] Company: ${company}, Role: ${role}, Date: ${interviewDate}`);
    
    // Don't start Career Agent automatically - let user control flow
    // Apps will be opened by the Career App UI
    
    return NextResponse.json({
      success: true,
      mission,
      message: 'Career mission created successfully'
    });
    
  } catch (error: any) {
    console.error('Create mission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create mission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/career/mission
 * Update career mission
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { missionId, interviewDate, ...otherUpdates } = body;
    
    if (!missionId) {
      return NextResponse.json(
        { error: 'Mission ID is required' },
        { status: 400 }
      );
    }
    
    // Verify mission belongs to user
    const mission = await careerRepository.findMissionById(missionId);
    
    if (!mission || mission.userId !== userId) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Prepare updates object
    const updates: any = { ...otherUpdates };
    if (interviewDate) {
      updates.interviewDate = new Date(interviewDate);
    }
    
    // Update mission
    await careerRepository.updateMission(missionId, updates);
    
    const updatedMission = await careerRepository.findMissionById(missionId);
    
    return NextResponse.json({
      success: true,
      mission: updatedMission
    });
    
  } catch (error: any) {
    console.error('Update mission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update mission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/career/mission
 * Delete career mission
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const missionId = url.searchParams.get('id');
    
    if (!missionId) {
      return NextResponse.json(
        { error: 'Mission ID is required' },
        { status: 400 }
      );
    }
    
    // Verify mission belongs to user
    const mission = await careerRepository.findMissionById(missionId);
    
    if (!mission || mission.userId !== userId) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Delete mission
    await careerRepository.deleteMission(missionId);
    
    return NextResponse.json({
      success: true,
      message: 'Mission deleted'
    });
    
  } catch (error: any) {
    console.error('Delete mission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete mission' },
      { status: 500 }
    );
  }
}
