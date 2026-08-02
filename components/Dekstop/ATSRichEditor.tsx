"use client"

import { useState } from "react"
import { Award, BriefcaseBusiness, Check, ChevronRight, FileText, GraduationCap, Languages, Link2, Plus, Sparkles, Trash2, UserRound, Wrench } from "lucide-react"
import { ATSLaTeXPreview } from "./ATSLaTeXPreview"
import { LATEX_TEMPLATES, type LaTeXTemplateId } from "@/lib/ats/latex"
import type { ATSResume } from "@/lib/ats/types"

export type ATSEditorSection = "personal" | "links" | "summary" | "experience" | "education" | "skills" | "projects" | "achievements" | "certifications" | "languages"
type ImproveField = "summary" | "experience" | "achievements"

interface ATSRichEditorProps {
  resume: ATSResume
  template: LaTeXTemplateId
  onTemplateChange: (template: LaTeXTemplateId) => void
  onChange: (resume: ATSResume) => void
  onImprove: (field: ImproveField, text: string, index?: number) => void
  onDone: () => void
  initialSection?: ATSEditorSection
}

const sections: Array<{ id: ATSEditorSection; label: string; icon: typeof UserRound }> = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "links", label: "Social Links", icon: Link2 },
  { id: "summary", label: "Professional Summary", icon: FileText },
  { id: "experience", label: "Work Experience", icon: BriefcaseBusiness },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: FileText },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "languages", label: "Languages", icon: Languages },
]

