/**
 * Judge0 API execution for backend languages
 * Supports Python, Java, C, C++, Go, Rust, PHP, Ruby, etc.
 */

/**
 * Execute code via Judge0 API (via our /api/execute route)
 */
export async function executeCode(
  filename: string,
  content: string
): Promise<{ stdout: string; stderr: string; error?: string; details?: string }> {
  try {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ext,
        content,
      }),
    })

    // Parse response with error handling
    let result: any
    const responseText = await response.text()
    try {
      result = JSON.parse(responseText)
    } catch {
      return {
        stdout: '',
        stderr: '',
        error: 'Server returned invalid JSON. Please try again.',
        details: responseText.substring(0, 200),
      }
    }
    
    if (!response.ok) {
      return {
        stdout: '',
        stderr: '',
        error: result.error || `API error: ${response.status}`,
        details: result.details,
      }
    }
    
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      error: result.error,
    }
  } catch (error: any) {
    return {
      stdout: '',
      stderr: '',
      error: `Execution failed: ${error.message}`,
    }
  }
}

/**
 * Check if a file can be executed as backend code
 */
export function isExecutable(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const executableExtensions = ['py', 'java', 'c', 'cpp', 'cc', 'cxx', 'go', 'rs', 'php', 'rb']
  return executableExtensions.includes(ext)
}
