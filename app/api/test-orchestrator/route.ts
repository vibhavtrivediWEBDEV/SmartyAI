// app/api/test-orchestrator/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[TEST] Testing fileSearchOrchestrator import...');
    
    const { fileSearchOrchestrator } = await import('@/lib/fileSearchOrchestrator');
    
    console.log('[TEST] Import successful:', typeof fileSearchOrchestrator);
    console.log('[TEST] Methods:', Object.keys(fileSearchOrchestrator));
    
    // Test enqueue
    const operationId = fileSearchOrchestrator.enqueue('test', ['Desktop']);
    console.log('[TEST] Enqueue successful, operationId:', operationId);
    
    const state = fileSearchOrchestrator.getState();
    console.log('[TEST] State:', JSON.stringify(state, null, 2));
    
    return NextResponse.json({
      success: true,
      import: typeof fileSearchOrchestrator,
      operationId,
      state
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
