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
  'es6': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'mts': 'typescript',
  'cts': 'typescript',
  
  // Data formats
  'json': 'json',
  'jsonc': 'json',
  'xml': 'xml',
  'yml': 'yaml',
  'yaml': 'yaml',
  
  // Markdown
  'md': 'markdown',
  'markdown': 'markdown',
  'mdx': 'mdx',
  
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
  'cs': 'csharp',
  'fs': 'fsharp',
  'fsx': 'fsharp',
  'dart': 'dart',
  'lua': 'lua',
  'r': 'r',
  'pl': 'perl',
  'pm': 'perl',
  'ex': 'elixir',
  'exs': 'elixir',
  'sol': 'solidity',
  'vb': 'vb',
  'wgsl': 'wgsl',
  
  // Shell & configs
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'fish': 'shell',
  'bat': 'bat',
  'cmd': 'bat',
  'ps1': 'powershell',
  'psm1': 'powershell',
  'env': 'plaintext',
  'txt': 'plaintext',
  'ini': 'ini',
  'cfg': 'ini',
  'conf': 'ini',
  'properties': 'ini',
  
  // Other
  'sql': 'sql',
  'graphql': 'graphql',
  'gql': 'graphql',
  'proto': 'protobuf',
  'tf': 'hcl',
  'tfvars': 'hcl',
  'hcl': 'hcl',
  'pug': 'pug',
  'hbs': 'handlebars',
  'handlebars': 'handlebars',
  'liquid': 'liquid',
  'twig': 'twig',
  'vue': 'html',
  'svelte': 'html',
  'astro': 'html',
  'cshtml': 'razor',
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'gradle': 'groovy',
}

const FILENAME_TO_LANGUAGE: Record<string, string> = {
  'dockerfile': 'dockerfile',
  'containerfile': 'dockerfile',
  'makefile': 'makefile',
  'jenkinsfile': 'groovy',
  '.editorconfig': 'ini',
  '.gitignore': 'plaintext',
  '.npmrc': 'ini',
  '.env': 'plaintext',
}

/**
 * Get Monaco language ID from filename
 * @param filename - File name with extension
 * @returns Monaco language ID
 */
export function getLanguageFromExtension(filename: string): string {
  if (!filename) return 'plaintext'

  const baseName = filename.split(/[\\/]/).pop()?.toLowerCase() || ''
  const exactLanguage = FILENAME_TO_LANGUAGE[baseName]
  if (exactLanguage) return exactLanguage

  if (baseName.startsWith('.env.')) return 'plaintext'
  const ext = baseName.includes('.') ? baseName.split('.').pop()! : baseName
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
