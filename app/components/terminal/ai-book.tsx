"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, ChevronLeftIcon, ChevronRightIcon, Code2, DownloadIcon, Globe2, History, ImageIcon, LibraryBig, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react"
import { jsPDF } from "jspdf"
import AsyncImageFromDescription from "./asyncImageDesc"
import type { LessonContext } from "@/modules/teaching/lesson.schema"
import { loadTodayLearningContext, type TodayLearningContext } from "@/lib/teaching/todayNotes"
import { isCodingBookPage } from "@/lib/teacher-books/codingExercise"

type Message = { role: "user" | "assistant" | "system"; content: string }
type BookPage = {
  type: "cover" | "text" | "image" | "end"
  content: { kind?: "coding"; language?: string; title?: string; subtitle?: string; author?: string; body?: string; question?: string; answer?: string; src?: string; imageUrl?: string; alt?: string; caption?: string; message?: string }
}
type Book = { id: string; sessionId?: string; subject: string; title: string; model?: string; messages?: Message[]; pages: BookPage[]; status: string; isPublic?: boolean; createdAt?: string }
type Usage = { used: number; limit: number; remaining: number }
type ScienceBookProps = { name?: string; subject?: string; context?: LessonContext; messages?: Message[]; callStart?: boolean | null; status?: string; sessionId?: string; bookId?: string; focusRequest?: number; openApplication?: (appName: string, initialX?: number, initialY?: number, commandToRun?: string, arg?: Record<string, unknown>) => void | Promise<void> }

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

