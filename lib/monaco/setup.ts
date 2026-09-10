/**
 * Monaco Editor Setup - Language Intelligence Configuration
 * Uses @monaco-editor/react which auto-configures workers
 */

import { loader } from "@monaco-editor/react";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import MonacoJSXHighlighter, { makeBabelParse } from "monaco-jsx-highlighter";

const configuredMonacoInstances = new WeakSet<object>();

export function attachJSXHighlighter(monaco: any, editor: any): () => void {
  const highlighter = new MonacoJSXHighlighter(
    monaco,
    makeBabelParse(parse, true),
    traverse,
    editor
  );
  return highlighter.highlightOnDidChangeModelContent(100, undefined, () => {}, undefined, () => {});
}

/**
 * Configure TypeScript/JavaScript for JSX support
 * Note: Called after monaco is loaded
 */
export function configureJSXSupport(monaco: any) {
  if (configuredMonacoInstances.has(monaco)) return;

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

    // Add comprehensive React type definitions
    const reactDts = `
      /// <reference path="react.d.ts" />
      declare module 'react' {
        export = React;
        export as namespace React;
      }
      
      declare namespace React {
        // React Elements
        interface ReactElement<P = any, T = string | ComponentType<P>> {
          type: T;
          props: P;
          key: Key | null;
        }
        
        type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
        interface FunctionComponent<P = {}> {
          (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
        }
        interface ComponentClass<P = {}> {
          new(props: P, context?: any): Component<P>;
        }
        
        // Hooks
        function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
        function useEffect(effect: EffectCallback, deps?: DependencyList): void;
        function useRef<T>(initialValue: T): MutableRefObject<T>;
        function useMemo<T>(factory: () => T, deps: DependencyList): T;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
        function useReducer<S, A>(reducer: (prevState: S, action: A) => S, initialArg: S, init?: (s: S) => S): [S, Dispatch<A>];
        function useContext<T>(context: Context<T>): T;
        function useImperativeHandle<T, R extends T>(ref: Ref<T> | undefined, init: () => R, deps?: DependencyList): void;
        function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void;
        function useDebugValue<T>(value: T, format?: (value: T) => any): void;
        
        // Types
        type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
        type ReactChild = string | number | ReactElement<any, any>;
        type ReactFragment = {} | ReactNodeArray;
        interface ReactNodeArray extends Array<ReactNode> {}
        interface ReactPortal extends ReactElement {}
        
        type Key = string | number;
        type Ref<T> = { current: T } | ((instance: T) => void);
        type Dispatch<A> = (value: A) => void;
        type SetStateAction<S> = S | ((prevState: S) => S);
        type DependencyList = readonly any[];
        type EffectCallback = () => void | (() => void);
        
        interface MutableRefObject<T> {
          current: T;
        }
        
        interface FunctionComponent<P = {}> {
          (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
          displayName?: string;
        }
        
        interface FC<P = {}> extends FunctionComponent<P> {}
        
        // Component
        abstract class Component<P, S = {}> {
          constructor(props: P, context?: any);
          props: Readonly<P> & Readonly<{ children?: ReactNode }>;
          state: Readonly<S>;
          setState<K extends keyof S>(state: Pick<S, K> | null | ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | null), callback?: () => any): void;
          forceUpdate(callback?: () => void): void;
          render(): ReactNode;
        }
        
        // createElement
        function createElement<P extends {}>(
          type: string | FunctionComponent<P> | ComponentClass<P>,
          props?: P & { key?: Key; ref?: Ref<any> } | null,
          ...children: ReactNode[]
        ): ReactElement<P>;
        
        // Fragment
        const Fragment: unique symbol;
        function Fragment(props: { children?: ReactNode }): ReactElement<any>;
        
        // Context
        interface Context<T> {
          Provider: Provider<T>;
          Consumer: Consumer<T>;
          displayName?: string;
        }
        interface Provider<T> {
          (props: { value: T; children?: ReactNode }): ReactElement<any>;
        }
        interface Consumer<T> {
          (props: { children: (value: T) => ReactNode }): ReactElement<any>;
        }
        function createContext<T>(defaultValue: T): Context<T>;
      }
      
      // Global React hooks (when imported without named import)
      declare const useState: typeof React.useState;
      declare const useEffect: typeof React.useEffect;
      declare const useRef: typeof React.useRef;
      declare const useMemo: typeof React.useMemo;
      declare const useCallback: typeof React.useCallback;
      declare const useReducer: typeof React.useReducer;
      declare const useContext: typeof React.useContext;
      declare const useImperativeHandle: typeof React.useImperativeHandle;
      declare const useLayoutEffect: typeof React.useLayoutEffect;
      declare const useDebugValue: typeof React.useDebugValue;
      declare const createContext: typeof React.createContext;
      declare const createElement: typeof React.createElement;
      declare const Fragment: typeof React.Fragment;
      
      // FC type alias
      declare type FC<P = {}> = React.FC<P>;
      declare type FunctionComponent<P = {}> = React.FunctionComponent<P>;
      declare type ReactElement = React.ReactElement;
      declare type ReactNode = React.ReactNode;

      declare namespace JSX {
        type Element = React.ReactElement<any, any>;
        interface ElementClass extends React.Component<any> {
          render(): React.ReactNode;
        }
        interface IntrinsicElements {
          [elementName: string]: any;
        }
      }
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(reactDts, "file:///node_modules/@types/react/index.d.ts");
    monaco.languages.typescript.javascriptDefaults.addExtraLib(reactDts, "file:///node_modules/@types/react/index.d.ts");

    // Add DOM types for better suggestions
    const domDts = `
      declare interface Window {
        React: typeof React;
      }
      
      declare interface HTMLElement {
        onclick: ((event: MouseEvent) => void) | null;
        onchange: ((event: Event) => void) | null;
        oninput: ((event: Event) => void) | null;
      }
    `;
    
    monaco.languages.typescript.typescriptDefaults.addExtraLib(domDts, "file:///node_modules/@types/react/dom.d.ts");
    monaco.languages.typescript.javascriptDefaults.addExtraLib(domDts, "file:///node_modules/@types/react/dom.d.ts");

    // Enable validation with all checks
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [] // Don't ignore any errors
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [] // Don't ignore any errors
    });

    // Enable semantic highlighting for TypeScript
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
      // Enable additional features
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
    });

    configuredMonacoInstances.add(monaco);
    console.log("[Monaco] JSX support configured with full React types and semantic highlighting");
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


