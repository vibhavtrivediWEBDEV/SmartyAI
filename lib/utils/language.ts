/**
 * Language utilities for VS Code Editor
 * Maps file extensions to Monaco editor language IDs
 */

/**
 * Maps file extensions to Monaco language IDs
 * Based on Monaco's built-in language support
 */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  // Web technologies
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'less': 'less',
  
  // JavaScript & TypeScript
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  
  // Data formats
  'json': 'json',
  'xml': 'xml',
  'yml': 'yaml',
  'yaml': 'yaml',
  
  // Markdown
  'md': 'markdown',
  'markdown': 'markdown',
  
  // Programming languages
  'py': 'python',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'h': 'c',
  'hpp': 'cpp',
  'go': 'go',
  'rs': 'rust',
  'php': 'php',
  'rb': 'ruby',
  'swift': 'swift',
  'kt': 'kotlin',
  'scala': 'scala',
  
  // Shell & configs
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'env': 'plaintext',
  'txt': 'plaintext',
  
  // Other
  'sql': 'sql',
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'gradle': 'groovy',
}

/**
 * Get Monaco language ID from filename
 * @param filename - File name with extension
 * @returns Monaco language ID
 */
export function getLanguageFromExtension(filename: string): string {
  if (!filename) return 'plaintext'
  
  // Extract extension (handle files like .env, Dockerfile without extensions)
  const parts = filename.split('.')
  
  // Handle files without extension (e.g., Dockerfile, Makefile)
  if (parts.length === 1) {
    const baseName = filename.toLowerCase()
    return EXTENSION_TO_LANGUAGE[baseName] || 'plaintext'
  }
  
  // Get the last part as extension
  const ext = parts[parts.length - 1].toLowerCase()
  
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext'
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension without dot
 */
export function getFileExtension(filename: string): string {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Get file icon color based on extension
 * @param filename - File name
 * @returns CSS color string
 */
export function getFileIconColor(filename: string): string {
  const ext = getFileExtension(filename)
  
  const colorMap: Record<string, string> = {
    'html': '#e44d26',
    'htm': '#e44d26',
    'css': '#2965f1',
    'scss': '#c6538c',
    'sass': '#c6538c',
    'less': '#1d365d',
    'js': '#f7df1e',
    'jsx': '#61dafb',
    'ts': '#3178c6',
    'tsx': '#3178c6',
    'json': '#cbcb41',
    'md': '#083fa1',
    'py': '#3572A5',
    'java': '#b07219',
    'c': '#555555',
    'cpp': '#f34b7d',
    'go': '#00ADD8',
    'rs': '#dea584',
    'php': '#4F5D95',
    'rb': '#701516',
    'swift': '#F05138',
    'xml': '#0060ac',
    'yml': '#cb171e',
    'yaml': '#cb171e',
    'sh': '#89e051',
    'bash': '#89e051',
    'sql': '#e38c00',
  }
  
  return colorMap[ext] || '#cccccc'
}