export function ScienceBook({ name = "Student", subject = "", context, messages = [], status = "NOT_STARTED", sessionId, bookId, focusRequest = 0, openApplication }: ScienceBookProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [book, setBook] = useState<Book | null>(null)
  const [history, setHistory] = useState<Book[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [openingExercise, setOpeningExercise] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [todayNotes, setTodayNotes] = useState<TodayLearningContext | null>(null)
  const finalizedRef = useRef<string | null>(null)
  const enrichingRef = useRef(new Set<string>())
  const livePages = useMemo(() => buildLivePages(name, subject, messages), [name, subject, messages])
  const pages = book?.pages?.length ? book.pages : livePages
  const totalPages = pages.length

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/book-pages", { cache: "no-store" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status !== 401) setError(data?.error || "Book history is temporarily unavailable.")
        return
      }
      const data = await response.json()
      setHistory(data.books || [])
      setUsage(data.usage || null)
    } catch (historyError) {
      setError(historyError instanceof Error && historyError.message === "Failed to fetch"
        ? "AI Book cannot reach the server. Restart the SmartyAI server and try again."
        : "Book history is temporarily unavailable.")
    } finally {
      setHistoryLoaded(true)
    }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])
  useEffect(() => { void loadTodayLearningContext().then(setTodayNotes) }, [])
  useEffect(() => { setCurrentPage((page) => Math.min(page, Math.max(0, totalPages - 1))) }, [totalPages])
  useEffect(() => {
    if (!focusRequest || totalPages < 1) return
    setCurrentPage(totalPages - 1)
  }, [focusRequest, totalPages])

  useEffect(() => {
    if (!bookId) return
    setLoading(true)
    setError("")
    void fetch(`/api/library/books/${encodeURIComponent(bookId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.book) throw new Error(data?.error || "Public book not found.")
        setBook({ ...data.book, status: "complete" })
        setCurrentPage(0)
      })
      .catch((bookError) => setError(bookError instanceof Error ? bookError.message : "Unable to open this book."))
      .finally(() => setLoading(false))
  }, [bookId])

  useEffect(() => {
    if (bookId || !historyLoaded || book || loading) return
    const generationSubject = subject.trim() || todayNotes?.topic || ""
    if (!generationSubject || (!todayNotes && !sessionId)) return
    const dailySessionId = sessionId || `today-notes:${todayNotes!.dateKey}:${todayNotes!.noteIds.join(",")}`
    const saved = history.find((item) => item.sessionId === dailySessionId)
    if (saved) {
      setBook(saved)
      setCurrentPage(0)
      return
    }
    if (finalizedRef.current === dailySessionId) return
    finalizedRef.current = dailySessionId
    setLoading(true)
    setError("")
    const sourceMessages: Message[] = [
      { role: "system", content: todayNotes ? `Today's verified student notes:\n\n${todayNotes.sourceMaterial}` : `Career learning topic: ${generationSubject}` },
      { role: "user", content: "Create a complete private study edition from today's notes, including questions, worked answers, practice, and revision material." },
    ]
    void fetch("/api/book-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prompt: generationSubject.slice(0, 300), messages: sourceMessages, sessionId: dailySessionId }),
    }).then(async (response) => {
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Book generation failed")
      setBook(data)
      setUsage(data.usage || null)
      setCurrentPage(0)
      await loadHistory()
    }).catch((generationError) => {
      setError(generationError instanceof Error ? generationError.message : "Book generation failed")
      finalizedRef.current = null
    }).finally(() => setLoading(false))
  }, [book, bookId, history, historyLoaded, loadHistory, loading, name, sessionId, subject, todayNotes])

  useEffect(() => {
    if (!sessionId || book?.sessionId === sessionId) return
    const saved = history.find((item) => item.sessionId === sessionId)
    if (!saved) return
    setBook(saved)
    setCurrentPage(0)
    setError("")
  }, [book?.sessionId, history, sessionId])

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
    if (bookId || status !== "COMPLETED" || messages.filter((message) => message.role !== "system").length < 2) return
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
  }, [bookId, context, loadHistory, messages, name, sessionId, status, subject])

  const persistImage = useCallback((pageIndex: number, imageUrl: string) => {
    if (!book?.id) return
    setBook((current) => current ? { ...current, pages: current.pages.map((page, index) => index === pageIndex ? { ...page, content: { ...page.content, imageUrl } } : page) } : current)
    void fetch("/api/book-pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.id, pageIndex, imageUrl }) })
  }, [book?.id])

  useEffect(() => {
    if (bookId || !book?.id) return
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
  }, [book, bookId, persistImage])

  const loadSavedBook = (id: string) => {
    const saved = history.find((item) => item.id === id)
    if (!saved) return
    setBook(saved)
    setCurrentPage(0)
    setError("")
  }

  const openCodingExercise = async () => {
    if (!book?.id || !openApplication) return
    setOpeningExercise(true)
    setError("")
    try {
      const response = await fetch(`/api/book-pages/${encodeURIComponent(book.id)}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIndex: currentPage }),
      })
      const result = await response.json()
      if (!response.ok || !result.data?.id) throw new Error(result.error || "Unable to create the coding workspace.")
      await openApplication("vscode", undefined, undefined, undefined, {
        workspaceId: result.data.id,
        initialFile: result.filePath,
      })
    } catch (exerciseError) {
      setError(exerciseError instanceof Error ? exerciseError.message : "Unable to open this exercise in VS Code.")
    } finally {
      setOpeningExercise(false)
    }
  }

  const togglePublication = async () => {
    if (!book?.id || book.status !== "complete" || bookId) return
    setPublishing(true)
    setError("")
    try {
      const summarySource = book.pages.find((item) => item.type === "text")?.content
      const summary = (summarySource?.body || summarySource?.answer || `${book.title} is a focused learning edition covering ${book.subject}.`)
        .replace(/\s+/g, " ").trim().slice(0, 360)
      const response = await fetch(`/api/library/books/${encodeURIComponent(book.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book.isPublic ? { isPublic: false } : { isPublic: true, summary }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Unable to update publication.")
      setBook((current) => current ? { ...current, isPublic: data.isPublic } : current)
      setHistory((current) => current.map((item) => item.id === book.id ? { ...item, isPublic: data.isPublic } : item))
    } catch (publicationError) {
      setError(publicationError instanceof Error ? publicationError.message : "Unable to update publication.")
    } finally {
      setPublishing(false)
    }
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
      pdf.setFillColor(246, 242, 232)
      pdf.rect(0, 0, width, height, "F")
      pdf.setFillColor(22, 36, 31)
      pdf.rect(0, 0, width, 9, "F")
      pdf.setDrawColor(194, 154, 72)
      pdf.setLineWidth(0.35)
      pdf.line(15, height - 16, width - 15, height - 16)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(95, 89, 76)
      pdf.text("SMARTY PRIVATE EDITION", 15, height - 10)
      pdf.text(`${index + 1} / ${pages.length}`, width - 15, height - 10, { align: "right" })
      pdf.setTextColor(25, 34, 31)
      if (page.type === "image" && page.content.imageUrl) {
        try {
          const image = await loadImage(page.content.imageUrl)
          pdf.addImage(image, "JPEG", 15, 28, width - 30, 145)
          pdf.setFontSize(12)
          pdf.setTextColor(68, 70, 64)
          pdf.text(pdf.splitTextToSize(page.content.caption || page.content.alt || "", width - 30), 15, 188)
          continue
        } catch { /* A remote host may not permit PDF canvas access. */ }
      }
      const title = page.content.title || page.content.question || (page.type === "cover" ? subject : "Lesson")
      const body = page.content.answer || page.content.body || page.content.subtitle || page.content.message || ""
      pdf.setFont("times", "bold")
      pdf.setFontSize(page.type === "cover" ? 30 : 21)
      pdf.text(pdf.splitTextToSize(title, width - 30), 15, 38)
      pdf.setDrawColor(194, 154, 72)
      pdf.setLineWidth(0.7)
      pdf.line(15, page.type === "cover" ? 54 : 50, 42, page.type === "cover" ? 54 : 50)
      pdf.setFont("times", "normal")
      pdf.setFontSize(12.5)
      pdf.setTextColor(62, 65, 59)
      pdf.text(pdf.splitTextToSize(body, width - 30), 15, page.type === "cover" ? 68 : 62, { lineHeightFactor: 1.55, maxWidth: width - 30 })
    }
    pdf.save(`${(book?.title || subject || "teacher-book").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`)
  }

  const page = pages[currentPage]
  return (
    <div className="flex h-full min-h-105 w-full flex-col overflow-hidden bg-[#111315] text-white">
      <div className="flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[#17191c] px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#ffd666]/20 bg-[#ffd666]/10"><LibraryBig className="size-4.5 text-[#ffd666]" /></div>
          <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-white/35">Private AI Library</p><span className="block truncate font-serif text-base font-medium">{book?.title || `${subject || todayNotes?.topic || "Today’s Notes"} Book`}</span></div>
        </div>
        {history.length > 0 && <label className="relative flex items-center gap-1.5"><History className="size-3.5 text-white/40" /><select aria-label="Book history" value={book?.id || ""} onChange={(event) => loadSavedBook(event.target.value)} className="h-8 max-w-44 rounded-md border border-white/10 bg-[#222429] px-2 text-[11px] text-white outline-none transition focus:border-[#63e6be]"><option value="">Book history</option>{history.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
        {usage && <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] text-white/45">{usage.used} of {usage.limit}</span>}
        {book?.status === "complete" && !bookId && <button onClick={() => void togglePublication()} disabled={publishing} title={book.isPublic ? "Remove this book from the public Library" : "Publish this book to the public Library"} className="flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 disabled:opacity-40">{publishing ? <LoaderCircle className="size-3.5 animate-spin" /> : book.isPublic ? <LockKeyhole className="size-3.5" /> : <Globe2 className="size-3.5" />}{book.isPublic ? "Make private" : "Publish"}</button>}
        <button onClick={downloadPDF} disabled={!pages.length} className="flex h-8 items-center gap-1.5 rounded-md bg-[#63e6be] px-3 text-[11px] font-bold text-[#0d1c18] transition hover:bg-[#8af0d1] disabled:opacity-40"><DownloadIcon className="size-3.5" /> Export PDF</button>
      </div>

      {loading && <div className="flex items-center gap-2 border-b border-[#ffd666]/20 bg-[#ffd666]/10 px-4 py-2 text-xs text-[#ffe49a]"><LoaderCircle className="size-3.5 animate-spin" /> Lesson finished. The book agent is organizing your complete book in the background…</div>}
      {error && <div className="border-b border-[#ff453a]/20 bg-[#ff453a]/10 px-3 py-2 text-xs text-[#ff6961]">{error}</div>}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(115deg,#111315,#1a1c20)] p-2.5 sm:p-4">
        <div className="h-full overflow-hidden rounded-lg border border-white/10 bg-[#1b1d21] shadow-[0_24px_60px_rgba(0,0,0,.35)]">
        {!page ? <div className="flex h-full flex-col items-center justify-center text-white/35"><BookOpen className="mb-3 size-10" /><p className="text-sm">Start the lesson to build your book live.</p></div> : page.type === "cover" ? (
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#13231e,#16181c_58%,#272113)] p-8 text-center"><div className="absolute inset-y-0 left-0 w-2 bg-[#63e6be]" /><div className="absolute left-8 right-8 top-8 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[.22em] text-white/30"><span>Personal edition</span><span>{new Date().getFullYear()}</span></div><div className="mb-7 flex size-16 items-center justify-center rounded-md border border-[#63e6be]/25 bg-[#63e6be]/10"><BookOpen className="size-8 text-[#63e6be]" /></div><h1 className="max-w-2xl font-serif text-4xl font-medium leading-tight text-white sm:text-5xl">{page.content.title}</h1><div className="mt-5 h-px w-16 bg-[#ffd666]" /><p className="mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base">{page.content.subtitle}</p><p className="mt-8 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ffd666]">Prepared for {page.content.author || name}</p></div>
        ) : page.type === "image" ? (
          <AsyncImageFromDescription description={page.content.src || subject} alt={page.content.alt || page.content.caption || "Educational illustration"} caption={page.content.caption} initialUrl={page.content.imageUrl} onResolved={(url) => persistImage(currentPage, url)} />
        ) : page.type === "end" ? (
          <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(145deg,#191b1f,#111315)] p-8 text-center"><div className="mb-6 flex size-14 items-center justify-center rounded-md border border-[#ffd666]/20 bg-[#ffd666]/10"><Sparkles className="size-7 text-[#ffd666]" /></div><p className="font-serif text-3xl font-medium">{page.content.message || "Keep learning."}</p><p className="mt-3 text-sm text-white/40">Your complete lesson is saved in Book History.</p></div>
        ) : (
          <div className="h-full overflow-y-auto bg-[#1c1e22] p-6 text-left sm:p-10"><div className={`mx-auto max-w-3xl rounded-lg transition ${focusRequest ? "bg-[#ffd666]/5 px-4 py-3 ring-2 ring-[#ffd666]/35" : ""}`}>{page.content.question && <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[#ffd666]">{isCodingBookPage(page.content) ? "Coding challenge" : "Student question"}</p>}<div className="flex flex-wrap items-start justify-between gap-4"><h2 className="min-w-0 flex-1 font-serif text-2xl font-medium leading-snug text-white sm:text-3xl">{page.content.question || page.content.title}</h2>{book?.id && openApplication && isCodingBookPage(page.content) && <button onClick={() => void openCodingExercise()} disabled={openingExercise} className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#007acc] px-3 text-xs font-bold text-white transition hover:bg-[#1591dc] disabled:cursor-wait disabled:opacity-60" title="Create a starter workspace for this exercise"><Code2 className="size-4" />{openingExercise ? "Creating…" : "Solve in VS Code"}</button>}</div>{page.content.answer && <div className="mt-6 flex items-center gap-3"><span className="h-px w-8 bg-[#63e6be]" /><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#63e6be]">Teacher&apos;s answer</p></div>}<div className="mt-4 space-y-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8">{(page.content.answer || page.content.body || "").split("\n").map((paragraph, index) => <p key={index} className={focusRequest && index === 0 ? "rounded bg-[#ffd666]/10 px-2 py-1 text-white" : ""}>{paragraph}</p>)}</div></div></div>
        )}
        </div>
      </div>

      <div className="flex min-h-12 items-center justify-between border-t border-white/10 bg-[#17191c] px-3 text-xs text-white/40">
        <button aria-label="Previous page" title="Previous page" onClick={() => setCurrentPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} className="flex size-8 items-center justify-center rounded-md border border-transparent hover:border-white/10 hover:bg-white/5 disabled:opacity-25"><ChevronLeftIcon className="size-4" /></button>
        <span className="flex min-w-28 items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em]">{page?.type === "image" && <ImageIcon className="size-3.5" />} Page {currentPage + 1} / {totalPages}</span>
        <button aria-label="Next page" title="Next page" onClick={() => setCurrentPage((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPage >= totalPages - 1} className="flex size-8 items-center justify-center rounded-md border border-transparent hover:border-white/10 hover:bg-white/5 disabled:opacity-25"><ChevronRightIcon className="size-4" /></button>
      </div>
    </div>
  )
}
