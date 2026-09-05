/**
 * VS Code with Workspace - BuildUForward-style Editor
 * Features:
 * - Multi-file Monaco with stable models
 * - Real nested file tree
 * - Closable file tabs
 * - Inline resizable preview panel
 * - Console in bottom panel + inline tab
 * - MongoDB persistence
 * - Proper language intelligence (workers, Emmet, JSX)
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  FileText,
  Folder,
  Plus,
  X,
  Play,
  Code,
  Terminal,
  Save,
  Loader2,
  RefreshCw,
  Package,
  Monitor,
  ChevronDown,
  Settings,
  ListTodo,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Wrench,
  WandSparkles,
  Check,
  Bot,
  GitBranch,
  PanelBottom,
} from 'lucide-react';
import FileTree from './FileTree';
import { CareerTaskMeta, useCareerClock } from '../Desktop/CareerTaskMeta';
import { getCareerTaskTiming, groupCareerTasks, prepareCareerTaskLaunch, type CareerTaskItem } from '../Desktop/careerTaskGroups';
import { getLanguageFromExtension } from '@/lib/utils/language';
import { configureJSXSupport } from '@/lib/monaco/setup';
import { playById } from '@/lib/sound';

// Emmet support for Monaco
import { emmetHTML, emmetCSS, emmetJSX } from 'emmet-monaco-es';

// Dynamically import Monaco Editor with SSR disabled
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="h-8 w-8 animate-spin text-[#007acc]" />
    </div>
  ),
});

// ============ TYPES ============
interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
  lastModified?: Date;
}

interface Workspace {
  id: string;
  name: string;
  files: WorkspaceFile[];
  packageJson?: Record<string, any>;
  settings: {
    runtime: string;
    entryPoint: string;
  };
  lastAccessedAt: string;
}

interface WorkspaceSummary {
  id: string;
  name: string;
  fileCount: number;
  lastAccessedAt: string;
}

interface ConsoleLog {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'success';
  message: string;
  time: string;
}

interface OpenFile {
  path: string;
  hasUnsavedChanges: boolean;
}

type AIAssistantAction = 'explain' | 'fix' | 'generate';

interface VSCodeWithWorkspaceProps {
  openPreviewWindow?: (htmlContent: string, title?: string) => void;
  initialWorkspaceId?: string;
  initialFile?: string;
  initialCareerTask?: CareerTaskItem;
}

// ============ CONSTANTS ============
const MIN_EDITOR_WIDTH = 300;
const MAX_EDITOR_WIDTH = 1200;
const DEFAULT_EDITOR_WIDTH_PERCENT = 60;
const MIN_SIDEBAR_WIDTH = 210;
const MAX_SIDEBAR_WIDTH = 440;
const MIN_AI_WIDTH = 280;
const MAX_AI_WIDTH = 560;
const MIN_CONSOLE_HEIGHT = 120;
const MAX_CONSOLE_HEIGHT = 460;

// ============ COMPONENT ============
export default function VSCodeWithWorkspace({ openPreviewWindow, initialWorkspaceId, initialFile, initialCareerTask }: VSCodeWithWorkspaceProps) {
  // Workspace State
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Open Files State (Multi-file)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const fileContentsRef = useRef<Map<string, string>>(new Map());
  const editedCareerTaskIdsRef = useRef<Set<string>>(new Set());
  const attemptedCareerTaskIdsRef = useRef<Set<string>>(new Set());

  // Monaco State
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const modelsRef = useRef<Map<string, any>>(new Map());
  const shellRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Preview State
  const [previewMode, setPreviewMode] = useState<'new-window' | 'inline'>('new-window');
  const [preview, setPreview] = useState<string>('');
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false); // Track if preview window is open
  const previewRefreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const [editorWidth, setEditorWidth] = useState<number>(DEFAULT_EDITOR_WIDTH_PERCENT);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  
  // Console State
  const [showConsole, setShowConsole] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(160);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'console' | 'browser'>('console');

  // UI State
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [aiPanelWidth, setAIPanelWidth] = useState(340);
  const [activeResize, setActiveResize] = useState<'sidebar' | 'ai' | 'console' | null>(null);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('react');
  const [explorerMode, setExplorerMode] = useState<'files' | 'tasks'>('files');
  const [careerTasks, setCareerTasks] = useState<CareerTaskItem[]>([]);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAction, setAIAction] = useState<AIAssistantAction>('explain');
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiResult, setAIResult] = useState<{ summary: string; code?: string; provider?: string; model?: string } | null>(null);
  const [isAIWorking, setIsAIWorking] = useState(false);
  const aiTargetRef = useRef<{ path: string; range: any } | null>(null);
  const now = useCareerClock();
  const codingTaskGroups = useMemo(() => {
    const codingTasks = careerTasks.filter((task) => task.type === 'coding' || task.id === initialCareerTask?.id);
    if (initialCareerTask && !codingTasks.some((task) => task.id === initialCareerTask.id)) {
      codingTasks.push(initialCareerTask);
    }
    return groupCareerTasks(codingTasks, now);
  }, [careerTasks, initialCareerTask, now]);

  useEffect(() => {
    if (initialCareerTask) setExplorerMode('tasks');
  }, [initialCareerTask]);

  // Project Templates
  const PROJECT_TEMPLATES = [
    { id: 'react', name: 'React (JavaScript)', icon: '⚛️', description: 'Modern React app with hooks' },
    { id: 'react-ts', name: 'React (TypeScript)', icon: '📘', description: 'Type-safe React application' },
    { id: 'html', name: 'HTML/CSS/JS', icon: '🌐', description: 'Simple web project' },
    { id: 'node', name: 'JavaScript / Node.js', icon: '🟢', description: 'Runnable JavaScript starter' },
    { id: 'typescript', name: 'TypeScript / Node.js', icon: 'TS', description: 'Runnable typed starter' },
    { id: 'python', name: 'Python', icon: '🐍', description: 'Python scripts and backend' },
    { id: 'java', name: 'Java', icon: '☕', description: 'Java application' },
    { id: 'sql', name: 'SQL Playground', icon: 'DB', description: 'SQL query practice' },
    { id: 'mongodb', name: 'MongoDB Pipeline', icon: 'MDB', description: 'Aggregation pipeline practice' },
  ];

  // ============ LOAD WORKSPACES ============
  useEffect(() => {
    loadWorkspaces();
  }, [initialWorkspaceId]);

  useEffect(() => {
    const loadCareerTasks = async () => {
      const response = await fetch('/api/career/tasks');
      if (!response.ok) return;
      const result = await response.json();
      setCareerTasks(Array.isArray(result.tasks) ? result.tasks : []);
    };
    void loadCareerTasks();
    const handleProgress = () => void loadCareerTasks();
    window.addEventListener('career-progress', handleProgress);
    return () => window.removeEventListener('career-progress', handleProgress);
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      let requestedWorkspaceId = initialWorkspaceId;
      let requestedFile = initialFile;
      if (initialCareerTask) {
        const launchArgs = await prepareCareerTaskLaunch(initialCareerTask);
        if (typeof launchArgs.workspaceId === 'string') requestedWorkspaceId = launchArgs.workspaceId;
        if (typeof launchArgs.initialFile === 'string') requestedFile = launchArgs.initialFile;
      }

      const response = await fetch('/api/workspaces');
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        setWorkspaces(result.data);
        const workspaceId = requestedWorkspaceId || result.data[0].id;
        await loadWorkspace(workspaceId, requestedFile);
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspace = async (workspaceId: string, requestedFileOverride?: string) => {
    const response = await fetch(`/api/workspaces/${workspaceId}`);
    const result = await response.json();
    if (!response.ok || !result.data) throw new Error(result.error || 'Failed to load workspace');

    const workspace: Workspace = result.data;
    if (activeWorkspace) cleanupModelsForWorkspace(activeWorkspace.id);
    setActiveWorkspace(workspace);
    setOpenFiles([]);
    setupModelsForWorkspace(workspace);

    const requestedFile = requestedFileOverride || initialFile || initialCareerTask?.result?.filePath;
    const exerciseFiles = workspace.files.filter((file) => file.path.startsWith('exercises/'));
    const indexedFile = exerciseFiles[initialCareerTask?.result?.exerciseIndex ?? -1];
    const firstFile = workspace.files.find((file) => file.path === requestedFile) || indexedFile || workspace.files[0];
    setActiveFilePath(firstFile?.path || null);
    if (firstFile) setOpenFiles([{ path: firstFile.path, hasUnsavedChanges: false }]);
    return workspace;
  };

  // ============ MONACO MODEL MANAGEMENT ============
  const setupModelsForWorkspace = (workspace: Workspace) => {
    // Store file contents
    workspace.files.forEach(file => {
      fileContentsRef.current.set(file.path, file.content);
    });
    
    // Create Monaco models if Monaco is loaded
    if (monacoRef.current && editorRef.current) {
      const monaco = monacoRef.current;
      
      // Create models for each file with proper language
      workspace.files.forEach(file => {
        const uri = monaco.Uri.parse(`smarty://workspace/${workspace.id}/${file.path}`);
        const existingModel = modelsRef.current.get(file.path);
        if (existingModel && existingModel.uri.toString() !== uri.toString()) {
          existingModel.dispose();
          modelsRef.current.delete(file.path);
        }
        if (!modelsRef.current.has(file.path)) {
          const language = file.language || getLanguageFromExtension(file.path);
          const model = monaco.editor.createModel(file.content, language, uri);
          modelsRef.current.set(file.path, model);
        }
      });
      
      console.log(`[Monaco] Created ${workspace.files.length} models for workspace:`, workspace.name);
    }
  };

  const cleanupModelsForWorkspace = (_workspaceId: string) => {
    modelsRef.current.forEach(model => model.dispose());
    modelsRef.current.clear();
    fileContentsRef.current.clear();
  };

  // ============ FILE OPERATIONS ============
  const openFile = (path: string, workspace?: Workspace) => {
    const ws = workspace || activeWorkspace;
    if (!ws) return;

    const file = ws.files.find(f => f.path === path);
    if (!file) return;

    // Track unsaved changes
    if (!openFiles.find(f => f.path === path)) {
      setOpenFiles(prev => [...prev, { path, hasUnsavedChanges: false }]);
    }

    setActiveFilePath(path);

    // Switch Monaco model
    if (editorRef.current && modelsRef.current.has(path)) {
      editorRef.current.setModel(modelsRef.current.get(path)!);
    }
  };

  const closeFile = (path: string) => {
    // Check for unsaved changes
    const openFile = openFiles.find(f => f.path === path);
    if (openFile?.hasUnsavedChanges) {
      if (!confirm(`Close ${path} with unsaved changes?`)) {
        return;
      }
    }

    setOpenFiles(prev => prev.filter(f => f.path !== path));
    
    // If closing active file, switch to another
    if (activeFilePath === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      if (remaining.length > 0) {
        setActiveFilePath(remaining[remaining.length - 1].path);
        if (editorRef.current && modelsRef.current.has(remaining[remaining.length - 1].path)) {
          editorRef.current.setModel(modelsRef.current.get(remaining[remaining.length - 1].path)!);
        }
      } else {
        setActiveFilePath(null);
        if (editorRef.current) {
          editorRef.current.setModel(null);
        }
      }
    }

    // Restore saved content
    const file = activeWorkspace?.files.find(f => f.path === path);
    if (file && modelsRef.current.has(path)) {
      modelsRef.current.get(path)!.setValue(file.content);
      fileContentsRef.current.set(path, file.content);
    }
  };

  // Track content changes without auto-saving
  const careerTaskForFile = (path: string) => {
    const tasks = initialCareerTask
      ? [initialCareerTask, ...careerTasks.filter(task => task.id !== initialCareerTask.id)]
      : careerTasks;
    return tasks.find(task =>
      (!task.result?.workspaceId || task.result.workspaceId === activeWorkspace?.id)
      && (!task.result?.filePath || task.result.filePath === path)
    );
  };

  const updateFileContent = (path: string, content: string) => {
    // Update local content
    fileContentsRef.current.set(path, content);
    const careerTask = careerTaskForFile(path);
    if (careerTask) editedCareerTaskIdsRef.current.add(careerTask.id);
    
    // Mark as unsaved
    setOpenFiles(prev => {
      const file = prev.find(item => item.path === path);
      if (!file || file.hasUnsavedChanges) return prev;
      return prev.map(item => item.path === path ? { ...item, hasUnsavedChanges: true } : item);
    });
  };

  const saveFile = async (path: string, content: string): Promise<boolean> => {
    if (!activeWorkspace) {
      console.error('❌ No active workspace loaded');
      addConsoleLog('error', 'No active workspace loaded');
      return false;
    }

    console.log('💾 Saving to MongoDB:', { path, workspaceId: activeWorkspace.id });
    setIsSaving(true);
    addConsoleLog('info', `Saving ${path}...`);
    
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          path,
          content,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Saved to MongoDB:', result);
        
        // Update local workspace state
        setActiveWorkspace(prev => {
          if (!prev) return prev;
          const fileIndex = prev.files.findIndex(f => f.path === path);
          const updatedFiles = [...prev.files];
          
          if (fileIndex >= 0) {
            // Update existing file
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              content,
              lastModified: new Date(),
            };
          } else {
            // Add new file
            updatedFiles.push({
              path,
              content,
              language: getLanguageFromExtension(path),
              lastModified: new Date(),
            });
          }
          
          return { ...prev, files: updatedFiles };
        });
        
        // Mark as saved
        setOpenFiles(prev => 
          prev.map(f => f.path === path ? { ...f, hasUnsavedChanges: false } : f)
        );
        
        addConsoleLog('success', `✓ Saved ${path} to MongoDB`);
        
        // Auto-refresh preview if active (only for frontend files)
        const isFrontendFile = path.endsWith('.html') || path.endsWith('.css') || 
                               path.endsWith('.js') || path.endsWith('.jsx') || 
                               path.endsWith('.tsx');
        
        const isBackendFile = path.endsWith('.py') || path.endsWith('.java') || path.endsWith('.ts');
        
        if (isPreviewActive && isFrontendFile) {
          addConsoleLog('info', 'Auto-refreshing preview...');
          
          // Clear previous timeout
          if (previewRefreshTimeout.current) {
            clearTimeout(previewRefreshTimeout.current);
          }
          
          // Debounced refresh (800ms after save)
          previewRefreshTimeout.current = setTimeout(() => {
            runCode(); // Re-run the preview
          }, 800);
        } else if (isBackendFile) {
          addConsoleLog('info', 'Backend file saved - no preview refresh needed');
        }
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Save failed:', error);
        addConsoleLog('error', `Failed to save ${path}: ${error.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      addConsoleLog('error', `Failed to save ${path}: Network error`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllFiles = async (): Promise<boolean> => {
    if (!activeWorkspace || isSaving) return false;
    const dirtyFiles = openFiles
      .filter(file => file.hasUnsavedChanges)
      .map(file => ({ path: file.path, content: fileContentsRef.current.get(file.path) ?? '' }));
    if (dirtyFiles.length === 0) {
      addConsoleLog('info', 'All open files are already saved');
      return true;
    }

    setIsSaving(true);
    addConsoleLog('info', `Saving ${dirtyFiles.length} changed ${dirtyFiles.length === 1 ? 'file' : 'files'}...`);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dirtyFiles),
      });
      const result = await response.json();
      const savedPaths = new Set<string>(
        Array.isArray(result.results)
          ? result.results.filter((item: { success: boolean }) => item.success).map((item: { path: string }) => item.path)
          : []
      );

      if (savedPaths.size > 0) {
        const savedAt = new Date();
        const contentByPath = new Map(dirtyFiles.map(file => [file.path, file.content]));
        setActiveWorkspace(previous => previous ? {
          ...previous,
          files: previous.files.map(file => savedPaths.has(file.path)
            ? { ...file, content: contentByPath.get(file.path) ?? file.content, lastModified: savedAt }
            : file),
        } : previous);
        setOpenFiles(previous => previous.map(file => savedPaths.has(file.path)
          ? { ...file, hasUnsavedChanges: false }
          : file));
      }

      if (!response.ok || savedPaths.size !== dirtyFiles.length) {
        addConsoleLog('error', `Saved ${savedPaths.size}/${dirtyFiles.length} files. Unsaved buffers were preserved.`);
        return false;
      }
      addConsoleLog('success', `Saved all ${dirtyFiles.length} changed ${dirtyFiles.length === 1 ? 'file' : 'files'}`);
      return true;
    } catch {
      addConsoleLog('error', 'Save All failed: Network error. Unsaved buffers were preserved.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const submitCareerTask = async (task: CareerTaskItem) => {
    const timing = getCareerTaskTiming(task, now);
    const taskWorkspaceId = task.result?.workspaceId;
    const taskFilePath = task.result?.filePath;
    if (!activeFilePath || task.status === 'completed') return;
    if (timing.state === 'upcoming') {
      addConsoleLog('warn', `${task.title} cannot be submitted before its scheduled start.`);
      return;
    }
    if (taskWorkspaceId && activeWorkspace?.id !== taskWorkspaceId) {
      addConsoleLog('error', 'Open this task workspace before submitting.');
      return;
    }
    if (taskFilePath && activeFilePath !== taskFilePath) {
      addConsoleLog('error', `Open ${taskFilePath} before submitting this task.`);
      return;
    }
    if (!editedCareerTaskIdsRef.current.has(task.id) && !attemptedCareerTaskIdsRef.current.has(task.id)) {
      void playById('cid-le-mdc').catch(() => {});
    }
    setSubmittingTaskId(task.id);
    try {
      const content = fileContentsRef.current.get(activeFilePath) ?? '';
      if (!await saveFile(activeFilePath, content)) return;

      const response = await fetch('/api/career/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: task.missionId, taskId: task.id, completed: true }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        addConsoleLog('error', result.error || 'Failed to submit career task');
        return;
      }

      setCareerTasks(tasks => tasks.map(item =>
        item.id === task.id ? { ...item, status: 'completed' } : item
      ));
      window.dispatchEvent(new CustomEvent('career-progress', { detail: { missionId: task.missionId } }));
      addConsoleLog('success', `Submitted ${task.title}`);
    } catch {
      addConsoleLog('error', 'Failed to submit career task');
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const addNewFile = async (fileName: string) => {
    if (!activeWorkspace) return;

    // If fileName is just a name (no path), create at root
    const fullPath = fileName.includes('/') ? fileName : fileName;

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          file: {
            path: fullPath,
            content: '',
            language: getLanguageFromExtension(fullPath),
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadWorkspaces();
        openFile(fullPath);
        addConsoleLog('log', `Created ${fullPath}`);
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create file');
    }
  };

  const createNewFolder = async (folderName: string) => {
    if (!activeWorkspace) return;

    // Create a .gitkeep file inside folder to make it exist
    const gitkeepPath = `${folderName}/.gitkeep`;
    
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          file: {
            path: gitkeepPath,
            content: '',
            language: 'text',
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadWorkspaces();
        addConsoleLog('log', `Created folder: ${folderName}`);
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create folder');
    }
  };

  const deleteFile = async (path: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Delete ${path}?`)) return;

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          path,
        }),
      });

      if (response.ok) {
        closeFile(path);
        await loadWorkspaces();
        addConsoleLog('log', `Deleted ${path}`);
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to delete file');
    }
  };

  const renameFile = async (oldPath: string, newPath: string) => {
    if (!activeWorkspace) return;

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          oldPath,
          newPath,
        }),
      });

      if (response.ok) {
        await loadWorkspaces();
        openFile(newPath);
        addConsoleLog('log', `Renamed ${oldPath} → ${newPath}`);
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to rename file');
    }
  };

  // ============ RUN CODE ============
  const runCode = async () => {
    if (!activeWorkspace) return;

    const careerTask = activeFilePath ? careerTaskForFile(activeFilePath) : undefined;
    if (careerTask) attemptedCareerTaskIdsRef.current.add(careerTask.id);

    setIsRunning(true);
    setConsoleLogs([]);
    setShowConsole(true);
    setActiveConsoleTab('console');
    addConsoleLog('info', `Running ${activeWorkspace.name}...`);

    try {
      const liveFiles = activeWorkspace.files.map(file => ({
        ...file,
        content: fileContentsRef.current.get(file.path) ?? file.content,
      }));
      const files = activeFilePath?.startsWith('exercises/')
        ? liveFiles.filter(file => file.path === activeFilePath)
        : liveFiles;
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, entryPoint: activeFilePath }),
      });

      const result = await response.json();

      if (result.logs) {
        result.logs.forEach((log: ConsoleLog) => {
          addConsoleLog(log.type, log.message);
        });
      }

      if (result.success) {
        if (result.preview) {
          // Frontend languages (React, HTML): Show preview
          setPreview(result.preview);
          setIsPreviewActive(true);

          // Open preview window
          if (previewMode === 'new-window' && openPreviewWindow) {
            openPreviewWindow(result.preview, `Preview - ${activeWorkspace.name}`);
          } else if (previewMode === 'inline') {
            setShowInlinePreview(true);
            setActiveConsoleTab('browser');
          }
        } else {
          setIsPreviewActive(false);
          setShowInlinePreview(false);
        }
      } else {
        const failureText = [result.error, ...(result.logs || []).map((log: ConsoleLog) => log.message)].filter(Boolean).join('\n');
        if (/syntax\s*error|unexpected token|parse error|compil(?:e|ation) (?:error|failed)|TS\d{4}/i.test(failureText)) {
          void playById('baigan').catch(() => {});
        }
        const hasErrorLog = result.logs?.some((log: ConsoleLog) => log.type === 'error');
        if (!hasErrorLog) addConsoleLog('error', result.error || 'Run failed');
        if (result.workspaceId) {
          addConsoleLog('error', `Workspace ID: ${result.workspaceId}`);
        }
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to run code');
      console.error('Run error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runAIAssistant = async (action: AIAssistantAction) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !activeFilePath) {
      addConsoleLog('error', 'Open a file before using the coding assistant');
      return;
    }
    if (action === 'generate' && !aiPrompt.trim()) {
      addConsoleLog('warn', 'Describe what you want the AI to generate');
      return;
    }

    const selection = editor.getSelection();
    const hasSelection = selection && !selection.isEmpty();
    const code = hasSelection ? model.getValueInRange(selection) : model.getValue();
    const targetRange = hasSelection
      ? selection
      : action === 'generate'
        ? new monacoRef.current.Range(selection.startLineNumber, selection.startColumn, selection.startLineNumber, selection.startColumn)
        : model.getFullModelRange();

    aiTargetRef.current = { path: activeFilePath, range: targetRange };
    setAIAction(action);
    setIsAIWorking(true);
    setAIResult(null);
    setShowAIAssistant(true);

    try {
      const activeFile = activeWorkspace?.files.find(file => file.path === activeFilePath);
      const response = await fetch('/api/workspaces/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          path: activeFilePath,
          language: activeFile?.language || getLanguageFromExtension(activeFilePath),
          code,
          instruction: aiPrompt.trim() || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Coding assistant failed');
      setAIResult(result);
      addConsoleLog('success', `AI ${action} completed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coding assistant failed';
      setAIResult({ summary: message });
      addConsoleLog('error', message);
    } finally {
      setIsAIWorking(false);
    }
  };

  const applyAIResult = () => {
    const target = aiTargetRef.current;
    const editor = editorRef.current;
    if (!target || !editor || !aiResult?.code || target.path !== activeFilePath) {
      addConsoleLog('warn', 'Reopen the original file before applying this suggestion');
      return;
    }

    editor.pushUndoStop();
    editor.executeEdits('smarty-ai', [{ range: target.range, text: aiResult.code, forceMoveMarkers: true }]);
    editor.pushUndoStop();
    addConsoleLog('success', 'AI change applied. Press Command+Z to undo.');
  };

  // ============ WORKSPACE MANAGEMENT ============
  const createNewWorkspace = async () => {
    if (!newProjectName.trim()) return;

    try {
      // Use test endpoint (no auth required) - port 3001
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          runtime: selectedTemplate,
          template: selectedTemplate,
        }),
      });

      const result = await response.json();
      if (result.data) {
        setWorkspaces([{ id: result.data.id, name: result.data.name, fileCount: result.data.files.length, lastAccessedAt: result.data.lastAccessedAt }, ...workspaces]);
        setActiveWorkspace(result.data);
        setupModelsForWorkspace(result.data);
        if (result.data.files && result.data.files.length > 0) {
          openFile(result.data.files[0].path, result.data);
        }
        addConsoleLog('log', `Created ${selectedTemplate} project: ${newProjectName}`);
        setShowNewProjectModal(false);
        setNewProjectName('');
        setSelectedTemplate('react');
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create workspace');
    }
  };

  const seedLoaderProject = async () => {
    try {
      addConsoleLog('log', 'Seeding loader project...');
      const response = await fetch('/api/workspaces/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setWorkspaces([{ id: result.data.id, name: result.data.name, fileCount: result.data.files.length, lastAccessedAt: result.data.lastAccessedAt }, ...workspaces]);
        setActiveWorkspace(result.data);
        setupModelsForWorkspace(result.data);
        if (result.data.files && result.data.files.length > 0) {
          openFile(result.data.files[0].path, result.data);
        }
        addConsoleLog('success', '✓ Loader project seeded successfully!');
      } else {
        addConsoleLog('error', 'Failed to seed project');
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to seed loader project');
    }
  };

  const switchWorkspace = async (workspace: WorkspaceSummary) => {
    if (workspace.id === activeWorkspace?.id) {
      setShowWorkspaceSelector(false);
      return;
    }

    setIsLoading(true);
    try {
      await loadWorkspace(workspace.id);
      setShowWorkspaceSelector(false);
    } catch (error) {
      addConsoleLog('error', error instanceof Error ? error.message : 'Failed to load workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ CONSOLE HELPER ============
  // Counter to ensure unique IDs even when logs are added in the same millisecond
  const logCounterRef = useRef(0);
  
  const addConsoleLog = (type: ConsoleLog['type'], message: string) => {
    const timestamp = Date.now();
    const counter = logCounterRef.current++;
    setConsoleLogs(prev => [...prev, {
      id: `log-${timestamp}-${counter}`,
      type,
      message,
      time: new Date().toLocaleTimeString(),
    }]);
  };

  // ============ MONACO EDITOR SETUP ============
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSX/TSX support (critical for React IntelliSense)
    try {
      configureJSXSupport(monaco);
      console.log('[Monaco] JSX support configured');
    } catch (error) {
      console.error('[Monaco] Failed to configure JSX:', error);
    }

    // Initialize Emmet support (only once)
    try {
      emmetHTML(monaco);  // For .html files
      emmetCSS(monaco);   // For .css files
      emmetJSX(monaco);   // For .jsx/.tsx files
      console.log('[Monaco] Emmet support initialized');
    } catch (error) {
      console.warn('[Monaco] Emmet initialization failed:', error);
    }

    // Create models for all workspace files
    if (activeWorkspace) {
      activeWorkspace.files.forEach(file => {
        if (!modelsRef.current.has(file.path)) {
          const language = file.language || getLanguageFromExtension(file.path);
          const uri = monaco.Uri.parse(`smarty://workspace/${activeWorkspace.id}/${file.path}`);
          
          // Check if model already exists in Monaco's registry
          let model = monaco.editor.getModel(uri);
          if (!model) {
            model = monaco.editor.createModel(file.content, language, uri);
          } else {
            // Update existing model's content if needed
            if (model.getValue() !== file.content) {
              model.setValue(file.content);
            }
          }
          modelsRef.current.set(file.path, model);
        }
      });
      console.log(`[Monaco] Created ${activeWorkspace.files.length} models`);
    }

    // Set active model
    if (activeFilePath && modelsRef.current.has(activeFilePath)) {
      editor.setModel(modelsRef.current.get(activeFilePath));
    }
    
  };

  // ============ CONSOLE MESSAGE LISTENER ============
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        addConsoleLog(event.data.logType, event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ============ DRAG HANDLERS ============
  const handleDividerDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingDivider) return;
    
    const container = document.getElementById('editor-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newWidth = Math.min(MAX_EDITOR_WIDTH, Math.max(MIN_EDITOR_WIDTH, e.clientX - rect.left));
    const percent = (newWidth / rect.width) * 100;
    setEditorWidth(percent);
  }, [isDraggingDivider]);

  useEffect(() => {
    if (isDraggingDivider) {
      window.addEventListener('mousemove', handleDividerDrag);
      window.addEventListener('mouseup', () => setIsDraggingDivider(false));
      return () => {
        window.removeEventListener('mousemove', handleDividerDrag);
        window.removeEventListener('mouseup', () => setIsDraggingDivider(false));
      };
    }
  }, [isDraggingDivider, handleDividerDrag]);

  useEffect(() => {
    if (!activeResize) return;

    const handlePaneResize = (event: MouseEvent) => {
      const shellRect = shellRef.current?.getBoundingClientRect();
      const contentRect = mainContentRef.current?.getBoundingClientRect();
      if (!shellRect || !contentRect) return;

      if (activeResize === 'sidebar') {
        setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, event.clientX - contentRect.left)));
      } else if (activeResize === 'ai') {
        setAIPanelWidth(Math.min(MAX_AI_WIDTH, Math.max(MIN_AI_WIDTH, contentRect.right - event.clientX)));
      } else {
        setConsoleHeight(Math.min(MAX_CONSOLE_HEIGHT, Math.max(MIN_CONSOLE_HEIGHT, shellRect.bottom - 24 - event.clientY)));
      }
    };
    const stopResize = () => setActiveResize(null);

    document.body.style.cursor = activeResize === 'console' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handlePaneResize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handlePaneResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [activeResize]);

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void saveAllFiles();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath, activeWorkspace, isSaving, openFiles]);

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="relative flex h-full overflow-hidden bg-[#090b12] text-slate-300">
        <div className="w-60 shrink-0 border-r border-white/8 bg-[#11141d] p-4">
          <div className="mb-6 h-5 w-28 animate-pulse rounded bg-white/8" />
          {[72, 88, 64, 82, 58].map((width, index) => (
            <div key={index} className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-cyan-300/10" />
              <div className="h-3 animate-pulse rounded bg-white/6" style={{ width: `${width}%` }} />
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-11 border-b border-white/8 bg-[#121620]" />
          <div className="relative flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/8 shadow-[0_0_28px_rgba(34,211,238,0.12)]">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              </div>
              <p className="text-xs font-medium text-slate-300">Opening workspace</p>
              <p className="mt-1 text-[10px] text-slate-600">Loading one project and preparing editor models</p>
            </div>
          </div>
          <div className="h-32 border-t border-white/8 bg-[#090c13]" />
        </div>
      </div>
    );
  }

  // ============ NO WORKSPACE SELECTED ============
  if (!activeWorkspace) {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e]">
          <Code size={64} className="mb-4 text-gray-600" />
          <h2 className="mb-2 text-xl text-white">No Workspaces Yet</h2>
          <p className="mb-6 text-sm text-gray-500">Create your first project workspace</p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="rounded-lg bg-[#007acc] px-6 py-2 text-white hover:bg-[#005a9e]"
          >
            + New Project
          </button>
          
          {workspaces.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowWorkspaceSelector(true)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Or select existing workspace ({workspaces.length})
              </button>
            </div>
          )}
        </div>

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-150 rounded-lg bg-[#252526] p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-semibold text-white">Create New Project</h2>
              
              {/* Project Name Input */}
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-300">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="my-project"
                  className="w-full rounded border border-[#3d3d3d] bg-[#1e1e1e] px-3 py-2 text-white placeholder-gray-500 focus:border-[#007acc] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-300">Project Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROJECT_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`rounded border p-3 text-left transition ${
                        selectedTemplate === template.id
                          ? 'border-[#007acc] bg-[#1e4d7a]'
                          : 'border-[#3d3d3d] bg-[#1e1e1e] hover:border-[#5d5d5d]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <div className="text-sm font-medium text-white">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName('');
                    setSelectedTemplate('react');
                  }}
                  className="rounded px-4 py-2 text-sm text-gray-400 hover:bg-[#2a2d2e]"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewWorkspace}
                  disabled={!newProjectName.trim()}
                  className="rounded bg-[#007acc] px-4 py-2 text-sm text-white hover:bg-[#005a9e] disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Selector */}
        {showWorkspaceSelector && (
          <div className="absolute left-1/2 top-12 z-50 w-96 -translate-x-1/2 rounded-lg border border-[#2d2d2d] bg-[#252526] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Select Workspace</h3>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="rounded bg-[#007acc] px-2 py-1 text-xs text-white hover:bg-[#005a9e]"
              >
                + New
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  onClick={() => switchWorkspace(workspace)}
                  className="w-full rounded p-2 text-left text-sm transition hover:bg-[#2a2d2e]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{workspace.name}</span>
                    <span className="text-xs text-gray-500">{workspace.fileCount} files</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // ============ MAIN UI ============
  return (
    <div ref={shellRef} className="relative flex h-full flex-col overflow-hidden bg-[#090b12] text-[#d8deef]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 bg-[radial-gradient(circle_at_18%_-20%,rgba(14,165,233,0.18),transparent_48%),radial-gradient(circle_at_82%_-30%,rgba(217,119,6,0.15),transparent_44%)]" />
      {/* Header Bar */}
      <div className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/8 bg-[#10131d]/95 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-400/10 shadow-[inset_0_1px_rgba(255,255,255,0.08),0_0_18px_rgba(34,211,238,0.08)]">
            <Code size={15} className="text-cyan-300" />
          </div>
          <div className="leading-tight">
            <span className="block text-[13px] font-semibold text-white">{activeWorkspace.name}</span>
            <span className="block text-[9px] uppercase tracking-[0.18em] text-slate-500">Smarty Studio</span>
          </div>
          {openFiles.some(f => f.hasUnsavedChanges) && <span className="text-xs text-yellow-500">●</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace Selector */}
          <button
            onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e]"
          >
            <Folder size={14} />
            <span>Workspaces</span>
          </button>

          {/* Package.json */}
          {activeWorkspace.packageJson ? (
            <button
              onClick={() => {
                const pkgPath = 'package.json';
                if (!activeWorkspace.files.find(f => f.path === pkgPath)) {
                  // Add package.json to files if not exists
                  openFile(pkgPath);
                }
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e]"
            >
              <Package size={14} />
              <span>package.json</span>
            </button>
          ) : null}

          {/* Save Button */}
          <button
            onClick={() => void saveAllFiles()}
            disabled={isSaving}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium bg-[#37373d] text-blue-400 hover:bg-[#45454d] disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save All'}</span>
            {!isSaving && (
              <span className="text-[10px] text-gray-500 ml-1">(⌘S)</span>
            )}
          </button>
          
          {/* Auto-save Indicator */}
          {openFiles.some(f => f.hasUnsavedChanges) && !isSaving && (
            <div className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
              <span className="font-bold">●</span>
              <span>Unsaved Changes</span>
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
              <Loader2 size={12} className="animate-spin" />
              <span>Saving to MongoDB...</span>
            </div>
          )}

          {/* Preview Mode Toggle */}
          <div className="flex items-center gap-1 rounded bg-[#2a2d2e] px-2 py-1">
            <Monitor size={14} className="text-gray-400" />
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as 'new-window' | 'inline')}
              className="bg-transparent text-xs text-gray-300 outline-none"
            >
              <option value="new-window">New Window</option>
              <option value="inline">Inline</option>
            </select>
          </div>

          <button
            onClick={() => setShowAIAssistant(value => !value)}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-all ${showAIAssistant ? 'border-cyan-300/35 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]' : 'border-white/8 bg-white/5 text-cyan-300 hover:border-cyan-300/25 hover:bg-cyan-400/10'}`}
            title="Open AI coding assistant"
          >
            <Sparkles size={14} />
            <span>AI</span>
          </button>

          {/* RUN BUTTON */}
          <button
            onClick={() => {
              const careerTask = activeFilePath ? careerTaskForFile(activeFilePath) : undefined;
              if (careerTask && !editedCareerTaskIdsRef.current.has(careerTask.id) && !attemptedCareerTaskIdsRef.current.has(careerTask.id)) {
                void playById('cid-le-mdc').catch(() => {});
              }
              void playById('gunshotjbudden').catch(() => {});
              void runCode();
            }}
            disabled={isRunning}
            className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-300/30 bg-linear-to-r from-emerald-600 to-teal-600 px-4 text-xs font-semibold text-white shadow-[0_5px_18px_rgba(5,150,105,0.22)] transition hover:brightness-110 disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Workspace Selector Dropdown */}
      {showWorkspaceSelector && (
        <div className="absolute left-1/2 top-12 z-50 w-96 -translate-x-1/2 rounded-lg border border-[#2d2d2d] bg-[#252526] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Select Workspace</h3>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="rounded bg-[#007acc] px-2 py-1 text-xs text-white hover:bg-[#005a9e]"
            >
              + New
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                onClick={() => void switchWorkspace(workspace)}
                className={`w-full rounded p-2 text-left text-sm transition hover:bg-[#2a2d2e] ${
                  workspace.id === activeWorkspace.id ? 'bg-[#37373d]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{workspace.name}</span>
                  <span className="text-xs text-gray-500">{workspace.fileCount} files</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div ref={mainContentRef} className="relative z-1 flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - File Tree */}
        {showFileTree && (
          <div
            className="relative flex shrink-0 flex-col border-r border-white/8 bg-[#11141d]/96 shadow-[8px_0_30px_rgba(0,0,0,0.18)]"
            style={{ width: sidebarWidth }}
          >
            <div className="px-3 pb-2 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Explorer</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-500">{activeWorkspace.files.length} files</span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-md border border-white/7 bg-black/20 p-1">
              <button
                onClick={() => setExplorerMode('files')}
                className={`flex h-7 items-center justify-center gap-1.5 rounded text-xs transition ${explorerMode === 'files' ? 'bg-linear-to-r from-cyan-500/20 to-blue-500/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.16)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <FileText size={13} /> Files
              </button>
              <button
                onClick={() => setExplorerMode('tasks')}
                className={`flex h-7 items-center justify-center gap-1.5 rounded text-xs transition ${explorerMode === 'tasks' ? 'bg-linear-to-r from-amber-500/20 to-orange-500/10 text-amber-100 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.16)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <ListTodo size={13} /> Tasks
              </button>
              </div>
            </div>
            {explorerMode === 'files' ? (
              <FileTree
                files={activeWorkspace.files}
                activeFile={activeFilePath || undefined}
                onFileSelect={(path) => openFile(path)}
                onFileDelete={deleteFile}
                onFileRename={renameFile}
                onFileAdd={addNewFile}
                onFolderCreate={createNewFolder}
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {codingTaskGroups.length === 0 ? (
                  <div className="px-2 py-8 text-center text-xs leading-relaxed text-gray-500">
                    Coding tasks from your Career plan will appear here.
                  </div>
                ) : codingTaskGroups.map((group) => (
                  <section key={group.dateKey} className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between px-1 text-[10px] font-semibold uppercase text-gray-500">
                      <span>{group.label}</span>
                      <span>{group.tasks.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.tasks.map((task) => {
                        const isSelectedCareerTask = task.id === initialCareerTask?.id;
                        const timing = getCareerTaskTiming(task, now);
                        const isTaskFileActive = (!task.result?.workspaceId || task.result.workspaceId === activeWorkspace?.id)
                          && (!task.result?.filePath || task.result.filePath === activeFilePath);
                        return (
                          <div
                            key={task.id}
                            className={`rounded border p-2.5 ${isSelectedCareerTask ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[inset_3px_0_0_rgba(34,211,238,0.9)]' : 'border-[#3d3d3d] bg-[#1e1e1e]'}`}
                          >
                            {isSelectedCareerTask && <p className="mb-1 text-[9px] font-semibold uppercase text-cyan-300">Opened from Career</p>}
                            <p className={`text-xs leading-snug ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.title}</p>
                            {task.description && <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{task.description}</p>}
                            <div className="mt-2">
                              <CareerTaskMeta task={task} now={now} />
                            </div>
                            <button
                              type="button"
                              onClick={() => void submitCareerTask(task)}
                              disabled={!activeFilePath || !isTaskFileActive || timing.state === 'upcoming' || task.status === 'completed' || submittingTaskId === task.id}
                              className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded bg-[#2d2d2d] text-[11px] text-gray-200 hover:bg-[#3d3d3d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {submittingTaskId === task.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <CheckCircle2 size={12} />}
                              {task.status === 'completed' ? 'Submitted' : timing.state === 'upcoming' ? 'Submit when task starts' : 'Save & Submit'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
            <div
              role="separator"
              aria-label="Resize explorer"
              className="absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize bg-transparent transition hover:bg-cyan-400/35"
              onMouseDown={() => setActiveResize('sidebar')}
            />
          </div>
        )}

        {/* Editor + Preview */}
        <div id="editor-container" className="flex min-w-0 flex-1 flex-col bg-[#0d1018]">
          {/* Open Tabs Row */}
          {openFiles.length > 0 && (
            <div className="flex h-10 shrink-0 items-center gap-1 border-b border-white/8 bg-[#121620] px-2">
              {/* Files pseudo-tab */}
              <button
                onClick={() => {
                  setExplorerMode('files');
                  setShowFileTree(true);
                }}
                className={`flex items-center rounded px-3 py-1.5 text-xs ${
                  showFileTree && explorerMode === 'files' ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={14} className="mr-1" />
                Files
              </button>
              <button
                onClick={() => {
                  setExplorerMode('tasks');
                  setShowFileTree(true);
                }}
                className={`flex items-center rounded px-3 py-1.5 text-xs ${
                  showFileTree && explorerMode === 'tasks' ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListTodo size={14} className="mr-1" />
                Tasks
              </button>

              {/* Divider */}
              <div className="h-4 w-px bg-[#3d3d3d]" />

              {/* Open file tabs */}
              <div className="flex flex-1 gap-1 overflow-x-auto">
                {openFiles.map(file => {
                  const isActive = file.path === activeFilePath;
                  const fileData = activeWorkspace.files.find(f => f.path === file.path);
                  
                  return (
                    <div
                      key={file.path}
                      className={`group relative flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs transition ${
                        isActive ? 'border-cyan-300/15 bg-cyan-400/8 text-white shadow-[inset_0_-2px_0_#22d3ee]' : 'border-transparent text-slate-500 hover:bg-white/4 hover:text-slate-200'
                      }`}
                      onClick={() => openFile(file.path)}
                    >
                      <FileText size={14} style={{ color: fileData ? '#519aba' : '#888' }} />
                      <span>{file.path.split('/').pop()}</span>
                      {file.hasUnsavedChanges && <span className="text-yellow-500">●</span>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(file.path);
                        }}
                        className="ml-1 rounded p-0.5 opacity-0 hover:bg-[#3d3d3d] group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Editor + Inline Preview */}
          <div className="relative flex flex-1 overflow-hidden">
            {/* Editor Panel */}
            <div
              className="flex-1 overflow-hidden"
              style={{
                width: showInlinePreview ? `${editorWidth}%` : '100%',
              }}
            >
              <Editor
                height="100%"
                theme="vs-dark"
                options={{
                  automaticLayout: true,
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  // Enable IntelliSense
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  wordBasedSuggestions: 'allDocuments',
                  parameterHints: { 
                    enabled: true,
                    cycle: true,
                  },
                  // Semantic highlighting
                  'semanticHighlighting.enabled': true,
                  // Format on type/paste
                  formatOnPaste: true,
                  formatOnType: true,
                  //Brackets
                  matchBrackets: 'always',
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  autoIndent: 'advanced',
                  // Colorization
                  colorDecorators: true,
                  renderLineHighlight: 'all',
                }}
                onMount={handleEditorDidMount}
                onChange={(value) => {
                  if (activeFilePath && value !== undefined) {
                    updateFileContent(activeFilePath, value);
                  }
                }}
              />
            </div>

            {/* Resizable Divider */}
            {showInlinePreview && (
              <>
                <div
                  className="w-1 cursor-col-resize bg-[#2d2d2d] hover:bg-[#007acc]"
                  onMouseDown={() => setIsDraggingDivider(true)}
                />
                
                {/* Inline Preview Panel */}
                <div className="flex flex-1 flex-col border-l border-[#2d2d2d] bg-[#1e1e1e]">
                  {/* Preview Tabs */}
                  <div className="flex h-9 items-center gap-2 border-b border-[#2d2d2d] bg-[#252526] px-2">
                    <button
                      onClick={() => setActiveConsoleTab('browser')}
                      className={`rounded px-3 py-1 text-xs ${
                        activeConsoleTab === 'browser'
                          ? 'bg-[#1e1e1e] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Browser
                    </button>
                    <button
                      onClick={() => setActiveConsoleTab('console')}
                      className={`rounded px-3 py-1 text-xs ${
                        activeConsoleTab === 'console'
                          ? 'bg-[#1e1e1e] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Console
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setShowInlinePreview(false)}
                      className="rounded p-1 hover:bg-[#2a2d2e]"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Preview Content */}
                  <div className="flex-1 overflow-hidden">
                    {activeConsoleTab === 'browser' ? (
                      preview ? (
                        <iframe
                          srcDoc={preview}
                          className="h-full w-full bg-white"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          Click Run to preview
                        </div>
                      )
                    ) : (
                      <div className="flex h-full flex-col overflow-y-auto p-2 font-mono text-xs">
                        {consoleLogs.map(log => (
                          <div
                            key={log.id}
                            className={`py-0.5 ${
                              log.type === 'error'
                                ? 'text-red-400'
                                : log.type === 'warn'
                                ? 'text-yellow-400'
                                : log.type === 'info'
                                ? 'text-blue-400'
                                : log.type === 'success'
                                ? 'text-green-400'
                                : 'text-gray-300'
                            }`}
                          >
                            <span className="mr-2 text-gray-600">[{log.time}]</span>
                            {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {showAIAssistant && (
          <aside className="relative flex shrink-0 flex-col border-l border-cyan-300/12 bg-[#0d111a]/98 shadow-[-12px_0_36px_rgba(0,0,0,0.25)]" style={{ width: aiPanelWidth }}>
            <div
              role="separator"
              aria-label="Resize AI assistant"
              className="absolute inset-y-0 -left-1 z-20 w-2 cursor-col-resize bg-transparent transition hover:bg-cyan-400/35"
              onMouseDown={() => setActiveResize('ai')}
            />
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 bg-linear-to-r from-cyan-500/8 to-amber-500/5 px-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-400/10">
                  <Bot size={15} className="text-cyan-300" />
                </span>
                <span><span className="block">Smarty AI</span><span className="block text-[9px] font-normal uppercase tracking-[0.14em] text-cyan-300/60">Coding copilot</span></span>
              </div>
              <button onClick={() => setShowAIAssistant(false)} className="rounded p-1 text-gray-500 hover:bg-[#2a2d2e] hover:text-white" title="Close assistant">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 border-b border-[#2d2d2d] p-2">
              {([
                ['explain', BookOpen, 'Explain'],
                ['fix', Wrench, 'Fix'],
                ['generate', WandSparkles, 'Generate'],
              ] as const).map(([action, Icon, label]) => (
                <button
                  key={action}
                  onClick={() => void runAIAssistant(action)}
                  disabled={isAIWorking}
                  className={`flex h-8 items-center justify-center gap-1 rounded-md border text-[11px] transition disabled:opacity-50 ${aiAction === action ? 'border-cyan-300/25 bg-cyan-400/12 text-cyan-100' : 'border-transparent bg-white/3 text-slate-500 hover:bg-white/7 hover:text-white'}`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="border-b border-[#2d2d2d] p-3">
              <textarea
                value={aiPrompt}
                onChange={event => setAIPrompt(event.target.value)}
                placeholder="Describe code to generate, or add context for a fix..."
                className="h-24 w-full resize-none rounded-md border border-white/10 bg-black/25 p-2.5 text-xs leading-relaxed text-gray-200 shadow-inner outline-none placeholder:text-slate-600 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-400/8"
              />
              <p className="mt-1.5 text-[10px] text-gray-600">Select code for a focused response. No selection uses the active file.</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isAIWorking ? (
                <div className="flex h-32 flex-col items-center justify-center gap-3 text-xs text-gray-400">
                  <Loader2 size={20} className="animate-spin text-cyan-300" />
                  Analyzing {activeFilePath?.split('/').pop()}...
                </div>
              ) : aiResult ? (
                <div className="space-y-3">
                  <div className="whitespace-pre-wrap text-xs leading-5 text-gray-300">{aiResult.summary}</div>
                  {aiResult.code && (
                    <>
                      <pre className="max-h-80 overflow-auto rounded border border-[#2d2d2d] bg-[#111] p-3 font-mono text-[11px] leading-5 text-gray-300">{aiResult.code}</pre>
                      <button onClick={applyAIResult} className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#0e639c] text-xs font-medium text-white hover:bg-[#1177bb]">
                        <Check size={13} /> Apply to editor
                      </button>
                    </>
                  )}
                  {(aiResult.provider || aiResult.model) && (
                    <div className="border-t border-[#2d2d2d] pt-2 text-[10px] text-gray-600">{[aiResult.provider, aiResult.model].filter(Boolean).join(' / ')}</div>
                  )}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-xs leading-5 text-gray-600">
                  <Sparkles size={22} />
                  Select code or open a file, then choose an AI action.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Console Panel */}
      {showConsole && (
        <div
          className="relative z-10 flex shrink-0 flex-col border-t border-cyan-300/12 bg-[#090c13]/98 shadow-[0_-12px_32px_rgba(0,0,0,0.25)]"
          style={{ height: consoleHeight }}
        >
          <div
            role="separator"
            aria-label="Resize terminal"
            className="absolute -top-1 inset-x-0 z-20 h-2 cursor-row-resize bg-transparent transition hover:bg-cyan-400/35"
            onMouseDown={() => setActiveResize('console')}
          />
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/8 bg-[#11151f] px-3">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-cyan-300" />
              <span className="text-xs font-semibold text-slate-300">Terminal</span>
              <span className="rounded-full border border-white/8 bg-white/5 px-1.5 text-[10px] text-slate-500">
                {consoleLogs.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleLogs([])}
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

          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
            {consoleLogs.map(log => (
              <div
                key={log.id}
                className={`py-0.5 ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warn'
                    ? 'text-yellow-400'
                    : log.type === 'info'
                    ? 'text-blue-400'
                    : log.type === 'success'
                    ? 'text-green-400'
                    : 'text-gray-300'
                }`}
              >
                <span className="mr-2 text-gray-600">[{log.time}]</span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console Toggle */}
      {!showConsole && (
        <button
          onClick={() => setShowConsole(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-[#252526] px-3 py-2 text-xs text-gray-400 shadow-lg hover:bg-[#2a2d2e]"
        >
          <Terminal size={14} />
          <span>Show Console</span>
        </button>
      )}

      <div className="relative z-20 flex h-6 shrink-0 items-center justify-between border-t border-cyan-200/10 bg-linear-to-r from-[#0d6376] via-[#135b73] to-[#694919] px-2.5 text-[10px] text-white/85 shadow-[0_-4px_18px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><GitBranch size={11} /> main</span>
          <span className="text-emerald-200">● Ready</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{activeFilePath ? getLanguageFromExtension(activeFilePath) : 'Plain Text'}</span>
          <button onClick={() => setShowConsole(value => !value)} className="flex items-center gap-1 rounded px-1.5 hover:bg-white/10" title="Toggle terminal">
            <PanelBottom size={11} /> Terminal
          </button>
          <span>UTF-8</span>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-150 rounded-lg bg-[#252526] p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-white">Create New Project</h2>
            
            {/* Project Name Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-300">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="my-project"
                className="w-full rounded border border-[#3d3d3d] bg-[#1e1e1e] px-3 py-2 text-white placeholder-gray-500 focus:border-[#007acc] focus:outline-none"
                autoFocus
              />
            </div>

            {/* Template Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-300">Project Template</label>
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`rounded border p-3 text-left transition ${
                      selectedTemplate === template.id
                        ? 'border-[#007acc] bg-[#1e4d7a]'
                        : 'border-[#3d3d3d] bg-[#1e1e1e] hover:border-[#5d5d5d]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="text-sm font-medium text-white">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Data Section */}
            <div className="mb-4 mt-4 border-t border-[#3d3d3d] pt-4">
              <label className="mb-2 block text-sm text-gray-300">Or Add Sample Data</label>
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  seedLoaderProject();
                }}
                className="w-full rounded border border-[#3d3d3d] bg-linear-to-r from-[#1e1e1e] to-[#2a2d2e] p-3 text-left hover:border-[#007acc] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎨</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">CSS Loading Spinners</div>
                    <div className="text-xs text-gray-500">React app with animations</div>
                  </div>
                  <div className="text-xs text-[#007acc]">Add →</div>
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName('');
                  setSelectedTemplate('react');
                }}
                className="rounded px-4 py-2 text-sm text-gray-400 hover:bg-[#2a2d2e]"
              >
                Cancel
              </button>
              <button
                onClick={createNewWorkspace}
                disabled={!newProjectName.trim()}
                className="rounded bg-[#007acc] px-4 py-2 text-sm text-white hover:bg-[#005a9e] disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
