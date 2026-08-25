import { NextResponse } from "next/server";
import { runWorkspace } from "@/lib/workspace/runner";
import type { WorkspaceFile, WorkspaceSettings } from "@/lib/types/workspace";

/**
 * GET /api/test-react-bundle
 * Test React bundling with multi-file project
 */
export async function GET() {
  // Create test React project structure
  const testFiles: WorkspaceFile[] = [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "css-loading-spinners",
        version: "1.0.0",
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        }
      }, null, 2),
      language: "json"
    },
    {
      path: "src/App.js",
      content: `import React from 'react';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <h1>CSS Loading Spinners</h1>
      <div className="spinner"></div>
    </div>
  );
}`,
      language: "javascript"
    },
    {
      path: "src/styles.css",
      content: `.app {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}`,
      language: "css"
    }
  ];

  const settings: WorkspaceSettings = {
    runtime: "react",
    entryPoint: "src/App.js",
    autoSave: true,
    fontSize: 14
  };

  try {
    console.log('[test] Testing React bundler with multi-file project...');
    const result = await runWorkspace(testFiles, settings);
    
    return NextResponse.json({
      success: true,
      preview: result.preview,
      logs: result.logs,
      error: result.error,
      meta: {
        filesCount: testFiles.length,
        hasPreview: !!result.preview,
        previewLength: result.preview?.length || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
