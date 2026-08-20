/**
 * Stream local files for browser viewing
 * Workaround for browser security restriction on file:// URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }
    
    // Decode the path (it's URL encoded from frontend)
    const decodedPath = decodeURIComponent(filePath);
    
    // Security: Prevent path traversal attacks
    if (decodedPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    // Security: Only allow files from specific directories
    const homeDir = process.env.HOME || `/Users/${process.env.USER}`;
    const allowedDirs = [
      path.join(homeDir, 'Downloads'),
      path.join(homeDir, 'Documents'),
      path.join(homeDir, 'Desktop'),
      path.join(homeDir, 'Pictures'),
      '/tmp'
    ];
    
    const isAllowed = allowedDirs.some(dir => decodedPath.startsWith(dir));
    if (!isAllowed) {
      return NextResponse.json({ 
        error: 'Access denied - file outside allowed directories',
        allowed: allowedDirs 
      }, { status: 403 });
    }
    
    // Check if file exists
    try {
      await fs.access(decodedPath);
    } catch {
      return NextResponse.json({ 
        error: 'File not found',
        path: decodedPath 
      }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await fs.readFile(decodedPath);
    
    // Determine content type based on extension
    const ext = decodedPath.split('.').pop()?.toLowerCase() || 'bin';
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    const fileName = decodedPath.split('/').pop() || 'file';
    
    // Stream file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error: any) {
    console.error('[File Stream] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to stream file',
      details: error?.message 
    }, { status: 500 });
  }
}
