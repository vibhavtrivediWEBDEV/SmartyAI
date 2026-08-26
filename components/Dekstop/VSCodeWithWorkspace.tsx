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

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import FileTree from './FileTree';
import { getLanguageFromExtension } from '@/lib/utils/language';
import { configureJSXSupport } from '@/lib/monaco/setup';

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

interface VSCodeWithWorkspaceProps {
  openPreviewWindow?: (htmlContent: string, title?: string) => void;
}

// ============ CONSTANTS ============
const MIN_EDITOR_WIDTH = 300;
const MAX_EDITOR_WIDTH = 1200;
const DEFAULT_EDITOR_WIDTH_PERCENT = 60;

// ============ COMPONENT ============
export default function VSCodeWithWorkspace({ openPreviewWindow }: VSCodeWithWorkspaceProps) {
  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Open Files State (Multi-file)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const fileContentsRef = useRef<Map<string, string>>(new Map());

  // Monaco State
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const modelsRef = useRef<Map<string, any>>(new Map());

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
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('react');

  // Project Templates
  const PROJECT_TEMPLATES = [
    { id: 'react', name: 'React (JavaScript)', icon: '⚛️', description: 'Modern React app with hooks' },
    { id: 'react-ts', name: 'React (TypeScript)', icon: '📘', description: 'Type-safe React application' },
    { id: 'html', name: 'HTML/CSS/JS', icon: '🌐', description: 'Simple web project' },
    { id: 'node', name: 'Node.js', icon: '🟢', description: 'Backend with Express.js' },
    { id: 'python', name: 'Python', icon: '🐍', description: 'Python scripts and backend' },
    { id: 'java', name: 'Java', icon: '☕', description: 'Java application' },
  ];

  // ============ LOAD WORKSPACES ============
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      // Use test endpoint (no auth required) - port 3001
      const response = await fetch('http://localhost:3001/api/test-workspaces');
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        setWorkspaces(result.data);
        const mostRecent = result.data.sort((a: Workspace, b: Workspace) => 
          new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
        )[0];
        setActiveWorkspace(mostRecent);
        
        // Setup models for all files
        if (mostRecent.files.length > 0) {
          setupModelsForWorkspace(mostRecent);
          openFile(mostRecent.files[0].path, mostRecent.id);
        }
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
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
        if (!modelsRef.current.has(file.path)) {
          const language = file.language || getLanguageFromExtension(file.path);
          const uri = monaco.Uri.parse(`smarty://workspace/${workspace.id}/${file.path}`);
          const model = monaco.editor.createModel(file.content, language, uri);
          modelsRef.current.set(file.path, model);
        }
      });
      
      console.log(`[Monaco] Created ${workspace.files.length} models for workspace:`, workspace.name);
    }
  };

  const cleanupModelsForWorkspace = (workspaceId: string) => {
    // Dispose models
    modelsRef.current.forEach((model, path) => {
      if (path.startsWith(workspaceId)) {
        model.dispose();
        modelsRef.current.delete(path);
      }
    });
    fileContentsRef.current.clear();
  };

  // ============ FILE OPERATIONS ============
  const openFile = (path: string, workspaceId?: string) => {
    const ws = workspaceId ? workspaces.find(w => w.id === workspaceId) : activeWorkspace;
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
  const updateFileContent = (path: string, content: string) => {
    // Update local content
    fileContentsRef.current.set(path, content);
    
    // Mark as unsaved
    setOpenFiles(prev => 
      prev.map(f => f.path === path ? { ...f, hasUnsavedChanges: true } : f)
    );
  };

  const saveFile = async (path: string, content: string) => {
    if (!activeWorkspace) {
      console.error('❌ No active workspace loaded');
      addConsoleLog('error', 'No active workspace loaded');
      return;
    }

    console.log('💾 Saving to MongoDB:', { path, workspaceId: activeWorkspace.id });
    setIsSaving(true);
    addConsoleLog('info', `Saving ${path}...`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/files`, {
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
      } else {
        const error = await response.json();
        console.error('❌ Save failed:', error);
        addConsoleLog('error', `Failed to save ${path}: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      addConsoleLog('error', `Failed to save ${path}: Network error`);
    } finally {
      setIsSaving(false);
    }
  };

  const addNewFile = async (fileName: string) => {
    if (!activeWorkspace) return;

    // If fileName is just a name (no path), create at root
    const fullPath = fileName.includes('/') ? fileName : fileName;

    try {
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/files`, {
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
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/files`, {
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
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/files`, {
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
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/files`, {
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

    setIsRunning(true);
    setConsoleLogs([]);
    addConsoleLog('info', `Running ${activeWorkspace.name}...`);

    try {
      // Use test endpoint (no auth required) - port 3001
      const response = await fetch(`http://localhost:3001/api/test-workspaces/${activeWorkspace.id}/run`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        // Add all logs from execution
        if (result.logs) {
          result.logs.forEach((log: ConsoleLog) => {
            addConsoleLog(log.type, log.message);
          });
        }

        // Check if this is a backend language (Python, Java, Node)
        const isBackendLanguage = activeWorkspace.runtime === 'python' || 
                                   activeWorkspace.runtime === 'java' || 
                                   activeWorkspace.runtime === 'node';

        if (isBackendLanguage) {
          // Backend languages: Only show console output, NO preview window
          // Logs already added above
          setIsPreviewActive(false); // Ensure preview is not active
        } else if (result.preview) {
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
        }
      } else {
        addConsoleLog('error', result.error || 'Run failed');
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

  // ============ WORKSPACE MANAGEMENT ============
  const createNewWorkspace = async () => {
    if (!newProjectName.trim()) return;

    try {
      // Use test endpoint (no auth required) - port 3001
      const response = await fetch('http://localhost:3001/api/test-workspaces', {
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
        setWorkspaces([result.data, ...workspaces]);
        setActiveWorkspace(result.data);
        setupModelsForWorkspace(result.data);
        if (result.data.files && result.data.files.length > 0) {
          openFile(result.data.files[0].path, result.data.id);
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
      const response = await fetch('http://localhost:3001/api/test-workspaces/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setWorkspaces([result.data, ...workspaces]);
        setActiveWorkspace(result.data);
        setupModelsForWorkspace(result.data);
        if (result.data.files && result.data.files.length > 0) {
          openFile(result.data.files[0].path, result.data.id);
        }
        addConsoleLog('success', '✓ Loader project seeded successfully!');
      } else {
        addConsoleLog('error', 'Failed to seed project');
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to seed loader project');
    }
  };

  const switchWorkspace = (workspace: Workspace) => {
    // Cleanup old workspace
    if (activeWorkspace) {
      cleanupModelsForWorkspace(activeWorkspace.id);
    }
    
    setActiveWorkspace(workspace);
    setOpenFiles([]);
    setActiveFilePath(null);
    setupModelsForWorkspace(workspace);
    
    if (workspace.files.length > 0) {
      openFile(workspace.files[0].path, workspace.id);
    }
    
    setShowWorkspaceSelector(false);
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
    
    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel();
      if (model && activeFilePath) {
        const content = model.getValue();
        updateFileContent(activeFilePath, content);
      }
    });
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

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeFilePath) {
          const content = fileContentsRef.current.get(activeFilePath) || '';
          saveFile(activeFilePath, content);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath]);

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#007acc]" />
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
            <div className="w-[600px] rounded-lg bg-[#252526] p-6 shadow-2xl">
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
                  className={`w-full rounded p-2 text-left text-sm transition hover:bg-[#2a2d2e] ${
                    workspace.id === activeWorkspace?.id ? 'bg-[#37373d]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{workspace.name}</span>
                    <span className="text-xs text-gray-500">{workspace.files.length} files</span>
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
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Header Bar */}
      <div className="flex h-10 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-[#007acc]" />
          <span className="text-sm font-medium text-white">{activeWorkspace.name}</span>
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
            onClick={() => {
              if (activeFilePath) {
                const content = fileContentsRef.current.get(activeFilePath) || '';
                saveFile(activeFilePath, content);
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium bg-[#37373d] text-blue-400 hover:bg-[#45454d] disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
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

          {/* RUN BUTTON */}
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1 rounded bg-green-600 px-4 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
                onClick={() => switchWorkspace(workspace)}
                className={`w-full rounded p-2 text-left text-sm transition hover:bg-[#2a2d2e] ${
                  workspace.id === activeWorkspace.id ? 'bg-[#37373d]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{workspace.name}</span>
                  <span className="text-xs text-gray-500">{workspace.files.length} files</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File Tree */}
        {showFileTree && (
          <div
            className="flex flex-col border-r border-[#2d2d2d] bg-[#252526]"
            style={{ width: sidebarWidth }}
          >
            <FileTree
              files={activeWorkspace.files}
              activeFile={activeFilePath || undefined}
              onFileSelect={(path) => openFile(path)}
              onFileDelete={deleteFile}
              onFileRename={renameFile}
              onFileAdd={addNewFile}
              onFolderCreate={createNewFolder}
            />
          </div>
        )}

        {/* Editor + Preview */}
        <div id="editor-container" className="flex flex-1 flex-col">
          {/* Open Tabs Row */}
          {openFiles.length > 0 && (
            <div className="flex h-9 items-center gap-1 border-b border-[#2d2d2d] bg-[#252526] px-2">
              {/* Files pseudo-tab */}
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                className={`flex items-center rounded px-3 py-1.5 text-xs ${
                  showFileTree ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={14} className="mr-1" />
                Files
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
                      className={`group flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-xs ${
                        isActive ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-white'
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
                  // TypeScript/JavaScript specific
                  jsDocCompletion: 'on',
                  typescriptCompletionOptions: {
                    completeFunctionCalls: true,
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
                  // Emmet
                  emmet: {
                    showExpandedAbbreviation: 'always',
                    showAbbreviationSuggestions: true,
                    syntaxProfiles: {
                      html: { html: 'html' },
                      css: { css: 'css' },
                      javascript: { jsx: 'react' },
                    }
                  }
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
      </div>

      {/* Bottom Console Panel */}
      {showConsole && (
        <div
          className="flex flex-col border-t border-[#2d2d2d] bg-[#1e1e1e]"
          style={{ height: consoleHeight }}
        >
          <div className="flex h-8 items-center justify-between border-b border-[#2d2d2d] px-3">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#007acc]" />
              <span className="text-xs font-medium text-gray-400">Console</span>
              <span className="rounded bg-[#2d2d2d] px-1.5 text-xs text-gray-500">
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

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[600px] rounded-lg bg-[#252526] p-6 shadow-2xl">
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
                className="w-full rounded border border-[#3d3d3d] bg-gradient-to-r from-[#1e1e1e] to-[#2a2d2e] p-3 text-left hover:border-[#007acc] transition"
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
