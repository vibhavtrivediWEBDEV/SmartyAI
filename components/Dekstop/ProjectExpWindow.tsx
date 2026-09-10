"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Airplay,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cloud,
  Columns3,
  Copy,
  Download,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileJson,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  GalleryHorizontal,
  Grid3X3,
  HardDrive,
  Image as ImageIcon,
  List,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  MonitorUp,
  Music2,
  Scissors,
  Search,
  Share,
  Star,
  Tag,
  Trash2,
  Upload,
  Users,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { useKeyboard } from "@/app/context/keyBoardContext"

export interface ProjectFile {
  id: string
  name: string
  type: "folder" | "document" | "image" | "video" | "spreadsheet" | "archive" | "code" | "link" | "other" | "file"
  kind?: "folder" | "file" | "text" | "link"
  parentId?: string | null
  size?: string | null
  sizeBytes?: number
  mimeType?: string | null
  files?: ProjectFile[]
  content?: string
  src?: string
  url?: string
  isStarred?: boolean
  showOnDesktop?: boolean
  isTrashed?: boolean
  createdAt?: string
  updatedAt?: string
  projectId?: string
}

interface ProjectExplorerWindowProps {
  onOpenFile: (file: ProjectFile) => void
  onDataChange?: () => void
}

interface FinderSubscription {
  plan: "free" | "starter" | "pro"
  status: "active" | "past_due" | "cancelled"
  finderStorageBytes: number
  finderBytesUsed: number
  finderBytesReserved: number
}

type ViewMode = "icons" | "list" | "columns" | "gallery"
type SortMode = "name" | "date" | "size" | "kind"
type SmartLocation = "recents" | "starred" | "trash" | null
type FinderIconComponent = React.ComponentType<{ className?: string }>

const viewOptions: Array<{ mode: ViewMode; label: string; icon: FinderIconComponent }> = [
  { mode: "icons", label: "Icon View", icon: Grid3X3 },
  { mode: "list", label: "List View", icon: List },
  { mode: "columns", label: "Column View", icon: Columns3 },
  { mode: "gallery", label: "Gallery View", icon: GalleryHorizontal },
]

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "—"

function FinderIcon({ item, size = 52 }: { item: ProjectFile; size?: number }) {
  const className = "drop-shadow-[0_5px_8px_rgba(0,0,0,0.38)]"
  if (item.type === "folder") return <Folder size={size} fill="#58a9ef" strokeWidth={1.25} className={className} color="#8ecbff" />
  if (item.type === "image") return <FileImage size={size} color="#78c7ff" className={className} />
  if (item.type === "video") return <Video size={size} color="#c795ff" className={className} />
  if (item.type === "spreadsheet") return <FileSpreadsheet size={size} color="#64d17b" className={className} />
  if (item.type === "archive") return <FileArchive size={size} color="#d9ad72" className={className} />
  if (item.name.toLowerCase().endsWith(".json")) return <FileJson size={size} color="#f1cf65" className={className} />
  if (item.type === "code") return <FileCode2 size={size} color="#70b9ff" className={className} />
  if (/\.(mp3|wav|aac|flac)$/i.test(item.name)) return <Music2 size={size} color="#ef78ba" className={className} />
  if (item.type === "document") return <FileText size={size} color="#f4f4f5" className={className} />
  return <File size={size} color="#d4d4d8" className={className} />
}

