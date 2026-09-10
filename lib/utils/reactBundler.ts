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
    // Exclude standard bootstrap files because the preview creates its own root.
    const allJsFiles = files.filter(f => 
      (f.name.endsWith('.js') || f.name.endsWith('.jsx') || 
       f.name.endsWith('.ts') || f.name.endsWith('.tsx')) &&
      !f.name.match(/(\/|^)(index|main)\.(js|ts|jsx|tsx)$/)
    );
    
    console.log('[bundler] Found', allJsFiles.length, 'JS/JSX/TS/TSX files (excluding bootstrap files)')
    
    // Babel Standalone in the preview parses JSX and TypeScript. Preserve TSX
    // syntax here instead of attempting to remove it with regular expressions.
    const processedCodes = allJsFiles.map(file => {
      let code = file.content;
      
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
 * Transform ES6 imports to use global React/ReactDOM
 */
function transformImports(code: string): string {
  code = code.replace(/import\s+type\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*/g, '')
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
