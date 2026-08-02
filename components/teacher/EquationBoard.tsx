"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { BlockMath } from "react-katex"
import { BookMarked, Check, CheckCircle2, Copy, Eraser, ImageIcon, Sparkles, Volume2 } from "lucide-react"

import type { BoardItem } from "@/modules/teaching/teacher-response"

type BoardVisual = { url: string; topic: string } | null

type EquationBoardProps = {
  items: BoardItem[]
  subject: string
  topic?: string
  visual?: BoardVisual
  isLoadingVisual?: boolean
}

const looksSymbolic = (value: string) => /[\\^_=+\-]|\d\s*[×÷]/.test(value)

export function EquationBoard({ items, subject, topic, visual, isLoadingVisual = false }: EquationBoardProps) {
  const [visibleCount, setVisibleCount] = useState(8)
  const [copied, setCopied] = useState(false)
  const visible = useMemo(() => items.slice(-visibleCount), [items, visibleCount])
  const copyNotes = async () => {
    const notes = items.map((item, index) => `${index + 1}. ${item.latex}\n${item.explanation}${item.steps.length ? `\n${item.steps.map((step, stepIndex) => `   ${stepIndex + 1}) ${step}`).join("\n")}` : ""}`).join("\n\n")
    await navigator.clipboard.writeText(`${subject}${topic ? ` — ${topic}` : ""}\n\n${notes}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col bg-[linear-gradient(145deg,#18191d,#101114)] p-2 sm:p-3">
      <div className="flex items-center justify-between rounded-t-2xl border border-white/10 bg-[#24252b] px-4 py-2 shadow-xl">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#30d158]/15 text-[#6ee78b]"><BookMarked className="size-4" /></span>
          <div className="min-w-0 text-left"><p className="truncate text-xs font-semibold text-white">Smart Blackboard</p><p className="truncate text-[10px] text-white/35">{subject}{topic ? ` · ${topic}` : ""}</p></div>
        </div>
        <div className="flex items-center gap-2"><span className="hidden items-center gap-1 text-[10px] text-white/30 sm:flex"><Sparkles className="size-3 text-[#ffd60a]" /> Live topper notes</span>{!!items.length && <button onClick={() => void copyNotes()} className="flex items-center gap-1.5 rounded-lg bg-white/[.07] px-2 py-1.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white/75">{copied ? <Check className="size-3 text-[#6ee78b]" /> : <Copy className="size-3" />}{copied ? "Copied" : "Copy notes"}</button>}</div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-b-2xl border-x border-b border-[#b88a52]/45 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.035),transparent_28%),linear-gradient(135deg,#183d32,#0d2d25)] p-4 shadow-[inset_0_0_55px_rgba(0,0,0,.5),0_14px_35px_rgba(0,0,0,.3)] sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(255,255,255,.25)_32px)]" />

        {!visible.length ? (
          <div className="relative flex h-full min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05]"><Eraser className="size-7 text-[#f4e6c1]/70" /></div>
            <h2 className="font-serif text-xl font-semibold text-[#f4e6c1]">The board is ready</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#d8e9df]/55">Definitions, formulas, reactions, diagrams, code, and derivation steps appear here instantly. The teacher explains their meaning instead of reading every symbol aloud.</p>
          </div>
        ) : (
          <div className={`relative grid gap-4 text-left ${visual || isLoadingVisual ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
            <div className="space-y-4">
              {visible.map((item, index) => (
                <article key={`${item.latex}-${index}`} className="rounded-xl border border-white/[.08] bg-black/10 p-4 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2" style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}>
                  <div className="mb-3 flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#ffd60a]" /><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ffd60a]/80">{item.type === "chemistry" ? "Reaction" : item.type === "code" ? "Code note" : item.type === "notation" ? "Key notation" : "Formula & concept"}</p></div>
                  {item.type === "latex" || item.type === "chemistry" ? (
                    <div className="overflow-x-auto rounded-lg bg-black/10 px-3 py-2 text-lg text-[#fff7d6] sm:text-xl"><BlockMath math={item.latex} errorColor="#ff9f0a" renderError={() => <code className="text-sm text-[#ffcc80]">{item.latex}</code>} /></div>
                  ) : <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3 font-mono text-sm leading-6 text-[#d5f5e3]">{item.latex}</pre>}
                  <div className="mt-3 border-l-2 border-[#64d2ff]/50 pl-3"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#64d2ff]">Definition / meaning</p><p className="font-serif text-sm leading-6 text-[#edf8f1]/80 sm:text-base">{item.explanation}</p></div>
                  {!!item.steps.length && <div className="mt-4 space-y-2"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#ff9f0a]">Topper&apos;s working</p>{item.steps.map((entry, stepIndex) => <div key={`${entry}-${stepIndex}`} className="flex items-start gap-2 rounded-lg bg-white/[.035] px-3 py-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#6ee78b]" />{looksSymbolic(entry) ? <div className="min-w-0 overflow-x-auto text-sm text-[#fff7d6]"><BlockMath math={entry} errorColor="#ff9f0a" renderError={() => <span>{entry}</span>} /></div> : <p className="text-xs leading-5 text-[#d8e9df]/70"><span className="mr-1 font-semibold text-white/55">{stepIndex + 1}.</span>{entry}</p>}</div>)}</div>}
                  <button onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(item.explanation))} className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] text-white/35 transition hover:bg-white/[.07] hover:text-white/60"><Volume2 className="size-3" /> Read explanation aloud</button>
                </article>
              ))}
              {items.length > visibleCount && <button onClick={() => setVisibleCount((count) => count + 8)} className="w-full rounded-xl border border-white/10 bg-white/[.04] py-2 text-xs text-white/45 hover:bg-white/[.07]">Show earlier board notes</button>}
            </div>

            {(visual || isLoadingVisual) && <aside className="h-fit overflow-hidden rounded-2xl border border-white/10 bg-black/20 xl:sticky xl:top-0">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-white/50"><ImageIcon className="size-3.5 text-[#64d2ff]" /> Visual reference</div>
              {isLoadingVisual && !visual ? <div className="flex aspect-square items-center justify-center"><div className="size-7 animate-spin rounded-full border-2 border-white/10 border-t-[#64d2ff]" /></div> : visual && <><div className="relative aspect-square bg-white/5"><Image src={visual.url} alt={`Educational visual for ${visual.topic}`} fill unoptimized className="object-contain" sizes="280px" /></div><p className="px-3 py-2 text-[10px] leading-4 text-white/35">High-resolution reference for {visual.topic}. Source: Pinterest search result.</p></>}
            </aside>}
          </div>
        )}
      </div>
    </div>
  )
}
