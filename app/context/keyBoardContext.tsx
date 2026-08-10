"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import { toast } from "sonner"
import { Copy, Scissors } from "lucide-react"

// Types for clipboard and file operations
interface ClipboardItem {
  id: string
  name: string
  type: "file" | "folder" | "text"
  data: any
  operation: "copy" | "cut"
  source?: string // source folder/location
}

interface KeyboardContextType {
  clipboardItems: ClipboardItem[]
  copyItems: (items: ClipboardItem[]) => void
  cutItems: (items: ClipboardItem[]) => void
  pasteItems: (targetLocation?: string) => Promise<ClipboardItem[]> // Made async for database operations
  clearClipboard: () => void

  // Selection management
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  selectAll: () => void

  currentTargetLocation: string | null
  setCurrentTargetLocation: (location: string | null) => void

  // Keyboard state
  pressedKeys: Set<string>
  isCommandPressed: boolean
  isShiftPressed: boolean
  isAltPressed: boolean

  // Context menu
  contextMenu: { x: number; y: number; items: any[] } | null
  showContextMenu: (x: number, y: number, items: any[]) => void
  hideContextMenu: () => void

  copyToDatabase: (sourceIds: string[], targetParentId?: string) => Promise<any[]>
  moveToDatabase: (sourceIds: string[], targetParentId?: string) => Promise<any[]>
  deleteFromDatabase: (ids: string[]) => Promise<void>
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined)

export const useKeyboard = () => {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error("useKeyboard must be used within a KeyboardProvider")
  }
  return context
}

interface KeyboardProviderProps {
  children: ReactNode
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onFind?: () => void
  onSelectAll?: () => void
  onOpenApps: (appName: string) => void

}


