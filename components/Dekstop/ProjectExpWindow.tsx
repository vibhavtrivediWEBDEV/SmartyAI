"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import {
  FolderIcon,
  FileTextIcon,
  PlayCircleIcon,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  GlobeIcon,
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  FolderOpen,
  Loader2,
  Plus,
  Edit3,
} from "lucide-react"
import { useKeyboard } from "@/app/context/keyBoardContext"
import { useSettings } from "@/app/context/settingContext"

interface ProjectFile {
  id: string
  name: string
  type: "folder" | "file"
  parentId?: string | null
  size?: string | null
  children?: ProjectFile[]
  createdAt?: Date
  updatedAt?: Date
  files?: ProjectFile[]
  content?: string
  src?: string
  url?: string
}


interface OpenFile extends ProjectFile {
  projectId: string
}


interface ProjectExplorerWindowProps {

  onOpenFile: (file: ProjectFile) => void
  onDataChange?: () => void
}

const FILE_EXTENSIONS = {
  text: [".txt", ".md", ".doc", ".docx", ".pdf"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp"],
  video: [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"],
  audio: [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"],
  code: [".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".py", ".java", ".cpp"],
  spreadsheet: [".xlsx", ".xls", ".csv", ".ods"],
  archive: [".zip", ".rar", ".7z", ".tar", ".gz"],
}

export function ProjectExplorerWindow({ onOpenFile, onDataChange }: ProjectExplorerWindowProps) {
  const [projects, setProjects] = useState<ProjectFile[]>([])

  const [sidebarOpen, setSidebarOpen] = useState(false)


  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [renamingItem, setRenamingItem] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [fileCreationDialog, setFileCreationDialog] = useState<{
    isOpen: boolean
    fileName: string
    fileType: string
    parentId: string
  } | null>(null)

  const { settings } = useSettings()

  const {
    selectedItems,
    setSelectedItems,
    copyItems,
    cutItems,
    pasteItems,
    showContextMenu,
    isCommandPressed,
    clipboardItems,
    setCurrentTargetLocation,
  } = useKeyboard()

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/Projects")
      if (!response.ok) throw new Error("Failed to fetch projects")

      const result = await response.json()
      setProjects(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects")
      console.error("[v0] Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(
    async (name: string, type: "folder" | "file", parentId?: string) => {
      try {
        console.log("[v0] Creating:", name, "Type:", type, "ParentId:", parentId)

        if (type === "file" && parentId) {
          const response = await fetch(`/api/Projects/${parentId}/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              type: "document", // IMPORTANT (match seed)
              content: "",
            }),
          })

          if (!response.ok) throw new Error("Failed to create file")

          const result = await response.json()

          setProjects(prev =>
            prev.map(p =>
              p.id === parentId
                ? { ...p, files: [...(p.files || []), result.data] }
                : p
            )
          )

          onDataChange?.()
          return result.data
        }
        else {
          // Creating a folder at root level
          const response = await fetch("/api/Projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type, parentId: parentId || null }),
          })

          if (!response.ok) throw new Error("Failed to create project")

          const result = await response.json()
          setProjects((prev) => [...prev, result.data])
          onDataChange?.()
          return result.data
        }
      } catch (err) {
        console.error("[v0] Error creating project:", err)
        throw err
      }
    },
    [projects, onDataChange]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/Projects`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        })

        if (!response.ok) throw new Error("Failed to delete project")

        setProjects((prev) => prev.filter((p) => p.id !== id))
        onDataChange?.()
      } catch (err) {
        console.error("[v0] Error deleting project:", err)
        throw err
      }
    },
    [onDataChange]
  )

  const copyProjectsToDatabase = useCallback(
    async (sourceIds: string[], targetParentId?: string) => {
      try {
        const response = await fetch("/api/Projects/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceIds, targetParentId }),
        })

        if (!response.ok) throw new Error("Failed to copy projects")

        const result = await response.json()
        setProjects((prev) => [...prev, ...result.data])
        onDataChange?.()
        return result.data
      } catch (err) {
        console.error("[v0] Error copying projects:", err)
        throw err
      }
    },
    [onDataChange]
  )

  const renameProject = useCallback(
    async (id: string, newName: string) => {
      try {
        const response = await fetch(`/api/Projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        })

        if (!response.ok) throw new Error("Failed to rename project")

        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)))
        onDataChange?.()
        return
      } catch (err) {
        console.error("[v0] Error renaming project:", err)
        throw err
      }
    },
    [onDataChange]
  )

  const uploadFile = useCallback(
    async (file: File, parentId?: string) => {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("parentId", parentId || "")

        const response = await fetch("/api/Projects/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Failed to upload file")

        const result = await response.json()
        setProjects((prev) => [...prev, result.data])
        onDataChange?.()
        return result.data
      } catch (err) {
        console.error("[v0] Error uploading file:", err)
        throw err
      }
    },
    [onDataChange]
  )

  const handleDragStart = useCallback((e: React.DragEvent, file: ProjectFile) => {
    e.dataTransfer.setData("application/json", JSON.stringify(file))
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId?: string) => {
      e.preventDefault()
      try {
        const fileData = JSON.parse(e.dataTransfer.getData("application/json"))

        const response = await fetch(`/api/Projects/${fileData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetId }),
        })

        if (!response.ok) throw new Error("Failed to move file")

        await fetchProjects()
        onDataChange?.()
      } catch (err) {
        console.error("[v0] Error moving file:", err)
      }
    },
    [fetchProjects, onDataChange]
  )

  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (projects.length > 0 && !selectedCategory) {
      const firstProject = projects.find((p) => !p.parentId) || projects[0]
      if (firstProject) {
        setSelectedCategory(firstProject.id)
        setCurrentTargetLocation(firstProject.id)
      }
    }
  }, [projects, selectedCategory, setCurrentTargetLocation])

  const rootProjects = projects.filter((p) => !p.parentId)
  const currentProject = projects.find((p) => p.id === selectedCategory)

  const getFileIcon = (file: ProjectFile) => {
    const iconSize = 28

    if (file.type === "folder") {
      return <FolderIcon size={iconSize} className="text-blue-500" />
    }

    const extension = file.name.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
      case "md":
        return <FileTextIcon size={iconSize} className="text-gray-500 " />
      case "mp4":
      case "mov":
      case "avi":
        return <PlayCircleIcon size={iconSize} className="text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FileImage size={iconSize} className="text-green-500" />
      case "xlsx":
      case "xls":
      case "csv":
        return <FileSpreadsheet size={iconSize} className="text-green-600" />
      case "zip":
      case "rar":
      case "7z":
        return <FileArchive size={iconSize} className="text-purple-500" />
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
        return <FileCode size={iconSize} className="text-blue-400" />
      default:
        if (file.name.includes(".com") || file.name.includes(".ai")) {
          return <GlobeIcon size={iconSize} className="text-indigo-500" />
        }
        return <FileIcon size={iconSize} className="text-gray-500" />
    }
  }

  const handleFileClick = useCallback(
    (file: ProjectFile, event: React.MouseEvent) => {
      if (renamingItem === file.id) return
      // console.log("click-project",selectedCategory)
      if (event.detail === 2) {
        onOpenFile({ ...file, projectId: selectedCategory } as OpenFile)
        return
      }


      if (isCommandPressed) {
        setSelectedItems((prev) =>
          prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id]
        )
      } else {
        setSelectedItems([file.id])
      }
    },
    [onOpenFile, isCommandPressed, selectedCategory, setSelectedItems, renamingItem]
  )

  const handleContextMenu = useCallback(
    (file: ProjectFile, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!selectedItems.includes(file.id)) {
        setSelectedItems([file.id])
      }

      const contextMenuItems = [
        {
          label: "Open",
          icon: <FolderOpen className="h-4 w-4" />,
          action: () => onOpenFile({ ...file, projectId: selectedCategory } as OpenFile),

        },
        { label: "---", disabled: true },
        {
          label: "Copy",
          icon: <Copy className="h-4 w-4" />,
          action: () => {
            const items = selectedItems.map((id) => {
              const fileData = projects.find((p) => p.id === id)
              return {
                id,
                name: fileData?.name || "",
                type: fileData?.type === "folder" ? "folder" : "file",
                data: fileData,
                operation: "copy" as const,
                source: selectedCategory,
              }
            })
            copyItems(items)
          },
        },
        {
          label: "Cut",
          icon: <Scissors className="h-4 w-4" />,
          action: () => {
            const items = selectedItems.map((id) => {
              const fileData = projects.find((p) => p.id === id)
              return {
                id,
                name: fileData?.name || "",
                type: fileData?.type === "folder" ? "folder" : "file",
                data: fileData,
                operation: "cut" as const,
                source: selectedCategory,
              }
            })
            cutItems(items)
          },
        },
        {
          label: "Paste",
          icon: <ClipboardPaste className="h-4 w-4" />,
          action: async () => {
            const sourceIds = clipboardItems.map((item) => item.id)
            await copyProjectsToDatabase(sourceIds, selectedCategory)
            pasteItems(selectedCategory)
            await fetchProjects()
            onDataChange?.()
          },
          disabled: clipboardItems.length === 0,
        },
        { label: "---", disabled: true },
        {
          label: "Rename",
          icon: <Edit3 className="h-4 w-4" />,
          action: () => {
            setRenamingItem(file.id)
            setRenameValue(file.name)
          },
          disabled: selectedItems.length > 1,
        },
        {
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          action: async () => {
            for (const id of selectedItems) {
              await deleteProject(id)
            }
            setSelectedItems([])
            onDataChange?.()
          },
        },
      ]

      showContextMenu(event.clientX, event.clientY, contextMenuItems)
    },
    [
      selectedItems,
      projects,
      clipboardItems,
      selectedCategory,
      onOpenFile,
      copyItems,
      cutItems,
      pasteItems,
      showContextMenu,
      copyProjectsToDatabase,
      deleteProject,
      fetchProjects,
      onDataChange,
    ]
  )

  const handleBlankAreaContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      setSelectedItems([])

      const contextMenuItems = [
        {
          label: "New Folder",
          icon: <Plus className="h-4 w-4" />,
          action: async () => {
            const name = prompt("Enter folder name:")
            if (!name) return
            await createProject(name, "folder", selectedCategory)
            onDataChange?.()
          },
        },
        {
          label: "New File",
          icon: <Plus className="h-4 w-4" />,
          action: () => {
            setFileCreationDialog({
              isOpen: true,
              fileName: "",
              fileType: "text",
              parentId: selectedCategory,
            })
          },
        },
        { label: "---", disabled: true },
        {
          label: "Paste",
          icon: <ClipboardPaste className="h-4 w-4" />,
          action: async () => {
            const sourceIds = clipboardItems.map((i) => i.id)
            await copyProjectsToDatabase(sourceIds, selectedCategory)
            pasteItems(selectedCategory)
            await fetchProjects()
            onDataChange?.()
          },
          disabled: clipboardItems.length === 0,
        },
      ]

      showContextMenu(event.clientX, event.clientY, contextMenuItems)
    },
    [
      clipboardItems,
      selectedCategory,
      createProject,
      copyProjectsToDatabase,
      pasteItems,
      fetchProjects,
      onDataChange,
    ]
  )




  const handleRenameSubmit = useCallback(async () => {
    if (renamingItem && renameValue.trim()) {
      try {
        await renameProject(renamingItem, renameValue.trim())
        setRenamingItem(null)
        setRenameValue("")
      } catch (err) {
        console.error("[v0] Failed to rename:", err)
      }
    }
  }, [renamingItem, renameValue, renameProject])

  const handleRenameCancel = useCallback(() => {
    setRenamingItem(null)
    setRenameValue("")
  }, [])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleRenameSubmit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleRenameCancel()
      }
    },
    [handleRenameSubmit, handleRenameCancel]
  )

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId)
      setCurrentTargetLocation(categoryId)
    },
    [setCurrentTargetLocation]
  )

  const handleProjectContextMenu = (event: React.MouseEvent, id: string) => {
    const contextMenuItems = [
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        action: async () => {
          try {
            await deleteProject(id)
            onDataChange?.()
          } catch (err) {
            console.error("[v0] Failed to delete project:", err)
          }
        },
        shortcut: "Del",
      },
    ]

    showContextMenu(event.clientX, event.clientY, contextMenuItems)
  }

  const handleEmptyFolderContextMenu = (event: React.MouseEvent, parentId: string) => {
    event.preventDefault()
    const contextMenuItems = [
      {
        label: "New File",
        icon: <Plus className="h-4 w-4" />,
        action: () => {
          setFileCreationDialog({
            isOpen: true,
            fileName: "",
            fileType: "text",
            parentId: parentId,
          })
        },
      },
    ]

    showContextMenu(event.clientX, event.clientY, contextMenuItems)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-red-600">
        <p className="text-sm font-medium">Error loading projects</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  // return (
  //   <div className="flex w-full h-full bg-gray-100 text-gray-800 rounded overflow-hidden text-xs leading-tight">
  //     {/* Sidebar */}
  //     <div className="w-48 h-screen bg-gray-200 border-r border-gray-300 p-2 overflow-y-auto">
  //       <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Projects</h3>
  //       <ul className="space-y-0.5">
  //         {rootProjects.map((project) => (
  //           <li key={project.id}>
  //             <button
  //               onClick={() => handleCategorySelect(project.id)}
  //               onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
  //               onDragOver={handleDragOver}
  //               onDrop={(e) => handleDrop(e, project.id)}
  //               className={`flex items-center w-full text-left px-2 py-1 rounded transition-colors
  //                 ${selectedCategory === project.id ? "bg-blue-500 text-white" : "hover:bg-gray-300 text-gray-700"}`}
  //             >
  //               <span className="truncate">{project.name}</span>
  //             </button>
  //           </li>
  //         ))}
  //       </ul>
  //     </div>

  //     {/* Content Area */}
  //     <div
  //       className="flex-1 p-2 overflow-y-auto bg-white"
  //       onContextMenu={handleBlankAreaContextMenu}
  //       onDragOver={handleDragOver}
  //       onDrop={(e) => handleDrop(e, selectedCategory)}
  //     >
  //       {currentProject ? (
  //         <>
  //           <h2 className="text-sm font-bold text-gray-700 mb-2 truncate">{currentProject.name}</h2>
  //           <div className="grid grid-cols-3 gap-2">
  //             {currentProject.files?.map((file) => {
  //               const isSelected = selectedItems.includes(file.id)
  //               const isCut = clipboardItems.some((item) => item.id === file.id && item.operation === "cut")
  //               const isRenaming = renamingItem === file.id

  //               return (
  //                 <div
  //                   key={file.id}
  //                   className={`flex flex-col items-center text-center p-1 rounded cursor-pointer transition-all duration-200
  //                     ${isSelected
  //                       ? "bg-blue-100 border-2 border-blue-400 shadow-sm"
  //                       : "hover:bg-gray-100 border-2 border-transparent"
  //                     }
  //                     ${isCut ? "opacity-50" : ""}
  //                   `}
  //                   onClick={(e) => handleFileClick(file, e)}
  //                   onContextMenu={(e) => handleContextMenu(file, e)}
  //                   draggable={!isRenaming}
  //                   onDragStart={(e) => handleDragStart(e, file)}
  //                 >
  //                   <div className={`transition-transform duration-200 ${isSelected ? "scale-105" : ""}`}>
  //                     {getFileIcon(file)}
  //                   </div>
  //                   {isRenaming ? (
  //                     <input
  //                       type="text"
  //                       value={renameValue}
  //                       onChange={(e) => setRenameValue(e.target.value)}
  //                       onKeyDown={handleRenameKeyDown}
  //                       onBlur={handleRenameSubmit}
  //                       className="text-[10px] mt-1 w-full text-center bg-white border border-blue-400 rounded px-1"
  //                       autoFocus
  //                     />
  //                   ) : (
  //                     <span
  //                       className={`text-[10px] mt-1 truncate w-full transition-colors ${isSelected ? "text-blue-700 font-medium" : "text-gray-700"
  //                         }`}
  //                     >
  //                       {file.name}
  //                     </span>
  //                   )}
  //                 </div>
  //               )
  //             })}
  //           </div>
  //           {(!currentProject.files || currentProject.files.length === 0) && (
  //             <div
  //               className="flex items-center justify-center h-32 text-gray-400 text-sm cursor-context-menu"
  //               onContextMenu={(e) => handleEmptyFolderContextMenu(e, selectedCategory)}
  //             >
  //               Right-click to add files and folders
  //             </div>
  //           )}
  //         </>
  //       ) : (
  //         <div className="flex items-center justify-center h-full text-gray-400">No project selected</div>
  //       )}
  //     </div>

  {/* File Creation Dialog */ }



  return (
    <div className="flex w-full h-screen  text-gray-800 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        style={{ backgroundColor: settings.themeColor }}
        className={`
        fixed md:static z-40
        top-0 left-0 h-full w-56 bg-gray-200
         border-r border-gray-300 p-2
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
          Projects
        </h3>

        <ul className="space-y-0.5">
          {rootProjects.map((project) => (
            <li key={project.id}>
              <button
                style={{ backgroundColor: selectedCategory === project.id ? settings.folderColor : '' }}
                onClick={() => {
                  handleCategorySelect(project.id)
                  setSidebarOpen(false)
                }}
                onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, project.id)}
                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors
                ${selectedCategory === project.id
                    ? " text-white"
                    : "text-gray-700 hover:bg-gray-300"
                  }`}
              >
                <span className="truncate">{project.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ">
        {/* Top Bar (Mobile) */}
        <div style={{ fontSize: settings.fontSize }} onClick={() => setSidebarOpen(true)} className="md:hidden flex items-center gap-2 px-3 py-2 border-b">
          <button

            className="text-xl text-white font-bold"
          >
            ☰
          </button>
          <span className=" text-white font-semibold truncate">
            {currentProject?.name || "Explorer"}
          </span>
        </div>

        {/* Content Area */}


        {fileCreationDialog?.isOpen ? (
          <div className=" inset-0  bg-opacity-40 flex items-center justify-center z-50 overflow-auto h-72">
            <div className=" rounded-lg shadow-lg p-4 w-96">
              <h3 className="text-sm font-bold mb-4">Create New File</h3>

              <div className="space-y-4">
                {/* File Name Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">File Name</label>
                  <input
                    type="text"
                    style={{ color: settings.textColor }}
                    value={fileCreationDialog.fileName}
                    onChange={(e) =>
                      setFileCreationDialog({
                        ...fileCreationDialog,
                        fileName: e.target.value,
                      })
                    }
                    placeholder="Enter file name"
                    className="w-full px-3  py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {/* File Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">File Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FILE_EXTENSIONS).map(([type]) => (
                      <button
                        key={type}
                        onClick={() =>
                          setFileCreationDialog({
                            ...fileCreationDialog,
                            fileType: type,
                          })
                        }
                        className={`px-3 py-2 rounded text-xs border transition-colors capitalize ${fileCreationDialog.fileType === type
                          ? "bg-blue-100 border-blue-500 text-blue-700 font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extension Preview */}
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <span className="text-gray-600">File will be: </span>
                  <span className="font-mono font-medium text-gray-900">
                    {fileCreationDialog.fileName || "filename"}
                    {FILE_EXTENSIONS[fileCreationDialog.fileType as keyof typeof FILE_EXTENSIONS]?.[0] || ".file"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={async () => {
                    if (fileCreationDialog.fileName.trim()) {
                      try {
                        const ext =
                          FILE_EXTENSIONS[fileCreationDialog.fileType as keyof typeof FILE_EXTENSIONS]?.[0] || ""
                        const fullName = `${fileCreationDialog.fileName.trim()}${ext}`
                        await createProject(fullName, "file", fileCreationDialog.parentId)
                        setFileCreationDialog(null)
                        onDataChange?.()
                      } catch (err) {
                        console.error("[v0] Failed to create file:", err)
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setFileCreationDialog(null)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) :
          <div
            className="flex-1  p-2 overflow-y-auto"
            onContextMenu={handleBlankAreaContextMenu}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, selectedCategory)}
          >
            {currentProject ? (
              <>
                {/* Desktop Title */}
                <h2 className="hidden md:block text-sm font-bold text-gray-700 mb-2 truncate">
                  {currentProject.name}
                </h2>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {currentProject.files?.map((file) => {
                    const isSelected = selectedItems.includes(file.id)
                    const isCut = clipboardItems.some(
                      (item) => item.id === file.id && item.operation === "cut"
                    )
                    const isRenaming = renamingItem === file.id

                    return (
                      <div
                        key={file.id}
                        style={{ background: isSelected ? "rgba(20, 9, 9, 0.37)" : "rgba(184, 172, 172, 0.04)" }}
                        // onMouseEnter={()}
                        className={`flex flex-col items-center text-center p-1 rounded cursor-pointer transition-all
                      ${isSelected
                            ? `bg-[${settings.folderColor}] border-1 border-grey-100`
                            : "hover:bg-slate-800 border-2 border-transparent"
                          }
                      ${isCut ? "opacity-50" : ""}
                    `}
                        onClick={(e) => handleFileClick(file, e)}
                        onContextMenu={(e) => handleContextMenu(file, e)}
                        draggable={!isRenaming}
                        onDragStart={(e) => handleDragStart(e, file)}
                      >
                        {getFileIcon(file)}

                        {isRenaming ? (
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleRenameSubmit}
                            className="text-[10px] mt-1 w-full text-center border rounded"
                            autoFocus
                          />
                        ) : (
                          <span style={{ color: settings.textColor }} className=" mt-1 truncate w-full">
                            {file.name}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No project selected
              </div>
            )}
          </div>}

      </div>
    </div>
  )


}
