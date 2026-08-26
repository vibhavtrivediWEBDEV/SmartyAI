import { NextRequest, NextResponse } from 'next/server';
import { findLogsByMissionId } from '@/modules/career/career.repository';

/**
 * GET /api/career/logs
 * Fetch career agent activity logs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const missionId = searchParams.get('missionId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let logs;

    if (missionId) {
      // Fetch logs for specific mission
      logs = await findLogsByMissionId(missionId);
    } else if (userId) {
      // Fetch logs for user's recent missions
      const { findActiveMissions } = await import('@/modules/career/career.repository');
      const missions = await findActiveMissions(userId);
      const missionIds = missions.map(m => m._id.toString());
      
      // Fetch logs for all user missions
      const { db } = await import('@/lib/db/mongodb');
      const database = await db();
      
      logs = await database
        .collection('career_agent_logs')
        .find({ missionId: { $in: missionIds } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } else {
      return NextResponse.json(
        { error: 'missionId or userId required' },
        { status: 400 }
      );
    }

    // Format logs for display
    const formattedLogs = logs.map(log => ({
      timestamp: log.timestamp || new Date(),
      action: log.action || 'Unknown Action',
      details: log.details || '',
      status: log.status || 'info',
      missionId: log.missionId?.toString() || missionId
    }));

    return NextResponse.json({
      logs: formattedLogs,
      count: formattedLogs.length
    });

  } catch (error: any) {
    console.error('[Career Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', message: error.message },
      { status: 500 }
    );
  }
}