export function ATSRichEditor({ resume, template, onTemplateChange, onChange, onImprove, onDone, initialSection = "personal" }: ATSRichEditorProps) {
  const [active, setActive] = useState<ATSEditorSection>(initialSection)
  const set = <K extends keyof ATSResume>(field: K, value: ATSResume[K]) => onChange({ ...resume, [field]: value })

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto bg-[#151517] xl:grid-cols-[205px_minmax(430px,1fr)_minmax(360px,0.9fr)] xl:overflow-hidden">
      <aside className="overflow-y-auto border-r border-white/10 bg-black/20 p-3">
        <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">Sections</p>
        <div className="space-y-1">{sections.map((section) => { const Icon = section.icon; return <button key={section.id} onClick={() => setActive(section.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] ${active === section.id ? "border border-blue-400/35 bg-blue-500/15 text-blue-200" : "border border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white/80"}`}><Icon className="h-3.5 w-3.5" /><span className="flex-1">{section.label}</span><ChevronRight className="h-3 w-3 opacity-40" /></button> })}</div>
        <button onClick={onDone} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"><Check className="h-3.5 w-3.5" />Done editing</button>
      </aside>

      <main className="overflow-y-auto border-r border-white/10 p-5">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.15em] text-white/35">Edit resume</p><h2 className="mt-1 text-lg font-semibold">{sections.find((section) => section.id === active)?.label}</h2></div><span className="flex items-center gap-1.5 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Draft protected</span></div>
        {active === "personal" && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><RichInput label="Full name" value={resume.name} onChange={(value) => set("name", value)} /><RichInput label="Headline" value={resume.headline} onChange={(value) => set("headline", value)} /></div><div className="grid grid-cols-2 gap-3"><RichInput label="Email" type="email" value={resume.email} onChange={(value) => set("email", value)} /><RichInput label="Phone" value={resume.phone} onChange={(value) => set("phone", value)} /></div><RichInput label="Location" value={resume.location} onChange={(value) => set("location", value)} /><p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[10px] leading-4 text-white/40">Use a city and country or region. A complete street address is normally unnecessary for ATS parsing.</p></div>}
        {active === "links" && <LinksSection resume={resume} onChange={onChange} />}
        {active === "summary" && <div><textarea value={resume.summary} onChange={(event) => set("summary", event.target.value)} rows={10} className="rich-area" placeholder="Write a concise professional summary…" /><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-white/35">{resume.summary.trim().split(/\s+/).filter(Boolean).length} words · target 35–80</span>{resume.summary && <button onClick={() => onImprove("summary", resume.summary)} className="improve-btn"><Sparkles className="h-3.5 w-3.5" />Review AI rewrite</button>}</div></div>}
        {active === "experience" && <ArrayCards title="Experience entry" values={resume.experience} onChange={(values) => set("experience", values)} onImprove={(text, index) => onImprove("experience", text, index)} />}
        {active === "education" && <ArrayCards title="Education entry" values={resume.education} onChange={(values) => set("education", values)} />}
        {active === "skills" && <TagEditor values={resume.skills} onChange={(values) => set("skills", values)} placeholder="Add a skill and press Enter" />}
        {active === "projects" && <ProjectsEditor resume={resume} onChange={onChange} />}
        {active === "achievements" && <ArrayCards title="Achievement" values={resume.achievements} onChange={(values) => set("achievements", values)} onImprove={(text, index) => onImprove("achievements", text, index)} />}
        {active === "certifications" && <ArrayCards title="Certification" values={resume.certifications} onChange={(values) => set("certifications", values)} />}
        {active === "languages" && <TagEditor values={resume.languages} onChange={(values) => set("languages", values)} placeholder="Add a language and press Enter" />}
      </main>

      <aside className="flex min-h-[650px] flex-col overflow-hidden bg-[#08080a] xl:min-h-0"><div className="shrink-0 border-b border-white/10 bg-[#202023] p-2"><p className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-white/35">Live template</p><div className="grid grid-cols-2 gap-1">{LATEX_TEMPLATES.map((item) => <button key={item.id} onClick={() => onTemplateChange(item.id)} className={`rounded-md border px-2 py-1 text-left text-[9px] ${template === item.id ? "border-blue-400/50 bg-blue-500/15 text-white" : "border-white/10 text-white/40 hover:text-white/70"}`}>{item.name}</button>)}</div></div><div className="min-h-0 flex-1 overflow-auto p-4"><ATSLaTeXPreview resume={resume} template={template} /></div></aside>
      <style jsx global>{`.rich-input,.rich-area{width:100%;border:1px solid rgba(255,255,255,.13);border-radius:.55rem;background:rgba(0,0,0,.22);padding:.7rem .75rem;font-size:.78rem;color:white;outline:none}.rich-input:focus,.rich-area:focus{border-color:rgba(96,165,250,.75);box-shadow:0 0 0 2px rgba(59,130,246,.12)}.rich-area{resize:vertical;line-height:1.55}.improve-btn{display:inline-flex;align-items:center;gap:.35rem;border-radius:.45rem;background:rgba(139,92,246,.15);padding:.45rem .65rem;font-size:.65rem;color:#c4b5fd}.improve-btn:hover{background:rgba(139,92,246,.25)}`}</style>
    </div>
  )
}

function RichInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-medium text-white/50">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rich-input" /></label> }

function LinksSection({ resume, onChange }: { resume: ATSResume; onChange: (resume: ATSResume) => void }) {
  const all = [...resume.socialLinks.map((link) => ({ ...link, group: "social" as const })), ...resume.externalLinks.map((link) => ({ ...link, group: "external" as const }))]
  const commit = (items: typeof all) => onChange({ ...resume, socialLinks: items.filter((item) => item.group === "social").map(({ platform, url }) => ({ platform, url })), externalLinks: items.filter((item) => item.group === "external").map(({ platform, url }) => ({ platform, url })) })
  return <div className="space-y-3">{all.map((link, index) => <div key={`${link.group}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="grid grid-cols-[130px_1fr_auto] gap-2"><select value={link.group} onChange={(event) => commit(all.map((item, itemIndex) => itemIndex === index ? { ...item, group: event.target.value as "social" | "external" } : item))} className="rich-input"><option value="social">Social</option><option value="external">External</option></select><input value={link.platform} onChange={(event) => commit(all.map((item, itemIndex) => itemIndex === index ? { ...item, platform: event.target.value } : item))} className="rich-input" placeholder="LinkedIn, GitHub…" /><button onClick={() => commit(all.filter((_, itemIndex) => itemIndex !== index))} className="grid h-9 w-9 place-items-center rounded-lg text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></div><input value={link.url} onChange={(event) => commit(all.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} className="rich-input mt-2" placeholder="https://…" /></div>)}<button onClick={() => commit([...all, { platform: "", url: "", group: "social" }])} className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/55 hover:bg-white/[0.04]"><Plus className="h-3.5 w-3.5" />Add social or external link</button></div>
}

function ArrayCards({ title, values, onChange, onImprove }: { title: string; values: string[]; onChange: (values: string[]) => void; onImprove?: (text: string, index: number) => void }) { return <div className="space-y-3">{values.map((value, index) => <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{title} {index + 1}</span><button onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-300/70 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div><textarea value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} rows={4} className="rich-area" />{onImprove && value && <button onClick={() => onImprove(value, index)} className="improve-btn mt-2"><Sparkles className="h-3.5 w-3.5" />Review AI rewrite</button>}</div>)}<button onClick={() => onChange([...values, ""])} className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/55 hover:bg-white/[0.04]"><Plus className="h-3.5 w-3.5" />Add {title.toLowerCase()}</button></div> }

function TagEditor({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder: string }) { const [draft, setDraft] = useState(""); const add = () => { const value = draft.trim(); if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...values, value]); setDraft("") }; return <div><div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">{values.map((value, index) => <span key={`${value}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] text-blue-200">{value}<button onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="text-blue-200/50 hover:text-white">×</button></span>)}<input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add() } }} onBlur={add} placeholder={placeholder} className="min-w-48 flex-1 bg-transparent px-1 py-1 text-xs text-white outline-none placeholder:text-white/25" /></div><p className="mt-2 text-[10px] text-white/35">Duplicate values are ignored automatically.</p></div> }

function ProjectsEditor({ resume, onChange }: { resume: ATSResume; onChange: (resume: ATSResume) => void }) { const update = (index: number, patch: Partial<ATSResume["projects"][number]>) => onChange({ ...resume, projects: resume.projects.map((project, itemIndex) => itemIndex === index ? { ...project, ...patch } : project) }); return <div className="space-y-3">{resume.projects.map((project, index) => <div key={index} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Project {index + 1}</span><button onClick={() => onChange({ ...resume, projects: resume.projects.filter((_, itemIndex) => itemIndex !== index) })} className="text-rose-300/70"><Trash2 className="h-3.5 w-3.5" /></button></div><input value={project.name} onChange={(event) => update(index, { name: event.target.value })} className="rich-input" placeholder="Project name" /><textarea value={project.description} onChange={(event) => update(index, { description: event.target.value })} rows={4} className="rich-area mt-2" placeholder="Impact-focused description" /><input value={project.technologies.join(", ")} onChange={(event) => update(index, { technologies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="rich-input mt-2" placeholder="Technologies, comma separated" /><textarea value={project.links.join("\n")} onChange={(event) => update(index, { links: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} rows={2} className="rich-area mt-2" placeholder="Links, one per line" /></div>)}<button onClick={() => onChange({ ...resume, projects: [...resume.projects, { name: "", description: "", technologies: [], links: [] }] })} className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/55"><Plus className="h-3.5 w-3.5" />Add project</button></div> }
