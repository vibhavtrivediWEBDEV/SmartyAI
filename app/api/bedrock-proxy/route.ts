import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for Bedrock API - Handles CORS and streaming
 * Forwards requests from localhost:3002 → localhost:3000
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to Bedrock proxy
    const bedrockUrl = process.env.ANTHROPIC_BASE_URL || 'http://localhost:3000';
    
    const isStreaming = body.stream === true;
    console.log('🔄 Proxying Bedrock request to:', `${bedrockUrl}/v1/messages`, isStreaming ? '(streaming)' : '');
    
    const response = await fetch(`${bedrockUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'dummy',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Bedrock proxy error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Bedrock request failed', details: errorText },
        { status: response.status }
      );
    }

    // Handle streaming response
    if (isStreaming && response.body) {
      console.log('📡 Streaming response...');
      
      // Pass through the stream directly
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Handle non-streaming response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Proxy route error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
