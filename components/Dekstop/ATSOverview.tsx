import { AlertCircle, ArrowRight, CheckCircle2, FileText, Target } from "lucide-react"
import { ATSLaTeXPreview } from "./ATSLaTeXPreview"
import type { LaTeXTemplateId } from "@/lib/ats/latex"
import { analyzeResumeInsights } from "@/lib/ats/insights"
import type { ATSResume, ATSScore } from "@/lib/ats/types"

interface ATSOverviewProps {
  resume: ATSResume
  score: ATSScore
  sourceScore: ATSScore
  template: LaTeXTemplateId
  hasJobDescription: boolean
  onEdit: (field?: string) => void
}

export function ATSOverview({ resume, score, sourceScore, template, hasJobDescription, onEdit }: ATSOverviewProps) {
  const delta = score.total - sourceScore.total
  const categories = Object.entries(score.categories)
  const evaluatedCategories = hasJobDescription ? categories : categories.filter(([name]) => name !== "keywords")
  const insights = analyzeResumeInsights(resume)
  const needsWork = insights.filter((insight) => insight.status === "needs-work")
  const passing = insights.filter((insight) => insight.status === "passing")
  const highestImpact = [...evaluatedCategories].sort((a, b) => (b[1].maximum - b[1].score) - (a[1].maximum - a[1].score))[0]
  const topSuggestion = score.suggestions.find((item) => item.severity === "important") ?? score.suggestions[0]

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto bg-[#151517] xl:grid-cols-[220px_minmax(420px,1fr)_minmax(360px,0.85fr)] xl:overflow-hidden">
      <aside className="overflow-y-auto border-r border-white/10 bg-black/20 p-3">
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 shadow-lg shadow-blue-950/20">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200/70">{hasJobDescription ? "ATS readiness estimate" : "General readiness estimate"}</p>
          <div className="mt-2 flex items-end gap-1"><span className="text-4xl font-bold text-emerald-400">{score.total}</span><span className="pb-1 text-sm text-white/35">/100</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${score.total}%` }} /></div>
          <p className={`mt-2 text-[10px] ${delta > 0 ? "text-emerald-300" : delta < 0 ? "text-amber-300" : "text-white/45"}`}>{delta > 0 ? `+${delta} points versus uploaded source` : delta < 0 ? `${delta} points versus uploaded source` : "Same estimate as uploaded source"}</p>
        </div>

        <button onClick={() => onEdit()} className="mt-3 flex w-full items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-white hover:bg-white/10"><span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-300" />Edit resume</span><ArrowRight className="h-3.5 w-3.5" /></button>

        <div className="mt-5"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">Needs work <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5">{needsWork.length}</span></p><div className="space-y-1">{needsWork.map((insight) => <button key={insight.id} title={insight.message} onClick={() => onEdit(insight.field)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]"><AlertCircle className="h-3.5 w-3.5 text-amber-300" /><span className="flex-1 text-[11px] text-white/70">{insight.label}</span><span className="rounded-full border border-amber-400/40 px-1.5 py-0.5 text-[9px] text-amber-200">{insight.score}</span></button>)}</div></div>
        <div className="mt-5"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">Passing <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5">{passing.length}</span></p><div className="space-y-1">{passing.map((insight) => <div key={insight.id} title={insight.message} className="flex items-center gap-2 px-2 py-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="flex-1 text-[11px] text-white/60">{insight.label}</span><span className="text-[9px] text-emerald-300">{insight.score}</span></div>)}</div></div>
      </aside>

      <main className="overflow-y-auto p-5">
        <section className="rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-500/10 to-violet-500/[0.06] p-5 shadow-xl shadow-black/20">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">Highest-impact review</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Improve {highestImpact?.[0] ?? "resume evidence"}</h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-white/50">{topSuggestion?.message ?? highestImpact?.[1].explanations[0] ?? "The resume has no critical deterministic issues."}</p>
          <div className="mt-4 flex items-center gap-2"><button onClick={() => onEdit(topSuggestion?.field ?? highestImpact?.[0])} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Review this fix <ArrowRight className="h-3.5 w-3.5" /></button><span className="text-[10px] text-white/35">Changes are never applied silently.</span></div>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start justify-between"><div><p className="text-[9px] uppercase tracking-[0.16em] text-white/35">Current analysis</p><h3 className="mt-2 max-w-lg text-xl font-semibold">{score.total >= 80 ? "Strong foundation—review the remaining evidence and alignment gaps." : score.total >= 60 ? "Good foundation with several meaningful improvements available." : "The resume needs structural and evidence improvements."}</h3></div><div className="text-right"><p className="text-5xl font-bold text-emerald-400">{score.total}</p><p className="text-[9px] text-white/35">out of 100 · estimate</p></div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${score.total}%` }} /></div>
          <p className="mt-3 text-[10px] leading-4 text-white/40">This is not an exact or universal ATS score. It is a reproducible readiness estimate based on the generated PDF, section structure, evidence, and optional job-description alignment. {!hasJobDescription && "Because no job description is present, the score is normalized across the 60 assessed general-readiness points; keyword alignment is not assessed. "}External services use different proprietary rules.</p>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"><div className="border-b border-white/10 px-5 py-3"><h3 className="text-sm font-semibold">Score breakdown</h3></div>{evaluatedCategories.map(([name, category]) => <button key={name} onClick={() => onEdit(name)} className="flex w-full items-center gap-3 border-b border-white/[0.06] px-5 py-3 text-left last:border-0 hover:bg-white/[0.04]"><div className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold ${category.score === category.maximum ? "border-emerald-400/50 text-emerald-300" : "border-amber-400/50 text-amber-200"}`}>{category.score}</div><div className="min-w-0 flex-1"><p className="text-xs font-medium capitalize text-white/80">{name}</p><p className="truncate text-[10px] text-white/35">{category.explanations[0]}</p></div><span className="text-[10px] text-white/35">/{category.maximum}</span><ArrowRight className="h-3.5 w-3.5 text-white/25" /></button>)}{!hasJobDescription && <button onClick={() => onEdit("keywords")} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.04]"><div className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-[9px] text-white/35">—</div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-white/60">Job alignment</p><p className="text-[10px] text-white/35">Paste a job description to assess the 40-point keyword category.</p></div><ArrowRight className="h-3.5 w-3.5 text-white/25" /></button>}</section>

        <section className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><Target className="mt-0.5 h-4 w-4 text-blue-300" /><div><p className="text-xs font-medium">Why scores can differ between websites</p><p className="mt-1 text-[10px] leading-4 text-white/40">Nextraise and other services use private scoring models. A one-point difference such as 81 versus 80 does not prove the resume became worse. Use the same job description and the same PDF when comparing, and validate the specific issues each service reports.</p></div></section>
      </main>

      <aside className="min-h-[650px] overflow-auto border-l border-white/10 bg-[#08080a] p-4 xl:min-h-0"><ATSLaTeXPreview resume={resume} template={template} /></aside>
    </div>
  )
}
