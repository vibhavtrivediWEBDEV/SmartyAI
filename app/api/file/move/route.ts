/**
 * Move/Copy file to Smarty Downloads folder
 * Copy file to ~/Downloads/Smarty folder with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { getSessionUserId } from '@/lib/auth/session';
import { createFinderNode, ensureSystemFinderNodes, listFinderNodes } from '@/modules/finder/finder.repository';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from session
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const body = await req.json();
    const { source, destination } = body;
    
    if (!source) {
      return NextResponse.json({ 
        success: false, 
        error: 'Source file path required' 
      }, { status: 400 });
    }
    
    console.log('[File Move] User:', userId);
    console.log('[File Move] Source:', source);
    console.log('[File Move] Destination:', destination);
    
    // Ensure system nodes exist
    await ensureSystemFinderNodes(userId);
    
    // Get file name from source path
    const fileName = source.split('/').pop();
    if (!fileName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file path' 
      }, { status: 400 });
    }
    
    // Create destination path
    // Default to ~/Downloads/Smarty folder
    const homeDir = process.env.HOME || '/Users/' + process.env.USER;
    const smartyDownloadsDir = path.join(homeDir, 'Downloads', 'Smarty');
    const destPath = path.join(smartyDownloadsDir, fileName);
    
    console.log('[File Move] Dest path:', destPath);
    
    // Ensure Smarty Downloads directory exists
    try {
      await fs.mkdir(smartyDownloadsDir, { recursive: true });
      console.log('[File Move] ✅ Created Smarty Downloads folder');
    } catch (error) {
      // Directory might already exist
    }
    
    // Copy file (not move, to preserve original)
    const command = `cp "${source}" "${destPath}"`;
    console.log('[File Move] Executing:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    // Handle "identical file" gracefully
    if (stderr && stderr.trim() && !stderr.includes('are identical')) {
      console.error('[File Move] Error:', stderr);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to copy file',
        details: stderr
      }, { status: 500 });
    }
    
    if (stderr && stderr.includes('are identical')) {
      console.log('[File Move] ℹ️ File already exists at destination, continuing...');
    }
    
    console.log('[File Move] ✅ File copied to Smarty Downloads');
    
    // Now upload to database using finder repository
    try {
      // Get file stats
      let fileSize = 0;
      try {
        const stats = await fs.stat(destPath);
        fileSize = stats.size;
      } catch (e) {}
      
      // Determine file type
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, string> = {
        'pdf': 'document',
        'doc': 'document',
        'docx': 'document',
        'txt': 'text',
        'md': 'text',
        'js': 'code',
        'ts': 'code',
        'tsx': 'code',
        'jsx': 'code',
        'py': 'code',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'svg': 'image',
      };
      const fileType = typeMap[ext] || 'file';
      
      // Get all finder nodes for this user
      const allNodes = await listFinderNodes(userId, false);
      
      // Find Downloads folder
      let downloadsFolder = allNodes.find((f: any) => 
        f.name.toLowerCase() === 'downloads' && 
        !f.parentId && 
        f.type === 'folder'
      );
      
      if (!downloadsFolder) {
        // Create Downloads folder in DB
        console.log('[File Move] Creating Downloads folder in DB...');
        downloadsFolder = await createFinderNode(userId, {
          name: 'Downloads',
          type: 'folder',
          parentId: null
        });
      }
      
      // Check if file already exists in database
      const existingFile = allNodes.find((f: any) => 
        f.name === fileName && 
        f.parentId === downloadsFolder.id
      );
      
      if (existingFile) {
        console.log('[File Move] ℹ️ File already exists in database');
      } else {
        // Create file entry in database
        console.log('[File Move] Creating database entry...');
        await createFinderNode(userId, {
          name: fileName,
          type: fileType,
          parentId: downloadsFolder.id,
          content: `Local file: ${destPath}`,
          size: fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : undefined,
          sizeBytes: fileSize
        });
        console.log('[File Move] ✅ Database entry created');
      }
    } catch (dbError) {
      console.error('[File Move] Database error:', dbError);
      // Still return success since file was copied
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'File moved to Smarty Downloads',
      source,
      destination: destPath,
      fileName,
      refresh: true
    });
    
  } catch (error: any) {
    console.error('[File Move] Failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to move file',
      details: error?.toString()
    }, { status: 500 });
  }
}
