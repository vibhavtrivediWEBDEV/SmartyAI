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
      // Get all missions for user
      const missions = await careerRepository.findMissionsByUserId(userId);
      
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
    
    // Create mission using repository directly
    const missionId = await careerRepository.createCareerMission({
      userId,
      company,
      role,
      jobDescription,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
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
    
    // Start Career Agent in background
    // Don't await - let it run asynchronously
    import('@/lib/career').then(({ startCareerAgent }) => {
      startCareerAgent(missionId, userId).catch(err => {
        console.error('Career Agent start failed:', err);
      });
    });
    
    return NextResponse.json({
      success: true,
      mission,
      message: 'Career mission created. Agent starting...'
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
    const { missionId, updates } = body;
    
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
