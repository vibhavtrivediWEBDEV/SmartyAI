"use client"

import { useMemo, useState } from "react"
import { ExternalLink, LoaderCircle, RotateCcw, Search, ZoomIn, ZoomOut } from "lucide-react"

import type { TeacherResponse } from "@/modules/teaching/teacher-response"

type Reference = NonNullable<TeacherResponse["documentReference"]>

export function TextbookPanel({ reference }: { reference: Reference }) {
  const [zoom, setZoom] = useState("page-width")
  const [page, setPage] = useState(reference.pdfPage || 1)
  const [loadKey, setLoadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const chapter = Number(reference.chapter)
  const pdfUrl = useMemo(() => `/api/textbooks/pdf?bookId=${encodeURIComponent(reference.bookId)}&chapter=${chapter}#page=${page}&zoom=${zoom}`, [chapter, page, reference.bookId, zoom, loadKey])
  return <div className="flex h-full min-h-[420px] flex-col bg-[#202127]">
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-2">
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{reference.bookTitle || reference.bookId} · Chapter {reference.chapter}{reference.printedPage ? ` · Printed page ${reference.printedPage}` : ""}</span>
      <label className="flex items-center gap-1 rounded-lg bg-white/[.07] px-2"><span className="text-[10px] text-white/40">PDF page</span><input aria-label="PDF page" type="number" min={1} value={page} onChange={(event) => setPage(Math.max(1, Number(event.target.value)))} className="h-7 w-12 bg-transparent text-xs outline-none" /></label>
      <button title="Zoom out" onClick={() => setZoom(String(Math.max(50, Number(zoom) - 15 || 85)))} className="rounded-lg p-1.5 hover:bg-white/10"><ZoomOut className="size-4" /></button>
      <button title="Fit width" onClick={() => setZoom("page-width")} className="rounded-lg px-2 py-1 text-[10px] hover:bg-white/10">Fit width</button>
      <button title="Zoom in" onClick={() => setZoom(String(Math.min(200, Number(zoom) + 15 || 115)))} className="rounded-lg p-1.5 hover:bg-white/10"><ZoomIn className="size-4" /></button>
      <span title="Use Command/Ctrl+F inside the PDF viewer" className="flex items-center gap-1 text-[10px] text-white/35"><Search className="size-3" /> Search: ⌘F</span>
      <a href={reference.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[#0a84ff] px-2 py-1 text-[10px] font-semibold">Official source <ExternalLink className="size-3" /></a>
    </div>
    <div className="relative min-h-0 flex-1">
      {loading && !failed && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#202127]"><LoaderCircle className="mr-2 size-5 animate-spin" /> Loading official PDF…</div>}
      {failed ? <div className="flex h-full flex-col items-center justify-center p-6 text-center"><p className="text-sm text-[#ff9f0a]">The official document is temporarily unavailable. Your lesson and transcript are preserved.</p><button onClick={() => { setFailed(false); setLoading(true); setLoadKey((key) => key + 1) }} className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs"><RotateCcw className="size-3.5" /> Retry</button></div> : <iframe key={loadKey} src={pdfUrl} title={`Official NCERT ${reference.bookTitle || "textbook"}`} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true) }} className="h-full min-h-[420px] w-full border-0" />}
    </div>
    <p className="border-t border-white/10 px-3 py-2 text-[10px] text-white/35">Official NCERT source · confidence {Math.round(reference.confidence * 100)}%. Printed and PDF page numbers can differ.</p>
  </div>
}