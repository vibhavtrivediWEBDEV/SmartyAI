'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FileText, Folder, Plus, X, Play, ChevronRight, ChevronDown, Code, Terminal, Menu, ChevronLeft } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useCursorAutomation } from '@/hooks/useCursorAutomation'
import { getLanguageFromExtension, getFileIconColor } from '@/lib/utils/language'
import { getRunStrategy, RunStrategy } from '@/lib/utils/runStrategy'
import { bundleReact } from '@/lib/utils/reactBundler'
import { executeCode } from '@/lib/utils/backendExecutor'

// ============ TYPES ============
interface CodeFile {
  id: string
  name: string
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
  { id: '1', name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p id="demo">Click the button</p>\n  <button id="btn">Click Me</button>\n</body>\n</html>' },
  { id: '2', name: 'style.css', content: 'body {\n  font-family: Arial, sans-serif;\n  background: #f0f0f0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}\n\nbutton {\n  padding: 8px 16px;\n  background: #007acc;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}' },
  { id: '3', name: 'script.js', content: 'console.log("Script loaded!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  console.log("Page ready");\n  \n  const btn = document.getElementById("btn");\n  if (btn) {\n    btn.addEventListener("click", () => {\n      console.log("Button clicked");\n      document.getElementById("demo").textContent = "Button was clicked!";\n    });\n  }\n});' },
  { id: '4', name: 'App.jsx', content: 'function App() {\n  const [count, setCount] = React.useState(0);\n  \n  return (\n    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>\n      <h1>React Counter</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}' },
  { id: '5', name: 'Counter.tsx', content: 'import { useState } from "react";\n\ninterface CounterProps {\n  initialValue?: number;\n}\n\nfunction Counter({ initialValue = 0 }: CounterProps) {\n  const [count, setCount] = useState<number>(initialValue);\n  \n  return (\n    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>\n      <h1>TypeScript Counter</h1>\n      <p style={{ fontSize: "48px", fontWeight: "bold" }}>{count}</p>\n      <button \n        onClick={() => setCount(c => c + 1)}\n        style={{ marginRight: "10px", padding: "10px 20px", fontSize: "16px" }}\n      >\n        +\n      </button>\n      <button \n        onClick={() => setCount(c => c - 1)}\n        style={{ padding: "10px 20px", fontSize: "16px" }}\n      >\n        -\n      </button>\n      <button \n        onClick={() => setCount(initialValue)}\n        style={{ marginLeft: "10px", padding: "10px 20px", fontSize: "16px" }}\n      >\n        Reset\n      </button>\n    </div>\n  );\n}\n\nexport default Counter;' },
  { id: '6', name: 'main.py', content: '# Python Example\nprint("Hello from Python!")\n\nfor i in range(5):\n  print(f"Number: {i}")\n\nprint("Done!")' }
]

// ============ PANEL SIZE CONSTANTS ============
const MIN_SIDEBAR_WIDTH = 150
const MAX_SIDEBAR_WIDTH = 500
const DEFAULT_SIDEBAR_WIDTH = 256

const MIN_EDITOR_WIDTH = 200
const MIN_PREVIEW_WIDTH = 200

const MIN_CONSOLE_HEIGHT = 80
const MAX_CONSOLE_HEIGHT = 500
const DEFAULT_CONSOLE_HEIGHT = 160

// ============ UTILITIES ============
const getFileIcon = (filename: string) => {
  const color = getFileIconColor(filename)
  return (
    <FileText
      size={16}
      style={{ color }}
      className="flex-shrink-0"
    />
  )
}

const addConsoleLog = (
  setConsoleLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>,
  consoleIdRef: React.MutableRefObject<number>,
  type: 'log' | 'error' | 'warn',
  message: string
) => {
  setConsoleLogs(prev => [...prev, {
    id: `log-${++consoleIdRef.current}`,
    type,
    message,
    time: new Date().toLocaleTimeString(),
  }])
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
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [fileName, setFileName] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // Panel sizes
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [editorPreviewSplit, setEditorPreviewSplit] = useState(50) // percentage
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT)

  // Dragging state
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const [isDraggingEditorSplit, setIsDraggingEditorSplit] = useState(false)
  const [isDraggingConsole, setIsDraggingConsole] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const consoleIdRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeFile = files.find(f => f.id === activeFileId)

