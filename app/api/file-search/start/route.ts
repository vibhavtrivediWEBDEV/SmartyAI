// API: Start File Search
// POST /api/file-search/start
// Body: { "filename": "resume", "searchLocations": ["Desktop", "Documents", "Downloads"] }
// Returns: { "success": true, "operationId": "search-xxx", "status": "pending" }

import { NextRequest, NextResponse } from 'next/server';
import { fileSearchOrchestrator } from '@/lib/fileSearchOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, searchLocations } = body;

    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'filename is required'
      }, { status: 400 });
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📂 [API] START FILE SEARCH');
    console.log(`   Filename: ${filename}`);
    console.log(`   Locations: ${searchLocations?.join(', ') || 'Default (Desktop, Documents, Downloads)'}`);
    console.log('═'.repeat(80) + '\n');

    // Enqueue search (non-blocking)
    const operationId = fileSearchOrchestrator.enqueue(filename, searchLocations);

    return NextResponse.json({
      success: true,
      operationId,
      status: 'pending',
      message: 'Search queued. Call GET /api/file-search/status?operationId=xxx to check progress',
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
