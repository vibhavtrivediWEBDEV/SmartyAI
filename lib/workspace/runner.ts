/**
 * Workspace Runner - Executes workspace code and generates preview
 * Handles React/HTML bundling with console capture
 */

import type { WorkspaceFile, WorkspaceSettings, ConsoleLogEntry } from "../types/workspace";
import { bundleReact } from "../utils/reactBundler";
import { executePython, executeJava, executeNode } from "./backendRunner";

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function backendResult(logs: ConsoleLogEntry[]): {
  preview: string;
  logs: ConsoleLogEntry[];
  error?: string;
} {
  const failure = logs.find(log => log.type === 'error');
  return {
    preview: '',
    logs,
    ...(failure ? { error: failure.message } : {}),
  };
}

/**
 * Bundle workspace files for preview
 * Returns HTML content ready for iframe
 */
export async function runWorkspace(
  files: WorkspaceFile[],
  settings: WorkspaceSettings
): Promise<{
  preview: string;
  logs: ConsoleLogEntry[];
  error?: string;
}> {
  const logs: ConsoleLogEntry[] = [];

  try {
    const runtime = resolveRuntime(files, settings);
    switch (runtime) {
      case "react":
      case "react-ts":
        return await runReact(files, settings);

      case "html":
        return await runHTML(files);

      case "node":
      case "typescript": {
        // Node.js execution
        const mainFile = findEntryFile(files, settings.entryPoint, [".js", ".mjs", ".cjs", ".ts"]);
        if (!mainFile) {
          return {
            preview: "",
            logs: [{ id: generateId(), type: "error", message: "No JavaScript/TypeScript file found", timestamp: new Date().toISOString() }],
            error: "No JavaScript/TypeScript file found",
          };
        }
        const nodeLogs = await executeNode(mainFile.content, mainFile.path.endsWith(".ts"));
        return backendResult(nodeLogs);
      }

      case "python": {
        // Python execution
        const mainFile = findEntryFile(files, settings.entryPoint, [".py"]);
        if (!mainFile) {
          return {
            preview: "",
            logs: [{ id: generateId(), type: "error", message: "No Python file found", timestamp: new Date().toISOString() }],
            error: "No Python file found",
          };
        }
        const pythonLogs = await executePython(mainFile.content);
        return backendResult(pythonLogs);
      }

      case "java": {
        // Java execution
        const mainFile = findEntryFile(files, settings.entryPoint, [".java"]);
        if (!mainFile) {
          return {
            preview: "",
            logs: [{ id: generateId(), type: "error", message: "No Java file found", timestamp: new Date().toISOString() }],
            error: "No Java file found",
          };
        }
        const javaLogs = await executeJava(mainFile.content);
        return backendResult(javaLogs);
      }

      case "sql":
        return runSQL(findEntryFile(files, settings.entryPoint, [".sql"]));

      case "mongodb":
        return runMongoPipeline(findEntryFile(files, settings.entryPoint, [".mongodb", ".mongo", ".json"]));

      default:
        return {
          preview: "",
          logs: [],
          error: "Unknown runtime",
        };
    }
  } catch (error) {
    return {
      preview: "",
      logs: [
        {
          id: generateId(),
          type: "error",
          message: error instanceof Error ? error.message : "Execution failed",
          timestamp: new Date().toISOString(),
        },
      ],
      error: error instanceof Error ? error.message : "Execution failed",
    };
  }
}

function findEntryFile(files: WorkspaceFile[], entryPoint: string, extensions: string[]): WorkspaceFile | undefined {
  const selected = files.find(file => file.path === entryPoint);
  if (selected && extensions.some(extension => selected.path.toLowerCase().endsWith(extension))) {
    return selected;
  }
  return files.find(file => extensions.some(extension => file.path.toLowerCase().endsWith(extension)));
}

function resolveRuntime(files: WorkspaceFile[], settings: WorkspaceSettings): WorkspaceSettings["runtime"] {
  const selected = files.find(file => file.path === settings.entryPoint);
  const extension = selected?.path.split('.').pop()?.toLowerCase();

  if (extension === 'jsx' || extension === 'tsx') return extension === 'tsx' ? 'react-ts' : 'react';
  if (extension === 'html' || extension === 'htm') return 'html';
  if (extension === 'py') return 'python';
  if (extension === 'java') return 'java';
  if (extension === 'sql') return 'sql';
  if (extension === 'mongo' || extension === 'mongodb') return 'mongodb';
  if (extension === 'ts') return 'typescript';
  if (extension === 'js' || extension === 'mjs' || extension === 'cjs') {
    if (settings.runtime === 'react' || settings.runtime === 'react-ts' || settings.runtime === 'html') {
      return settings.runtime;
    }
    return 'node';
  }

  return settings.runtime;
}

