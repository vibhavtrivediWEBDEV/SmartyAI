/**
 * Enhanced JSX/TSX Transpiler
 * Transpiles React JSX/TSX code to browser-runnable JavaScript
 * Uses Babel standalone in the iframe for transpilation
 */

/**
 * Process JSX/TSX content for browser execution
 * Returns the code ready for Babel standalone transpilation in the iframe
 */
export async function bundleReact(
  entryPoint: string,
  files: Array<{ name: string; content: string }>
): Promise<{ code: string; error?: string }> {
  try {
    console.log('[bundler] Processing JSX/TSX for:', entryPoint)
    console.log('[bundler] Files available:', files.map(f => f.name))
    
    // Find the entry file
    const entryFile = files.find(f => f.name === entryPoint) || 
                      files.find(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx')) ||
                      files.find(f => f.name.endsWith('.ts') || f.name.endsWith('.js'))
    
    if (!entryFile) {
      console.error('[bundler] No JSX/TSX file found')
      return { code: '', error: 'No JSX/TSX file found' }
    }

    console.log('[bundler] Using entry file:', entryFile.name)
    
    // Collect ALL JS/JSX/TS/TSX files (not just entry)
    // EXCLUDE index.js/index.ts files that typically contain createRoot calls
    const allJsFiles = files.filter(f => 
      (f.name.endsWith('.js') || f.name.endsWith('.jsx') || 
       f.name.endsWith('.ts') || f.name.endsWith('.tsx')) &&
      !f.name.match(/(\/|^)index\.(js|ts|jsx|tsx)$/)
    );
    
    console.log('[bundler] Found', allJsFiles.length, 'JS/JSX/TS/TSX files (excluding index entry files)')
    
    // Process all files and combine them
    const processedCodes = allJsFiles.map(file => {
      let code = file.content;
      
      // Process TypeScript/TSX files
      if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        console.log('[bundler] Stripping TypeScript from:', file.name)
        code = stripTypeScript(code);
      }
      
      // Transform ES6 imports to use globals
      code = transformImports(code);
      
      // Remove export statements
      code = removeExports(code);
      
      return `// File: ${file.name}\n${code}`;
    });
    
    // Combine all processed files
    const combinedCode = processedCodes.join('\n\n');
    
    console.log('[bundler] Combined code length:', combinedCode.length)
    
    // Return the processed code
    return { code: combinedCode }
    
  } catch (error: any) {
    console.error('[bundler] Processing error:', error)
    return {
      code: '',
      error: error.message || 'Failed to process React code',
    }
  }
}

/**
 * Strip TypeScript-specific syntax
 */
