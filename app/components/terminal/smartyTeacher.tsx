"use client"

import { useEffect, useState } from "react"
import { ArrowRight, BookMarked, BrainCircuit, GraduationCap, Languages, Sparkles } from "lucide-react"

import SmartyAIAgent from "@/components/SmartyAIAgent"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { getSessionBySessionId } from "@/lib/actions/general.action"
import { loadTodayLearningContext } from "@/lib/teaching/todayNotes"
import { EDUCATION_BOARDS, STANDARDS, SUBJECTS, type LessonContext } from "@/modules/teaching/lesson.schema"

const fieldClass = "h-11 w-full rounded-md border border-white/10 bg-[#202126] px-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,.04)] outline-none transition hover:border-white/20 focus:border-[#63e6be] focus:ring-4 focus:ring-[#63e6be]/10"

export default function SmartyTeacherWrapper({ sessionId, initialTopic }: { sessionId?: string; initialTopic?: string }) {
  const [name, setName] = useState("")
  const [context, setContext] = useState<LessonContext>({ subject: "Physics", topic: "", standard: undefined, board: "NCERT/CBSE", book: "", chapter: "", language: "English", difficulty: "Intermediate", interests: [] })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    void Promise.all([
      getCurrentUser(),
      fetch("/api/profile", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
      sessionId ? getSessionBySessionId(sessionId) : Promise.resolve(null),
      loadTodayLearningContext(),
    ]).then(([user, profileResponse, teachingSession, todayNotes]) => {
      if (user?.name) setName(user.name)
      const education = profileResponse?.data?.education
      const professional = profileResponse?.data?.professional
      const sessionSubject = typeof teachingSession?.subject === "string" && SUBJECTS.includes(teachingSession.subject as LessonContext["subject"])
        ? teachingSession.subject as LessonContext["subject"]
        : undefined
      const sessionTopic = typeof teachingSession?.topic === "string" ? teachingSession.topic : undefined
      setContext((current) => ({
        ...current,
        subject: sessionSubject || current.subject,
        topic: sessionTopic || initialTopic || todayNotes?.topic || current.topic,
        standard: STANDARDS.includes(education?.standard) ? education.standard : current.standard,
        board: EDUCATION_BOARDS.includes(education?.board) ? education.board : current.board,
        language: education?.preferredLanguage || current.language,
        difficulty: teachingSession?.difficulty || (["Beginner", "Intermediate", "Advanced"].includes(education?.difficulty) ? education.difficulty : current.difficulty),
        interests: education?.interests || professional?.skills?.slice(0, 10) || [],
        sourceMaterial: todayNotes?.sourceMaterial || current.sourceMaterial,
      }))
      if (teachingSession || initialTopic || todayNotes) setSubmitted(true)
    })
  }, [initialTopic, sessionId])

  const update = <K extends keyof LessonContext>(key: K, value: LessonContext[K]) => setContext((current) => ({ ...current, [key]: value }))

  if (submitted) return <SmartyAIAgent userName={name || "Student"} context={context} onContextChange={setContext} sessionId={sessionId} autoStart />

  return (
    <div className="relative flex min-h-full w-full overflow-hidden bg-[#111315] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(99,230,190,.09),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(255,214,102,.09),transparent_28%)]" />
      <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }} className="relative grid w-full gap-6 p-4 sm:p-6 lg:grid-cols-[.68fr_1.32fr] lg:gap-8 lg:p-8">
        <section className="flex flex-col justify-between border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md border border-[#63e6be]/25 bg-[#63e6be]/10 shadow-[0_14px_36px_rgba(0,0,0,.35)]"><GraduationCap className="size-7 text-[#63e6be]" /></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ffd666]">Smarty Academy</p><p className="mt-1 text-sm text-white/45">Private learning studio</p></div>
            </div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#63e6be]"><Sparkles className="size-4" /> Personal AI tutor</div>
            <h1 className="max-w-md font-serif text-4xl font-medium leading-[1.05] sm:text-5xl">Design your next lesson.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/55">Choose a subject, then add a chapter or topic. Profile defaults are filled automatically and always remain editable.</p>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-white/10 bg-white/[.035] p-3"><BookMarked className="size-4 text-[#ffd666]" /><p className="mt-3 text-[11px] font-medium">Verified text</p></div>
            <div className="rounded-md border border-white/10 bg-white/[.035] p-3"><BrainCircuit className="size-4 text-[#63e6be]" /><p className="mt-3 text-[11px] font-medium">Adaptive pace</p></div>
            <div className="rounded-md border border-white/10 bg-white/[.035] p-3"><Languages className="size-4 text-[#70b7ff]" /><p className="mt-3 text-[11px] font-medium">Your language</p></div>
          </div>
        </section>

        <section className="self-center rounded-lg border border-white/15 bg-[#181a1e]/95 p-4 shadow-[0_28px_70px_rgba(0,0,0,.42)] sm:p-6">
          <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Lesson profile</p><h2 className="mt-1 text-xl font-semibold">Session details</h2></div><span className="rounded-full border border-[#63e6be]/20 bg-[#63e6be]/10 px-2.5 py-1 text-[10px] font-semibold text-[#8af0d1]">READY</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-white/55">Subject <span className="text-[#ff6961]">*</span><select required value={context.subject} onChange={(event) => update("subject", event.target.value as LessonContext["subject"])} className={`${fieldClass} mt-2`}>{SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
            <label className="text-xs text-white/55 sm:col-span-2">Topic or chapter <span className="text-white/30">(optional)</span><input value={context.topic} onChange={(event) => update("topic", event.target.value)} placeholder="e.g. Laws of Motion" className={`${fieldClass} mt-2`} /></label>
            <label className="text-xs text-white/55">Standard/class<select value={context.standard || ""} onChange={(event) => update("standard", (event.target.value || undefined) as LessonContext["standard"])} className={`${fieldClass} mt-2`}><option value="">Not specified</option>{STANDARDS.map((standard) => <option key={standard}>{standard}</option>)}</select></label>
            <label className="text-xs text-white/55">Education board<select value={context.board || ""} onChange={(event) => update("board", (event.target.value || undefined) as LessonContext["board"])} className={`${fieldClass} mt-2`}><option value="">Not specified</option>{EDUCATION_BOARDS.map((board) => <option key={board}>{board}</option>)}</select></label>
            <label className="text-xs text-white/55">Chapter number<input value={context.chapter} onChange={(event) => update("chapter", event.target.value.replace(/[^0-9.]/g, ""))} inputMode="numeric" placeholder="e.g. 4" className={`${fieldClass} mt-2`} /></label>
            <label className="text-xs text-white/55 sm:col-span-2">Book name<input value={context.book} onChange={(event) => update("book", event.target.value)} placeholder="Optional textbook name" className={`${fieldClass} mt-2`} /></label>
            <label className="text-xs text-white/55">Preferred language<input value={context.language} onChange={(event) => update("language", event.target.value)} className={`${fieldClass} mt-2`} /></label>
            <label className="text-xs text-white/55">Difficulty<select value={context.difficulty} onChange={(event) => update("difficulty", event.target.value as LessonContext["difficulty"])} className={`${fieldClass} mt-2`}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label className="text-xs text-white/55 sm:col-span-2">Student name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className={`${fieldClass} mt-2`} /></label>
          </div>
          <button type="submit" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#63e6be] text-sm font-bold text-[#0d1c18] shadow-[0_10px_28px_rgba(99,230,190,.18)] transition hover:bg-[#8af0d1] active:scale-[.99]">Enter lesson studio <ArrowRight className="size-4" /></button>
        </section>
      </form>
    </div>
  )
}
