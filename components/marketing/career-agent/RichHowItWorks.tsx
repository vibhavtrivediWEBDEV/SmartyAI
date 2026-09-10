'use client'

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import {
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronsDown,
  FileOutput,
  Gauge,
  Network,
  ScanSearch,
  Sparkles,
} from 'lucide-react'
import { useRef, useState } from 'react'
import Image from 'next/image'

const stages = [
  {
    label: 'Understand',
    title: 'Read the opportunity',
    detail: 'The agent extracts role requirements, seniority, responsibilities, technologies, and interview signals from the job description.',
    input: 'Job description + target date',
    output: 'Structured role profile',
    image: '/screenshots/main.png',
    icon: ScanSearch,
    accent: '#38bdf8',
  },
  {
    label: 'Compare',
    title: 'Map your readiness',
    detail: 'Your resume and existing knowledge are compared against the role to identify strengths, missing evidence, and genuine skill gaps.',
    input: 'Role profile + your context',
    output: 'Prioritized readiness map',
    image: '/screenshots/ats.png',
    icon: BrainCircuit,
    accent: '#2dd4bf',
  },
  {
    label: 'Plan',
    title: 'Build the shortest useful path',
    detail: 'SmartyAI turns the remaining time into a realistic sequence of lessons, coding work, revision, and interview practice.',
    input: 'Gaps + available time',
    output: 'Daily preparation mission',
    image: '/screenshots/main.png',
    icon: CalendarClock,
    accent: '#fbbf24',
  },
  {
    label: 'Create',
    title: 'Provision every workspace',
    detail: 'The system creates lessons, exercise files, notes, interview sessions, calendar events, and resume actions inside the right apps.',
    input: 'Preparation mission',
    output: 'Ready-to-use workspace',
    image: '/screenshots/finder.png',
    icon: FileOutput,
    accent: '#fb7185',
  },
  {
    label: 'Adapt',
    title: 'Track evidence and adjust',
    detail: 'Completed work, scores, feedback, and remaining time continuously update what the agent recommends next.',
    input: 'Your live progress',
    output: 'Next best action',
    image: '/screenshots/dekstop.png',
    icon: Gauge,
    accent: '#a78bfa',
  },
]

