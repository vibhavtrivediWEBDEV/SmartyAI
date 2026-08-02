"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Braces, Download, FileText, Loader2, RefreshCcw, Save, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"
import type { ResumeProfile } from "./ResumeProfilePanel"
import { ATSLaTeXPreview } from "./ATSLaTeXPreview"
import { ATSOverview } from "./ATSOverview"
import { ATSRichEditor, type ATSEditorSection } from "./ATSRichEditor"
import { generateResumePDF, resumeFileName } from "@/lib/ats/pdf"
import { generateLaTeXResume, latexFileName, LATEX_TEMPLATES, type LaTeXTemplateId } from "@/lib/ats/latex"
import { generatedResumeDiagnostic, readinessDisplayScore, scoreResume } from "@/lib/ats/scoring"
import { EMPTY_PDF_DIAGNOSTIC, type ATSResume, type PDFDiagnostic } from "@/lib/ats/types"
import { useSettings } from "@/app/context/settingContext"

const LOCAL_KEY = "smarty-ats-resume-draft-v1"
const emptyResume: ATSResume = { name: "", email: "", phone: "", location: "", headline: "", summary: "", skills: [], experience: [], companies: [], education: [], projects: [], achievements: [], certifications: [], languages: [], socialLinks: [], externalLinks: [] }
const fromProfile = (profile: NonNullable<ResumeProfile["profile"]>): ATSResume => ({
  name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", location: profile.location ?? "", headline: profile.headline ?? "", summary: profile.about ?? "",
  skills: profile.skills ?? [], experience: profile.experience ?? [], companies: profile.companies ?? [], education: profile.education ?? [], projects: profile.projects ?? [], achievements: profile.achievements ?? [], certifications: profile.certifications ?? [], languages: profile.languages ?? [], socialLinks: profile.socialLinks ?? [], externalLinks: profile.externalLinks ?? [],
})
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean)

type RewriteTarget = { field: "summary" | "experience" | "achievements"; index?: number; text: string }
type AIRewrite = { suggestedRewrite: string; reason: string; keywordsAddressed: string[]; factsRequiringInput: string[] }

