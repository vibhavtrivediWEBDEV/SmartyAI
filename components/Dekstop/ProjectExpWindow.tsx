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

interface ProjectFile {
  id: string
  name: string
  type: "folder" | "file"
  parentId?: string | null
  size?: string | null
  children?: ProjectFile[]
  createdAt?: Date
  updatedAt?: Date
  // Legacy fields for compatibility
  content?: string
  src?: string
  url?: string
}

interface ProjectExplorerWindowProps {
  onOpenFile: (file: ProjectFile) => void
  onDataChange?: () => void
}

export function ProjectExplorerWindow({ onOpenFile, onDataChange }: ProjectExplorerWindowProps) {
  const [projects, setProjects] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  // Added state for rename functionality
  const [renamingItem, setRenamingItem] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

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
      console.error("Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(
    async (name: string, type: "folder" | "file", parentId?: string) => {
      try {
        const response = await fetch("/api/Projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, parentId }),
        })

        if (!response.ok) throw new Error("Failed to create project")

        const result = await response.json()
        setProjects((prev) => [...prev, result.data])
        onDataChange?.()
        return result.data
      } catch (err) {
        console.error("Error creating project:", err)
        throw err
      }
    },
    [onDataChange,fetchProjects],
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
        console.error("Error deleting project:", err)
        throw err
      }
    },
    [onDataChange],
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
        console.error("Error copying projects:", err)
        throw err
      }
    },
    [onDataChange],
  )

  // Added rename functionality
  const renameProject = useCallback(
    async (id: string, newName: string) => {
      try {
        const response = await fetch(`/api/Projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        })

        if (!response.ok) throw new Error("Failed to rename project")

        const result = await response.json()
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)))
        onDataChange?.() // Notify parent component of data change
        return result.data
      } catch (err) {
        console.error("Error renaming project:", err)
        throw err
      }
    },
    [onDataChange],
  )

  // Added file upload functionality
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
        console.error("Error uploading file:", err)
        throw err
      }
    },
    [onDataChange],
  )

  // Added drag and drop handlers
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

        // Move file to new parent
        const response = await fetch(`/api/Projects/${fileData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetId }),
        })

        if (!response.ok) throw new Error("Failed to move file")

        await fetchProjects()
        onDataChange?.()
      } catch (err) {
        console.error("Error moving file:", err)
      }
    },
    [fetchProjects, onDataChange],
  )

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects,createProject])

  useEffect(() => {
    if (projects.length > 0 && !selectedCategory) {
      const firstProject = projects.find((p) => !p.parentId) || projects[0]
      if (firstProject) {
        setSelectedCategory(firstProject.id)
        setCurrentTargetLocation(firstProject.id)
        console.log("Auto-selected first project:", firstProject.id)
      }
    }
  }, [projects, selectedCategory, setCurrentTargetLocation])

  const rootProjects = projects.filter((p) => !p.parentId)
  const currentProject = projects.find((p) => p.id === selectedCategory)
  // console.log("selectedCategory",projects,selectedCategory)
  const currentFiles = projects.find((p) => p.id === selectedCategory) // every time it must be in ZERO index
  console.log("currentFiles",currentFiles?.files)




  

  const getFileIcon = (file: ProjectFile) => {
    const iconSize = 28

    if (file.type === "folder") {
      return <FolderIcon size={iconSize} className="text-blue-500" />
    }

    // Determine file type by extension
    const extension = file.name.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
      case "md":
        return <FileTextIcon size={iconSize} className="text-gray-500" />
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

  // Enhanced file click handler with rename support
  const handleFileClick = useCallback(
    (file: ProjectFile, event: React.MouseEvent) => {
      if (renamingItem === file.id) return // Don't handle clicks during rename

      if (event.detail === 2) {
        // Double click - open file
        onOpenFile(file)
        return
      }

      // Single click - handle selection
      if (isCommandPressed) {
        // Cmd+click for multiple selection
        setSelectedItems((prev) => (prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id]))
      } else {
        // Regular click - select only this file
        setSelectedItems([file.id])
      }
    },
    [onOpenFile, isCommandPressed, setSelectedItems, renamingItem],
  )

  // Enhanced context menu with rename functionality
  const handleContextMenu = useCallback(
    (file: ProjectFile, event: React.MouseEvent) => {
      event.preventDefault()

      // Select the file if not already selected
      if (!selectedItems.includes(file.id)) {
        setSelectedItems([file.id])
      }

      const contextMenuItems = [
        {
          label: "Open",
          icon: <FolderOpen className="h-4 w-4" />,
          action: () => onOpenFile(file),
          shortcut: "Enter",
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
                type: fileData?.type === "folder" ? ("folder" as const) : ("file" as const),
                data: fileData,
                operation: "copy" as const,
                source: selectedCategory,
              }
            })
            copyItems(items)
          },
          shortcut: "⌘C",
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
                type: fileData?.type === "folder" ? ("folder" as const) : ("file" as const),
                data: fileData,
                operation: "cut" as const,
                source: selectedCategory,
              }
            })
            cutItems(items)
          },
          shortcut: "⌘X",
        },
        {
          label: "Paste",
          icon: <ClipboardPaste className="h-4 w-4" />,
          action: async () => {
            try {
              const sourceIds = clipboardItems.map((item) => item.id)
              await copyProjectsToDatabase(sourceIds, selectedCategory)
              const pastedItems = pasteItems(selectedCategory)
              console.log(`Pasted ${pastedItems.length} items to database`)
              await fetchProjects()   // <-- refetch data here to refresh UI

              onDataChange?.()
            } catch (err) {
              console.error("Failed to paste items:", err)
            }
          },
          shortcut: "⌘V",
          disabled: clipboardItems.length === 0,
        },
        { label: "---", disabled: true },
        {
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          action: async () => {
            try {
              for (const itemId of selectedItems) {
                await deleteProject(itemId)
              }
              setSelectedItems([])
              onDataChange?.()
            } catch (err) {
              console.error("Failed to delete items:", err)
            }
          },
          shortcut: "Del",
        },
        {
          label: "Rename",
          icon: <Edit3 className="h-4 w-4" />,
          action: () => {
            setRenamingItem(file.id)
            setRenameValue(file.name)
          },
          shortcut: "F2",
          disabled: selectedItems.length > 1,
        },
        {
          label: "New Folder",
          icon: <Plus className="h-4 w-4" />,
          action: async () => {
            try {
              const name = prompt("Enter folder name:")
              if (name) {
                await createProject(name, "folder", selectedCategory)
                onDataChange?.()
              }
            } catch (err) {
              console.error("Failed to create folder:", err)
            }
          },
          shortcut: "⌘⇧N",
        },
      ]

      showContextMenu(event.clientX, event.clientY, contextMenuItems)
    },
    [
      selectedItems,
      setSelectedItems,
      onOpenFile,
      copyItems,
      cutItems,
      pasteItems,
      showContextMenu,
      clipboardItems,
      selectedCategory,
      projects,
      copyProjectsToDatabase,
      deleteProject,
      createProject,
      onDataChange,
      fetchProjects
    ],
  )

  // Added rename input handlers
  const handleRenameSubmit = useCallback(async () => {
    if (renamingItem && renameValue.trim()) {
      try {
        await renameProject(renamingItem, renameValue.trim())
        setRenamingItem(null)
        setRenameValue("")
      } catch (err) {
        console.error("Failed to rename:", err)
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
    [handleRenameSubmit, handleRenameCancel],
  )

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId)
      setCurrentTargetLocation(categoryId)
      console.log("Category selected - updating targetLocation to:", categoryId)
    },
    [setCurrentTargetLocation],
  )

