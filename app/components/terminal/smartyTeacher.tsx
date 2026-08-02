"use client"

import { useEffect, useState } from "react"
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react"

import SmartyAIAgent from "@/components/SmartyAIAgent"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { EDUCATION_BOARDS, STANDARDS, SUBJECTS, type LessonContext } from "@/modules/teaching/lesson.schema"

const fieldClass = "h-11 w-full rounded-xl border border-white/10 bg-[#292a31] px-3 text-sm text-white outline-none transition focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/15"

export default function SmartyTeacherWrapper() {
  const [name, setName] = useState("")
  const [context, setContext] = useState<LessonContext>({ subject: "Physics", topic: "", standard: undefined, board: "NCERT/CBSE", book: "", chapter: "", language: "English", difficulty: "Intermediate", interests: [] })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    void Promise.all([
      getCurrentUser(),
      fetch("/api/profile", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
    ]).then(([user, profileResponse]) => {
      if (user?.name) setName(user.name)
      const education = profileResponse?.data?.education
      const professional = profileResponse?.data?.professional
      setContext((current) => ({
        ...current,
        standard: STANDARDS.includes(education?.standard) ? education.standard : current.standard,
        board: EDUCATION_BOARDS.includes(education?.board) ? education.board : current.board,
        language: education?.preferredLanguage || current.language,
        difficulty: ["Beginner", "Intermediate", "Advanced"].includes(education?.difficulty) ? education.difficulty : current.difficulty,
        interests: education?.interests || professional?.skills?.slice(0, 10) || [],
      }))
    })
  }, [])

  const update = <K extends keyof LessonContext>(key: K, value: LessonContext[K]) => setContext((current) => ({ ...current, [key]: value }))

  if (submitted) return <SmartyAIAgent userName={name || "Student"} context={context} onContextChange={setContext} autoStart />

  return (
    <div className="flex min-h-full w-full bg-[radial-gradient(circle_at_15%_10%,rgba(88,86,214,.22),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(10,132,255,.2),transparent_30%),linear-gradient(145deg,#101116,#1c1d25)] text-white">
      <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }} className="grid w-full gap-5 p-3 sm:p-5 lg:grid-cols-[.72fr_1.28fr] lg:p-6">
        <section className="flex flex-col justify-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] shadow-[0_12px_30px_rgba(10,132,255,.35)]"><GraduationCap className="size-8" /></div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#64d2ff]"><Sparkles className="size-4" /> Personal AI tutor</div>
          <h1 className="text-4xl font-semibold tracking-[-.04em]">Build your lesson</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">Choose a subject, then add a chapter or topic. Profile defaults are filled automatically and always remain editable.</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.05] p-4 text-xs leading-5 text-white/45">For NCERT lessons, Smarty can resolve verified official chapter PDFs and show the relevant page without sending the whole book to AI.</p>
        </section>

        <section className="self-center rounded-[24px] border border-white/15 bg-black/20 p-4 shadow-2xl sm:p-5">
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
          <button type="submit" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a84ff] text-sm font-semibold shadow-[0_8px_24px_rgba(10,132,255,.3)] transition hover:bg-[#2997ff] active:scale-[.98]">Start teaching <ArrowRight className="size-4" /></button>
        </section>
      </form>
    </div>
  )
}
