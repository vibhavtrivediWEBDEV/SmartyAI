/**
 * Workspace Editor - BuildUForward-style Project Workspace
 * Full backend MongoDB persistence
 * Integrates with existing SmartyAI VS Code UI
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Folder,
  Plus,
  X,
  Play,
  ChevronRight,
  ChevronDown,
  Code,
  Terminal,
  Save,
  Loader2,
  RefreshCw,
  Settings,
  Download,
  Share2,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getLanguageFromExtension, getFileIconColor } from "@/lib/utils/language";

// ============ TYPES ============
interface WorkspaceEditorProps {
  workspaceId?: string;
  openPreviewWindow?: (htmlContent: string, title?: string) => void;
}

// ============ CONSTANTS ============
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_CONSOLE_HEIGHT = 80;
const MAX_CONSOLE_HEIGHT = 400;
const DEFAULT_CONSOLE_HEIGHT = 160;

// ============ COMPONENT ============
export default function WorkspaceEditor({ 
  workspaceId, 
  openPreviewWindow 
}: WorkspaceEditorProps) {
  const {
    workspace,
    files,
    activeFile,
    settings,
    logs,
    isLoading,
    isSaving,
    isRunning,
    preview,
    hasUnsavedChanges,
    error,
    loadWorkspace,
    createFile,
    updateFile,
    deleteFile,
    setActiveFile,
    save,
    run,
    clearConsole,
    updateSettings,
  } = useWorkspace({ workspaceId, autoSave: true });

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Drag handlers
  const handleSidebarDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingSidebar) return;
    const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
    setSidebarWidth(newWidth);
  }, [isDraggingSidebar]);

  const handleConsoleDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingConsole || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const distanceFromBottom = containerRect.bottom - e.clientY;
    const newHeight = Math.min(MAX_CONSOLE_HEIGHT, Math.max(MIN_CONSOLE_HEIGHT, distanceFromBottom));
    setConsoleHeight(newHeight);
  }, [isDraggingConsole]);

  const stopDragging = useCallback(() => {
    setIsDraggingSidebar(false);
    setIsDraggingConsole(false);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) handleSidebarDrag(e);
      else if (isDraggingConsole) handleConsoleDrag(e);
    };

    if (isDraggingSidebar || isDraggingConsole) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopDragging);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDragging);
      if (!isDraggingSidebar && !isDraggingConsole) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [isDraggingSidebar, isDraggingConsole, handleSidebarDrag, handleConsoleDrag, stopDragging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save, run]);

  // File icon
  const getFileIcon = (filename: string) => {
    const color = getFileIconColor(filename);
    return <FileText size={16} style={{ color }} className="flex-shrink-0" />;
  };

  // Handle file creation
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const path = newFileName.includes(".") ? newFileName : `${newFileName}.jsx`;
    await createFile(path);
    setNewFileName("");
    setIsCreatingFile(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#007acc]" />
          <p className="mt-4 text-sm text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !workspace) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/10 p-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => loadWorkspace(workspaceId!)}
            className="mt-4 rounded-lg bg-[#007acc] px-4 py-2 text-sm text-white hover:bg-[#005a9e]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
        <div className="flex items-center gap-2">
          <Code size={18} className="text-[#007acc]" />
          <span className="text-sm font-medium text-gray-200">
            {workspace?.name || "Untitled Workspace"}
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-gray-500">•</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Save</span>
          </button>

          <button
            onClick={run}
            disabled={isRunning}
            className="flex items-center gap-1 rounded bg-[#007acc] px-3 py-1 text-xs font-medium text-white hover:bg-[#005a9e] disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div
            className="flex flex-col border-r border-[#2d2d2d] bg-[#252526]"
            style={{ width: sidebarWidth }}
          >
            {/* File explorer header */}
            <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] px-3">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Explorer
              </span>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="rounded p-1 hover:bg-[#2a2d2e]"
                title="New file"
              >
                <Plus size={14} className="text-gray-400" />
              </button>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto">
              {isCreatingFile && (
                <div className="flex items-center gap-1 border-b border-[#2d2d2d] bg-[#1e1e1e] px-2 py-1">
                  <FileText size={14} className="text-gray-400" />
                  <input
                    ref={fileInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFile();
                      if (e.key === "Escape") {
                        setIsCreatingFile(false);
                        setNewFileName("");
                      }
                    }}
                    onBlur={handleCreateFile}
                    placeholder="filename.jsx"
                    className="flex-1 bg-transparent text-sm text-gray-200 outline-none"
                    autoFocus
                  />
                </div>
              )}

              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setActiveFile(file.path)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] ${
                    activeFile?.path === file.path ? "bg-[#37373d]" : ""
                  }`}
                >
                  {getFileIcon(file.path)}
                  <span className="flex-1 truncate text-sm text-gray-200">
                    {file.path}
                  </span>
                  {file.path === activeFile?.path && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.path);
                      }}
                      className="rounded p-0.5 opacity-0 hover:bg-[#2a2d2e] group-hover:opacity-100"
                    >
                      <X size={12} className="text-gray-500 hover:text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={() => setIsDraggingSidebar(true)}
              className="absolute right-0 top-0 h-full w-1 cursor-ew-resize hover:bg-[#007acc]"
            />
          </div>
        )}

        {/* Editor + Preview */}
        <div className="flex flex-1 flex-col">
          {/* Tabs */}
          {activeFile && (
            <div className="flex h-9 items-center border-b border-[#2d2d2d] bg-[#252526]">
              <div className="flex items-center gap-2 border-r border-[#2d2d2d] bg-[#1e1e1e] px-3">
                {getFileIcon(activeFile.path)}
                <span className="text-sm text-gray-200">{activeFile.path}</span>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={(value) => {
                  if (value !== undefined) {
                    updateFile(activeFile.path, value);
                  }
                }}
                theme="vs-dark"
                options={{
                  automaticLayout: true,
                  minimap: { enabled: true },
                  fontSize: settings?.fontSize || 14,
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  lineNumbers: "on",
                  wordWrap: "on",
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FileText className="mx-auto h-16 w-16 text-gray-600" />
                  <p className="mt-4 text-sm text-gray-500">Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        {preview && (
          <div className="flex w-1/2 flex-col border-l border-[#2d2d2d]">
            <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Preview
              </span>
              {openPreviewWindow && (
                <button
                  onClick={() => openPreviewWindow(preview, `Preview - ${workspace?.name}`)}
                  className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e]"
                >
                  Open in Window
                </button>
              )}
            </div>
            <iframe
              ref={previewRef}
              srcDoc={preview}
              className="flex-1 bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
            />
          </div>
        )}
      </div>

      {/* Console */}
      {showConsole && (
        <div
          className="flex flex-col border-t border-[#2d2d2d] bg-[#1e1e1e]"
          style={{ height: consoleHeight }}
        >
          {/* Console header */}
          <div className="flex h-8 items-center justify-between border-b border-[#2d2d2d] px-3">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#007acc]" />
              <span className="text-xs font-medium text-gray-400">Console</span>
              <span className="rounded bg-[#2d2d2d] px-1.5 text-xs text-gray-500">
                {logs.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearConsole}
                className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-[#2a2d2e]"
              >
                Clear
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="rounded p-1 hover:bg-[#2a2d2e]"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Console output */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 py-0.5 ${
                  log.type === "error"
                    ? "text-red-400"
                    : log.type === "warn"
                    ? "text-yellow-400"
                    : log.type === "info"
                    ? "text-blue-400"
                    : "text-gray-300"
                }`}
              >
                <span className="shrink-0 text-gray-600">{log.timestamp.split("T")[1]?.split(".")[0]}</span>
                <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={() => setIsDraggingConsole(true)}
            className="absolute right-0 bottom-0 left-0 h-1 cursor-ns-resize hover:bg-[#007acc]"
          />
        </div>
      )}

      {/* Console toggle */}
      {!showConsole && (
        <button
          onClick={() => setShowConsole(true)}
          className="absolute bottom-2 right-2 flex items-center gap-2 rounded bg-[#252526] px-3 py-1.5 text-xs text-gray-400 shadow-lg hover:bg-[#2a2d2e]"
        >
          <Terminal size={14} />
          <span>Show Console</span>
        </button>
      )}
    </div>
  );
}