// project menu

const handleProjectedMenu =(event:React.MouseEvent,id:Number)=>{
  

  const contextMenuItems = [
    
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: async () => {
        try {
          await deleteProject(id)
       
          onDataChange?.()
        } catch (err) {
          console.error("Failed to delete items:", err)
        }
      },
      shortcut: "Del",
    },
   
  ]

  showContextMenu(event.clientX, event.clientY, contextMenuItems)
}


  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center w-full h-full bg-white">
  //       <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  //       <span className="ml-2 text-gray-600">Loading projects...</span>
  //     </div>
  //   )
  // }

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


  

  return (
    <div className="flex w-full h-full bg-gray-100 text-gray-800 rounded overflow- text-xs leading-tight">
      {/* Sidebar */}
      <div className="w-48 h-screen  bg-gray-200 border-r border-gray-300 p-2 overflow-y-auto ">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Projects</h3>
        <ul className="space-y-0.5">
          {rootProjects.map((project) => (
            <li key={project.id}>
              <button
                onClick={() => handleCategorySelect(project.id)}
                onContextMenu={(e)=>handleProjectedMenu( e ,project.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, project.id)}
                className={`flex items-center w-full text-left px-2 py-1 rounded transition-colors
                  ${selectedCategory === project.id ? "bg-blue-500 text-white" : "hover:bg-gray-300 text-gray-700"}`}
              >
                <span className="truncate">{project.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 p-2 overflow-y-auto bg-white"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, selectedCategory)}
      >
        {/* {JSON.stringify(currentFiles)} */}
        {currentProject ? (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-2 truncate">{currentProject.name}</h2>
            <div className="grid grid-cols-3 gap-2">
              {/* {JSON.stringify(currentFiles?.children)} */}
              {currentFiles?.files?.map((file) => {
                const isSelected = selectedItems.includes(file.id)
                const isCut = clipboardItems.some((item) => item.id === file.id && item.operation === "cut")
                const isRenaming = renamingItem === file.id

                return (
                  <div
                    key={file.id}
                    className={`flex flex-col items-center text-center p-1 rounded cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? "bg-blue-100 border-2 border-blue-400 shadow-sm"
                          : "hover:bg-gray-100 border-2 border-transparent"
                      }
                      ${isCut ? "opacity-50" : ""}
                    `}
                    onClick={(e) => handleFileClick(file, e)}
                    onContextMenu={(e) => handleContextMenu(file, e)}
                    draggable={!isRenaming}
                    onDragStart={(e) => handleDragStart(e, file)}
                  >
                    <div className={`transition-transform duration-200 ${isSelected ? "scale-105" : ""}`}>
                      {getFileIcon(file)}
                    </div>
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        className="text-[10px] mt-1 w-full text-center bg-white border border-blue-400 rounded px-1"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`text-[10px] mt-1 truncate w-full transition-colors ${
                          isSelected ? "text-blue-700 font-medium" : "text-gray-700"
                        }`}
                      >
                        {file.name}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            Select a project from the sidebar.
          </div>
        )}
      </div>
    </div>
  )
}
