import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED: Bedrock Proxy Route
 * 
 * This route is no longer needed as we use direct AWS SDK integration.
 * All Bedrock requests now go through lib/ai/bedrock-glm.ts directly.
 * 
 * This file exists only to prevent 404 errors for any legacy requests.
 * 
 * @deprecated Use lib/ai/bedrock-glm.ts instead
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use the direct AWS Bedrock SDK integration.',
      message: 'The bedrock-proxy route has been replaced by lib/ai/bedrock-glm.ts',
      documentation: 'See GLM_DIRECT_INTEGRATION_COMPLETE.md for details.'
    },
    { status: 410 } // Gone
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      status: 'deprecated',
      message: 'Bedrock proxy is no longer in use. Using direct AWS SDK.',
      newImplementation: 'lib/ai/bedrock-glm.ts'
    },
    { status: 200 }
  );
}
