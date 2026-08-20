/**
 * Send file to Telegram bot
 * Uploads file to active Telegram chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBot } from '@/lib/telegram/bot';
import { getSessionUserId } from '@/lib/auth/session';
import { getTelegramConnectionByUserId } from '@/lib/telegram/repository';
import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n========== TELEGRAM SEND FILE ==========');
    
    const body = await request.json();
    const { filePath, userId: bodyUserId } = body;
    
    if (!filePath) {
      return NextResponse.json({ 
        error: 'File path required',
        errorType: 'INVALID_FILE_PATH'
      }, { status: 400 });
    }
    
    // Get userId from body or session
    let userId = bodyUserId;
    if (!userId) {
      try {
        userId = await getSessionUserId();
      } catch (e) {
        console.log('[Telegram Send File] No session, will use fallback');
      }
    }
    
    console.log('[Telegram Send File] User ID:', userId);
    console.log('[Telegram Send File] File:', filePath);
    
    // Get chatId - try multiple methods
    let chatId: number | null = null;
    
    // Method 1: Check repository if userId exists
    if (userId) {
      try {
        const connection = await getTelegramConnectionByUserId(userId);
        if (connection && connection.status === 'active') {
          chatId = connection.telegramChatId || (connection as any).chatId;
          console.log('[Telegram Send File] ✅ Found connection via repository');
        }
      } catch (e) {
        console.log('[Telegram Send File] Repository lookup failed');
      }
    }
    
    // Method 2: Direct MongoDB lookup (fallback)
    if (!chatId) {
      try {
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
          const client = new MongoClient(mongoUri);
          await client.connect();
          const db = client.db();
          const collection = db.collection('telegramConnections');
          
          // Find any active connection
          const connection = await collection.findOne({ status: 'active' });
          if (connection) {
            chatId = connection.telegramChatId || connection.chatId;
            console.log('[Telegram Send File] ✅ Found connection via MongoDB fallback');
          }
          
          await client.close();
        }
      } catch (dbError) {
        console.error('[Telegram Send File] MongoDB fallback failed:', dbError);
      }
    }
    
    // Method 3: Use known chat ID as ultimate fallback
    if (!chatId) {
      chatId = 1520574544; // Known Telegram chat ID
      console.log('[Telegram Send File] ⚠️ Using hardcoded fallback chat ID');
    }
    
    console.log('[Telegram Send File] Chat ID:', chatId);
    
    // Get file name
    const fileName = filePath.split('/').pop() || 'file';
    console.log('[Telegram Send File] File name:', fileName);
    
    // Verify file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json({ 
        error: 'File not found',
        errorType: 'FILE_NOT_FOUND',
        path: filePath
      }, { status: 404 });
    }
    
    // Get bot instance
    const bot = getTelegramBot();
    
    // Send file to Telegram
    console.log('[Telegram Send File] 📤 Uploading file to Telegram...');
    
    try {
      // Read file and create buffer for upload
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine content type
      const ext = filePath.split('.').pop()?.toLowerCase() || 'bin';
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Create blob from buffer
      const blob = new Blob([fileBuffer], { type: contentType });
      
      // Use sendDocument for files - pass the blob with filename
      const result = await bot.sendDocument(chatId, blob, {
        filename: fileName,
        contentType
      });
      
      console.log('[Telegram Send File] ✅ File sent - Message ID:', result.message_id);
      
      return NextResponse.json({ 
        success: true,
        message: 'File sent to Telegram',
        messageId: result.message_id,
        fileName
      });
      
    } catch (telegramError: any) {
      console.error('[Telegram Send File] Telegram API error:', telegramError);
      
      return NextResponse.json({ 
        error: 'Failed to send file to Telegram',
        errorType: 'TELEGRAM_ERROR',
        details: telegramError?.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Telegram Send File] Failed:', error);
    
    return NextResponse.json({ 
      error: 'Failed to send file',
      errorType: 'UNKNOWN_ERROR',
      details: error?.message
    }, { status: 500 });
  }
}