function stripTypeScript(code: string): string {
  // Remove type-only imports (import type { ... } from '...')
  code = code.replace(/import\s+type\s+[^\n]+/g, '')
  
  // Remove interface declarations (single-line and multi-line)
  code = code.replace(/interface\s+\w+[^{]*\{[^}]*\}/g, '')
  code = code.replace(/interface\s+\w+[^{]*\{[\s\S]*?^\}/gm, '')
  
  // Remove type declarations
  code = code.replace(/type\s+\w+[^=]*=[^\n]+/g, '')
  code = code.replace(/type\s+\w+[^{]*\{[\s\S]*?^\}/gm, '')
  
  // Remove React.FC, React.FunctionComponent and similar BEFORE other processing
  // This prevents issues with JSX detection
  code = code.replace(/:\s*React\.(FC|FunctionComponent|ComponentType)(?:<[^>]+>)?\s*=/g, ' =')
  code = code.replace(/:\s*(FC|FunctionComponent|ComponentType)(?:<[^>]+>)?\s*=/g, ' =')
  
  // Remove generic type parameters in specific contexts:
  // 1. After function/method names: function name<Type>
  // 2. After useState, useRef, etc.: React.useState<Type>
  // 3. In class extends: extends Base<Type>
  // BUT NOT in JSX tags
  
  // Remove uppercase generics (Type parameters)
  code = code.replace(/([a-zA-Z_$]\w*)<[A-Z]\w*(?:\s+(?:extends|keyof|in)\s+[^>,]+)?(?:\s*,\s*[A-Z]\w*(?:\s+(?:extends|keyof|in)\s+[^>,]+)?)*>/g, '$1')
  
  // Remove lowercase generics in function call context (after . or lowercase letters)
  // Matches: .useState<number>, .useRef<string>, etc.
  code = code.replace(/([a-z]\w*\.)[a-z]\w*<[a-z]\w*>/g, (match, prefix) => {
    return match.replace(/<[a-z]\w*>/, '')
  })
  
  // Remove destructuring parameter type annotations: { prop }: Type or { prop = value }: Type
  code = code.replace(/(\{[^}]+\})\s*:\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?/g, '$1')
  
  // Remove function parameter type annotations
  // Matches: paramName: Type (but preserves function declarations)
  // Only match patterns that are clearly parameters (after comma or in parameter position)
  code = code.replace(/,\s*(\w+)\s*:\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?(?:\s*\|\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?)*/g, ', $1')
  code = code.replace(/\((\w+)\s*:\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?(?:\s*\|\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?)*/g, '($1')
  
  // Remove return type annotations (but be careful with arrow functions)
  // Only remove return types that are clearly type annotations (not arrow functions)
  code = code.replace(/\)\s*:\s*(?!=>)[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?(?:\s*\|\s*[A-Z][a-zA-Z0-9_]*)*(?=\s*[{;\n])/g, ')')
  
  // Remove variable type annotations (const x: Type = ...)
  code = code.replace(/(const|let|var)\s+(\w+)\s*:\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?:\[\])?/g, '$1 $2')
  
  // Remove `as Type` assertions
  code = code.replace(/\s+as\s+[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?/g, '')
  
  // Remove `as const` assertions
  code = code.replace(/\s+as\s+const/g, '')
  
  // Remove non-null assertion operator (!)
  code = code.replace(/\w!/g, (match) => match.slice(0, -1))
  
  // Remove optional chaining type annotations (?.Type)
  code = code.replace(/\?\s*:\s*[A-Z][a-zA-Z0-9_]*/g, '?')
  
  // Clean up any remaining double spaces or orphaned colons
  code = code.replace(/\s{2,}/g, ' ')
  code = code.replace(/:\s*[,);\n]/g, '$1')
  
  return code
}

/**
 * Transform ES6 imports to use global React/ReactDOM
 */
function transformImports(code: string): string {
  // Handle: import React, { useState, useEffect } from 'react'
  code = code.replace(/import\s+React\s*,\s*\{([^}]+)\}\s+from\s+['"]react['"];\n?/g, (match, imports) => {
    const importList = imports.split(',').map((i: string) => i.trim()).filter(Boolean)
    if (importList.length === 0) return ''
    return `const { ${importList.join(', ')} } = React;\n`
  })
  
  // Handle: import { useState, useEffect } from 'react'
  code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];\n?/g, (match, imports) => {
    const importList = imports.split(',').map((i: string) => i.trim()).filter(Boolean)
    if (importList.length === 0) return ''
    return `const { ${importList.join(', ')} } = React;\n`
  })
  
  // Remove default React imports (import React from 'react')
  code = code.replace(/import\s+React\s+from\s+['"]react['"];\n?/g, '')
  code = code.replace(/import\s+\w+\s+from\s+['"]react['"];\n?/g, '')
  
  // Transform named imports from 'react-dom'
  code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-dom['"];\n?/g, (match, imports) => {
    const importList = imports.split(',').map((i: string) => i.trim()).filter(Boolean)
    if (importList.length === 0) return ''
    return `const { ${importList.join(', ')} } = ReactDOM;\n`
  })
  
  // Remove default React-DOM imports
  code = code.replace(/import\s+ReactDOM\s+from\s+['"]react-dom['"];\n?/g, '')
  code = code.replace(/import\s+\w+\s+from\s+['"]react-dom\/client['"];\n?/g, '')
  
  // Remove CSS imports (import './styles.css')
  code = code.replace(/import\s+['"][^'"]+\.css['"];\n?/g, '')
  
  // Remove local file imports (components, utils, etc.)
  // Pattern: import ... from './...' OR import ... from '../...'
  // IMPORTANT: Only match the full import statement ending with semicolon and newline
  code = code.replace(/^import\s+[\w{},\s*]+\s+from\s+['"]\.\.?\/[^'"]+['"];\s*$/gm, '// Import removed for browser preview')
  
  // Remove other third-party imports (non-relative)
  // Pattern: import ... from 'package-name' (but not from './...')
  // IMPORTANT: Only match the full import statement ending with semicolon
  code = code.replace(/^import\s+[\w{},\s*]+\s+from\s+['"](?!\.+\/)[^'"]+['"];\s*$/gm, '// Import removed for browser preview')
  
  return code
}

/**
 * Remove export statements
 */
function removeExports(code: string): string {
  // Transform: export default function Name → function Name
  code = code.replace(/export\s+default\s+(function|class)\s+(\w+)/g, '$1 $2')
  
  // Transform: export default const/let/var Name → const/let/var Name
  code = code.replace(/export\s+default\s+(const|let|var)\s+(\w+)/g, '$1 $2')
  
  // Remove: export default Component (standalone)
  code = code.replace(/export\s+default\s+\w+;?\n?/g, '')
  
  // Remove: export { Component }
  code = code.replace(/export\s+\{[^}]+\};?\n?/g, '')
  
  // Transform: export const/function/class → const/function/class (preserve spacing)
  code = code.replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
  
  return code
}

/**
 * React hook for managing the bundler (kept for backward compatibility)
 */
export function useReactBundler() {
  return { isReady: true, error: null, bundleReact }
}
