// 'use client'

// export default function Vscode() {
//   return (
//     <div className="w-full overflow-auto h-screen">
//      <iframe
//                 src="https://github1s.com/vibhavtrivediWEBDEV/SmartyAI/blob/main/src/Pages/main.js"
//                 title="VsCode"
//                 className="h-full w-full bg-ub-cool-grey"
//               ></iframe>
//     </div>
//   );
// }


'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileText, Folder, Plus, X, Play, ChevronRight, ChevronDown, Code, Copy } from 'lucide-react'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

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

interface VSCodeEditorProps {
  onClose?: () => void
  initialFiles?: CodeFile[]
}

const syntaxHighlight = (code: string, type: string) => {
  try {
    if (type === 'html') {
      return hljs.highlight(code, { language: 'html' }).value
    } else if (type === 'css') {
      return hljs.highlight(code, { language: 'css' }).value
    } else if (type === 'js') {
      return hljs.highlight(code, { language: 'javascript' }).value
    }
  } catch (e) {
    console.log('[v0] Syntax highlight error:', e)
  }
  return hljs.utils.escapeHtml(code)
}

export default function VSCodeEditor({ onClose, initialFiles = [] }: VSCodeEditorProps) {
  const [files, setFiles] = useState<CodeFile[]>(
    initialFiles.length > 0
      ? initialFiles
      : [
          { id: '1', name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>' },
          { id: '2', name: 'style.css', type: 'css', content: 'body {\n  font-family: Arial, sans-serif;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}' },
          { id: '3', name: 'script.js', type: 'js', content: 'console.log("Hello from JS!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  console.log("Page loaded");\n});' },
        ]
  )
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [activeFileId, setActiveFileId] = useState(files[0]?.id || '1')
  const [showPreview, setShowPreview] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [fileDialogType, setFileDialogType] = useState<'html' | 'css' | 'js' | 'txt'>('html')
  const [fileName, setFileName] = useState('')
  const previewRef = useRef<HTMLIFrameElement>(null)

  const activeFile = files.find(f => f.id === activeFileId)

  const updateFile = (id: string, content: string) => {
    setFiles(files.map(f => (f.id === id ? { ...f, content } : f)))
  }

  const createFile = (type: 'html' | 'css' | 'js' | 'txt') => {
    setFileDialogType(type)
    setFileName('')
    setShowFileDialog(true)
  }

  const confirmCreateFile = () => {
    if (!fileName.trim()) return
    const ext = fileDialogType === 'js' ? 'js' : fileDialogType
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: fileName.includes('.') ? fileName : `${fileName}.${ext}`,
      type: fileDialogType,
      content: '',
      folderId: selectedFolderId || undefined,
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setShowFileDialog(false)
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

  const deleteFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id)
    setFiles(newFiles)
    if (activeFileId === id && newFiles.length > 0) {
      setActiveFileId(newFiles[0].id)
    }
  }

  const generatePreview = () => {
    const htmlFile = files.find(f => f.type === 'html')
    const cssFiles = files.filter(f => f.type === 'css')
    const jsFiles = files.filter(f => f.type === 'js')

    if (!htmlFile) {
      if (previewRef.current) {
        previewRef.current.srcDoc = '<h1 style="color: red; text-align: center; margin-top: 20px;">Please create an HTML file first</h1>'
      }
      return
    }

    let html = htmlFile.content

    // Add all CSS files
    if (cssFiles.length > 0) {
      const cssContent = cssFiles.map(f => f.content).join('\n')
      html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`)
    }

    // Add all JS files
    if (jsFiles.length > 0) {
      const jsContent = jsFiles.map(f => f.content).join('\n')
      html = html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`)
    }

    if (previewRef.current) {
      previewRef.current.srcDoc = html
    }
  }

  useEffect(() => {
    if (showPreview) {
      generatePreview()
    }
  }, [showPreview, files])

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

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* File Name Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-6 w-80">
            <h3 className="text-white mb-4 font-semibold">Create {fileDialogType.toUpperCase()} File</h3>
            <input
              type="text"
              placeholder={`filename.${fileDialogType === 'js' ? 'js' : fileDialogType}`}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmCreateFile()}
              className="w-full bg-[#3c3c3c] text-white px-3 py-2 rounded border border-[#3e3e42] outline-none focus:border-[#007acc] mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFileDialog(false)}
                className="px-4 py-2 bg-[#3e3e42] hover:bg-[#454545] rounded text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateFile}
                className="px-4 py-2 bg-[#007acc] hover:bg-[#1177bb] text-white rounded text-sm transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Window Header */}
      <div className="h-8 bg-[#252526] border-b border-[#2d2d30] flex items-center justify-between px-3 flex-shrink-0">
        <span className="text-sm font-semibold flex items-center gap-2"><Code size={16} /> VS Code Editor</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Menu Bar */}
      <div className="h-9 bg-[#323233] border-b border-[#2d2d30] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex gap-6 text-sm">
          <button className="hover:bg-[#3e3e42] px-2 py-1 rounded transition-colors">File</button>
          <button className="hover:bg-[#3e3e42] px-2 py-1 rounded transition-colors">Edit</button>
          <button className="hover:bg-[#3e3e42] px-2 py-1 rounded transition-colors">View</button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`${
              showPreview ? 'bg-[#1177bb]' : 'bg-[#0e639c]'
            } hover:bg-[#1177bb] text-white px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors`}
          >
            <Play size={12} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-64 bg-[#252526] border-r border-[#2d2d30] flex flex-col flex-shrink-0">
          {/* Sidebar Header */}
          <div className="h-10 border-b border-[#2d2d30] px-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#cccccc]">Explorer</span>
            <div className="flex gap-2">
              <button
                onClick={addFolder}
                title="New Folder"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
              >
                <Folder size={12} />
              </button>
              <button
                onClick={() => createFile('html')}
                title="New HTML"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => createFile('css')}
                title="New CSS"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => createFile('js')}
                title="New JS"
                className="w-5 h-5 flex items-center justify-center hover:bg-[#3e3e42] rounded text-[#cccccc] transition-colors"
              >
                <Plus size={14} />
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
                {/* Root Files */}
                {files.filter(f => !f.folderId).map(file => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                      activeFileId === file.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'
                    }`}
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
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                        selectedFolderId === folder.id ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'
                      }`}
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
                        {files.filter(f => f.folderId === folder.id).map(file => (
                          <div
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                              activeFileId === file.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'
                            }`}
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

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div className="h-9 bg-[#252526] border-b border-[#2d2d30] flex overflow-x-auto flex-shrink-0">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`flex items-center gap-2 px-3 border-r border-[#2d2d30] cursor-pointer transition-colors min-w-max ${
                  activeFileId === file.id
                    ? 'bg-[#1e1e1e] border-t-2 border-t-[#007acc]'
                    : 'bg-[#2d2d2d] hover:bg-[#323233]'
                }`}
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

          {/* Editor Content */}
          {activeFile && (
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Code Editor with Syntax Highlight */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div className="flex-1 overflow-auto relative font-mono text-sm" style={{ lineHeight: '1.5' }}>
                  {/* Highlight Code Background */}
                  <pre className="absolute inset-0 w-full p-4 text-[#d4d4d4] bg-[#1e1e1e] overflow-auto pointer-events-none margin-0 border-none" style={{ margin: 0, padding: 16, fontFamily: 'Monaco, Menlo, Consolas, monospace' }}>
                    <code
                      className="hljs"
                      dangerouslySetInnerHTML={{
                        __html: syntaxHighlight(activeFile.content, activeFile.type),
                      }}
                    />
                  </pre>
                  {/* Editable Textarea */}
                  <textarea
                    value={activeFile.content}
                    onChange={e => updateFile(activeFile.id, e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 resize-none outline-none border-none text-transparent bg-transparent caret-[#d4d4d4] z-10"
                    style={{
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, Consolas, monospace',
                      fontSize: '14px',
                      color: 'transparent',
                    }}
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <div className="w-1/2 border-l border-[#2d2d30] bg-white overflow-hidden flex flex-col">
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
                    ref={previewRef}
                    className="flex-1 w-full h-full bg-white"
                    title="Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white flex-shrink-0">
        <div className="flex gap-4">
          <span>{activeFile?.type.toUpperCase() || 'UNTITLED'}</span>
          <span>Ln 1, Col 1</span>
        </div>
        <div className="flex gap-4">
          <span>{files.length} files</span>
        </div>
      </div>
    </div>
  )
}
