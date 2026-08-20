// API: Cancel File Search
// POST /api/file-search/cancel
// Body: { "operationId": "search-xxx" }
// Returns: { "success": true, "message": "Search cancelled" }

import { NextRequest, NextResponse } from 'next/server';
import { fileSearchOrchestrator } from '@/lib/fileSearchOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationId } = body;

    if (!operationId) {
      return NextResponse.json({
        success: false,
        error: 'operationId is required'
      }, { status: 400 });
    }

    console.log('\n' + '🚫'.repeat(80));
    console.log('❌ [API] CANCEL SEARCH');
    console.log(`   Operation ID: ${operationId}`);
    console.log('🚫'.repeat(80) + '\n');

    // Cancel operation
    fileSearchOrchestrator.cancelOperation(operationId);

    return NextResponse.json({
      success: true,
      operationId,
      status: 'cancelled',
      message: 'Search cancelled successfully'
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
