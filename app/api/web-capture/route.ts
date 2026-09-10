/**
 * Web Capture API Endpoint
 * 
 * POST /api/web-capture
 * 
 * Captures a specific region of a webpage using Puppeteer
 * Returns base64 PNG image
 */

import { NextRequest, NextResponse } from 'next/server';
import { captureWebRegion, type CaptureConfig } from '@/lib/webCapture';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const { url, rect, viewport } = body;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    
    if (!rect || typeof rect !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Capture rectangle is required' },
        { status: 400 }
      );
    }
    
    if (!viewport || typeof viewport !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Viewport dimensions are required' },
        { status: 400 }
      );
    }
    
    // Validate rectangle dimensions
    if (
      typeof rect.x !== 'number' ||
      typeof rect.y !== 'number' ||
      typeof rect.width !== 'number' ||
      typeof rect.height !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid rectangle dimensions' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    // Validate viewport dimensions
    if (
      typeof viewport.width !== 'number' ||
      typeof viewport.height !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid viewport dimensions' },
        { status: 400 }
      );
    }
    
    // Build capture configuration
    const captureConfig: CaptureConfig = {
      url,
      rect: {
        x: Math.max(0, rect.x),
        y: Math.max(0, rect.y),
        width: Math.max(100, Math.min(rect.width, 1920)),
        height: Math.max(100, Math.min(rect.height, 1080)),
      },
      viewport: {
        width: Math.max(320, Math.min(viewport.width, 1920)),
        height: Math.max(240, Math.min(viewport.height, 1080)),
        scrollX: viewport.scrollX || 0,
        scrollY: viewport.scrollY || 0,
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
      },
    };
    
    console.log('📸 Web capture request:', {
      url: captureConfig.url,
      rect: captureConfig.rect,
      viewport: captureConfig.viewport,
    });
    
    // Capture the region
    const result = await captureWebRegion(captureConfig);
    
    if (!result.success) {
      console.error('❌ Capture failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Capture failed' },
        { status: 500 }
      );
    }
    
    console.log('✅ Capture successful:', {
      imageSize: result.image?.length || 0,
      capturedAt: result.capturedAt,
    });
    
    return NextResponse.json({
      success: true,
      image: result.image,
      capturedAt: result.capturedAt,
      metadata: {
        url: captureConfig.url,
        rect: captureConfig.rect,
        viewport: captureConfig.viewport,
      },
    });
    
  } catch (error) {
    console.error('💥 Web capture API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web-capture',
    timestamp: new Date().toISOString(),
  });
}
