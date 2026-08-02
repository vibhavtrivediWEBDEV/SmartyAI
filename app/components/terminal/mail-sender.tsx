"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  Inbox,
  Loader2,
  Mail,
  PenLine,
  Save,
  Send,
  Sparkles,
  Trash2,
  WandSparkles,
  XCircle,
} from "lucide-react"
import { useSettings } from "@/app/context/settingContext"

type Tone = "professional" | "friendly" | "concise" | "persuasive" | "warm"
type Template = "smart" | "introduction" | "follow-up" | "meeting" | "thank-you" | "proposal"
type GenerateAction = "write" | "improve" | "shorten" | "expand"
type Tab = "compose" | "history" | "templates"

type MailRecord = {
  id: string
  to: string
  subject: string
  body: string
  senderName: string
  status: "sent" | "draft"
  createdAt: string
}

type Quota = { used: number; limit: number; remaining: number; resetAt: string }

const HISTORY_KEY = "smarty-mail-history-v1"
const DRAFT_KEY = "smarty-mail-current-draft-v1"

const templates: Array<{ id: Template; title: string; description: string; accent: string }> = [
  { id: "smart", title: "Smart draft", description: "AI chooses the best structure", accent: "from-violet-500 to-fuchsia-500" },
  { id: "introduction", title: "Introduction", description: "A polished first connection", accent: "from-cyan-500 to-blue-500" },
  { id: "follow-up", title: "Follow-up", description: "Continue a conversation naturally", accent: "from-emerald-500 to-teal-500" },
  { id: "meeting", title: "Meeting", description: "Request or recap a meeting", accent: "from-orange-500 to-amber-500" },
  { id: "thank-you", title: "Thank you", description: "Show thoughtful appreciation", accent: "from-pink-500 to-rose-500" },
  { id: "proposal", title: "Proposal", description: "Present an idea persuasively", accent: "from-indigo-500 to-violet-500" },
]

