"use client"
import { PdfViewer } from "@/app/components/terminal/pdfviwer"
import Image from "next/image"
import type React from "react"

interface ProjectFile {
  name: string
  icon?: React.ReactNode
  type: "folder" | "document" | "video" | "image" | "spreadsheet" | "archive" | "code" | "other" | "link"
  content?: string
  src?: string
  url?: string
}

interface FileDetailsViewerProps {
  file: ProjectFile
}

export function FileDetailsViewer({ file }: FileDetailsViewerProps) {
  return (
    <div className="p-4 bg-gray-800 text-gray-200 flex flex-col h-full overflow-auto">
      <h3 className="text-lg font-bold mb-2">{file.name}</h3>
      <p className="text-sm text-gray-400 mb-4">Type: {file.type}</p>

      {file.type === "document" && file.content && (
        <pre className="bg-gray-700 p-3 rounded-md whitespace-pre-wrap text-xs flex-1">{file.content}</pre>
      )}

      {file.type === "document" && file.src && file.name.endsWith(".pdf") && (
        <div className="flex-1">
          <PdfViewer pdfUrl={file.src} />
        </div>
      )}

      {file.type === "image" && file.src && (
        <div className="relative w-64 h-64 mb-4">
          <Image
            src={file.src || "b1.png"}
            className="h-96 w-96"
            alt={file.name}
            layout="fill"
            objectFit="contain"
          />
        </div>
      )}

      {file.type === "video" && file.src && (
        <div className="mb-4">
          <video
            controls
            src={file.src}
            className="max-w-full max-h-96 rounded-md bg-black"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {file.type === "link" && file.url && (
        <div className="flex items-center gap-2">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-sm"
          >
            {file.url}
          </a>
          <button
            onClick={() => window.open(file.url, "_blank")}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-xs"
          >
            Open Link
          </button>
        </div>
      )}

      {(file.type === "folder" ||
        file.type === "spreadsheet" ||
        file.type === "archive" ||
        file.type === "code" ||
        file.type === "other") && (
        <p className="text-gray-400 italic">Details for this file type are not available in this viewer.</p>
      )}

      {!file.content && !file.src && !file.url && file.type !== "folder" && (
        <p className="text-gray-400 italic">No content available for this file.</p>
      )}
    </div>
  )
}
