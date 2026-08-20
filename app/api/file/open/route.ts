/**
 * Open file using system default or specific app
 * Uses macOS 'open' command to open files with registered applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path: filePath, app } = body;
    
    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'File path required' 
      }, { status: 400 });
    }
    
    console.log('[File Open] Opening file:', filePath);
    
    // Determine how to open based on extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    let command: string;
    
    if (app) {
      // Open with specific app
      // e.g., 'Preview', 'TextEdit', 'Google Chrome'
      command = `open -a "${app}" "${filePath}"`;
    } else {
      // Open with system default
      // This will use the registered application for the file type
      command = `open "${filePath}"`;
    }
    
    console.log('[File Open] Executing command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      console.error('[File Open] Error:', stderr);
      // Still return success if file opened (some apps output warnings to stderr)
    }
    
    console.log('[File Open] ✅ File opened successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'File opened',
      path: filePath
    });
    
  } catch (error: any) {
    console.error('[File Open] Failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to open file',
      details: error?.stderr || error?.toString()
    }, { status: 500 });
  }
}
