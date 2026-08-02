"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, History, ImageIcon, LoaderCircle } from "lucide-react"
import { jsPDF } from "jspdf"
import AsyncImageFromDescription from "./asyncImageDesc"
import type { LessonContext } from "@/modules/teaching/lesson.schema"

type Message = { role: "user" | "assistant" | "system"; content: string }
type BookPage = {
  type: "cover" | "text" | "image" | "end"
  content: { title?: string; subtitle?: string; author?: string; body?: string; question?: string; answer?: string; src?: string; imageUrl?: string; alt?: string; caption?: string; message?: string }
}
type Book = { id: string; subject: string; title: string; model: string; messages: Message[]; pages: BookPage[]; status: string; createdAt?: string }
type Usage = { used: number; limit: number; remaining: number }
type ScienceBookProps = { name?: string; subject?: string; context?: LessonContext; messages?: Message[]; callStart?: boolean | null; status?: string; sessionId?: string }

function buildLivePages(name: string, subject: string, messages: Message[]): BookPage[] {
  const pages: BookPage[] = [{ type: "cover", content: { title: subject || "Live Lesson", subtitle: "Your questions and teacher's explanations", author: name } }]
  let pendingQuestion = ""
  for (const message of messages) {
    if (message.role === "user") pendingQuestion = message.content
    if (message.role === "assistant" && message.content.trim()) {
      pages.push({ type: "text", content: pendingQuestion ? { question: pendingQuestion, answer: message.content } : { title: "Teacher's note", body: message.content } })
      pendingQuestion = ""
    }
  }
  if (pendingQuestion) pages.push({ type: "text", content: { question: pendingQuestion, answer: "The teacher is preparing an answer…" } })
  return pages
}

