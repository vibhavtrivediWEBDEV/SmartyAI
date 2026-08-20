// API: Get File Search Status
// GET /api/file-search/status?operationId=search-xxx
// Returns: { "status": "awaiting_permission", "currentStep": {...}, "foundFiles": [...] }

import { NextRequest, NextResponse } from 'next/server';
import { fileSearchOrchestrator } from '@/lib/fileSearchOrchestrator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json({
        success: false,
        error: 'operationId query parameter is required'
      }, { status: 400 });
    }

    const state = fileSearchOrchestrator.getState();
    const operation = state.queue.find(op => op.id === operationId) || 
                      (state.currentOperation?.id === operationId ? state.currentOperation : null);

    if (!operation) {
      return NextResponse.json({
        success: false,
        error: 'Operation not found'
      }, { status: 404 });
    }

    const currentStep = operation.steps[operation.currentStepIndex];

    return NextResponse.json({
      success: true,
      operationId: operation.id,
      status: operation.status,
      currentStepIndex: operation.currentStepIndex,
      currentStep: currentStep ? {
        location: currentStep.location,
        status: currentStep.status,
        permissionGranted: currentStep.permissionGranted,
        humanLog: currentStep.humanLog,
        resultsCount: currentStep.results?.length || 0
      } : null,
      foundFiles: operation.allResults || [],
      topResult: operation.foundFile || null,
      nextAction: getNextAction(operation)
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getNextAction(operation: any): string {
  if (operation.status === 'awaiting_permission') {
    return `POST /api/file-search/grant-permission with { "operationId": "${operation.id}" }`;
  } else if (operation.status === 'results_ready') {
    return `POST /api/file-search/select-file with { "operationId": "${operation.id}", "filePath": "/path/to/file" }`;
  } else if (operation.status === 'completed') {
    return 'File moved successfully. Operation complete.';
  } else if (operation.status === 'not_found') {
    return 'File not found in any location. Operation complete.';
  } else {
    return 'Continue polling GET /api/file-search/status';
  }
}
