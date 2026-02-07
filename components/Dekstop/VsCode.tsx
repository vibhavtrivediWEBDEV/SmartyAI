'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileText, Folder, Plus, X, Play, ChevronRight, ChevronDown, Code, Terminal, Menu, ChevronLeft } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useCursorAutomation } from '@/hooks/useCursorAutomation'

// ============ TYPES ============
interface CodeFile {
  id: string
  name: string
  type: 'html' | 'css' | 'js' | 'txt'
  content: string
  folderId?: string
}

interface FolderItem {
  id: string
  name: string
  collapsed: boolean
}

interface ConsoleLog {
  id: string
  type: 'log' | 'error' | 'warn'
  message: string
  time: string
}

// ============ DEFAULT FILES ============
const DEFAULT_FILES: CodeFile[] = [
  { id: '1', name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p id="demo">Click the button</p>\n  <button id="btn">Click Me</button>\n</body>\n</html>' },
  { id: '2', name: 'style.css', type: 'css', content: 'body {\n  font-family: Arial, sans-serif;\n  background: #f0f0f0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}\n\nbutton {\n  padding: 8px 16px;\n  background: #007acc;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}' },
  { id: '3', name: 'script.js', type: 'js', content: 'console.log("Script loaded!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  console.log("Page ready");\n  \n  const btn = document.getElementById("btn");\n  if (btn) {\n    btn.addEventListener("click", () => {\n      console.log("Button clicked");\n      document.getElementById("demo").textContent = "Button was clicked!";\n    });\n  }\n});' },
]

// ============ UTILITIES ============
const getFileIcon = (type: string) => {
  const colors = { html: '#e44d26', css: '#2965f1', js: '#f7df1e', txt: '#cccccc' }
  return (
    <FileText
      size={16}
      style={{ color: colors[type as keyof typeof colors] }}
      className="flex-shrink-0"
    />
  )
}

const getLanguageFromType = (type: string): string => {
  const languageMap: { [key: string]: string } = {
    html: 'html',
    css: 'css',
    js: 'javascript',
    txt: 'plaintext',
  }
  return languageMap[type] || 'plaintext'
}

export default function VSCodeEditor() {
  const automationAPI = useCursorAutomation(() => { })

  // ============ STATE ============
  const [files, setFiles] = useState<CodeFile[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [activeFileId, setActiveFileId] = useState('1')
  const [showPreview, setShowPreview] = useState(true)
  const [showConsole, setShowConsole] = useState(true)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [creatingFileType, setCreatingFileType] = useState<'html' | 'css' | 'js' | 'txt' | null>(null)
  const [fileName, setFileName] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const consoleIdRef = useRef<number>(0)

  const activeFile = files.find(f => f.id === activeFileId)

  // ============ LOCALSTORAGE HELPERS ============
  const saveToLocalStorage = (files: CodeFile[], folders: FolderItem[]) => {
    try {
      localStorage.setItem('vscode-files', JSON.stringify(files))
      localStorage.setItem('vscode-folders', JSON.stringify(folders))
      localStorage.setItem('vscode-activeFileId', activeFileId)
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedFiles = localStorage.getItem('vscode-files')
      const savedFolders = localStorage.getItem('vscode-folders')
      const savedActiveFileId = localStorage.getItem('vscode-activeFileId')

      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles)
        setFiles(parsedFiles.length > 0 ? parsedFiles : DEFAULT_FILES)
      } else {
        setFiles(DEFAULT_FILES)
      }

      if (savedFolders) {
        setFolders(JSON.parse(savedFolders))
      }

      if (savedActiveFileId) {
        setActiveFileId(savedActiveFileId)
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      setFiles(DEFAULT_FILES)
    }
  }

  // ============ INITIAL LOAD ============
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  // ============ AUTO-SAVE TO LOCALSTORAGE ============
  useEffect(() => {
    if (files.length > 0) {
      saveToLocalStorage(files, folders)
    }
  }, [files, folders])

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem('vscode-activeFileId', activeFileId)
    }
  }, [activeFileId])

  // ============ FILE OPERATIONS ============
  const updateFile = (id: string, content: string) => {
    setFiles(files.map(f => (f.id === id ? { ...f, content } : f)))
    setHasUnsavedChanges(true)
  }

  const deleteFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id)
    setFiles(newFiles)
    if (activeFileId === id && newFiles.length > 0) {
      setActiveFileId(newFiles[0].id)
    }
  }

  const startCreatingFile = (type: 'html' | 'css' | 'js' | 'txt') => {
    setCreatingFileType(type)
    setFileName('')
    setTimeout(() => fileInputRef.current?.focus(), 0)
  }

  const confirmCreateFile = () => {
    if (!fileName.trim() || !creatingFileType) return
    const ext = creatingFileType === 'js' ? 'js' : creatingFileType
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: fileName.includes('.') ? fileName : `${fileName}.${ext}`,
      type: creatingFileType,
      content: '',
      folderId: selectedFolderId || undefined,
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setCreatingFileType(null)
    setFileName('')
  }

  const cancelCreatingFile = () => {
    setCreatingFileType(null)
    setFileName('')
  }

  const addFolder = () => {
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: `Folder${folders.length + 1}`,
      collapsed: false,
    }
    setFolders([...folders, newFolder])
  }

  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(f =>
      f.id === folderId ? { ...f, collapsed: !f.collapsed } : f
    ))
  }

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId))
    setFiles(files.filter(f => f.folderId !== folderId))
    setSelectedFolderId(null)
  }

  // ============ BUNDLING & PREVIEW ============
  const bundleCode = (): string => {
    const html = files.find(f => f.type === 'html')?.content || ''
    const css = files.filter(f => f.type === 'css').map(f => f.content).join('\n')
    const js = files.filter(f => f.type === 'js').map(f => f.content).join('\n')

    if (!html) {
      return '<h1 style="color: red; text-align: center; margin-top: 20px;">Please create an HTML file first</h1>'
    }

    // Console bridge - must be injected right after body opens
    const consoleBridge = `<script>
(function(){
  const send = (type, args) => {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2) } catch { return String(arg) }
      }
      return String(arg)
    }).join(' ')
    window.parent.postMessage({ type, message, time: new Date().toLocaleTimeString() }, '*')
  }
  const methods = ['log','error','warn','info']
  methods.forEach(method => {
    const original = console[method]
    console[method] = (...args) => { send(method, args); original(...args) }
  })
  window.addEventListener('error', (e) => {
    window.parent.postMessage({ type: 'error', message: e.message, time: new Date().toLocaleTimeString() }, '*')
  })
})()
</script>`

    // Bundle: HTML → CSS in head → console bridge after body → user JS before /body
    let bundled = html
      .replace('</head>', css ? `<style>${css}</style></head>` : '</head>')
      .replace('<body>', `<body>${consoleBridge}`)
      .replace('</body>', js ? `<script>${js}</script></body>` : '</body>')

    // Fallback for missing tags
    if (!bundled.includes('</body>')) {
      bundled = bundled + (js ? `<script>${js}</script>` : '')
    }

    return bundled
  }

  const generatePreview = () => {
    if (!iframeRef.current) return
    iframeRef.current.srcdoc = bundleCode()
    setConsoleLogs([]) // Clear console on each run
    setHasUnsavedChanges(false)
  }

  // ============ CONSOLE MESSAGE HANDLER ============
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type || !['log', 'error', 'warn', 'info'].includes(e.data.type)) return
      setConsoleLogs(prev => [...prev, {
        id: `log-${++consoleIdRef.current}`,
        type: e.data.type,
        message: e.data.message,
        time: e.data.time,
      }])
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs])

  // ============ RENDER ============
  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* Header */}
      <div className="h-8 bg-[#252526] border-b border-[#2d2d30] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden text-[#cccccc] hover:text-white transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
          <span className="text-sm font-semibold flex items-center gap-2">
            <Code size={16} /> <span className="hidden sm:inline">VS Code Editor</span>
          </span>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="h-9 bg-[#323233] border-b border-[#2d2d30] flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center gap-1 text-[#cccccc] hover:text-white transition-colors text-xs"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          <span className="hidden xl:inline">{sidebarCollapsed ? 'Show' : 'Hide'} Sidebar</span>
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`${showConsole ? 'bg-[#1177bb]' : 'bg-[#0e639c]'} hover:bg-[#1177bb] text-white px-2 sm:px-3 py-1 rounded text-xs flex items-center gap-1 sm:gap-2 transition-colors`}
          >
            <Terminal size={12} />
            <span className="hidden sm:inline">{showConsole ? 'Hide Console' : 'Show Console'}</span>
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`${showPreview ? 'bg-[#1177bb]' : 'bg-[#0e639c]'} hover:bg-[#1177bb] text-white px-2 sm:px-3 py-1 rounded text-xs flex items-center gap-1 sm:gap-2 transition-colors`}
          >
            <Play size={12} />
            <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={generatePreview}
            className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs flex items-center gap-1 sm:gap-2 transition-colors font-semibold"
          >
            <Play size={12} fill="white" />
            <span>Run</span>
            {hasUnsavedChanges && <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar - File Explorer */}
        <div
          className={`${sidebarCollapsed ? 'w-0 -ml-64' : 'w-64'
            } bg-[#252526] border-r border-[#2d2d30] flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 absolute lg:relative z-10 h-full lg:z-0`}
        >
          {/* Sidebar Header */}
          <div className="h-10 border-b border-[#2d2d30] px-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide">Explorer</span>
            <div className="flex gap-1">
              <button
                onClick={() => startCreatingFile('html')}
                title="New HTML"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => startCreatingFile('css')}
                title="New CSS"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => startCreatingFile('js')}
                title="New JS"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={addFolder}
                title="New Folder"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded transition-colors"
              >
                <Folder size={14} />
              </button>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="mb-2">
                <div className="flex items-center gap-2 px-2 py-1 text-sm">
                  <Folder size={14} />
                  <span>Project</span>
                </div>
              </div>

              <div className="space-y-1">
                {/* File Creation Input */}
                {creatingFileType && !selectedFolderId && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded">
                    {getFileIcon(creatingFileType)}
                    <input
                      ref={fileInputRef}
                      type="text"
                      placeholder={`filename.${creatingFileType === 'js' ? 'js' : creatingFileType}`}
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmCreateFile()
                        if (e.key === 'Escape') cancelCreatingFile()
                      }}
                      className="flex-1 bg-[#3c3c3c] text-white text-sm px-1 py-0 rounded border border-[#007acc] outline-none"
                      autoFocus
                    />
                  </div>
                )}

                {/* Root Files */}
                {files.filter(f => !f.folderId).map(file => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}
                  >
                    {getFileIcon(file.type)}
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        deleteFile(file.id)
                      }}
                      className="w-4 h-4 flex items-center justify-center hover:bg-[#3e3e42] rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Folders */}
                {folders.map(folder => (
                  <div key={folder.id}>
                    <div
                      onClick={() => {
                        toggleFolder(folder.id)
                        setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)
                      }}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${selectedFolderId === folder.id ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'}`}
                    >
                      {folder.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      <Folder size={14} className="text-yellow-500" />
                      <span className="text-sm truncate flex-1">{folder.name}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteFolder(folder.id)
                        }}
                        className="w-4 h-4 flex items-center justify-center hover:bg-[#3e3e42] rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Files in Folder */}
                    {!folder.collapsed && (
                      <div className="ml-4 space-y-1">
                        {creatingFileType && selectedFolderId === folder.id && (
                          <div className="flex items-center gap-2 px-2 py-1 rounded">
                            {getFileIcon(creatingFileType)}
                            <input
                              ref={fileInputRef}
                              type="text"
                              placeholder={`filename.${creatingFileType === 'js' ? 'js' : creatingFileType}`}
                              value={fileName}
                              onChange={(e) => setFileName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmCreateFile()
                                if (e.key === 'Escape') cancelCreatingFile()
                              }}
                              className="flex-1 bg-[#3c3c3c] text-white text-sm px-1 py-0 rounded border border-[#007acc] outline-none"
                              autoFocus
                            />
                          </div>
                        )}

                        {files.filter(f => f.folderId === folder.id).map(file => (
                          <div
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}
                          >
                            {getFileIcon(file.type)}
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                deleteFile(file.id)
                              }}
                              className="w-4 h-4 flex items-center justify-center hover:bg-[#3e3e42] rounded"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {!sidebarCollapsed && (
          <div
            className=" inset-0 bg-black bg-opacity-50 z-[5] lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          >kjkkjjk</div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div className="h-9 bg-[#252526] border-b border-[#2d2d30] flex overflow-x-auto flex-shrink-0">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`flex items-center gap-2 px-3 border-r border-[#2d2d30] cursor-pointer transition-colors min-w-max ${activeFileId === file.id ? 'bg-[#1e1e1e] border-t-2 border-t-[#007acc]' : 'bg-[#2d2d2d] hover:bg-[#323233]'}`}
              >
                {getFileIcon(file.type)}
                <span className="text-xs">{file.name}</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteFile(file.id)
                  }}
                  className="w-4 h-4 flex items-center justify-center hover:bg-[#3e3e42] rounded ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor + Preview Split */}
          {activeFile && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Monaco Editor */}
                <div className={`${showPreview ? 'lg:w-1/2' : 'w-full'} flex flex-col overflow-hidden min-w-0 transition-all duration-300 ${showPreview ? 'h-1/2 lg:h-full' : 'h-full'}`}>
                  <Editor
                    height="100%"
                    language={getLanguageFromType(activeFile.type)}
                    value={activeFile.content}
                    onChange={(value) => updateFile(activeFile.id, value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: window.innerWidth > 768 },
                      fontSize: window.innerWidth < 640 ? 12 : 14,
                      fontFamily: 'Monaco, Menlo, Consolas, monospace',
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: 'on',
                      quickSuggestions: true,
                      parameterHints: { enabled: true },
                      scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                    }}
                  />
                </div>

                {/* Live Preview */}
                {showPreview && (
                  <div className={`${showPreview ? 'lg:w-1/2' : 'w-0'} border-t lg:border-t-0 lg:border-l border-[#2d2d30] bg-white overflow-hidden flex flex-col transition-all duration-300 ${showPreview ? 'h-1/2 lg:h-full' : 'h-0'}`}>
                    <div className="h-8 bg-[#252526] border-b border-[#2d2d30] px-3 flex items-center justify-between flex-shrink-0">
                      <span className="text-xs text-[#cccccc]">Live Preview</span>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-[#858585] hover:text-[#cccccc] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <iframe
                      ref={iframeRef}
                      sandbox="allow-scripts"
                      className="flex-1 w-full h-full bg-white"
                      title="Preview"
                    />
                  </div>
                )}
              </div>

              {/* Console Panel */}
              {showConsole && (
                <div className="h-32 sm:h-40 border-t border-[#2d2d30] bg-[#1e1e1e] flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300">
                  <div className="h-8 bg-[#252526] border-b border-[#2d2d30] px-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-[#cccccc]">
                      <Terminal size={14} />
                      Console
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setConsoleLogs([])}
                        className="text-xs text-[#858585] hover:text-[#cccccc] px-2 py-1 rounded hover:bg-[#3e3e42] transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowConsole(false)}
                        className="text-[#858585] hover:text-[#cccccc] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-mono">
                    {consoleLogs.length === 0 ? (
                      <div className="text-[#858585]">Console is clean</div>
                    ) : (
                      consoleLogs.map(log => (
                        <div
                          key={log.id}
                          className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-[#d4d4d4]'
                            }`}
                        >
                          <span className="text-[#858585]">[{log.time}]</span> {log.message}
                        </div>
                      ))
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}