export function ATSResumeBuilder() {
  const { settings } = useSettings()
  const [resume, setResume] = useState<ATSResume>(emptyResume)
  const [extracted, setExtracted] = useState<ATSResume>(emptyResume)
  const [jobDescription, setJobDescription] = useState("")
  const [diagnostic, setDiagnostic] = useState<PDFDiagnostic>(EMPTY_PDF_DIAGNOSTIC)
  const [debounced, setDebounced] = useState({ resume: emptyResume, jobDescription: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [compilingLaTeX, setCompilingLaTeX] = useState(false)
  const [view, setView] = useState<"overview" | "editor" | "tools">("overview")
  const [editorSection, setEditorSection] = useState<ATSEditorSection>("personal")
  const [template, setTemplate] = useState<LaTeXTemplateId>("classic")
  const [tab, setTab] = useState<"original" | "preview" | "latex">("preview")
  const [rewriteTarget, setRewriteTarget] = useState<RewriteTarget | null>(null)
  const [rewrite, setRewrite] = useState<AIRewrite | null>(null)
  const [rewriting, setRewriting] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)

  useEffect(() => {
    let active = true
    const localSnapshot = localStorage.getItem(LOCAL_KEY)
    Promise.all([
      fetch("/api/profile/resume").then(async (response) => response.ok ? response.json() : Promise.reject(new Error((await response.json()).error ?? "Resume could not be loaded"))),
      fetch("/api/profile/resume/ats/draft").then((response) => response.ok ? response.json() : { atsDraft: null }),
      fetch("/api/profile/resume/ats/analyze").then((response) => response.ok ? response.json() : { diagnostic: EMPTY_PDF_DIAGNOSTIC }),
    ]).then(([resumeBody, draftBody, analysisBody]) => {
      if (!active) return
      const source = resumeBody.resume?.profile ? fromProfile(resumeBody.resume.profile) : emptyResume
      setExtracted(source)
      let local: { draft?: ATSResume; jobDescription?: string; template?: LaTeXTemplateId } | null = null
      try { local = JSON.parse(localSnapshot ?? "null") } catch { local = null }
      const saved = draftBody.atsDraft ?? local
      setResume(saved?.draft ?? source)
      setJobDescription(saved?.jobDescription ?? "")
      const savedTemplate = draftBody.atsDraft?.selectedTemplate ?? local?.template
      if (savedTemplate && LATEX_TEMPLATES.some((item) => item.id === savedTemplate)) setTemplate(savedTemplate)
      setDiagnostic(analysisBody.diagnostic ?? EMPTY_PDF_DIAGNOSTIC)
    }).catch((error) => toast.error(error instanceof Error ? error.message : "ATS could not load")).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (loading) return
    const timer = window.setTimeout(() => setDebounced({ resume, jobDescription }), 400)
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ draft: resume, jobDescription, template }))
    return () => window.clearTimeout(timer)
  }, [resume, jobDescription, template, loading])

  const result = useMemo(() => { const score = scoreResume(debounced.resume, debounced.jobDescription, generatedResumeDiagnostic(debounced.resume)); return { ...score, total: readinessDisplayScore(score, debounced.jobDescription) } }, [debounced])
  const sourceResult = useMemo(() => { const score = scoreResume(extracted, debounced.jobDescription, diagnostic); return { ...score, total: readinessDisplayScore(score, debounced.jobDescription) } }, [extracted, debounced.jobDescription, diagnostic])
  const latexSource = useMemo(() => generateLaTeXResume(resume, template), [resume, template])
  const rewriteImpact = useMemo(() => {
    if (!rewriteTarget || !rewrite) return null
    let next = resume
    if (rewriteTarget.field === "summary") next = { ...resume, summary: rewrite.suggestedRewrite }
    else {
      const field = rewriteTarget.field
      next = { ...resume, [field]: resume[field].map((item, index) => index === rewriteTarget.index ? rewrite.suggestedRewrite : item) }
    }
    const beforeScore = scoreResume(resume, jobDescription, generatedResumeDiagnostic(resume))
    const afterScore = scoreResume(next, jobDescription, generatedResumeDiagnostic(next))
    const before = readinessDisplayScore(beforeScore, jobDescription)
    const after = readinessDisplayScore(afterScore, jobDescription)
    return { before, after, delta: after - before }
  }, [jobDescription, resume, rewrite, rewriteTarget])
  const setField = useCallback(<K extends keyof ATSResume>(field: K, value: ATSResume[K]) => setResume((current) => ({ ...current, [field]: value })), [])
  const recheckJobDescription = () => {
    setDebounced({ resume, jobDescription })
    setLastCheckedAt(new Date())
    toast.success(jobDescription.trim() ? "Job-description alignment recalculated" : "General readiness recalculated")
  }
  const openEditor = (field?: string) => {
    if (field === "keywords") { setView("tools"); return }
    const mapping: Record<string, ATSEditorSection> = { parseability: "personal", sections: "summary", evidence: "achievements", socialLinks: "links", externalLinks: "links" }
    const candidate = mapping[field ?? ""] ?? field
    if (["personal", "links", "summary", "experience", "education", "skills", "projects", "achievements", "certifications", "languages"].includes(candidate ?? "")) setEditorSection(candidate as ATSEditorSection)
    setView("editor")
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/profile/resume/ats/draft", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: resume, jobDescription, latestScores: result.categories, sourceResumeExtractionVersion: 3, selectedTemplate: template }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Draft could not be saved")
      toast.success("ATS draft saved")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Draft could not be saved") } finally { setSaving(false) }
  }
  const download = () => {
    const blob = generateResumePDF(resume)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = resumeFileName(resume.name); anchor.click(); URL.revokeObjectURL(url)
  }
  const downloadLaTeX = () => {
    const url = URL.createObjectURL(new Blob([latexSource], { type: "application/x-tex;charset=utf-8" }))
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = latexFileName(resume.name); anchor.click(); URL.revokeObjectURL(url)
  }
  const compileLaTeX = async () => {
    setCompilingLaTeX(true)
    try {
      const response = await fetch("/api/profile/resume/ats/latex", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume, template }) })
      if (!response.ok) { const body = await response.json(); throw new Error(body.error ?? "LaTeX compilation failed") }
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = latexFileName(resume.name).replace(/\.tex$/, ".pdf"); anchor.click(); URL.revokeObjectURL(url)
      toast.success("LaTeX PDF compiled")
    } catch (error) { toast.error(error instanceof Error ? error.message : "LaTeX compilation failed") } finally { setCompilingLaTeX(false) }
  }
  const replaceAccountResume = async () => {
    setReplacing(true)
    try {
      const blob = generateResumePDF(resume)
      const form = new FormData(); form.append("resume", new File([blob], resumeFileName(resume.name), { type: "application/pdf" }))
      const response = await fetch("/api/profile/resume", { method: "POST", body: form }); const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Resume replacement failed")
      const refreshed = fromProfile(body.resume.profile); setExtracted(refreshed); setResume(refreshed)
      const analysisResponse = await fetch("/api/profile/resume/ats/analyze")
      if (analysisResponse.ok) setDiagnostic((await analysisResponse.json()).diagnostic ?? EMPTY_PDF_DIAGNOSTIC)
      window.dispatchEvent(new Event("finder-desktop-change")); toast.success("Account resume replaced and Finder refreshed")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Resume replacement failed") } finally { setReplacing(false) }
  }
  const requestRewrite = async (target: RewriteTarget) => {
    setRewriteTarget(target); setRewrite(null); setRewriting(true)
    try {
      const response = await fetch("/api/profile/resume/ats/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedText: target.text, jobDescription }) })
      const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Suggestion failed"); setRewrite(body.suggestion)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Suggestion failed"); setRewriteTarget(null) } finally { setRewriting(false) }
  }
  const acceptRewrite = () => {
    if (!rewriteTarget || !rewrite) return
    if (rewriteImpact && rewriteImpact.delta < 0) {
      toast.error("This rewrite would lower the readiness estimate and was not applied.")
      return
    }
    if (rewriteTarget.field === "summary") setField("summary", rewrite.suggestedRewrite)
    else {
      const field = rewriteTarget.field
      setResume((current) => ({ ...current, [field]: current[field].map((item, index) => index === rewriteTarget.index ? rewrite.suggestedRewrite : item) }))
    }
    setRewriteTarget(null); setRewrite(null)
    if (rewriteImpact?.delta && rewriteImpact.delta > 0) toast.success(`Suggestion accepted · +${rewriteImpact.delta} points`)
    else toast.success("Suggestion accepted · readiness estimate unchanged")
  }

  if (loading) return <div className="grid h-full place-items-center text-sm" style={{ background: "var(--macos-bg)", color: "var(--macos-secondary)" }}><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading resume and PDF diagnostics…</div>
  return (
    <div className="ats-app flex h-full min-h-0 flex-col" data-theme={settings.darkMode ? "dark" : "light"} style={{ background: "var(--macos-bg)", color: "var(--macos-text)" }}>
      <header className="ats-header flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-[#27272a]/95 px-3 backdrop-blur-xl">
        <div className="mr-auto flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600"><FileText className="h-4 w-4" /></div><div><h1 className="text-sm font-semibold">ATS Resume Builder</h1><p className="text-[10px] text-white/45">Private structured draft · single-column PDF</p></div></div>
        <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5"><button onClick={() => setView("overview")} className={`rounded-md px-3 py-1.5 text-[11px] ${view === "overview" ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"}`}>Overview</button><button onClick={() => setView("editor")} className={`rounded-md px-3 py-1.5 text-[11px] ${view === "editor" ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"}`}>Edit Resume</button><button onClick={() => setView("tools")} className={`rounded-md px-3 py-1.5 text-[11px] ${view === "tools" ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"}`}>Analysis & Tools</button></div>
        <button onClick={() => { setResume(extracted); toast.success("Reset to extracted resume") }} className="toolbar-btn"><RefreshCcw className="h-3.5 w-3.5" />Reset</button>
        <button onClick={() => void saveDraft()} disabled={saving} className="toolbar-btn"><Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save draft"}</button>
        <button onClick={download} className="toolbar-btn"><Download className="h-3.5 w-3.5" />Download PDF</button>
        <button onClick={downloadLaTeX} className="toolbar-btn"><Braces className="h-3.5 w-3.5" />Download .tex</button>
        <button onClick={() => void compileLaTeX()} disabled={compilingLaTeX} className="toolbar-btn">{compilingLaTeX ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{compilingLaTeX ? "Compiling…" : "LaTeX PDF"}</button>
        <button onClick={() => void replaceAccountResume()} disabled={replacing} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium hover:bg-blue-500 disabled:opacity-50"><Upload className="h-3.5 w-3.5" />{replacing ? "Extracting…" : "Replace account resume"}</button>
      </header>

      {view === "overview" ? <ATSOverview resume={resume} score={result} sourceScore={sourceResult} template={template} hasJobDescription={Boolean(jobDescription.trim())} onEdit={openEditor} /> : view === "editor" ? <ATSRichEditor key={editorSection} resume={resume} template={template} initialSection={editorSection} onTemplateChange={setTemplate} onChange={setResume} onImprove={(field, text, index) => void requestRewrite({ field, text, index })} onDone={() => setView("overview")} /> : <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto xl:grid-cols-[280px_minmax(430px,1fr)_minmax(360px,0.9fr)] xl:overflow-hidden">
        <aside className="space-y-4 overflow-y-auto border-r border-white/10 bg-black/20 p-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3"><div className="flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-widest text-white/45">{jobDescription.trim() ? "ATS readiness estimate" : "General readiness estimate"}</p><p className="text-4xl font-semibold tabular-nums">{result.total}<span className="text-base text-white/35">/100</span></p></div><div className={`h-3 w-3 rounded-full ${result.total >= 75 ? "bg-emerald-400" : result.total >= 50 ? "bg-amber-400" : "bg-rose-400"}`} /></div>
            <p className="mt-3 text-[10px] leading-4 text-white/50">This is an ATS readiness estimate based on parseability, structure, evidence, and job-description keyword alignment. Hiring systems use different rules, so this is not a guarantee of ranking or selection.</p></div>
          <div className="grid grid-cols-2 gap-2">{Object.entries(result.categories).map(([key, category]) => <div key={key} className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><p className="text-[10px] capitalize text-white/45">{key}</p><p className="text-lg font-semibold">{category.score}<span className="text-xs text-white/35">/{category.maximum}</span></p></div>)}</div>
          <section><div className="mb-1.5 flex items-center justify-between"><span className="section-label !mb-0">Job description</span><button onClick={recheckJobDescription} className="inline-flex items-center gap-1 rounded-md bg-blue-600/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-500"> <RefreshCcw className="h-3 w-3" />Recheck</button></div><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={8} placeholder="Paste a different target job description…" className="ats-textarea" /><div className="mt-1.5 flex items-center justify-between text-[9px] text-white/35"><span>{result.keywordMatch.matched.length} matched · {result.keywordMatch.missing.length} missing</span><span>{lastCheckedAt ? `Checked ${lastCheckedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Auto-checks after edits"}</span></div></section>
          <KeywordList title="Matched keywords" values={result.keywordMatch.matched} color="emerald" /><KeywordList title="Missing keywords — add only if truthful" values={result.keywordMatch.missing} color="amber" />
          <section><h3 className="section-label">Uploaded PDF diagnostics · {diagnostic.confidence} confidence</h3><p className="text-xs text-white/65">{diagnostic.pages} pages · {diagnostic.textCharacters.toLocaleString()} extractable characters</p>{diagnostic.details.map((detail) => <p key={detail} className="mt-1 text-[11px] leading-4 text-white/45">• {detail}</p>)}<p className="mt-2 text-[10px] leading-4 text-white/35">The current estimate uses the generated single-column output. {diagnostic.limitations}</p></section>
          <section><h3 className="section-label">Suggestions</h3><div className="space-y-2">{result.suggestions.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-[11px] leading-4 text-white/70">{item.message}</div>)}</div></section>
        </aside>

        <main className="overflow-y-auto border-r border-white/10 p-4">
          <h2 className="mb-3 text-sm font-semibold">Structured resume</h2>
          <div className="grid grid-cols-2 gap-3"><TextField label="Name" value={resume.name} onChange={(value) => setField("name", value)} /><TextField label="Headline" value={resume.headline} onChange={(value) => setField("headline", value)} /><TextField label="Email" value={resume.email} onChange={(value) => setField("email", value)} /><TextField label="Phone" value={resume.phone} onChange={(value) => setField("phone", value)} /><div className="col-span-2"><TextField label="Location" value={resume.location} onChange={(value) => setField("location", value)} /></div></div>
          <EditorSection title="Professional summary" onImprove={resume.summary ? () => void requestRewrite({ field: "summary", text: resume.summary }) : undefined}><textarea value={resume.summary} onChange={(event) => setField("summary", event.target.value)} rows={5} className="ats-textarea" /></EditorSection>
          <LinesEditor title="Skills (one per line)" values={resume.skills} onChange={(value) => setField("skills", value)} />
          <LinesEditor title="Experience (one entry or bullet per line)" values={resume.experience} onChange={(value) => setField("experience", value)} onImprove={(text, index) => void requestRewrite({ field: "experience", text, index })} />
          <LinesEditor title="Companies" values={resume.companies} onChange={(value) => setField("companies", value)} />
          <LinesEditor title="Education" values={resume.education} onChange={(value) => setField("education", value)} />
          <EditorSection title="Projects"><div className="space-y-3">{resume.projects.map((project, index) => <div key={index} className="rounded-lg border border-white/10 p-3"><TextField label="Project name" value={project.name} onChange={(value) => setResume((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item) }))} /><textarea value={project.description} onChange={(event) => setResume((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))} rows={3} className="ats-textarea mt-2" placeholder="Description" /><input value={project.technologies.join(", ")} onChange={(event) => setResume((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : item) }))} className="ats-input mt-2" placeholder="Technologies, comma separated" /><textarea value={project.links.join("\n")} onChange={(event) => setResume((current) => ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, links: lines(event.target.value) } : item) }))} rows={2} className="ats-textarea mt-2" placeholder="Project links, one per line" /><button onClick={() => setResume((current) => ({ ...current, projects: current.projects.filter((_, itemIndex) => itemIndex !== index) }))} className="mt-2 text-[11px] text-rose-300">Remove project</button></div>)}<button onClick={() => setField("projects", [...resume.projects, { name: "", description: "", technologies: [], links: [] }])} className="toolbar-btn">Add project</button></div></EditorSection>
          <LinesEditor title="Achievements" values={resume.achievements} onChange={(value) => setField("achievements", value)} onImprove={(text, index) => void requestRewrite({ field: "achievements", text, index })} /><LinesEditor title="Certifications" values={resume.certifications} onChange={(value) => setField("certifications", value)} /><LinesEditor title="Languages" values={resume.languages} onChange={(value) => setField("languages", value)} />
          <LinksEditor title="Social links" values={resume.socialLinks} onChange={(value) => setField("socialLinks", value)} /><LinksEditor title="External links" values={resume.externalLinks} onChange={(value) => setField("externalLinks", value)} />
        </main>

        <aside className="flex min-h-[600px] flex-col bg-[#202023] xl:min-h-0">
          <div className="shrink-0 border-b border-white/10 bg-[#242427] p-2">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">LaTeX templates</p>
            <div className="grid grid-cols-2 gap-1.5">{LATEX_TEMPLATES.map((item) => <button key={item.id} onClick={() => { setTemplate(item.id); setTab("preview") }} title={item.description} className={`rounded-md border px-2 py-1.5 text-left ${template === item.id ? "border-blue-400/60 bg-blue-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07]"}`}><span className="block text-[10px] font-semibold">{item.name}</span><span className="mt-0.5 block truncate text-[8px] opacity-60">{item.description}</span></button>)}</div>
          </div>
          <div className="flex h-10 shrink-0 items-center border-b border-white/10 px-2"><button onClick={() => setTab("original")} className={`preview-tab ${tab === "original" ? "bg-white/10 text-white" : "text-white/45"}`}>Original PDF</button><button onClick={() => setTab("preview")} className={`preview-tab ${tab === "preview" ? "bg-white/10 text-white" : "text-white/45"}`}>Template Preview</button><button onClick={() => setTab("latex")} className={`preview-tab ${tab === "latex" ? "bg-white/10 text-white" : "text-white/45"}`}>LaTeX Source</button></div>
          <div className={`min-h-0 flex-1 overflow-auto p-4 ${tab === "preview" || tab === "latex" ? "bg-[#08080a]" : "bg-[#d0d0d2]"}`}>{tab === "original" ? <iframe title="Original resume PDF" src="/api/profile/resume/file" className="h-full min-h-[560px] w-full border-0 bg-white shadow-xl" /> : tab === "latex" ? <pre className="min-h-full whitespace-pre-wrap rounded-lg border border-white/10 bg-[#101012] p-4 font-mono text-[10px] leading-4 text-emerald-200">{latexSource}</pre> : template === "classic" ? <ResumePreview resume={resume} /> : <ATSLaTeXPreview resume={resume} template={template} />}</div>
        </aside>
      </div>}

      {rewriteTarget && <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"><div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#27272a] p-4 shadow-2xl"><h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-violet-300" />AI rewrite preview</h3><p className="mt-3 rounded-lg bg-black/25 p-3 text-xs text-white/55">Original: {rewriteTarget.text}</p>{rewriting ? <p className="p-8 text-center text-sm text-white/50"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Preparing grounded suggestion…</p> : rewrite && <><p className="mt-3 rounded-lg border border-violet-400/20 bg-violet-500/10 p-3 text-sm leading-6">{rewrite.suggestedRewrite}</p><p className="mt-2 text-xs text-white/55">{rewrite.reason}</p>{rewriteImpact && <p className={`mt-2 text-xs ${rewriteImpact.delta > 0 ? "text-emerald-300" : rewriteImpact.delta < 0 ? "text-rose-300" : "text-white/45"}`}>Estimated impact: {rewriteImpact.before} → {rewriteImpact.after} ({rewriteImpact.delta > 0 ? "+" : ""}{rewriteImpact.delta})</p>}{rewrite.factsRequiringInput.length > 0 && <p className="mt-2 text-xs text-amber-300">Still needs your input: {rewrite.factsRequiringInput.join(", ")}</p>}<div className="mt-4 flex justify-end gap-2"><button onClick={() => { setRewriteTarget(null); setRewrite(null) }} className="toolbar-btn">Reject</button><button onClick={acceptRewrite} disabled={Boolean(rewriteImpact && rewriteImpact.delta < 0)} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40">{rewriteImpact?.delta && rewriteImpact.delta > 0 ? `Accept (+${rewriteImpact.delta})` : "Accept"}</button></div></>}</div></div>}
      <style jsx global>{`
        .ats-app .ats-header{background:color-mix(in srgb,var(--macos-surface) 90%,transparent)!important;border-color:var(--macos-border)!important;backdrop-filter:blur(var(--macos-blur))}
        .ats-app>div,.ats-app>div>aside,.ats-app>div>main{border-color:var(--macos-border)!important}
        .ats-app .bg-blue-600,.ats-app .bg-blue-600\/80,.ats-app .bg-gradient-to-br{background:var(--theme-primary-color)!important}
        .ats-app .bg-blue-500\/15,.ats-app .bg-violet-500\/10{background:var(--theme-primary-soft)!important}
        .ats-app .border-blue-400\/60,.ats-app .border-violet-400\/20{border-color:var(--theme-primary-color)!important}
        .ats-app .text-violet-200,.ats-app .text-violet-300{color:var(--theme-primary-color)!important}
        .ats-app[data-theme="light"]>div>aside,.ats-app[data-theme="light"]>div>main{background:var(--macos-surface)!important;color:var(--macos-text)}
        .ats-app[data-theme="light"] .text-white,.ats-app[data-theme="light"] [class*="text-white/"]{color:var(--macos-text)!important}
        .ats-app[data-theme="light"] [class*="bg-white/"]{background:var(--macos-surface-raised)!important}
        .toolbar-btn{display:inline-flex;height:2rem;align-items:center;gap:.375rem;border:1px solid var(--macos-border);border-radius:.375rem;background:var(--macos-surface-raised);padding:0 .625rem;font-size:.75rem;color:var(--macos-text)}
        .toolbar-btn:hover{filter:brightness(1.08)}.toolbar-btn:disabled{opacity:.5}
        .section-label{margin-bottom:.375rem;display:block;font-size:.625rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--macos-secondary)}
        .ats-input,.ats-textarea{width:100%;border:1px solid var(--macos-border);border-radius:.5rem;background:color-mix(in srgb,var(--macos-surface-raised) 72%,transparent);padding:.55rem .65rem;font-size:.75rem;color:var(--macos-text);outline:none}
        .ats-input:focus,.ats-textarea:focus{border-color:var(--theme-primary-color)}.ats-textarea{resize:vertical;line-height:1.4}.preview-tab{height:1.75rem;border-radius:.375rem;padding:0 .65rem;font-size:.7rem}
        .ats-app *{transition-duration:var(--macos-motion)}
      `}</style>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="section-label">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="ats-input" /></label> }
