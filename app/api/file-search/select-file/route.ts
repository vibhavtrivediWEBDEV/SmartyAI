// API: Select File from Results (Triggers File Move)
// POST /api/file-search/select-file
// Body: { "operationId": "search-xxx", "filePath": "/Users/name/Desktop/resume.pdf" }
// Returns: { "success": true, "message": "File moved to Smarty Finder" }

import { NextRequest, NextResponse } from 'next/server';
import { fileSearchOrchestrator } from '@/lib/fileSearchOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationId, filePath } = body;

    if (!operationId || !filePath) {
      return NextResponse.json({
        success: false,
        error: 'operationId and filePath are required'
      }, { status: 400 });
    }

    console.log('\n' + '📁'.repeat(80));
    console.log('📂 [API] SELECT FILE');
    console.log(`   Operation ID: ${operationId}`);
    console.log(`   File Path: ${filePath}`);
    console.log('📁'.repeat(80) + '\n');

    // Select file (triggers move to Smarty Finder)
    await fileSearchOrchestrator.selectFile(operationId, filePath);

    const state = fileSearchOrchestrator.getState();

    return NextResponse.json({
      success: true,
      operationId,
      status: 'completed',
      message: 'File moved to Smarty Finder successfully',
      selectedFile: state.currentOperation?.foundFile || null
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
