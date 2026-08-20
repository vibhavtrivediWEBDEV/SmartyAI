/**
 * Custom hook for managing workspace state with backend synchronization
 * Replaces localStorage with MongoDB backend
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { 
  WorkspaceFile, 
  WorkspaceSettings, 
  ConsoleLogEntry,
  SerializedWorkspace 
} from "@/lib/types/workspace";

interface UseWorkspaceOptions {
  workspaceId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number; // ms
}

interface UseWorkspaceReturn {
  // State
  workspace: SerializedWorkspace | null;
  files: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  settings: WorkspaceSettings | null;
  logs: ConsoleLogEntry[];
  isLoading: boolean;
  isSaving: boolean;
  isRunning: boolean;
  preview: string;
  hasUnsavedChanges: boolean;
  error: string | null;

  // Actions
  loadWorkspace: (id: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => Promise<void>;
  setActiveFile: (path: string) => void;
  save: () => Promise<void>;
  run: () => Promise<void>;
  clearConsole: () => void;
  updateSettings: (updates: Partial<WorkspaceSettings>) => void;
}

/**
 * Generate unique ID
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get language from file path
 */
function inferLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    txt: "plaintext",
  };
  return languageMap[ext] || "plaintext";
}

/**
 * Hook for workspace management
 */
export function useWorkspace(options: UseWorkspaceOptions = {}): UseWorkspaceReturn {
  const { workspaceId, autoSave = true, autoSaveDelay = 1000 } = options;

  // State
  const [workspace, setWorkspace] = useState<SerializedWorkspace | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef<Map<string, string>>(new Map());

  /**
   * Load workspace from backend
   */
  const loadWorkspace = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load workspace");
      }

      const workspace = result.data;
      setWorkspace(workspace);
      setFiles(workspace.files);
      setSettings(workspace.settings);

      // Set entry point as active file
      const entryPoint = workspace.settings.entryPoint;
      const entryFile = workspace.files.find((f: WorkspaceFile) => f.path === entryPoint);
      setActiveFile(entryFile || workspace.files[0] || null);

      // Reset unsaved changes
      setHasUnsavedChanges(false);
      lastSavedContent.current.clear();
      workspace.files.forEach((file: WorkspaceFile) => {
        lastSavedContent.current.set(file.path, file.content);
      });

      // Add console log
      addLog("info", `Workspace "${workspace.name}" loaded`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load workspace";
      setError(message);
      addLog("error", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add console log
   */
  const addLog = useCallback((type: ConsoleLogEntry["type"], message: string) => {
    setLogs(prev => [
      ...prev.slice(-99), // Keep last 100 logs
      {
        id: generateLogId(),
        type,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  /**
   * Create new file
   */
  const createFile = useCallback(async (path: string, content: string = "") => {
    const language = inferLanguage(path);
    const newFile: WorkspaceFile = {
      path,
      content,
      language,
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
    setHasUnsavedChanges(true);

    // Save to backend if workspace exists
    if (workspace) {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            file: newFile,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create file");
        }

        addLog("log", `Created ${path}`);
      } catch (err) {
        addLog("error", `Failed to create ${path}`);
      }
    }
  }, [workspace, addLog]);

  /**
   * Update file content (local)
   */
  const updateFile = useCallback((path: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.path === path ? { ...f, content } : f
    ));

    if (activeFile?.path === path) {
      setActiveFile(prev => prev ? { ...prev, content } : null);
    }

    setHasUnsavedChanges(true);

    // Auto-save after delay
    if (autoSave && workspace) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(async () => {
        await saveFile(path, content);
      }, autoSaveDelay);
    }
  }, [activeFile, autoSave, workspace, autoSaveDelay]);

  /**
   * Save single file to backend
   */
  const saveFile = async (path: string, content: string) => {
    if (!workspace) return;

    // Check if content changed
    if (lastSavedContent.current.get(path) === content) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          path,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      lastSavedContent.current.set(path, content);
      
      // Check if all files are saved
      const allSaved = files.every(f => 
        lastSavedContent.current.get(f.path) === f.content
      );
      
      if (allSaved) {
        setHasUnsavedChanges(false);
      }

      addLog("log", `Saved ${path}`);
    } catch (err) {
      addLog("error", `Failed to save ${path}`);
    }
  };

  /**
   * Delete file
   */
  const deleteFile = useCallback(async (path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path));

    if (activeFile?.path === path) {
      setActiveFile(files.find(f => f.path !== path) || null);
    }

    setHasUnsavedChanges(true);

    if (workspace) {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete",
            path,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete file");
        }

        addLog("log", `Deleted ${path}`);
      } catch (err) {
        addLog("error", `Failed to delete ${path}`);
      }
    }
  }, [workspace, activeFile, files, addLog]);

  /**
   * Manually save all changes
   */
  const save = useCallback(async () => {
    if (!workspace || !hasUnsavedChanges) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save workspace");
      }

      // Update last saved content
      lastSavedContent.current.clear();
      files.forEach(file => {
        lastSavedContent.current.set(file.path, file.content);
      });

      setHasUnsavedChanges(false);
      addLog("log", "Workspace saved");
    } catch (err) {
      addLog("error", "Failed to save workspace");
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [workspace, files, hasUnsavedChanges, addLog]);

  /**
   * Run workspace
   */
  const run = useCallback(async () => {
    if (!workspace) return;

    setIsRunning(true);
    setLogs([]); // Clear console
    addLog("info", "Running...");

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/run`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Run failed");
      }

      setPreview(result.preview);

      // Add logs from execution
      if (result.logs) {
        result.logs.forEach((log: ConsoleLogEntry) => {
          setLogs(prev => [...prev, log]);
        });
      }

      addLog("log", "Execution complete");
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : "Run failed");
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setIsRunning(false);
    }
  }, [workspace, addLog]);

  /**
   * Clear console
   */
  const clearConsole = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates: Partial<WorkspaceSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Set active file by path
   */
  const setFileByPath = useCallback((path: string) => {
    const file = files.find(f => f.path === path) || null;
    setActiveFile(file);
  }, [files]);

  /**
   * Auto-load workspace if ID provided
   */
  useEffect(() => {
    if (workspaceId) {
      loadWorkspace(workspaceId);
    }
  }, [workspaceId, loadWorkspace]);

  /**
   * Cleanup auto-save timer
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  /**
   * Listen for console messages from preview iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        addLog(event.data.logType, event.data.message);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addLog]);

  return {
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
    setActiveFile: setFileByPath,
    save,
    run,
    clearConsole,
    updateSettings,
  };
}
