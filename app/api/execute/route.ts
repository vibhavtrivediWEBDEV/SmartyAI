import { NextRequest, NextResponse } from 'next/server'

/**
 * Map file extensions to Judge0 language IDs
 * https://ce.judge0.com/languages
 */
const EXTENSION_TO_LANGUAGE_ID: Record<string, number> = {
  'py': 71,      // Python 3
  'python': 71,
  'java': 62,    // Java
  'c': 50,       // C (GCC 9.2.0)
  'cpp': 54,     // C++ (GCC 9.2.0)
  'cc': 54,
  'cxx': 54,
  'go': 60,      // Go
  'rs': 73,      // Rust
  'php': 68,     // PHP
  'rb': 72,      // Ruby
  'js': 63,      // JavaScript (Node.js 12.14.0)
  'ts': 74,      // TypeScript (3.7.4)
}

/**
 * Base64 encode function (works in browser and Node.js)
 */
function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64')
  }
  // Fallback for edge runtime
  return Buffer.from ? Buffer.from(str).toString('base64') : btoa(unescape(encodeURIComponent(str)))
}

/**
 * Base64 decode function
 */
function base64Decode(str: string): string {
  if (!str) return ''
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf-8')
    }
    // Fallback for edge runtime
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return str
  }
}

/**
 * API Route: Execute code via Judge0 CE
 * POST /api/execute
 * 
 * Body: { ext, content } or { language, version, files }
 * Returns: { stdout, stderr, status }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Support both new format and old format for backward compatibility
    let ext: string
    let sourceCode: string
    
    if (body.ext && body.content) {
      // New format: { ext, content }
      ext = body.ext
      sourceCode = body.content
    } else if (body.language && body.files) {
      // Old format: { language, files } - for backward compatibility
      ext = body.language
      sourceCode = body.files[0]?.content || ''
    } else {
      return NextResponse.json(
        { error: 'Missing required fields: ext and content' },
        { status: 400 }
      )
    }

    const languageId = EXTENSION_TO_LANGUAGE_ID[ext]
    
    if (!languageId) {
      return NextResponse.json(
        { error: `Unsupported language: .${ext}`, supported: Object.keys(EXTENSION_TO_LANGUAGE_ID) },
        { status: 400 }
      )
    }

    // Prepare Judge0 submission
    const submission = {
      source_code: base64Encode(sourceCode),
      language_id: languageId,
      stdin: body.stdin ? base64Encode(body.stdin) : '',
    }

    // Submit to Judge0 CE (free public endpoint)
    const judge0Url = 'https://ce.judge0.com/submissions?base64_encoded=true&wait=true'
    
    let response: Response
    try {
      response = await fetch(judge0Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      })
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: 'Cannot connect to Judge0 API. The service may be temporarily unavailable.', details: fetchError.message },
        { status: 503 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Judge0 API error: ${response.status}`
      
      // Check if error is HTML (500 page) instead of JSON
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
        errorMessage = 'Judge0 API is experiencing issues (HTTP 500). Please try again later.'
      } else if (errorText.includes('Internal Server Error')) {
        errorMessage = 'Judge0 API internal error. Please try again later.'
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorText.substring(0, 200) },
        { status: response.status >= 500 ? 502 : response.status }
      )
    }

    // Parse response with error handling for non-JSON responses
    let result: any
    const responseText = await response.text()
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Judge0 API returned invalid JSON. The service may be experiencing issues.', details: responseText.substring(0, 200) },
        { status: 502 }
      )
    }

    // Decode outputs
    const stdout = base64Decode(result.stdout || '')
    const stderr = base64Decode(result.stderr || '')
    const compileOutput = base64Decode(result.compile_output || '')
    const status = result.status?.description || 'Unknown'
    const exitCode = result.exit_code
    const time = result.time
    const memory = result.memory

    return NextResponse.json({
      stdout,
      stderr: stderr || compileOutput,
      status,
      exitCode,
      time,
      memory,
      success: result.status?.id === 3 || result.status?.id === 5, // Accepted or Runtime Error
    })

  } catch (error: any) {
    console.error('Execute API error:', error)
    return NextResponse.json(
      { error: 'Failed to execute code', details: error.message },
      { status: 500 }
    )
  }
}