function runSQL(file?: WorkspaceFile): { preview: string; logs: ConsoleLogEntry[]; error?: string } {
  const sql = file?.content.trim() || '';
  const statements = sql
    .split(';')
    .map(statement => statement.replace(/--.*$/gm, '').trim())
    .filter(Boolean);
  const supportedStart = /^(select|insert|update|delete|create|alter|drop|with|explain|show|use)\b/i;
  const invalid = statements.find(statement => !supportedStart.test(statement));

  if (!file || statements.length === 0 || invalid) {
    const error = !file ? 'No SQL file found' : statements.length === 0 ? 'No SQL statement found' : `Unsupported SQL statement: ${invalid}`;
    return {
      preview: '',
      logs: [{ id: generateId(), type: 'error', message: error, timestamp: new Date().toISOString() }],
      error,
    };
  }

  return {
    preview: '',
    logs: [{
      id: generateId(),
      type: 'success',
      message: `SQL validated: ${statements.length} statement${statements.length === 1 ? '' : 's'} ready to run against a database.`,
      timestamp: new Date().toISOString(),
    }],
  };
}

function runMongoPipeline(file?: WorkspaceFile): { preview: string; logs: ConsoleLogEntry[]; error?: string } {
  try {
    if (!file) throw new Error('No MongoDB pipeline file found');
    const pipeline = JSON.parse(file.content);
    if (!Array.isArray(pipeline)) throw new Error('Aggregation pipeline must be a JSON array');
    const invalidStage = pipeline.find(stage =>
      !stage || typeof stage !== 'object' || Array.isArray(stage) ||
      Object.keys(stage).length !== 1 || !Object.keys(stage)[0].startsWith('$')
    );
    if (invalidStage) throw new Error('Each aggregation stage must contain exactly one $ operator');

    return {
      preview: '',
      logs: [{
        id: generateId(),
        type: 'success',
        message: `MongoDB aggregation validated: ${pipeline.length} stage${pipeline.length === 1 ? '' : 's'} ready.`,
        timestamp: new Date().toISOString(),
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid MongoDB aggregation pipeline';
    return {
      preview: '',
      logs: [{ id: generateId(), type: 'error', message, timestamp: new Date().toISOString() }],
      error: message,
    };
  }
}

/**
 * Run React workspace
 */
async function runReact(
  files: WorkspaceFile[],
  settings: WorkspaceSettings
): Promise<{
  preview: string;
  logs: ConsoleLogEntry[];
}> {
  const selectedEntry = files.find(file => file.path === settings.entryPoint);
  const entryPoint = selectedEntry && /\.(jsx|tsx|js)$/.test(selectedEntry.path)
    ? selectedEntry.path
    : findEntryFile(files, settings.entryPoint, [".jsx", ".tsx", ".js"])?.path || "App.jsx";
  const entryFile = files.find(f => f.path === entryPoint);

  if (!entryFile) {
    return {
      preview: generateErrorHTML("Entry file not found"),
      logs: [{
        id: generateId(),
        type: "error",
        message: `Entry file "${entryPoint}" not found`,
        timestamp: new Date().toISOString(),
      }],
    };
  }

  // Get CSS files
  const cssContent = files
    .filter(f => f.path.endsWith(".css"))
    .map(f => f.content)
    .join("\n");

  // Convert WorkspaceFile[] to format expected by bundler
  const reactFiles = entryPoint.startsWith('exercises/') ? [entryFile] : files;
  const bundlerFiles = reactFiles.map(f => ({
    name: f.path,
    content: f.content
  }));

  // Bundle React code
  const { code, error } = await bundleReact(entryPoint, bundlerFiles);

  if (error || !code) {
    return {
      preview: generateErrorHTML(error || "Failed to bundle React code"),
      logs: [{
        id: generateId(),
        type: "error",
        message: error || "Failed to bundle React code",
        timestamp: new Date().toISOString(),
      }],
    };
  }

  // Generate preview HTML with console bridge
  const preview = generateReactPreview(code, cssContent);

  return {
    preview,
    logs: [{
      id: generateId(),
      type: "log",
      message: "React app compiled successfully",
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * Run HTML workspace
 */
async function runHTML(files: WorkspaceFile[]): Promise<{
  preview: string;
  logs: ConsoleLogEntry[];
}> {
  const htmlFile = files.find(f => f.path.endsWith(".html"));

  if (!htmlFile) {
    return {
      preview: generateErrorHTML("No HTML file found"),
      logs: [{
        id: generateId(),
        type: "error",
        message: "No HTML file found",
        timestamp: new Date().toISOString(),
      }],
    };
  }

  // Get CSS and JS files
  const cssContent = files
    .filter(f => f.path.endsWith(".css"))
    .map(f => f.content)
    .join("\n");

  const jsContent = files
    .filter(f => f.path.endsWith(".js") && !f.path.includes("test"))
    .map(f => f.content)
    .join("\n");

  // Bundle HTML with CSS and JS
  const preview = bundleHTML(htmlFile.content, cssContent, jsContent);

  return {
    preview,
    logs: [{
      id: generateId(),
      type: "log",
      message: "HTML preview generated",
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * Bundle HTML with CSS and JS
 */
function bundleHTML(html: string, css: string, js: string): string {
  const consoleBridge = `<script>
(function(){
  const send = (type, args) => {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2) } catch { return String(arg) }
      }
      return String(arg)
    }).join(' ')
    window.parent.postMessage({ 
      type: 'console', 
      logType: type, 
      message, 
      timestamp: new Date().toISOString() 
    }, '*')
  }
  
  const methods = ['log', 'error', 'warn', 'info']
  methods.forEach(method => {
    const original = console[method]
    console[method] = (...args) => { 
      send(method, args)
      original(...args) 
    }
  })
  
  window.addEventListener('error', (e) => {
    window.parent.postMessage({ 
      type: 'console', 
      logType: 'error', 
      message: e.message, 
      timestamp: new Date().toISOString() 
    }, '*')
  })
})()
</script>`;

  let bundled = html;

  // Inject console bridge
  if (bundled.includes("<head>")) {
    bundled = bundled.replace("<head>", `<head>${consoleBridge}`);
  } else {
    bundled = consoleBridge + bundled;
  }

  // Inject CSS
  if (css && bundled.includes("</head>")) {
    bundled = bundled.replace("</head>", `<style>${css}</style></head>`);
  }

  // Inject JS
  if (js) {
    if (bundled.includes("</body>")) {
      bundled = bundled.replace("</body>", `<script>${js}</script></body>`);
    } else {
      bundled = bundled + `<script>${js}</script>`;
    }
  }

  return bundled;
}

/**
 * Generate React preview HTML
 */
function generateReactPreview(reactCode: string, cssContent: string): string {
  const previewSource = `${reactCode}

// Auto-render with proper root management
if (typeof App !== 'undefined') {
  const container = document.getElementById('root');
  if (window._reactRoot) {
    window._reactRoot.unmount();
    window._reactRoot = null;
  }
  window._reactRoot = ReactDOM.createRoot(container);
  window._reactRoot.render(<App />);
} else {
  console.warn('No App component found. Make sure you export a component named "App"');
}`;
  const serializedPreviewSource = JSON.stringify(previewSource).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.26.9/babel.min.js"></script>
  ${cssContent ? `<style>${cssContent}</style>` : ''}
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script>
    // Console bridge
    (function(){
      const send = (type, args) => {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2) } catch { return String(arg) }
          }
          return String(arg)
        }).join(' ')
        window.parent.postMessage({ 
          type: 'console', 
          logType: type, 
          message, 
          timestamp: new Date().toISOString() 
        }, '*')
      }
      
      const methods = ['log', 'error', 'warn', 'info']
      methods.forEach(method => {
        const original = console[method]
        console[method] = (...args) => { 
          send(method, args)
          original(...args) 
        }
      })
      
      window.addEventListener('error', (e) => {
        window.parent.postMessage({ 
          type: 'console', 
          logType: 'error', 
          message: e.message, 
          timestamp: new Date().toISOString() 
        }, '*')
      })
    })()
  </script>
  
  <script>
    try {
      const source = ${serializedPreviewSource};
      const transformed = Babel.transform(source, {
        filename: 'preview.tsx',
        presets: ['typescript', 'react'],
      }).code;
      (0, eval)(transformed);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  </script>
</body>
</html>`;
}

/**
 * Generate error HTML
 */
function generateErrorHTML(error: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h2 {
      color: #d32f2f;
      margin-top: 0;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="error">
    <h2>⚠️ Error</h2>
    <pre>${error}</pre>
  </div>
</body>
</html>`;
}

/**
 * Generate backend placeholder
 */
function generateBackendPlaceholder(runtime: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .message {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    h2 {
      color: #666;
      margin-top: 0;
    }
    p {
      color: #888;
      font-size: 14px;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="message">
    <div class="emoji">🖥️</div>
    <h2>${runtime.charAt(0).toUpperCase() + runtime.slice(1)} Workspace</h2>
    <p>Backend execution requires server-side runtime.</p>
    <p>Preview not available for ${runtime} files in browser.</p>
  </div>
</body>
</html>`;
}
