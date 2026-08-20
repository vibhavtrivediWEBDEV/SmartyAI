// API: Grant Permission for Current Step
// POST /api/file-search/grant-permission
// Body: { "operationId": "search-xxx" }
// Returns: { "success": true, "status": "searching" }

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

    console.log('\n' + '✅'.repeat(80));
    console.log('🔐 [API] GRANT PERMISSION');
    console.log(`   Operation ID: ${operationId}`);
    console.log('✅'.repeat(80) + '\n');

    // Grant permission (triggers search in current location)
    await fileSearchOrchestrator.grantPermission(operationId);

    const state = fileSearchOrchestrator.getState();
    const operation = state.currentOperation;

    return NextResponse.json({
      success: true,
      operationId,
      status: operation?.status || 'running',
      message: 'Permission granted. Search started.',
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
