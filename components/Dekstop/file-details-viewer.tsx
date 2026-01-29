"use client"
import { useState } from "react"
import Image from "next/image"
import { PdfViewer } from "@/app/components/terminal/pdfviwer"

interface ProjectFile {
  id: string
  name: string
  type: "folder" | "document" | "video" | "image" | "spreadsheet" | "archive" | "code" | "other" | "link"
  content?: string
  src?: string
  url?: string
}

interface FileDetailsViewerProps {
  file: ProjectFile
  projectId?: string
  onUpdate?: (updatedFile: ProjectFile) => void
}

export function FileDetailsViewer({ file, projectId, onUpdate }: FileDetailsViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProjectFile>({ ...file })
  const [saving, setSaving] = useState(false)

  const handleChange = (key: keyof ProjectFile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  // Save changes to API
  const saveChanges = async () => {
    if (!projectId) return alert("Project ID missing!")
    setSaving(true)
    try {
      const response = await fetch(`/api/Projects/${projectId}/files/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })

      if (!response.ok) throw new Error("Failed to save file")

      const updatedFile: ProjectFile = await response.json()
      onUpdate?.(updatedFile)
      setDraft(updatedFile)
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving file:", err)
      alert("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const renderViewer = () => {
    switch (file.type) {
      case "document":
        if (file.content) return <pre className="bg-gray-700 p-3 rounded-md whitespace-pre-wrap text-xs flex-1">{file.content}</pre>
        if (file.src && file.name.endsWith(".pdf")) return <PdfViewer pdfUrl={file.src} />
        return <p className="text-gray-400 italic">No content available</p>

      case "image":
        if (file.src)
          return (
            <div className="relative w-64 h-64 mb-4">
              <Image src={file.src} alt={file.name} fill style={{ objectFit: "contain" }} />
            </div>
          )
        return <p className="text-gray-400 italic">No image available</p>

      case "video":
        if (file.src)
          return (
            <video controls src={file.src} className="max-w-full max-h-96 rounded-md bg-black">
              Your browser does not support the video tag.
            </video>
          )
        return <p className="text-gray-400 italic">No video available</p>

      case "link":
        if (file.url)
          return (
            <div className="flex items-center gap-2">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                {file.url}
              </a>
              <button onClick={() => window.open(file.url, "_blank")} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-xs">
                Open Link
              </button>
            </div>
          )
        return <p className="text-gray-400 italic">No link available</p>

      default:
        return <p className="text-gray-400 italic">Details not available for this type</p>
    }
  }

  const renderEditor = () => {
    switch (draft.type) {
      case "document":
        return draft.name.endsWith(".pdf") ? (
          <input
            type="text"
            placeholder="PDF URL"
            value={draft.src || ""}
            onChange={(e) => handleChange("src", e.target.value)}
            className="w-full p-2 rounded border text-xs mb-2"
          />
        ) : (
          <textarea
            placeholder="Document content"
            value={draft.content || ""}
            onChange={(e) => handleChange("content", e.target.value)}
            className="w-full p-2 rounded border text-xs h-32 mb-2"
          />
        )
      case "image":
      case "video":
        return (
          <input
            type="text"
            placeholder={`${draft.type} URL`}
            value={draft.src || ""}
            onChange={(e) => handleChange("src", e.target.value)}
            className="w-full p-2 rounded border text-xs mb-2"
          />
        )
      case "link":
        return (
          <input
            type="text"
            placeholder="Link URL"
            value={draft.url || ""}
            onChange={(e) => handleChange("url", e.target.value)}
            className="w-full p-2 rounded border text-xs mb-2"
          />
        )
      default:
        return <p className="text-gray-400 italic">Editing not supported for this type</p>
    }
  }

  return (
    <div className="p-4 bg-gray-800 text-gray-200 flex flex-col h-full overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">{draft.name}</h3>
        <button
          onClick={() => (isEditing ? saveChanges() : setIsEditing(true))}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-xs"
          disabled={saving}
        >
          {saving ? "Saving..." : isEditing ? "Save" : draft.content || draft.src || draft.url ? "Edit" : "Add"}
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">Type: {draft.type}</p>

      {isEditing ? renderEditor() : renderViewer()}
    </div>
  )
}
