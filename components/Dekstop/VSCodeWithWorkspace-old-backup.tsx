/**
 * VS Code with Workspace Backend Integration
 * Shows projects as workspaces with backend persistence
 * Includes Run button and package.json support
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Folder, Plus, X, Play, ChevronRight, ChevronDown, Code, Terminal, Save, Loader2, RefreshCw, Package } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { getLanguageFromExtension, getFileIconColor } from '@/lib/utils/language'

// ============ TYPES ============
interface WorkspaceFile {
  path: string
  content: string
  language: string
}

interface Workspace {
  id: string
  name: string
  files: WorkspaceFile[]
  packageJson?: Record<string, any>
  settings: {
    runtime: string
    entryPoint: string
  }
  lastAccessedAt: string
}

interface ConsoleLog {
  id: string
  type: 'log' | 'error' | 'warn' | 'info'
  message: string
  time: string
}

interface VSCodeWithWorkspaceProps {
  openPreviewWindow?: (htmlContent: string, title?: string) => void
}

// ============ COMPONENT ============
export default function VSCodeWithWorkspace({ openPreviewWindow }: VSCodeWithWorkspaceProps) {
  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null)
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [preview, setPreview] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // UI State
  const [showConsole, setShowConsole] = useState(true)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [consoleIdRef, setConsoleIdRef] = useState(0)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [consoleHeight, setConsoleHeight] = useState(160)
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false)

  // ============ LOAD WORKSPACES ============
  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workspaces')
      const result = await response.json()
      
      if (result.data && result.data.length > 0) {
        setWorkspaces(result.data)
        // Auto-select most recent workspace
        const mostRecent = result.data.sort((a: Workspace, b: Workspace) => 
          new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
        )[0]
        setActiveWorkspace(mostRecent)
        setActiveFile(mostRecent.files[0] || null)
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  // ============ CREATE WORKSPACE ============
  const createNewWorkspace = async () => {
    const name = prompt('Enter workspace name:')
    if (!name) return

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          runtime: 'react',
        }),
      })

      const result = await response.json()
      if (result.data) {
        setWorkspaces([result.data, ...workspaces])
        setActiveWorkspace(result.data)
        setActiveFile(result.data.files[0] || null)
        addConsoleLog('log', `Created workspace: ${name}`)
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create workspace')
    }
  }

  // ============ FILE OPERATIONS ============
  const updateFileContent = async (path: string, content: string) => {
    if (!activeWorkspace) return

    // Update local state
    const updatedFiles = activeWorkspace.files.map(f =>
      f.path === path ? { ...f, content } : f
    )
    
    setActiveWorkspace({ ...activeWorkspace, files: updatedFiles })
    setHasUnsavedChanges(true)

    // Auto-save after 1 second
    setTimeout(() => saveFile(path, content), 1000)
  }

  const saveFile = async (path: string, content: string) => {
    if (!activeWorkspace) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          path,
          content,
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        addConsoleLog('log', `Saved ${path}`)
      }
    } catch (error) {
      addConsoleLog('error', `Failed to save ${path}`)
    } finally {
      setIsSaving(false)
    }
  }

  const addNewFile = async () => {
    if (!activeWorkspace) return

    const fileName = prompt('Enter file name (e.g., Component.jsx):')
    if (!fileName) return

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          file: {
            path: fileName,
            content: '',
            language: getLanguageFromFileName(fileName),
          },
        }),
      })

      const result = await response.json()
      if (result.success) {
        await loadWorkspaces()
        addConsoleLog('log', `Created ${fileName}`)
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create file')
    }
  }

  const deleteFile = async (path: string) => {
    if (!activeWorkspace) return
    if (!confirm(`Delete ${path}?`)) return

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          path,
        }),
      })

      if (response.ok) {
        await loadWorkspaces()
        addConsoleLog('log', `Deleted ${path}`)
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to delete file')
    }
  }

  const createPackageJson = async () => {
    if (!activeWorkspace) return

    const packageJson = {
      name: activeWorkspace.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `${activeWorkspace.name} - SmartyAI Workspace`,
      main: activeWorkspace.settings.entryPoint,
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
    }

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageJson }),
      })

      if (response.ok) {
        await loadWorkspaces()
        addConsoleLog('log', 'Created package.json')
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to create package.json')
    }
  }

  // ============ RUN CODE ============
  const runCode = async () => {
    if (!activeWorkspace || !activeFile) return

    setIsRunning(true)
    setConsoleLogs([])

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/run`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success && result.preview) {
        setPreview(result.preview)
        
        // Add logs
        if (result.logs) {
          result.logs.forEach((log: ConsoleLog) => {
            addConsoleLog(log.type, log.message)
          })
        }

        // Open in preview window if available
        if (openPreviewWindow) {
          openPreviewWindow(result.preview, `Preview - ${activeWorkspace.name}`)
        }
      } else {
        addConsoleLog('error', result.error || 'Run failed')
      }
    } catch (error) {
      addConsoleLog('error', 'Failed to run code')
    } finally {
      setIsRunning(false)
    }
  }

  // ============ CONSOLE HELPER ============
  const addConsoleLog = (type: ConsoleLog['type'], message: string) => {
    setConsoleLogs(prev => [...prev, {
      id: `log-${Date.now()}`,
      type,
      message,
      time: new Date().toLocaleTimeString(),
    }])
  }

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (activeFile) {
          saveFile(activeFile.path, activeFile.content)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        runCode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile])

  // ============ HELPER FUNCTIONS ============
  function getLanguageFromFileName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    }
    return languageMap[ext] || 'plaintext'
  }

  const getFileIcon = (filename: string) => {
    const color = getFileIconColor(filename)
    return <FileText size={16} style={{ color }} className="flex-shrink-0" />
  }

  // ============ LISTEN FOR CONSOLE MESSAGES ============
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        addConsoleLog(event.data.logType, event.data.message)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#007acc]" />
      </div>
    )
  }

  // ============ NO WORKSPACE SELECTED ============
  if (!activeWorkspace) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e]">
        <Code size={64} className="mb-4 text-gray-600" />
        <h2 className="mb-2 text-xl text-white">No Workspaces Yet</h2>
        <p className="mb-6 text-sm text-gray-500">Create your first project workspace</p>
        <button
          onClick={createNewWorkspace}
          className="rounded-lg bg-[#007acc] px-6 py-2 text-white hover:bg-[#005a9e]"
        >
          + Create Workspace
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
    )
  }

  // ============ MAIN UI ============
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-[#007acc]" />
          <span className="text-sm font-medium text-white">{activeWorkspace.name}</span>
          {hasUnsavedChanges && <span className="text-xs text-yellow-500">●</span>}
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
              onClick={() => setActiveFile({ path: 'package.json', content: JSON.stringify(activeWorkspace.packageJson, null, 2), language: 'json' })}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e]"
            >
              <Package size={14} />
              <span>package.json</span>
            </button>
          ) : (
            <button
              onClick={createPackageJson}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e]"
            >
              <Plus size={14} />
              <span>Add package.json</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={() => activeFile && saveFile(activeFile.path, activeFile.content)}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-[#2a2d2e] disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save</span>
          </button>

          {/* RUN BUTTON - ALWAYS VISIBLE */}
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
              onClick={createNewWorkspace}
              className="rounded bg-[#007acc] px-2 py-1 text-xs text-white hover:bg-[#005a9e]"
            >
              + New
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {workspaces.map(workspace => (
              <button
                key={workspace.id}
                onClick={() => {
                  setActiveWorkspace(workspace)
                  setActiveFile(workspace.files[0] || null)
                  setShowWorkspaceSelector(false)
                }}
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
        {/* Sidebar - File Explorer */}
        <div 
          className="flex flex-col border-r border-[#2d2d2d] bg-[#252526]"
          style={{ width: sidebarWidth }}
        >
          <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] px-3">
            <span className="text-xs font-medium uppercase text-gray-400">Files</span>
            <button
              onClick={addNewFile}
              className="rounded p-1 hover:bg-[#2a2d2e]"
              title="Add file"
            >
              <Plus size={14} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeWorkspace.files.map(file => (
              <div
                key={file.path}
                className={`flex cursor-pointer items-center justify-between px-3 py-1 hover:bg-[#2a2d2e] ${
                  activeFile?.path === file.path ? 'bg-[#37373d]' : ''
                }`}
                onClick={() => setActiveFile(file)}
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(file.path)}
                  <span className="text-sm text-gray-200">{file.path}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file.path)
                  }}
                  className="rounded p-0.5 opacity-0 hover:bg-[#1e1e1e] group-hover:opacity-100"
                >
                  <X size={12} className="text-gray-500 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="flex flex-1 flex-col">
          {/* Editor Tabs */}
          {activeFile && (
            <div className="flex h-9 items-center border-b border-[#2d2d2d] bg-[#252526]">
              <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-2">
                {getFileIcon(activeFile.path)}
                <span className="text-sm text-gray-200">{activeFile.path}</span>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                onChange={(value) => {
                  if (value !== undefined) {
                    updateFileContent(activeFile.path, value)
                  }
                }}
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

        {/* Preview Panel */}
        {preview && (
          <div className="flex w-1/2 flex-col border-l border-[#2d2d2d]">
            <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
              <span className="text-xs font-medium uppercase text-gray-400">Preview</span>
              <button
                onClick={() => setPreview('')}
                className="rounded p-1 hover:bg-[#2a2d2e]"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            <iframe
              srcDoc={preview}
              className="flex-1 bg-white"
              sandbox="allow-scripts allow-same-origin"
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
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warn' ? 'text-yellow-400' :
                  log.type === 'info' ? 'text-blue-400' :
                  'text-gray-300'
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
    </div>
  )
}