function readStoredHistory(): MailRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function MailSender() {
  const { settings } = useSettings()
  const [tab, setTab] = useState<Tab>("compose")
  const [to, setTo] = useState("")
  const [senderName, setSenderName] = useState("Vibhav Trivedi")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [tone, setTone] = useState<Tone>("professional")
  const [template, setTemplate] = useState<Template>("smart")
  const [history, setHistory] = useState<MailRecord[]>([])
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 100, remaining: 100, resetAt: "" })
  const [status, setStatus] = useState<"idle" | "generating" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const subjectRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistory(readStoredHistory())
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")
      if (draft) {
        setTo(draft.to || "")
        setSenderName(draft.senderName || "Vibhav Trivedi")
        setSubject(draft.subject || "")
        setBody(draft.body || "")
        setTone(draft.tone || "professional")
        setTemplate(draft.template || "smart")
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
    setHydrated(true)
    fetch("/api/sendmail")
      .then((response) => response.json())
      .then((data) => data.quota && setQuota(data.quota))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ to, senderName, subject, body, tone, template }))
  }, [to, senderName, subject, body, tone, template, hydrated])

  const words = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body])
  const selectedTemplate = templates.find((item) => item.id === template) || templates[0]

  const persistHistory = (records: MailRecord[]) => {
    const limited = records.slice(0, 100)
    setHistory(limited)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited))
  }

  const generate = async (action: GenerateAction = "write") => {
    if (subject.trim().length < 2) {
      setStatus("error")
      setMessage("Add a subject so AI knows what to write.")
      subjectRef.current?.focus()
      return
    }

    setStatus("generating")
    setMessage(action === "write" ? "AI is writing your email…" : `AI is applying “${action}”…`)
    try {
      const response = await fetch("/api/sendmail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          recipient: to,
          senderName,
          tone,
          template,
          currentBody: action === "write" ? "" : body,
          action,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "AI generation failed.")
      setBody(data.content)
      setStatus("idle")
      setMessage("Draft ready — edit anything before sending.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "AI generation failed.")
    }
  }

  const saveDraft = () => {
    if (!subject.trim() && !body.trim()) {
      setStatus("error")
      setMessage("There is nothing to save yet.")
      return
    }
    const record: MailRecord = {
      id: crypto.randomUUID(), to, subject, body, senderName, status: "draft", createdAt: new Date().toISOString(),
    }
    persistHistory([record, ...history])
    setStatus("idle")
    setMessage("Draft saved to history.")
  }

  const sendMail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim() || !senderName.trim()) {
      setStatus("error")
      setMessage("Recipient, sender name, subject, and message are required.")
      return
    }
    if (quota.remaining <= 0) {
      setStatus("error")
      setMessage("The daily limit of 100 emails has been reached.")
      return
    }

    setStatus("sending")
    setMessage("Sending securely…")
    try {
      const response = await fetch("/api/sendmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, senderName }),
      })
      const data = await response.json()
      if (data.quota) setQuota(data.quota)
      if (!response.ok || !data.success) throw new Error(data.error || "Email could not be sent.")

      const record: MailRecord = {
        id: data.messageId || crypto.randomUUID(), to, subject, body, senderName, status: "sent", createdAt: new Date().toISOString(),
      }
      persistHistory([record, ...history])
      setStatus("sent")
      setMessage(`Sent successfully to ${to}.`)
      setTo("")
      setSubject("")
      setBody("")
      setTemplate("smart")
      localStorage.removeItem(DRAFT_KEY)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Email could not be sent.")
    }
  }

  const openRecord = (record: MailRecord) => {
    setTo(record.to)
    setSubject(record.subject)
    setBody(record.body)
    setSenderName(record.senderName)
    setTab("compose")
    setStatus("idle")
    setMessage(record.status === "sent" ? "Loaded a copy of the sent email." : "Draft loaded.")
  }

  const chooseTemplate = (id: Template) => {
    setTemplate(id)
    setTab("compose")
    setStatus("idle")
    setMessage(`${templates.find((item) => item.id === id)?.title} template selected.`)
    subjectRef.current?.focus()
  }

  const newMessage = () => {
    setTo("")
    setSubject("")
    setBody("")
    setTemplate("smart")
    setTab("compose")
    setStatus("idle")
    setMessage("")
    localStorage.removeItem(DRAFT_KEY)
    subjectRef.current?.focus()
  }

  return (
    <div className="smarty-mail flex h-full min-h-[520px] overflow-hidden" style={{ background: "var(--macos-bg)", color: "var(--macos-text)" }} data-theme={settings.darkMode ? "dark" : "light"}>
      <aside className="mail-sidebar hidden w-48 shrink-0 flex-col border-r border-white/10 bg-[#0d111b] p-3 sm:flex">
        <div className="mb-4 flex items-center gap-2 px-2 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
            <Mail className="h-4 w-4" />
          </div>
          <div><p className="text-sm font-bold">Smarty Mail</p><p className="text-[10px] text-slate-500">AI mail studio</p></div>
        </div>
        <button onClick={newMessage} className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-violet-100">
          <PenLine className="h-3.5 w-3.5" /> New message
        </button>
        <nav className="space-y-1">
          {([
            ["compose", PenLine, "Compose"],
            ["history", Inbox, "History"],
            ["templates", FileText, "Templates"],
          ] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${tab === id ? "bg-violet-500/15 text-violet-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
              {id === "history" && history.length > 0 && <span className="ml-auto text-[10px]">{history.length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-[10px]"><span className="text-slate-500">Daily usage</span><span>{quota.used}/{quota.limit}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }} /></div>
          <p className="mt-2 text-[10px] text-slate-500">{quota.remaining} sends remaining</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="mail-header sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#080b12]/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {tab !== "compose" && <button onClick={() => setTab("compose")} className="rounded-lg p-1.5 hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>}
            <div><h2 className="text-sm font-semibold">{tab === "compose" ? "New message" : tab === "history" ? "Mail history" : "AI templates"}</h2><p className="text-[10px] text-slate-500">Securely sent from your configured account</p></div>
          </div>
          <div className="flex items-center gap-1.5 sm:hidden">
            <button onClick={() => setTab("history")} className="rounded-lg p-2 text-slate-400 hover:bg-white/10"><Archive className="h-4 w-4" /></button>
            <button onClick={() => setTab("templates")} className="rounded-lg p-2 text-slate-400 hover:bg-white/10"><Sparkles className="h-4 w-4" /></button>
          </div>
        </header>

        {tab === "compose" && (
          <div className="mx-auto max-w-4xl p-4">
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Send to</span><input type="email" value={to} onChange={(event) => setTo(event.target.value)} placeholder="recipient@example.com" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none transition placeholder:text-slate-600 focus:border-violet-500/70 focus:bg-violet-500/5" /></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Send as</span><input value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none transition placeholder:text-slate-600 focus:border-violet-500/70" /></label>
            </div>

            <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Subject — tell AI what this email should achieve</span><div className="flex rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-violet-500/70"><input ref={subjectRef} value={subject} onChange={(event) => setSubject(event.target.value)} onKeyDown={(event) => event.key === "Enter" && generate()} placeholder="e.g. Follow up after our product meeting" maxLength={200} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-xs outline-none placeholder:text-slate-600" /><button onClick={() => generate()} disabled={status === "generating"} className="m-1 flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 text-[11px] font-semibold transition hover:bg-violet-400 disabled:opacity-50">{status === "generating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />} Write with AI</button></div></label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={tone} onChange={(event) => setTone(event.target.value as Tone)} className="rounded-lg border border-white/10 bg-[#111722] px-2.5 py-2 text-[11px] outline-none focus:border-violet-500"><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="concise">Concise</option><option value="persuasive">Persuasive</option><option value="warm">Warm</option></select>
              <button onClick={() => setTab("templates")} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[11px] text-slate-300 hover:bg-white/5"><span className={`h-2 w-2 rounded-full bg-gradient-to-r ${selectedTemplate.accent}`} />{selectedTemplate.title}</button>
              {body && <div className="ml-auto flex gap-1">{(["improve", "shorten", "expand"] as GenerateAction[]).map((action) => <button key={action} onClick={() => generate(action)} disabled={status === "generating"} className="rounded-lg px-2 py-1.5 text-[10px] capitalize text-violet-300 hover:bg-violet-500/10 disabled:opacity-40">{action}</button>)}</div>}
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] focus-within:border-violet-500/50">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><div className="flex items-center gap-2 text-[10px] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-violet-400" /> AI draft · fully editable</div><span className="text-[10px] text-slate-600">{words} words</span></div>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add a subject and let AI write the complete email, or start typing here…" className="min-h-48 w-full resize-y bg-transparent p-4 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600" />
            </div>

            {message && <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${status === "error" ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : status === "sent" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-violet-500/20 bg-violet-500/10 text-violet-200"}`}>{status === "error" ? <XCircle className="h-3.5 w-3.5" /> : status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === "generating" || status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{message}</div>}

            <div className="mt-4 flex items-center justify-between gap-3"><button onClick={saveDraft} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-slate-300 transition hover:bg-white/5"><Save className="h-3.5 w-3.5" /> Save draft</button><button onClick={sendMail} disabled={status === "sending" || status === "generating" || quota.remaining <= 0} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-2.5 text-xs font-bold shadow-lg shadow-violet-600/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send email <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9px]">{quota.remaining} left</span></button></div>
          </div>
        )}

        {tab === "templates" && <div className="grid gap-3 p-4 sm:grid-cols-2">{templates.map((item) => <button key={item.id} onClick={() => chooseTemplate(item.id)} className={`group rounded-2xl border p-4 text-left transition ${template === item.id ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"}`}><div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${item.accent}`}><FileText className="h-4 w-4" /></div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-[11px] text-slate-500">{item.description}</p><p className="mt-4 flex items-center gap-1 text-[10px] text-violet-300 opacity-0 transition group-hover:opacity-100"><WandSparkles className="h-3 w-3" /> Use template</p></button>)}</div>}

        {tab === "history" && <div className="p-4">{history.length === 0 ? <div className="grid min-h-72 place-items-center text-center"><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5"><Clock3 className="h-5 w-5 text-slate-500" /></div><p className="text-sm font-medium">No mail history yet</p><p className="mt-1 text-[11px] text-slate-500">Sent emails and saved drafts appear here.</p></div></div> : <div className="space-y-2">{history.map((record) => <div key={record.id} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 transition hover:bg-white/[0.05]"><button onClick={() => openRecord(record)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] ${record.status === "sent" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{record.status}</span><span className="truncate text-xs font-medium">{record.subject || "Untitled"}</span></div><p className="mt-1 truncate text-[10px] text-slate-500">{record.to || "No recipient"} · {new Date(record.createdAt).toLocaleString()}</p></button><button onClick={() => persistHistory(history.filter((item) => item.id !== record.id))} aria-label="Delete history item" className="rounded-lg p-2 text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</div>}
      </main>
      <style jsx global>{`
        .smarty-mail .mail-sidebar,.smarty-mail .mail-header{background:color-mix(in srgb,var(--macos-surface) 88%,transparent)!important;border-color:var(--macos-border)!important;backdrop-filter:blur(var(--macos-blur))}
        .smarty-mail [class*="border-white"]{border-color:var(--macos-border)!important}
        .smarty-mail [class*="bg-white/"]{background-color:color-mix(in srgb,var(--macos-surface-raised) 55%,transparent)!important}
        .smarty-mail select{background:var(--macos-surface-raised)!important;color:var(--macos-text)}
        .smarty-mail textarea,.smarty-mail input{color:var(--macos-text)}
        .smarty-mail .bg-violet-500,.smarty-mail .bg-violet-600,.smarty-mail .bg-gradient-to-r,.smarty-mail .bg-gradient-to-br{background:var(--theme-primary-color)!important}
        .smarty-mail .text-violet-200,.smarty-mail .text-violet-300,.smarty-mail .text-violet-400{color:var(--theme-primary-color)!important}
        .smarty-mail .border-violet-500\/60,.smarty-mail .focus-within\:border-violet-500\/70:focus-within{border-color:var(--theme-primary-color)!important}
        .smarty-mail .bg-violet-500\/10,.smarty-mail .bg-violet-500\/15{background:var(--theme-primary-soft)!important}
        .smarty-mail[data-theme="light"] [class*="text-slate-"]{color:var(--macos-secondary)!important}
        .smarty-mail[data-theme="light"] .text-white{color:var(--macos-text)!important}
        .smarty-mail *{transition-duration:var(--macos-motion)}
      `}</style>
    </div>
  )
}