export function KeyboardProvider({ children, onUndo, onRedo, onSave, onFind, onSelectAll, onOpenApps }: KeyboardProviderProps) {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null)
  const [currentTargetLocation, setCurrentTargetLocation] = useState<string | null>(null)

  const isCommandPressed = pressedKeys.has("Meta") || pressedKeys.has("Control")
  const isShiftPressed = pressedKeys.has("Shift")
  const isAltPressed = pressedKeys.has("Alt")

  const copyToDatabase = useCallback(async (sourceIds: string[], targetParentId?: string) => {
    try {
      const response = await fetch("/api/Projects/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds, targetParentId }),
      })

      if (!response.ok) throw new Error("Failed to copy to database")

      const result = await response.json()
      toast.success(`Copied ${sourceIds.length} item${sourceIds.length > 1 ? "s" : ""} to database`)
      return result.data
    } catch (error) {
      console.error("Error copying to database:", error)
      toast.error("Copy failed")
      throw error
    }
  }, [])

  const moveToDatabase = useCallback(
    async (sourceIds: string[], targetParentId?: string) => {
      try {
        const copiedItems = await copyToDatabase(sourceIds, targetParentId)
        await deleteFromDatabase(sourceIds)
        toast.success(`Moved ${sourceIds.length} item${sourceIds.length > 1 ? "s" : ""} successfully`)
        return copiedItems
      } catch (error) {
        console.error("Error moving in database:", error)
        toast.error("Move failed")
        throw error
      }
    },
    [copyToDatabase],
  )

  const deleteFromDatabase = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/Projects/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error(`Failed to delete item ${id}`)
      }
      toast.success(`Deleted ${ids.length} item${ids.length > 1 ? "s" : ""} successfully`)
    } catch (error) {
      console.error("Error deleting from database:", error)
      toast.error("Delete failed")
      throw error
    }
  }, [])

  const copyItems = useCallback((items: ClipboardItem[]) => {
    const copyItems = items.map((item) => ({ ...item, operation: "copy" as const }))
    setClipboardItems(copyItems)
    toast.success(`Copied ${items.length} item${items.length > 1 ? "s" : ""} to clipboard`)
    console.log(`Copied ${items.length} item(s) to clipboard`)
  }, [])

  const cutItems = useCallback((items: ClipboardItem[]) => {
    const cutItems = items.map((item) => ({ ...item, operation: "cut" as const }))
    setClipboardItems(cutItems)
    toast.success(`Cut ${items.length} item${items.length > 1 ? "s" : ""} to clipboard`)
    console.log(`Cut ${items.length} item(s) to clipboard`)
  }, [])

  const pasteItems = useCallback(
    async (targetLocation?: string) => {
      console.log("clip", clipboardItems)
      if (clipboardItems.length === 0) {
        toast.error("Nothing to paste")
        return []
      }


      try {
        const sourceIds = clipboardItems.map((item) => item.id)
        let result: any[] = []

        const finalTargetLocation = targetLocation || currentTargetLocation || "root"

        console.log("Pasting items:", {
          sourceIds,
          targetLocation,
          currentTargetLocation,
          finalTargetLocation,
          clipboardOperation: clipboardItems[0].operation,
        })

        if (clipboardItems[0].operation === "copy") {
          result = await copyToDatabase(sourceIds, finalTargetLocation)
          console.log("copy result", result)
        } else {
          result = await moveToDatabase(sourceIds, finalTargetLocation)
          setClipboardItems([])
        }

        toast.success(
          `Pasted ${clipboardItems.length} item${clipboardItems.length > 1 ? "s" : ""}${finalTargetLocation !== "root" ? ` to ${finalTargetLocation}` : ""}`,
        )

        console.log(
          `Pasted ${clipboardItems.length} item(s)${finalTargetLocation ? ` to ${finalTargetLocation}` : ""} in database`,
        )

        return result
      } catch (error) {
        console.error("Error pasting items:", error)
        toast.error("Paste failed")
        return []
      }
    },
    [clipboardItems, copyToDatabase, moveToDatabase, currentTargetLocation],
  )

  const clearClipboard = useCallback(() => {
    setClipboardItems([])
    toast("Clipboard cleared")
  }, [])

  const selectAll = useCallback(() => {
    onSelectAll?.()
    toast("Select All")
  }, [onSelectAll])

  const showContextMenu = useCallback((x: number, y: number, items: any[]) => {
    setContextMenu({ x, y, items })
  }, [])

  const hideContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const openTerminal = useCallback(() => {
    alert("termial")
    // onOpenApps("Terminal",150,150,) 

  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prev) => new Set([...prev, event.key]))

      const isCmd = event.metaKey || event.ctrlKey

      if (isCmd) {
        switch (event.key.toLowerCase()) {
          // case "c":
          //   if (selectedItems.length > 0) {
          //     event.preventDefault()
          //     const items: ClipboardItem[] = selectedItems.map((id) => ({
          //       id,
          //       name: id,
          //       type: "file" as const,
          //       data: { id },
          //       operation: "copy" as const,
          //     }))
          //     copyItems(items)
          //   }
          //   break
          case "x":
            if (selectedItems.length > 0) {
              event.preventDefault()
              const items: ClipboardItem[] = selectedItems.map((id) => ({
                id,
                name: id,
                type: "file" as const,
                data: { id },
                operation: "cut" as const,
              }))
              cutItems(items)
            }
            break


          // case "v":
          //   event.preventDefault()
          //   pasteItems()
          //   break

          case "a":
            event.preventDefault()
            selectAll()
            break
          case "z":
            if (event.shiftKey) {
              event.preventDefault()
              onRedo?.()
              toast("Redo")
            } else {
              event.preventDefault()
              onUndo?.()
              toast("Undo")
            }
            break
          case "s":
            event.preventDefault()
            onSave?.()
            toast.success("Saved")
            break

          case "l":
            event.preventDefault()
            onOpenApps("Terminal", 390, 200, "excel")
            break
          case "f":
            event.preventDefault()
            onFind?.()
            toast("Search")
            break
        }
      }

      if (event.key === "Escape") {
        hideContextMenu()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const newSet = new Set(prev)
        newSet.delete(event.key)
        return newSet
      })
    }

    const handleClick = () => {
      hideContextMenu()
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("click", handleClick)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [selectedItems, copyItems, cutItems, pasteItems, selectAll, onUndo, onRedo, onSave, onFind, hideContextMenu])

  const value: KeyboardContextType = {
    clipboardItems,
    copyItems,
    cutItems,
    pasteItems,
    clearClipboard,
    selectedItems,
    setSelectedItems,
    selectAll,
    currentTargetLocation,
    setCurrentTargetLocation,
    pressedKeys,
    isCommandPressed,
    isShiftPressed,
    isAltPressed,
    contextMenu,
    showContextMenu,
    hideContextMenu,
    copyToDatabase,
    moveToDatabase,
    deleteFromDatabase,
  }

  return (
    <KeyboardContext.Provider value={value}>
      {children}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 z-[9999] min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.items.map((item, index) => (
            <button
              key={index}
              className={`flex items-center w-full text-left px-3 py-2 text-sm transition-colors ${item.disabled ? "text-gray-500 cursor-not-allowed" : "text-gray-200 hover:bg-gray-700"
                }`}
              onClick={() => {
                if (!item.disabled) {
                  item.action?.()
                  hideContextMenu()
                }
              }}
              disabled={item.disabled}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label === "---" ? (
                <div className="w-full h-px bg-gray-600 my-1" />
              ) : (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <span className="text-xs text-gray-400 ml-2">{item.shortcut}</span>}
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {clipboardItems.length > 0 && (
        <div className="fixed left-10 bottom-10  bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-[9998] max-w-xs">
          <div className="flex items-center space-x-2">
            {clipboardItems[0].operation === "copy" ? (
              <Copy className="h-4 w-4 text-blue-400" />
            ) : (
              <Scissors className="h-4 w-4 text-orange-400" />
            )}
            <div className="text-sm text-gray-200">
              <div className="font-medium">
                {clipboardItems.length} item{clipboardItems.length > 1 ? "s" : ""}{" "}
                {clipboardItems[0].operation === "copy" ? "copied" : "cut"}
              </div>
              <div className="text-xs text-gray-400">Press Cmd+V to paste</div>
            </div>
            <button
              onClick={clearClipboard}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Clear clipboard"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </KeyboardContext.Provider>
  )
}