function Preview({ item }: { item?: ProjectFile }) {
  if (!item) return <div className="grid h-full place-items-center text-[13px] text-white/35">Select an item</div>
  if (item.type === "image" && item.src) {
    return <img src={item.src} alt={item.name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
  }
  if ((item.type === "document" || item.type === "code") && item.content) {
    return <pre className="max-h-full w-full overflow-auto whitespace-pre-wrap rounded-lg bg-white p-5 text-left font-mono text-[11px] leading-5 text-zinc-800 shadow-2xl">{item.content.slice(0, 8000)}</pre>
  }
  return <div className="flex flex-col items-center gap-5"><FinderIcon item={item} size={112} /><span className="max-w-sm truncate text-sm text-white/80">{item.name}</span></div>
}

export function ProjectExplorerWindow({ onOpenFile, onDataChange }: ProjectExplorerWindowProps) {
  const [nodes, setNodes] = useState<ProjectFile[]>([])
  const [knownFolders, setKnownFolders] = useState<Record<string, ProjectFile>>({})
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [smartLocation, setSmartLocation] = useState<SmartLocation>("recents")
  const [history, setHistory] = useState<Array<{ folderId: string | null; smart: SmartLocation }>>([{ folderId: null, smart: "recents" }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("icons")
  const [sortMode, setSortMode] = useState<SortMode>("name")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<FinderSubscription | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    selectedItems,
    setSelectedItems,
    copyItems,
    cutItems,
    clearClipboard,
    clipboardItems,
    showContextMenu,
    isCommandPressed,
    setCurrentTargetLocation,
  } = useKeyboard()

  const fetchNodes = useCallback(async (_forceRefresh?: boolean) => {
    try {
      setLoading(true)
      const location = smartLocation ?? (currentFolderId ? "folder" : "root")
      const params = new URLSearchParams({ location })
      if (location === "folder" && currentFolderId) params.set("parentId", currentFolderId)
      const response = await fetch(`/api/Projects?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not load Finder")
      const nextNodes: ProjectFile[] = result.data ?? []
      setNodes(nextNodes)
      setKnownFolders((current) => {
        const next = { ...current }
        nextNodes.forEach((node) => { if (node.type === "folder") next[node.id] = node })
        return next
      })
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Finder")
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, smartLocation])

  useEffect(() => { void fetchNodes() }, [fetchNodes])

  useEffect(() => {
    let active = true
    void fetch("/api/subscription")
      .then((response) => response.json())
      .then((result) => { if (active) setSubscription(result.subscription ?? null) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const rootFolders = useMemo(() => Object.values(knownFolders).filter((node) => !node.parentId && node.type === "folder" && !node.isTrashed), [knownFolders])
  const developerFolders = useMemo(() => rootFolders.filter((folder) => /^(Resume|About Me|Projects|GitHub\s—)/i.test(folder.name)), [rootFolders])
  const otherRootFolders = useMemo(() => rootFolders.filter((folder) => !developerFolders.some((generated) => generated.id === folder.id)), [developerFolders, rootFolders])
  const downloadsFolder = useMemo(() => rootFolders.find((f) => f.name.toLowerCase() === 'downloads'), [rootFolders])
  const currentFolder = currentFolderId ? knownFolders[currentFolderId] : undefined

  const rawItems = useMemo(() => {
    return nodes
  }, [nodes])

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query ? rawItems.filter((item) => item.name.toLowerCase().includes(query)) : rawItems
    return [...filtered].sort((a, b) => {
      if (sortMode === "date" || (smartLocation === "recents" && sortMode === "name")) return +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0)
      if (sortMode === "size") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)
      if (sortMode === "kind") return a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
      return Number(b.type === "folder") - Number(a.type === "folder") || a.name.localeCompare(b.name)
    })
  }, [rawItems, searchQuery, smartLocation, sortMode])

  const selectedItem = selectedItems.length === 1 ? nodeById.get(selectedItems[0]) : undefined

  const breadcrumbs = useMemo(() => {
    const result: ProjectFile[] = []
    let cursor = currentFolder
    while (cursor) {
      result.unshift(cursor)
      cursor = cursor.parentId ? nodeById.get(cursor.parentId) : undefined
    }
    return result
  }, [currentFolder, nodeById])

  const navigate = useCallback((folderId: string | null, smart: SmartLocation = null, record = true) => {
    setCurrentFolderId(folderId)
    setSmartLocation(smart)
    setSelectedItems([])
    setCurrentTargetLocation(folderId)
    if (record) {
      const next = history.slice(0, historyIndex + 1)
      next.push({ folderId, smart })
      setHistory(next)
      setHistoryIndex(next.length - 1)
    }
  }, [history, historyIndex, setCurrentTargetLocation, setSelectedItems])

  const goHistory = (direction: -1 | 1) => {
    const nextIndex = historyIndex + direction
    const location = history[nextIndex]
    if (!location) return
    setHistoryIndex(nextIndex)
    navigate(location.folderId, location.smart, false)
  }

  const openItem = useCallback(async (item: ProjectFile) => {
    if (item.type === "folder") return navigate(item.id)
    try {
      const response = await fetch(`/api/Projects/${item.id}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not open file")
      onOpenFile({ ...result.data, projectId: item.parentId ?? currentFolderId ?? "root" })
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not open file")
    }
  }, [currentFolderId, navigate, onOpenFile])

  const createNode = async (type: "folder" | "file") => {
    const defaultName = type === "folder" ? "untitled folder" : "untitled.txt"
    const response = await fetch("/api/Projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: defaultName, type, parentId: currentFolderId }),
    })
    const result = await response.json()
    if (!response.ok) return toast.error(result.error || "Could not create item")
    await fetchNodes(false)
    setSelectedItems([result.data.id])
    setRenamingId(result.data.id)
    setRenameValue(defaultName)
    onDataChange?.()
  }

  const createLink = async () => {
    const url = window.prompt("Enter the full website URL")?.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      return toast.error("Enter a valid URL, including https://")
    }
    const suggestedName = new URL(url).hostname.replace(/^www\./, "")
    const name = window.prompt("Name this link", suggestedName)?.trim()
    if (!name) return
    const response = await fetch("/api/Projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "link", url, parentId: currentFolderId }),
    })
    const result = await response.json()
    if (!response.ok) return toast.error(result.error || "Could not create link")
    await fetchNodes(false)
    toast.success("Link added to Finder")
    onDataChange?.()
  }

  const toggleDesktopVisibility = async (item: ProjectFile) => {
    const response = await fetch(`/api/Projects/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnDesktop: !item.showOnDesktop }),
    })
    if (!response.ok) return toast.error("Could not update Desktop visibility")
    await fetchNodes(false)
    window.dispatchEvent(new Event("finder-desktop-change"))
    toast.success(item.showOnDesktop ? "Removed from Desktop" : "Shown on Desktop")
  }

  const renameNode = async () => {
    if (!renamingId || !renameValue.trim()) return setRenamingId(null)
    const response = await fetch(`/api/Projects/${renamingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    if (response.ok) await fetchNodes(smartLocation === "trash")
    else toast.error("Rename failed")
    setRenamingId(null)
  }

  const trashSelection = useCallback(async () => {
    if (!selectedItems.length) return
    const response = await fetch("/api/Projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedItems }),
    })
    if (!response.ok) return toast.error("Could not move items to Bin")
    toast.success(`Moved ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} to Bin`)
    setSelectedItems([])
    await fetchNodes(smartLocation === "trash")
    onDataChange?.()
  }, [fetchNodes, onDataChange, selectedItems, setSelectedItems, smartLocation])

  const selectedClipboardItems = () => selectedItems.map((id) => {
    const item = nodeById.get(id)
    return { id, name: item?.name ?? "", type: item?.type === "folder" ? "folder" as const : "file" as const, data: item, operation: "copy" as const, source: item?.parentId ?? undefined }
  })

  const pasteClipboard = useCallback(async () => {
    if (!clipboardItems.length) return toast("Nothing to paste")
    const targetParentId = currentFolderId
    if (clipboardItems[0].operation === "cut") {
      await Promise.all(clipboardItems.map((item) => fetch(`/api/Projects/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: targetParentId }),
      })))
      clearClipboard()
    } else {
      await fetch("/api/Projects/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds: clipboardItems.map((item) => item.id), targetParentId }),
      })
    }
    await fetchNodes(false)
    toast.success("Paste completed")
  }, [clearClipboard, clipboardItems, currentFolderId, fetchNodes])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        if (currentFolderId) form.append("parentId", currentFolderId)
        const response = await fetch("/api/Projects/upload", { method: "POST", body: form })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}`)
      }
      await fetchNodes(false)
      toast.success(`${files.length} item${files.length > 1 ? "s" : ""} uploaded`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [currentFolderId, fetchNodes])

  const handleDrop = useCallback(async (event: React.DragEvent, targetId = currentFolderId) => {
    event.preventDefault()
    if (event.dataTransfer.files.length) return uploadFiles(event.dataTransfer.files)
    const raw = event.dataTransfer.getData("application/x-smarty-finder") || event.dataTransfer.getData("application/json")
    if (!raw) return
    const item = JSON.parse(raw) as ProjectFile
    const response = await fetch(`/api/Projects/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: targetId }),
    })
    if (!response.ok) toast.error("Move failed")
    else await fetchNodes(false)
  }, [currentFolderId, fetchNodes, uploadFiles])

  const selectItem = (item: ProjectFile, event: React.MouseEvent) => {
    if (event.detail === 2) return openItem(item)
    if (isCommandPressed) setSelectedItems(selectedItems.includes(item.id) ? selectedItems.filter((id) => id !== item.id) : [...selectedItems, item.id])
    else setSelectedItems([item.id])
  }

  const showItemMenu = (event: React.MouseEvent, item: ProjectFile) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selectedItems.includes(item.id)) setSelectedItems([item.id])
    showContextMenu(event.clientX, event.clientY, [
      { label: "Open", icon: <FolderOpen className="h-4 w-4" />, action: () => openItem(item) },
      { label: "---", disabled: true },
      { label: "Copy", shortcut: "⌘C", icon: <Copy className="h-4 w-4" />, action: () => copyItems(selectedItems.includes(item.id) ? selectedClipboardItems() : [{ id: item.id, name: item.name, type: item.type === "folder" ? "folder" : "file", data: item, operation: "copy", source: item.parentId ?? undefined }]) },
      { label: "Cut", shortcut: "⌘X", icon: <Scissors className="h-4 w-4" />, action: () => cutItems(selectedItems.includes(item.id) ? selectedClipboardItems() : [{ id: item.id, name: item.name, type: item.type === "folder" ? "folder" : "file", data: item, operation: "cut", source: item.parentId ?? undefined }]) },
      { label: "Rename", shortcut: "↩", action: () => { setRenamingId(item.id); setRenameValue(item.name) } },
      { label: item.isStarred ? "Remove from Favourites" : "Add to Favourites", icon: <Star className="h-4 w-4" />, action: async () => { await fetch(`/api/Projects/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isStarred: !item.isStarred }) }); await fetchNodes(false) } },
      { label: item.showOnDesktop ? "Remove from Desktop" : "Show on Desktop", icon: <MonitorUp className="h-4 w-4" />, action: () => void toggleDesktopVisibility(item) },
      { label: "---", disabled: true },
      { label: "Move to Bin", shortcut: "⌘⌫", icon: <Trash2 className="h-4 w-4" />, action: trashSelection },
    ])
  }

  const showBlankMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setSelectedItems([])
    showContextMenu(event.clientX, event.clientY, [
      { label: "New Folder", icon: <FolderPlus className="h-4 w-4" />, action: () => void createNode("folder") },
      { label: "New Text File", icon: <FilePlus2 className="h-4 w-4" />, action: () => void createNode("file") },
      { label: "New Link…", icon: <LinkIcon className="h-4 w-4" />, action: () => void createLink() },
      { label: "Upload…", icon: <Upload className="h-4 w-4" />, action: () => fileInputRef.current?.click() },
      { label: "---", disabled: true },
      { label: "Paste Item", shortcut: "⌘V", disabled: !clipboardItems.length, action: () => void pasteClipboard() },
      { label: "Get Info", shortcut: "⌘I", action: () => setInspectorOpen(true) },
    ])
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches("input, textarea, [contenteditable='true']")) return
      const command = event.metaKey || event.ctrlKey
      if (command && event.key.toLowerCase() === "c" && selectedItems.length) { event.preventDefault(); copyItems(selectedClipboardItems()) }
      if (command && event.key.toLowerCase() === "x" && selectedItems.length) { event.preventDefault(); cutItems(selectedClipboardItems()) }
      if (command && event.key.toLowerCase() === "v") { event.preventDefault(); void pasteClipboard() }
      if ((event.key === "Backspace" && command) || event.key === "Delete") { event.preventDefault(); void trashSelection() }
      if (event.key === "Enter" && selectedItem) { setRenamingId(selectedItem.id); setRenameValue(selectedItem.name) }
      if (command && event.key.toLowerCase() === "a") { event.preventDefault(); setSelectedItems(visibleItems.map((item) => item.id)) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  const itemLabel = (item: ProjectFile) => renamingId === item.id ? (
    <input
      autoFocus
      value={renameValue}
      onChange={(event) => setRenameValue(event.target.value)}
      onBlur={() => void renameNode()}
      onKeyDown={(event) => { if (event.key === "Enter") void renameNode(); if (event.key === "Escape") setRenamingId(null) }}
      onClick={(event) => event.stopPropagation()}
      className="w-full rounded border border-[#0a84ff] bg-[#2c2c2e] px-1 text-center text-[11px] text-white outline-none"
    />
  ) : <span className="line-clamp-2 max-w-full break-words rounded px-1 text-center text-[11px] leading-[15px] text-white/90">{item.name}</span>

  const renderIconView = () => (
    <div className="grid auto-rows-[112px] grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-3 gap-y-1 p-5">
      {visibleItems.map((item) => {
        const selected = selectedItems.includes(item.id)
        const cut = clipboardItems.some((entry) => entry.id === item.id && entry.operation === "cut")
        return (
          <button
            key={item.id}
            draggable={renamingId !== item.id}
            onDragStart={(event) => { event.dataTransfer.setData("application/x-smarty-finder", JSON.stringify(item)); event.dataTransfer.effectAllowed = "move" }}
            onDragOver={(event) => item.type === "folder" && event.preventDefault()}
            onDrop={(event) => item.type === "folder" && void handleDrop(event, item.id)}
            onClick={(event) => selectItem(item, event)}
            onContextMenu={(event) => showItemMenu(event, item)}
            className={`group flex min-w-0 flex-col items-center gap-1.5 rounded-lg p-2 outline-none transition ${selected ? "bg-[#0a84ff]/75" : "hover:bg-white/[0.055]"} ${cut ? "opacity-45" : ""}`}
          >
            <FinderIcon item={item} size={54} />
            {itemLabel(item)}
          </button>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="min-w-[640px] text-xs">
      <div className="grid grid-cols-[minmax(260px,1fr)_150px_110px_90px] border-b border-white/10 bg-white/[0.025] px-3 py-1.5 text-white/45">
        <span>Name</span><span>Date Modified</span><span>Kind</span><span className="text-right">Size</span>
      </div>
      {visibleItems.map((item, index) => (
        <button
          key={item.id}
          draggable
          onDragStart={(event) => event.dataTransfer.setData("application/x-smarty-finder", JSON.stringify(item))}
          onClick={(event) => selectItem(item, event)}
          onContextMenu={(event) => showItemMenu(event, item)}
          className={`grid w-full grid-cols-[minmax(260px,1fr)_150px_110px_90px] items-center px-3 py-1 text-left ${selectedItems.includes(item.id) ? "bg-[#0a84ff]/70" : index % 2 ? "bg-white/[0.022]" : "hover:bg-white/[0.045]"}`}
        >
          <span className="flex min-w-0 items-center gap-2"><FinderIcon item={item} size={20} /><span className="truncate">{renamingId === item.id ? itemLabel(item) : item.name}</span></span>
          <span className="text-white/55">{formatDate(item.updatedAt)}</span>
          <span className="capitalize text-white/55">{item.type}</span>
          <span className="text-right text-white/55">{formatBytes(item.sizeBytes)}</span>
        </button>
      ))}
    </div>
  )

  const columnSets = useMemo(() => {
    const path = breadcrumbs
    const sets: Array<{ title: string; items: ProjectFile[] }> = [{ title: currentFolder?.name ?? "My Files", items: nodes }]
    path.slice(0, -1).forEach((folder) => sets.unshift({ title: folder.name, items: [] }))
    return sets
  }, [breadcrumbs, currentFolder, nodes])

  const renderColumnView = () => (
    <div className="flex h-full min-w-max">
      {columnSets.map((set, columnIndex) => (
        <div key={`${set.title}-${columnIndex}`} className="w-56 overflow-y-auto border-r border-white/10 p-1.5">
          {set.items.map((item) => (
            <button
              key={item.id}
              onClick={(event) => { selectItem(item, event); if (item.type === "folder") navigate(item.id) }}
              onContextMenu={(event) => showItemMenu(event, item)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${selectedItems.includes(item.id) || breadcrumbs.some((crumb) => crumb.id === item.id) ? "bg-[#0a84ff]" : "hover:bg-white/10"}`}
            >
              <FinderIcon item={item} size={19} /><span className="min-w-0 flex-1 truncate">{item.name}</span>{item.type === "folder" && <ChevronRight className="h-3 w-3" />}
            </button>
          ))}
        </div>
      ))}
      <div className="w-[360px] p-8"><Preview item={selectedItem} /></div>
    </div>
  )

  const renderGalleryView = () => (
    <div className="flex h-full flex-col">
      <div className="grid min-h-0 flex-1 place-items-center overflow-hidden p-8"><Preview item={selectedItem ?? visibleItems[0]} /></div>
      <div className="flex h-28 items-center gap-3 overflow-x-auto border-t border-white/10 bg-black/25 px-5">
        {visibleItems.map((item) => <button key={item.id} onClick={(event) => selectItem(item, event)} onDoubleClick={() => openItem(item)} className={`flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-lg ${selectedItems.includes(item.id) ? "bg-[#0a84ff]/75 ring-2 ring-white/70" : "bg-white/[0.045] hover:bg-white/10"}`}><FinderIcon item={item} size={38} /><span className="mt-1 w-20 truncate text-[10px]">{item.name}</span></button>)}
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 w-full select-none overflow-hidden bg-[#1c1c1e] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text',sans-serif] text-white">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => { if (event.target.files) void uploadFiles(event.target.files); event.target.value = "" }} />

      <aside className="hidden w-[168px] shrink-0 overflow-y-auto border-r border-white/[0.08] bg-[#242426]/90 px-2 py-3 backdrop-blur-2xl md:block">
        <SidebarSection title="Favourites">
          <SidebarItem active={smartLocation === "recents"} icon={Clock3} label="Recents" onClick={() => navigate(null, "recents")} />
          <SidebarItem active={smartLocation === "starred"} icon={Star} label="Favourites" onClick={() => navigate(null, "starred")} />
          <SidebarItem icon={HardDrive} label="My Files" active={!smartLocation && !currentFolderId} onClick={() => navigate(null)} />
          <SidebarItem icon={Download} label="Downloads" active={!smartLocation && currentFolderId === downloadsFolder?.id} onClick={() => {
            const downloads = rootFolders.find((f) => f.name.toLowerCase() === 'downloads');
            if (downloads) navigate(downloads.id);
            else navigate(null);
          }} />
        </SidebarSection>
        <SidebarSection title="Locations">
          <SidebarItem icon={Cloud} label="iCloud Drive" onClick={() => navigate(null)} />
          <SidebarItem icon={Airplay} label="AirDrop" onClick={() => toast("AirDrop simulation coming soon")} />
        </SidebarSection>
        {!!developerFolders.length && <SidebarSection title="Developer">{developerFolders.map((folder) => <SidebarItem key={folder.id} icon={Folder} label={folder.name} active={currentFolderId === folder.id} onClick={() => navigate(folder.id)} />)}</SidebarSection>}
        {!!otherRootFolders.length && <SidebarSection title="Folders">{otherRootFolders.map((folder) => <SidebarItem key={folder.id} icon={Folder} label={folder.name} active={currentFolderId === folder.id} onClick={() => navigate(folder.id)} />)}</SidebarSection>}
        <SidebarSection title="Tags">
          {["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Grey"].map((tag) => <button key={tag} className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-white/70 hover:bg-white/10"><span className={`h-2.5 w-2.5 rounded-full tag-${tag.toLowerCase()}`} />{tag}</button>)}
        </SidebarSection>
        <button onClick={() => navigate(null, "trash")} className={`mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${smartLocation === "trash" ? "bg-white/15" : "text-white/65 hover:bg-white/10"}`}><Trash2 className="h-4 w-4" />Bin</button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#272729]/95 px-3 shadow-sm">
          <div className="flex items-center">
            <ToolbarButton label="Back" disabled={historyIndex === 0} onClick={() => goHistory(-1)}><ArrowLeft className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton label="Forward" disabled={historyIndex >= history.length - 1} onClick={() => goHistory(1)}><ArrowRight className="h-4 w-4" /></ToolbarButton>
          </div>
          <div className="min-w-0 flex-1 truncate px-2 text-[13px] font-semibold">{smartLocation ? smartLocation[0].toUpperCase() + smartLocation.slice(1) : currentFolder?.name ?? "My Files"}</div>
          <div className="hidden overflow-hidden rounded-lg border border-white/10 bg-black/15 sm:flex">
            {viewOptions.map(({ mode, label, icon: Icon }) => <button key={mode} title={label} onClick={() => setViewMode(mode)} className={`grid h-7 w-8 place-items-center border-r border-white/10 last:border-0 ${viewMode === mode ? "bg-white/18 text-white" : "text-white/55 hover:bg-white/10"}`}><Icon className="h-4 w-4" /></button>)}
          </div>
          <div className="relative hidden lg:block">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" className="h-7 w-44 rounded-lg border border-white/10 bg-black/20 pl-7 pr-2 text-xs outline-none focus:border-[#0a84ff]" />
          </div>
          <ToolbarButton label="Upload" onClick={() => fileInputRef.current?.click()}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</ToolbarButton>
          <ToolbarButton label="Share" disabled={!selectedItems.length}><Share className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Tags" disabled={!selectedItems.length}><Tag className="h-4 w-4" /></ToolbarButton>
          <div className="relative group">
            <ToolbarButton label="More"><MoreHorizontal className="h-4 w-4" /></ToolbarButton>
            <div className="invisible absolute right-0 top-8 z-30 w-40 rounded-lg border border-white/10 bg-[#303033]/95 p-1 opacity-0 shadow-2xl backdrop-blur-xl transition group-hover:visible group-hover:opacity-100">
              <button onClick={() => void createNode("folder")} className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-[#0a84ff]">New Folder</button>
              <button onClick={() => void createNode("file")} className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-[#0a84ff]">New Text File</button>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="mt-1 w-full rounded bg-black/20 px-2 py-1.5 text-xs outline-none"><option value="name">Sort by Name</option><option value="date">Sort by Date</option><option value="size">Sort by Size</option><option value="kind">Sort by Kind</option></select>
            </div>
          </div>
        </div>

        <div className="flex h-7 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.07] bg-[#202022] px-4 text-[11px] text-white/55">
          <button onClick={() => navigate(null)} className="hover:text-white">My Files</button>
          {breadcrumbs.map((crumb) => <span key={crumb.id} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button onClick={() => navigate(crumb.id)} className="max-w-32 truncate hover:text-white">{crumb.name}</button></span>)}
        </div>

        <div className="relative flex min-h-0 flex-1" onContextMenu={showBlankMenu} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = event.dataTransfer.files.length ? "copy" : "move" }} onDrop={(event) => void handleDrop(event)}>
          <div className="min-w-0 flex-1 overflow-auto">
            {loading ? <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-white/35" /></div>
              : error ? <div className="grid h-full place-items-center text-sm text-red-300"><div className="text-center"><p>{error}</p><button onClick={() => void fetchNodes()} className="mt-3 rounded bg-[#0a84ff] px-3 py-1.5">Try Again</button></div></div>
                : !visibleItems.length ? <div className="grid h-full place-items-center text-sm text-white/30"><div className="text-center"><FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-45" /><p>Your private Finder is empty</p><p className="mt-1 text-xs">Only your files appear here. Drop files or right-click to begin.</p></div></div>
                  : viewMode === "icons" ? renderIconView() : viewMode === "list" ? renderListView() : viewMode === "columns" ? renderColumnView() : renderGalleryView()}
          </div>
          {inspectorOpen && <aside className="w-64 shrink-0 overflow-y-auto border-l border-white/10 bg-[#242426] p-4"><div className="flex justify-between"><span className="text-sm font-semibold">Info</span><button onClick={() => setInspectorOpen(false)}>×</button></div><div className="mt-8 flex justify-center">{selectedItem && <FinderIcon item={selectedItem} size={72} />}</div><dl className="mt-6 space-y-3 text-xs"><InfoRow label="Name" value={selectedItem?.name ?? "Multiple items"} /><InfoRow label="Kind" value={selectedItem?.type ?? "—"} /><InfoRow label="Size" value={selectedItem ? formatBytes(selectedItem.sizeBytes) : "—"} /><InfoRow label="Modified" value={formatDate(selectedItem?.updatedAt)} /></dl></aside>}
        </div>

        <footer className="flex h-6 shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#202022] px-3 text-[10px] text-white/45">
          <span>{selectedItems.length ? `${selectedItems.length} of ${visibleItems.length} selected` : `${visibleItems.length} items`}</span>
          {subscription && <span className="capitalize">{subscription.plan} · {formatBytes(subscription.finderBytesUsed + subscription.finderBytesReserved)} of {formatBytes(subscription.finderStorageBytes)}</span>}
          <button onClick={() => setInspectorOpen((value) => !value)} className="hover:text-white">{inspectorOpen ? "Hide Info" : "Show Info"}</button>
        </footer>
      </main>
      <style jsx global>{`.tag-red{background:#ff453a}.tag-orange{background:#ff9f0a}.tag-yellow{background:#ffd60a}.tag-green{background:#30d158}.tag-blue{background:#0a84ff}.tag-purple{background:#bf5af2}.tag-grey{background:#8e8e93}`}</style>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-4"><h3 className="mb-1 px-2 text-[10px] font-semibold text-white/35">{title}</h3><div>{children}</div></section>
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: FinderIconComponent; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] ${active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/[0.07]"}`}><Icon className="h-4 w-4 text-[#5ac8fa]" /><span className="truncate">{label}</span></button>
}

function ToolbarButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return <button title={label} aria-label={label} disabled={disabled} onClick={onClick} className="grid h-7 w-8 place-items-center rounded-md text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent">{children}</button>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-white/35">{label}</dt><dd className="mt-0.5 break-words text-white/75">{value}</dd></div>
}