export default function RichHowItWorks() {
  const scrubRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [activeStage, setActiveStage] = useState(0)
  const stage = stages[activeStage]
  const { scrollYProgress } = useScroll({ target: scrubRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextStage = Math.min(stages.length - 1, Math.floor(progress * stages.length))
    setActiveStage((currentStage) => currentStage === nextStage ? currentStage : nextStage)
  })

  const seekToStage = (index: number) => {
    const scrub = scrubRef.current
    if (!scrub) return

    const scrubTop = window.scrollY + scrub.getBoundingClientRect().top
    const scrollableDistance = Math.max(scrub.offsetHeight - window.innerHeight, 1)
    const stageProgress = index / Math.max(stages.length - 1, 1)
    window.scrollTo({
      top: scrubTop + scrollableDistance * stageProgress,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    setActiveStage(index)
  }

  return (
    <section id="how-it-works" className="relative scroll-mt-16 overflow-clip bg-[#08090b] lg:scroll-mt-20">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
      <div ref={scrubRef} className="relative" style={{ height: `calc(100dvh + ${(stages.length - 1) * 45}dvh)` }}>
        <div data-active-agent-stage={activeStage} className="sticky top-[calc(4rem+env(safe-area-inset-top))] flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] items-center overflow-hidden py-3 lg:top-[calc(5rem+env(safe-area-inset-top))] lg:h-[calc(100dvh-5rem-env(safe-area-inset-top))] [@media(max-height:600px)]:py-2">
          <div className="mx-auto flex h-full w-full max-w-350 flex-col px-5 sm:px-8 lg:px-12">
            <div className="grid shrink-0 items-end gap-3 border-b border-white/10 pb-3 lg:grid-cols-[1fr_0.72fr] [@media(max-height:600px)]:grid-cols-[1fr_0.72fr] [@media(max-height:600px)]:pb-2">
              <div>
                <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase text-emerald-300 sm:text-xs [@media(max-height:600px)]:mb-1"><Network className="h-4 w-4" /> Inside the agent</p>
                <h2 className="text-2xl font-semibold leading-[1.06] text-white sm:text-4xl lg:text-5xl [@media(max-height:600px)]:text-2xl">One goal enters. <span className="text-white/38">A working system comes out.</span></h2>
              </div>
              <p className="hidden text-sm leading-6 text-white/52 sm:block [@media(max-height:600px)]:hidden">No prompt engineering and no manual setup across ten tools. The agent converts intent into a controlled execution graph.</p>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-b border-white/10 py-2 sm:py-3 [@media(max-height:600px)]:py-1.5">
              <div className="grid min-w-0 flex-1 grid-cols-5 gap-1" role="tablist" aria-label="Agent workflow stages">
                {stages.map((item, index) => {
                  const Icon = item.icon
                  const active = index === activeStage
                  return (
                    <button key={item.label} type="button" role="tab" aria-selected={active} onClick={() => seekToStage(index)} className={`flex h-10 min-w-0 items-center justify-center gap-2 px-1 text-xs font-medium transition sm:px-3 ${active ? 'bg-white text-black' : 'bg-white/4 text-white/38 hover:bg-white/8 hover:text-white'}`}>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden truncate sm:inline">{item.label}</span>
                      <span className="sm:hidden">0{index + 1}</span>
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={() => seekToStage(stages.length - 1)} title="Skip to last agent stage" className="flex h-10 shrink-0 items-center gap-2 border border-white/12 px-3 text-xs font-medium text-white/55 transition hover:border-white/30 hover:bg-white hover:text-black sm:px-4" aria-label="Skip to last agent stage">
                <span className="sm:hidden">Skip</span>
                <span className="hidden sm:inline">Skip to last</span>
                <ChevronsDown className="h-4 w-4" />
              </button>
            </div>

            <motion.div key={stage.label} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="mt-3 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-white/12 bg-[#0d0f12] shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[0.72fr_1.28fr] lg:grid-rows-1 [@media(max-height:600px)]:mt-2 [@media(min-width:640px)_and_(max-height:600px)]:grid-cols-[0.72fr_1.28fr] [@media(min-width:640px)_and_(max-height:600px)]:grid-rows-1">
              <div className="flex min-h-0 flex-col justify-between border-b border-white/10 p-4 sm:p-6 lg:border-r lg:border-b-0 [@media(max-height:600px)]:border-r [@media(max-height:600px)]:border-b-0 [@media(max-height:600px)]:p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/28">TASK / 0{activeStage + 1}</span>
                    <stage.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stage.accent }} />
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase sm:mt-5" style={{ color: stage.accent }}>{stage.label}</p>
                  <h3 className="mt-1 text-xl font-semibold leading-tight text-white sm:mt-2 sm:text-3xl [@media(max-height:600px)]:text-xl">{stage.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/50 sm:mt-4 sm:text-sm sm:leading-6 [@media(max-height:600px)]:hidden">{stage.detail}</p>
                </div>
                <div className="mt-3 grid gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 [@media(max-height:600px)]:grid-cols-2">
                  <div className="bg-[#0d0f12] p-3">
                    <span className="text-[9px] font-semibold uppercase text-white/28">Receives</span>
                    <p className="mt-1 truncate text-xs text-white/72">{stage.input}</p>
                  </div>
                  <div className="bg-[#0d0f12] p-3">
                    <span className="text-[9px] font-semibold uppercase text-white/28">Produces</span>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/72"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />{stage.output}</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-0 overflow-hidden bg-black">
                <div className="flex h-10 items-center justify-between border-b border-white/8 bg-[#141619] px-4">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-white/45"><Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Agent execution</div>
                  <div className="flex items-center gap-2 text-[9px] uppercase text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live</div>
                </div>
                <div className="relative h-[calc(100%-2.5rem)] min-h-0">
                  <Image src={stage.image} alt={`${stage.title} inside SmartyAI`} fill sizes="(max-width: 1024px) 100vw, 64vw" className="object-contain object-center" />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0d0f12]/45 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>

            <div className="mt-2 h-px shrink-0 overflow-hidden bg-white/10">
              <motion.div className="h-full origin-left" style={{ scaleX: scrollYProgress, backgroundColor: stage.accent }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}