  // ============ DRAG HANDLERS ============
  const handleSidebarDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingSidebar) return
    const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX))
    setSidebarWidth(newWidth)
  }, [isDraggingSidebar])

  const handleEditorSplitDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingEditorSplit || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const sidebarOffset = sidebarCollapsed ? 0 : sidebarWidth
    const editorWidth = e.clientX - containerRect.left - sidebarOffset
    const contentWidth = containerRect.width - sidebarOffset
    const percentage = (editorWidth / contentWidth) * 100
    setEditorPreviewSplit(Math.min(80, Math.max(20, percentage)))
  }, [isDraggingEditorSplit, sidebarCollapsed, sidebarWidth])

  const handleConsoleDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingConsole || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const distanceFromBottom = containerRect.bottom - e.clientY
    const newHeight = Math.min(MAX_CONSOLE_HEIGHT, Math.max(MIN_CONSOLE_HEIGHT, distanceFromBottom))
    setConsoleHeight(newHeight)
  }, [isDraggingConsole])

  const stopDragging = useCallback(() => {
    setIsDraggingSidebar(false)
    setIsDraggingEditorSplit(false)
    setIsDraggingConsole(false)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) handleSidebarDrag(e)
      else if (isDraggingEditorSplit) handleEditorSplitDrag(e)
      else if (isDraggingConsole) handleConsoleDrag(e)
    }

    if (isDraggingSidebar || isDraggingEditorSplit || isDraggingConsole) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', stopDragging)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopDragging)
      if (!isDraggingSidebar && !isDraggingEditorSplit && !isDraggingConsole) {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDraggingSidebar, isDraggingEditorSplit, isDraggingConsole, handleSidebarDrag, handleEditorSplitDrag, handleConsoleDrag, stopDragging])

  // ============ LOCALSTORAGE HELPERS ============
  const saveToLocalStorage = (files: CodeFile[], folders: FolderItem[]) => {
    try {
      localStorage.setItem('vscode-files-v2', JSON.stringify(files))
      localStorage.setItem('vscode-folders', JSON.stringify(folders))
      localStorage.setItem('vscode-activeFileId', activeFileId)
      localStorage.setItem('vscode-sidebarWidth', sidebarWidth.toString())
      localStorage.setItem('vscode-consoleHeight', consoleHeight.toString())
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedFiles = localStorage.getItem('vscode-files-v2')
      const savedFolders = localStorage.getItem('vscode-folders')
      const savedActiveFileId = localStorage.getItem('vscode-activeFileId')
      const savedSidebarWidth = localStorage.getItem('vscode-sidebarWidth')
      const savedConsoleHeight = localStorage.getItem('vscode-consoleHeight')

      if (savedFiles) {
        // Migration: remove 'type' field from old files
        const parsedFiles = JSON.parse(savedFiles).map((f: any) => {
          const { type, ...rest } = f
          return rest
        })
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

      if (savedSidebarWidth) {
        setSidebarWidth(parseInt(savedSidebarWidth))
      }

      if (savedConsoleHeight) {
        setConsoleHeight(parseInt(savedConsoleHeight))
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
  }, [files, folders, sidebarWidth, consoleHeight])

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

  const startCreatingFile = () => {
    setIsCreatingFile(true)
    setFileName('')
    setTimeout(() => fileInputRef.current?.focus(), 0)
  }

  const confirmCreateFile = () => {
    if (!fileName.trim()) return
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: fileName.includes('.') ? fileName : `${fileName}.txt`,
      content: '',
      folderId: selectedFolderId || undefined,
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setIsCreatingFile(false)
    setFileName('')
  }

  const cancelCreatingFile = () => {
    setIsCreatingFile(false)
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
    const html = files.find(f => f.name.endsWith('.html'))?.content || ''
    const css = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n')
    const js = files.filter(f => f.name.endsWith('.js')).map(f => f.content).join('\n')

    if (!html) {
      return '<h1 style="color: red; text-align: center; margin-top: 20px;">Please create an HTML file first</h1>'
    }

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

    let bundled = html
      .replace('</head>', css ? `<style>${css}</style></head>` : '</head>')
      .replace('<body>', `<body>${consoleBridge}`)
      .replace('</body>', js ? `<script>${js}</script></body>` : '</body>')

    if (!bundled.includes('</body>')) {
      bundled = bundled + (js ? `<script>${js}</script>` : '')
    }

    return bundled
  }

  const handleRun = async () => {
    if (!activeFile) return
    
    setIsRunning(true)
    setConsoleLogs([]) // Clear console before execution
    
    addConsoleLog(setConsoleLogs, consoleIdRef, 'log', `Running ${activeFile.name}...`)
    
    try {
      const strategy = getRunStrategy(activeFile.name)
      
      switch (strategy) {
        case 'html-preview':
          generatePreview()
          addConsoleLog(setConsoleLogs, consoleIdRef, 'log', 'Preview loaded successfully')
          break
          
        case 'react-bundle':
          addConsoleLog(setConsoleLogs, consoleIdRef, 'log', 'Bundling React/TypeScript code...')
          const reactResult = await bundleReact(activeFile.name, files)
          
          if (reactResult.error) {
            addConsoleLog(setConsoleLogs, consoleIdRef, 'error', `Bundle error: ${reactResult.error}`)
          } else {
            generateReactPreview(reactResult.code)
            addConsoleLog(setConsoleLogs, consoleIdRef, 'log', 'React app bundled and running')
          }
          break
          
        case 'backend-execute':
          addConsoleLog(setConsoleLogs, consoleIdRef, 'log', 'Executing backend code...')
          const backendResult = await executeCode(activeFile.name, activeFile.content)
          
          if (backendResult.stdout) {
            backendResult.stdout.split('\n').forEach(line => {
              if (line.trim()) {
                addConsoleLog(setConsoleLogs, consoleIdRef, 'log', line)
              }
            })
          }
          
          if (backendResult.stderr) {
            backendResult.stderr.split('\n').forEach(line => {
              if (line.trim()) {
                addConsoleLog(setConsoleLogs, consoleIdRef, 'error', line)
              }
            })
          }
          
          if (backendResult.error) {
            addConsoleLog(setConsoleLogs, consoleIdRef, 'error', backendResult.error)
          }
          
          if (!backendResult.stdout && !backendResult.stderr && !backendResult.error) {
            addConsoleLog(setConsoleLogs, consoleIdRef, 'warn', 'No output from execution')
          }
          break
          
        case 'unsupported':
          addConsoleLog(setConsoleLogs, consoleIdRef, 'error', `Cannot run ${activeFile.name}. This file type is not executable.`)
          addConsoleLog(setConsoleLogs, consoleIdRef, 'warn', 'Supported: HTML, CSS, JS, JSX, TSX, TS, Python, Java, C, C++, Go, Rust, PHP')
          break
      }
    } catch (error: any) {
      addConsoleLog(setConsoleLogs, consoleIdRef, 'error', `Execution failed: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }
  
  const generateReactPreview = (code: string) => {
    if (!iframeRef.current) return
    
    console.log('🔍 [VSCode] Transformed code for preview:\n', code)
    
    // Wrap code with auto-mount logic (BEFORE transpilation)
    const wrappedCode = `
${code}

// Auto-mount logic
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

(function() {
  try {
    // Try to find component
    const componentNames = ['App', 'Root', 'Main', 'Application', 'Counter', 'Component'];
    let ComponentToMount = null;
    
    for (const name of componentNames) {
      if (typeof eval(name) !== 'undefined') {
        ComponentToMount = eval(name);
        break;
      }
    }
    
    if (ComponentToMount) {
      root.render(React.createElement(ComponentToMount));
      console.log('✅ React app mounted successfully');
    } else {
      console.warn('⚠️ No component found to mount');
    }
  } catch (e) {
    console.error('❌ React mount error:', e);
    document.getElementById('root').innerHTML = '<div style="padding:20px;background:#fee;color:#c00;border-radius:8px;margin:20px;"><h2>Error</h2><pre>' + e.message + '</pre></div>';
  }
})();
    `;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif; }
    #root { width: 100%; height: 100vh; }
    .error-boundary { padding: 20px; background: #fee; color: #c00; border-radius: 8px; margin: 20px; }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  ${getConsoleBridge()}
  <script>
    // Transpile and execute
    try {
      console.log('📦 [IFRAME] Transpiling code...');
      const codeToTranspile = \`${wrappedCode.replace(/`/g, '\\`').replace(/<\/script>/g, '<\\/script>')}\`;
      console.log('📦 [IFRAME] Code to transpile:', codeToTranspile.substring(0, 500));
      
      const transpiledCode = Babel.transform(codeToTranspile, {
        presets: [['react', { runtime: 'classic' }]],
        plugins: []
      }).code;
      
      console.log('📦 [IFRAME] Transpiled successfully');
      console.log('📦 [IFRAME] Transpiled code:', transpiledCode.substring(0, 500));
      eval(transpiledCode);
    } catch (error) {
      console.error('❌ Transpilation error:', error);
      console.error('❌ Code that failed:', error.code);
      document.getElementById('root').innerHTML = '<div style="padding:20px;background:#fee;color:#c00;border-radius:8px;margin:20px;"><h2>Error</h2><pre>' + error.message + '</pre></div>';
    }
  </script>
</body>
</html>
    `
    
    iframeRef.current.srcdoc = html
    setHasUnsavedChanges(false)
  }
  
  const getConsoleBridge = () => {
    return `<script>
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
  }

  const generatePreview = () => {
    if (!iframeRef.current) return
    iframeRef.current.srcdoc = bundleCode()
    setConsoleLogs([])
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
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden" ref={containerRef}>
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
            <span className="hidden sm:inline">{showConsole ? 'Hide' : 'Show'} Console</span>
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`${showPreview ? 'bg-[#1177bb]' : 'bg-[#0e639c]'} hover:bg-[#1177bb] text-white px-2 sm:px-3 py-1 rounded text-xs flex items-center gap-1 sm:gap-2 transition-colors`}
          >
            <Play size={12} />
            <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 sm:px-3 py-1 rounded text-xs flex items-center gap-1 sm:gap-2 transition-colors font-semibold"
          >
            <Play size={12} fill="white" className={isRunning ? 'animate-spin' : ''} />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
            {hasUnsavedChanges && !isRunning && <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar - File Explorer */}
        <div
          style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
          className={`bg-[#252526] border-r border-[#2d2d30] flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300`}
        >
          {/* Sidebar Header */}
          <div className="h-10 border-b border-[#2d2d30] px-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide">Explorer</span>
            <div className="flex gap-1">
              <button
                onClick={startCreatingFile}
                title="New File"
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
                {isCreatingFile && !selectedFolderId && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded">
                    {fileName && getFileIcon(fileName)}
                    <input
                      ref={fileInputRef}
                      type="text"
                      placeholder="filename.ext (e.g., app.tsx)"
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
                    {getFileIcon(file.name)}
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
                        {isCreatingFile && selectedFolderId === folder.id && (
                          <div className="flex items-center gap-2 px-2 py-1 rounded">
                            {fileName && getFileIcon(fileName)}
                            <input
                              ref={fileInputRef}
                              type="text"
                              placeholder="filename.ext"
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
                            {getFileIcon(file.name)}
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

        {/* Sidebar Resize Handle */}
        {!sidebarCollapsed && (
          <div
            className="w-1 bg-transparent hover:bg-[#007acc] cursor-ew-resize flex-shrink-0 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDraggingSidebar(true)
            }}
          />
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
                {getFileIcon(file.name)}
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

          {/* Editor + Preview Container */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0" style={{ height: showConsole ? `calc(100% - ${consoleHeight}px)` : '100%' }}>
            {/* Monaco Editor */}
            <div
              style={{ width: showPreview ? `${editorPreviewSplit}%` : '100%' }}
              className="flex flex-col overflow-hidden min-w-0 h-full"
            >
              {activeFile && (
                <Editor
                  height="100%"
                  language={getLanguageFromExtension(activeFile.name)}
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
              )}
            </div>

            {/* Editor/Preview Split Resize Handle */}
            {showPreview && (
              <div
                className="w-1 bg-transparent hover:bg-[#007acc] cursor-ew-resize flex-shrink-0 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsDraggingEditorSplit(true)
                }}
              />
            )}

            {/* Live Preview */}
            {showPreview && (
              <div
                style={{ width: `${100 - editorPreviewSplit}%` }}
                className="border-t lg:border-t-0 lg:border-l border-[#2d2d30] bg-white overflow-hidden flex flex-col h-full"
              >
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
                  sandbox="allow-scripts allow-same-origin"
                  className="flex-1 w-full h-full bg-white"
                  title="Preview"
                />
              </div>
            )}
          </div>

          {/* Console Resize Handle */}
          {showConsole && (
            <div
              className="h-1 bg-transparent hover:bg-[#007acc] cursor-ns-resize flex-shrink-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                setIsDraggingConsole(true)
              }}
            />
          )}

          {/* Console Panel */}
          {showConsole && (
            <div
              style={{ height: consoleHeight }}
              className="border-t border-[#2d2d30] bg-[#1e1e1e] flex flex-col flex-shrink-0 overflow-hidden"
            >
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
                      className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-[#d4d4d4]'}`}
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
      </div>
    </div>
  )
}