function EditorSection({ title, children, onImprove }: { title: string; children: React.ReactNode; onImprove?: () => void }) { return <section className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="section-label !mb-0">{title}</h3>{onImprove && <button onClick={onImprove} className="text-[10px] text-violet-300 hover:text-violet-200"><Sparkles className="mr-1 inline h-3 w-3" />Improve selected section</button>}</div>{children}</section> }
function LinesEditor({ title, values, onChange, onImprove }: { title: string; values: string[]; onChange: (value: string[]) => void; onImprove?: (text: string, index: number) => void }) { return <EditorSection title={title}><textarea value={values.join("\n")} onChange={(event) => onChange(lines(event.target.value))} rows={Math.max(4, Math.min(10, values.length + 2))} className="ats-textarea" />{onImprove && values.map((value, index) => <button key={`${value}-${index}`} onClick={() => onImprove(value, index)} className="mr-2 mt-1 text-[10px] text-violet-300"><Sparkles className="mr-1 inline h-3 w-3" />Improve {index + 1}</button>)}</EditorSection> }
function LinksEditor({ title, values, onChange }: { title: string; values: Array<{ platform: string; url: string }>; onChange: (value: Array<{ platform: string; url: string }>) => void }) { return <EditorSection title={`${title} (Platform | URL, one per line)`}><textarea value={values.map((link) => `${link.platform} | ${link.url}`).join("\n")} onChange={(event) => onChange(lines(event.target.value).map((line) => { const [platform, ...url] = line.split("|"); return { platform: platform.trim(), url: url.join("|").trim() } }).filter((link) => link.url))} rows={4} className="ats-textarea" /></EditorSection> }
function KeywordList({ title, values, color }: { title: string; values: string[]; color: "emerald" | "amber" }) { return <section><h3 className="section-label">{title}</h3><div className="flex flex-wrap gap-1">{values.length ? values.map((value) => <span key={value} className={`rounded-full px-2 py-1 text-[10px] ${color === "emerald" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}>{value}</span>) : <span className="text-[11px] text-white/35">None yet</span>}</div></section> }
function ResumePreview({ resume }: { resume: ATSResume }) { const section = (title: string, values: string[]) => values.length ? <section className="mt-5"><h3 className="border-b border-white/45 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3><ul className="mt-2.5 space-y-1.5 text-[11px] leading-[1.55] text-zinc-100">{values.map((value, index) => <li key={index} className="pl-1">• {value}</li>)}</ul></section> : null; return <article className="mx-auto min-h-[1120px] w-full max-w-[794px] border border-white/15 bg-[#101012] p-[7%] font-sans text-white shadow-2xl shadow-black/60"><h1 className="text-2xl font-bold tracking-tight text-white">{resume.name || "Your Name"}</h1><p className="mt-0.5 text-sm font-semibold text-zinc-200">{resume.headline}</p><p className="mt-1.5 text-[11px] leading-4 text-zinc-300">{[resume.email, resume.phone, resume.location].filter(Boolean).join(" | ")}</p>{resume.summary && <section className="mt-5"><h3 className="border-b border-white/45 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">Professional Summary</h3><p className="mt-2.5 whitespace-pre-wrap text-[11px] leading-[1.6] text-zinc-100">{resume.summary}</p></section>}{section("Skills", [resume.skills.join(" • ")].filter(Boolean))}{section("Experience", resume.experience)}{section("Education", resume.education)}{resume.projects.length > 0 && <section className="mt-5"><h3 className="border-b border-white/45 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">Projects</h3>{resume.projects.map((project, index) => <div key={index} className="mt-2.5 text-[11px] leading-[1.55] text-zinc-100"><strong className="text-white">{project.name}</strong><p>{project.description}</p>{project.technologies.length > 0 && <p className="text-zinc-300">Technologies: {project.technologies.join(", ")}</p>}</div>)}</section>}{section("Achievements", resume.achievements)}{section("Certifications", resume.certifications)}{section("Languages", resume.languages)}</article> }