export function ScienceBook({ name = "Student", subject = "", context, messages = [], status = "NOT_STARTED", sessionId }: ScienceBookProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [book, setBook] = useState<Book | null>(null)
  const [history, setHistory] = useState<Book[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const finalizedRef = useRef<string | null>(null)
  const enrichingRef = useRef(new Set<string>())
  const livePages = useMemo(() => buildLivePages(name, subject, messages), [name, subject, messages])
  const pages = book?.pages?.length ? book.pages : livePages
  const totalPages = pages.length

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/book-pages", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      setHistory(data.books || [])
      setUsage(data.usage || null)
    } catch (historyError) {
      console.error("Failed to load teacher books", historyError)
    }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])
  useEffect(() => { setCurrentPage((page) => Math.min(page, Math.max(0, totalPages - 1))) }, [totalPages])

  useEffect(() => {
    if (!book?.id || !["generating", "enriching"].includes(book.status)) return
    const timer = window.setInterval(() => {
      void fetch("/api/book-pages", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return
        const data = await response.json()
        const updated = (data.books as Book[] | undefined)?.find((item) => item.id === book.id)
        if (updated) {
          setBook(updated)
          setHistory(data.books || [])
          setUsage(data.usage || null)
        }
      }).catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [book?.id, book?.status])

  useEffect(() => {
    if (status !== "COMPLETED" || messages.filter((message) => message.role !== "system").length < 2) return
    const key = sessionId || `${subject}:${messages.length}:${messages.at(-1)?.content.slice(0, 40)}`
    if (finalizedRef.current === key) return
    const finalizeTimer = window.setTimeout(() => {
      finalizedRef.current = key
      setLoading(true)
      setError("")
      void fetch("/api/book-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prompt: subject, context, messages, sessionId: key }),
      }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Book generation failed")
      setBook(data)
      setUsage(data.usage || null)
      setCurrentPage(0)
      await loadHistory()
      }).catch((generationError) => {
      setError(generationError instanceof Error ? generationError.message : "Book generation failed")
      finalizedRef.current = null
      void loadHistory()
      }).finally(() => setLoading(false))
    }, 1200)
    return () => window.clearTimeout(finalizeTimer)
  }, [context, loadHistory, messages, name, sessionId, status, subject])

  const persistImage = useCallback((pageIndex: number, imageUrl: string) => {
    if (!book?.id) return
    setBook((current) => current ? { ...current, pages: current.pages.map((page, index) => index === pageIndex ? { ...page, content: { ...page.content, imageUrl } } : page) } : current)
    void fetch("/api/book-pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.id, pageIndex, imageUrl }) })
  }, [book?.id])

  useEffect(() => {
    if (!book?.id) return
    book.pages.forEach((page, pageIndex) => {
      const enrichmentKey = `${book.id}:${pageIndex}`
      if (page.type !== "image" || page.content.imageUrl || enrichingRef.current.has(enrichmentKey)) return
      enrichingRef.current.add(enrichmentKey)
      void (async () => {
        try {
          const description = page.content.src || `${book.subject} educational diagram`
          const searchResponse = await fetch("/api/pinterest/searchimage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ search: description, mode: "education" }),
          })
          const search = await searchResponse.json()
          const candidate = search?.images?.[0]
          const imageUrl = typeof candidate === "string" ? candidate : candidate?.url
          if (imageUrl) persistImage(pageIndex, imageUrl)
        } catch (imageError) {
          console.error("Background book image enrichment failed", imageError)
        }
      })()
    })
  }, [book, persistImage])

  const loadSavedBook = (id: string) => {
    const saved = history.find((item) => item.id === id)
    if (!saved) return
    setBook(saved)
    setCurrentPage(0)
    setError("")
  }

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

  const downloadPDF = async () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const width = pdf.internal.pageSize.getWidth()
    const height = pdf.internal.pageSize.getHeight()
    for (let index = 0; index < pages.length; index += 1) {
      if (index) pdf.addPage()
      const page = pages[index]
      pdf.setFillColor(24, 25, 31)
      pdf.rect(0, 0, width, height, "F")
      pdf.setTextColor(242, 242, 247)
      if (page.type === "image" && page.content.imageUrl) {
        try {
          const image = await loadImage(page.content.imageUrl)
          pdf.addImage(image, "JPEG", 15, 25, width - 30, 150)
          pdf.setFontSize(12)
          pdf.text(pdf.splitTextToSize(page.content.caption || page.content.alt || "", width - 30), 15, 188)
          continue
        } catch { /* A remote host may not permit PDF canvas access. */ }
      }
      const title = page.content.title || page.content.question || (page.type === "cover" ? subject : "Lesson")
      const body = page.content.answer || page.content.body || page.content.subtitle || page.content.message || ""
      pdf.setFontSize(page.type === "cover" ? 28 : 20)
      pdf.text(pdf.splitTextToSize(title, width - 30), 15, 35)
      pdf.setFontSize(13)
      pdf.setTextColor(205, 205, 215)
      pdf.text(pdf.splitTextToSize(body, width - 30), 15, page.type === "cover" ? 65 : 60)
    }
    pdf.save(`${(book?.title || subject || "teacher-book").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`)
  }

  const page = pages[currentPage]
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col overflow-hidden bg-[#191a20] text-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[.04] px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2"><BookOpen className="size-4 shrink-0 text-[#64d2ff]" /><span className="truncate text-xs font-medium">{book?.title || `${subject || "Science"} Book`}</span></div>
        {history.length > 0 && <label className="relative flex items-center gap-1.5"><History className="size-3.5 text-white/40" /><select value={book?.id || ""} onChange={(event) => loadSavedBook(event.target.value)} className="max-w-44 rounded-lg border border-white/10 bg-[#292a31] px-2 py-1 text-[11px] text-white outline-none"><option value="">Book history</option>{history.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
        {usage && <span className="rounded-full bg-white/[.06] px-2 py-1 text-[10px] text-white/45">{usage.used}/{usage.limit} books</span>}
        <button onClick={downloadPDF} disabled={!pages.length} className="flex items-center gap-1.5 rounded-lg bg-[#0a84ff] px-2.5 py-1.5 text-[11px] font-semibold transition hover:bg-[#2997ff] disabled:opacity-40"><DownloadIcon className="size-3.5" /> PDF</button>
      </div>

      {loading && <div className="flex items-center gap-2 border-b border-[#bf5af2]/20 bg-[#bf5af2]/10 px-3 py-2 text-xs text-[#d48aff]"><LoaderCircle className="size-3.5 animate-spin" /> Lesson finished. The book agent is organizing your complete book in the background…</div>}
      {error && <div className="border-b border-[#ff453a]/20 bg-[#ff453a]/10 px-3 py-2 text-xs text-[#ff6961]">{error}</div>}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!page ? <div className="flex h-full flex-col items-center justify-center text-white/35"><BookOpen className="mb-3 size-10" /><p className="text-sm">Start the lesson to build your book live.</p></div> : page.type === "cover" ? (
          <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(48,209,88,.18),transparent_38%),linear-gradient(145deg,#10251c,#17181d)] p-8 text-center"><BookOpen className="mb-6 size-12 text-[#30d158]" /><h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#7cf59a] sm:text-4xl">{page.content.title}</h1><p className="mt-3 text-base text-white/55">{page.content.subtitle}</p><p className="mt-8 text-sm text-white/35">By {page.content.author || name}</p></div>
        ) : page.type === "image" ? (
          <AsyncImageFromDescription description={page.content.src || subject} alt={page.content.alt || page.content.caption || "Educational illustration"} caption={page.content.caption} initialUrl={page.content.imageUrl} onResolved={(url) => persistImage(currentPage, url)} />
        ) : page.type === "end" ? (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#202127] to-[#111217] p-8 text-center"><BookOpen className="mb-5 size-10 text-[#64d2ff]" /><p className="text-2xl font-semibold">{page.content.message || "Keep learning."}</p><p className="mt-3 text-sm text-white/40">Your complete lesson is saved in Book History.</p></div>
        ) : (
          <div className="h-full overflow-y-auto bg-[linear-gradient(135deg,#202127,#17181d)] p-6 text-left sm:p-8">{page.content.question && <p className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-[#ffd60a]">Student question</p>}<h2 className="text-xl font-semibold leading-snug text-[#64d2ff] sm:text-2xl">{page.content.question || page.content.title}</h2>{page.content.answer && <p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-[#6ee78b]">Teacher&apos;s answer</p>}<div className="mt-3 space-y-3 text-sm leading-7 text-white/70 sm:text-base">{(page.content.answer || page.content.body || "").split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-white/[.04] px-3 py-2 text-xs text-white/40">
        <button onClick={() => setCurrentPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10 disabled:opacity-25"><ChevronLeftIcon className="size-4" /> Previous</button>
        <span className="flex items-center gap-1.5">{page?.type === "image" && <ImageIcon className="size-3.5" />} Page {currentPage + 1} of {totalPages}</span>
        <button onClick={() => setCurrentPage((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPage >= totalPages - 1} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10 disabled:opacity-25">Next <ChevronRightIcon className="size-4" /></button>
      </div>
    </div>
  )
}
