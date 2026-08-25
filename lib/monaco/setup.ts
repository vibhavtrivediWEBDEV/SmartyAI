/**
 * Monaco Editor Setup - Language Intelligence Configuration
 * Uses @monaco-editor/react which auto-configures workers
 */

import { loader } from "@monaco-editor/react";

/**
 * Configure TypeScript/JavaScript for JSX support
 * Note: Called after monaco is loaded
 */
export function configureJSXSupport(monaco: any) {
  try {
    // Configure TypeScript compiler options for JSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: true,
      noEmit: true,
      resolveJsonModule: true,
    });

    // Configure JavaScript for JSX
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      allowNonTsExtensions: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: false, // Less strict for JS
      noEmit: true,
      resolveJsonModule: true,
    });

    // Add React type definitions
    const reactDts = `
      declare namespace React {
        function createElement(type: any, props?: any, ...children: any[]): any;
        function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void];
        function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        function useRef<T>(initial: T): { current: T };
        function useMemo<T>(factory: () => T, deps: any[]): T;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
      }
      declare const React: typeof React;
      declare const useState: typeof React.useState;
      declare const useEffect: typeof React.useEffect;
      declare const useRef: typeof React.useRef;
      declare const useMemo: typeof React.useMemo;
      declare const useCallback: typeof React.useCallback;
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(reactDts, "react.d.ts");
    monaco.languages.typescript.javascriptDefaults.addExtraLib(reactDts, "react.d.ts");

    // Enable validation
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    console.log("[Monaco] JSX support configured");
  } catch (error) {
    console.error("[Monaco] Failed to configure JSX support:", error);
  }
}

/**
 * Initialize Monaco with proper configuration
 * Call this once at app startup
 */
export function initializeMonaco() {
  // Configure Monaco loader
  loader.init().then((monaco: any) => {
    console.log("[Monaco] Editor initialized");
    
    // Configure JSX support after monaco loads
    configureJSXSupport(monaco);
  }).catch((error: any) => {
    console.error("[Monaco] Failed to initialize:", error);
  });
}

/**
 * Get language ID from file path
 */
export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",
    json: "json",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    java: "java",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    txt: "plaintext",
  };
  
  return languageMap[ext] || "plaintext";
}

/**
 * Create a Monaco model URI for a workspace file
 */
export function createModelUri(projectId: string, filePath: string): any {
  // Dynamic import to avoid type issues
  return {
    toString: () => `smarty://project/${projectId}/${filePath}`,
  };
}

/**
 * Setup workspace models for multi-file support
 * Returns a map of file paths to Monaco models
 */
export function setupWorkspaceModels(
  projectId: string,
  files: Array<{ path: string; content: string; language: string }>
): Map<string, any> {
  const models = new Map<string, any>();
  
  // Note: This will be called from the editor mount callback
  // where monaco instance is available
  console.log(`[Monaco] Setup models for project ${projectId}, ${files.length} files`);
  
  return models;
}

/**
 * Clean up workspace models
 */
export function cleanupWorkspaceModels(projectId: string) {
  console.log(`[Monaco] Cleanup models for project ${projectId}`);
  // Models will be cleaned up when editor unmounts
}

/**
 * Register workspace libraries for TS/JS intellisense
 * Allows import resolution across files in the same workspace
 */
export function registerWorkspaceLibraries(
  projectId: string,
  files: Array<{ path: string; content: string }>
) {
  console.log(`[Monaco] Register libraries for project ${projectId}`);
  // This will be configured after monaco loads
}


