// API: Deny Permission (Skip to Next Location)
// POST /api/file-search/deny-permission
// Body: { "operationId": "search-xxx" }
// Returns: { "success": true, "status": "awaiting_permission" }

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

    console.log('\n' + '⛔'.repeat(80));
    console.log('🚫 [API] DENY PERMISSION');
    console.log(`   Operation ID: ${operationId}`);
    console.log('⛔'.repeat(80) + '\n');

    // Deny permission (skips to next location)
    fileSearchOrchestrator.denyPermission(operationId);

    const state = fileSearchOrchestrator.getState();
    const operation = state.currentOperation;

    return NextResponse.json({
      success: true,
      operationId,
      status: operation?.status || 'pending',
      message: 'Permission denied. Skipped to next location.',
      nextStep: `GET /api/file-search/status?operationId=${operationId}`
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
