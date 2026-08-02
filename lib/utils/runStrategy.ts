/**
 * Run strategy utilities for VS Code Editor
 * Determines how different file types should be executed
 */

export type RunStrategy = 'html-preview' | 'react-bundle' | 'backend-execute' | 'unsupported'

/**
 * Web-related extensions that use HTML preview
 */
const HTML_PREVIEW_EXTENSIONS = new Set([
  'html', 'htm'
])

/**
 * React/JavaScript/TypeScript extensions that need bundling
 */
const REACT_BUNDLE_EXTENSIONS = new Set([
  'jsx', 'tsx'
])

/**
 * Backend programming languages that need server-side execution
 */
const BACKEND_EXECUTION_EXTENSIONS = new Set([
  'py', 'java', 'c', 'cpp', 'cc', 'cxx', 'go', 'rs', 'php', 'rb', 'ts'
])

/**
 * Get the execution strategy for a file
 * @param filename - File name with extension
 * @returns Run strategy to use
 */
export function getRunStrategy(filename: string): RunStrategy {
  if (!filename) return 'unsupported'
  
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  // Check for HTML preview
  if (HTML_PREVIEW_EXTENSIONS.has(ext)) {
    return 'html-preview'
  }
  
  // Check for React/JSX/TSX bundling
  if (REACT_BUNDLE_EXTENSIONS.has(ext)) {
    return 'react-bundle'
  }
  
  // Check for backend execution
  if (BACKEND_EXECUTION_EXTENSIONS.has(ext)) {
    return 'backend-execute'
  }
  
  // CSS/JS files can be part of HTML preview (bundled with HTML)
  if (ext === 'css' || ext === 'js') {
    return 'html-preview'
  }
  
  // Default to unsupported
  return 'unsupported'
}

/**
 * Check if a file can be executed/run
 * @param filename - File name with extension
 * @returns True if the file can be run
 */
export function canRunFile(filename: string): boolean {
  const strategy = getRunStrategy(filename)
  return strategy !== 'unsupported'
}

/**
 * Get human-readable strategy name
 * @param strategy - Run strategy
 * @returns Human-readable string
 */
export function getStrategyDisplayName(strategy: RunStrategy): string {
  const names: Record<RunStrategy, string> = {
    'html-preview': 'HTML Preview',
    'react-bundle': 'React Bundle',
    'backend-execute': 'Backend Execute',
    'unsupported': 'Not Runnable'
  }
  return names[strategy]
}
