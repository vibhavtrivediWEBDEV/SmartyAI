// app/api/native/file-search/route.ts
/**
 * OpenClaw-style sequential file search
 * 
 * Searches Desktop → Documents → Downloads
 * Requests permission before each location
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Standard macOS search locations
const SEARCH_LOCATIONS = {
  Desktop: '~/Desktop',
  Documents: '~/Documents',
  Downloads: '~/Downloads'
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, filename, operationId } = body;

    if (!location || !filename) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing location or filename' 
      }, { status: 400 });
    }

    // Sanitize filename - remove any stray quotes
    const sanitizedFilename = filename.replace(/^["']+|["']+$/g, '').trim();
    
    console.log(`\n${'🔍'.repeat(40)}`);
    console.log(`[file-search] Request received`);
    console.log(`   Location: ${location}`);
    console.log(`   Filename: ${sanitizedFilename} (sanitized from: ${filename})`);
    console.log(`   Operation ID: ${operationId}`);
    console.log(`${'🔍'.repeat(40)}\n`);

    // Get the search path for this location
    const searchPath = SEARCH_LOCATIONS[location as keyof typeof SEARCH_LOCATIONS];
    if (!searchPath) {
      return NextResponse.json({ 
        success: false, 
        error: `Unknown location: ${location}` 
      }, { status: 400 });
    }

    // Expand ~ to home directory
    const expandedPath = searchPath.replace('~', process.env.HOME || '/Users');
    
    console.log(`[file-search] Searching in: ${expandedPath}`);

    // Use mdfind (Spotlight) for fast search, fallback to find
    try {
      // mdfind is faster and searches Spotlight index
      const searchQuery = `kMDItemFSName == '*${sanitizedFilename}*' && kMDItemPath == '${expandedPath}'`;
      const { stdout: mdfindResult } = await execAsync(
        `mdfind -onlyin "${expandedPath}" -name "${sanitizedFilename}"`,
        { timeout: 10000 }
      );

      const results = mdfindResult
        .trim()
        .split('\n')
        .filter(Boolean)
        .slice(0, 10) // Limit to 10 results
        .map(path => ({
          path,
          name: path.split('/').pop() || path,
          size: 0,
          modifiedAt: new Date().toISOString()
        }));

      if (results.length > 0) {
        console.log(`[file-search] ✓ Found ${results.length} results via mdfind`);
        return NextResponse.json({
          success: true,
          results,
          location,
          searchMethod: 'mdfind'
        });
      }
    } catch (mdfindError) {
      console.warn('[file-search] mdfind failed, falling back to find:', mdfindError);
    }

    // Fallback to find command
    try {
      const { stdout: findResult } = await execAsync(
        `find "${expandedPath}" -type f -iname "*${sanitizedFilename}*" -maxdepth 5 2>/dev/null`,
        { timeout: 15000 }
      );

      const results = findResult
        .trim()
        .split('\n')
        .filter(Boolean)
        .slice(0, 10)
        .map(path => ({
          path,
          name: path.split('/').pop() || path,
          size: 0,
          modifiedAt: new Date().toISOString()
        }));

      if (results.length > 0) {
        console.log(`[file-search] ✓ Found ${results.length} results via find`);
        return NextResponse.json({
          success: true,
          results,
          location,
          searchMethod: 'find'
        });
      }
    } catch (findError: any) {
      console.warn('[file-search] find command failed:', findError.message);
      
      // Check if permission denied
      if (findError.message?.includes('Permission denied') || 
          findError.message?.includes('Operation not permitted')) {
        return NextResponse.json({
          success: false,
          needConsent: true,
          error: 'Permission denied',
          errorType: 'TCC_DENIED',
          location,
          guidance: {
            title: `Permission required for ${location}`,
            message: `Smarty needs access to ${location} to search for "${filename}".`,
            action: 'grant_permission',
            operationId
          }
        }, { status: 403 });
      }
    }

    // No results found in this location
    console.log(`[file-search] ✗ Not found in ${location}`);
    return NextResponse.json({
      success: true,
      results: [],
      location,
      searchMethod: 'none',
      message: `"${filename}" not found in ${location}`
    });

  } catch (error: any) {
    console.error('[file-search] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
