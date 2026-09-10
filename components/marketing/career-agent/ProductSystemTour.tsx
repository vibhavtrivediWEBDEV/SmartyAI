'use client'

import Image from 'next/image'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  AppWindow,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Code2,
  Command,
  FileSearch,
  GraduationCap,
  LayoutGrid,
  Mail,
  Map,
  Monitor,
  NotebookPen,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  TerminalSquare,
  Video,
} from 'lucide-react'

type TourItem = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  result: string
  image: string
  icon: typeof Monitor
  group: 'Career core' | 'Work suite' | 'System'
  accent: string
}

const tourItems: TourItem[] = [
  { id: 'desktop', label: 'Career desktop', eyebrow: 'Your command center', title: 'One desktop runs the entire career journey.', description: 'Your plan, apps, files, calls, schedule, and progress live in one focused workspace.', result: 'A single source of truth', image: '/screenshots/dekstop.png', icon: Monitor, group: 'Career core', accent: '#38bdf8' },
  { id: 'career', label: 'Career plan', eyebrow: 'Role intelligence', title: 'Turn a job opportunity into an execution plan.', description: 'SmartyAI reads the role, maps the required skills, and creates the exact tasks to become interview-ready.', result: 'Personalized daily roadmap', image: '/screenshots/main.png', icon: BriefcaseBusiness, group: 'Career core', accent: '#22c55e' },
  { id: 'teacher', label: 'AI teacher', eyebrow: 'Adaptive learning', title: 'Learn only what the role demands.', description: 'Interactive books and guided lessons are generated around your gaps, not a generic curriculum.', result: 'Role-specific mastery', image: '/screenshots/book.png', icon: GraduationCap, group: 'Career core', accent: '#f59e0b' },
  { id: 'interview', label: 'Interview', eyebrow: 'Real-time practice', title: 'Practice in an interview room built for the role.', description: 'Voice-led mock interviews, live transcription, feedback, and structured evaluation build real confidence.', result: 'Actionable interview feedback', image: '/screenshots/interview.png', icon: Video, group: 'Career core', accent: '#fb7185' },
  { id: 'code', label: 'Coding studio', eyebrow: 'Applied practice', title: 'Move from learning to working code immediately.', description: 'Role-specific exercises open inside a complete editor with files, console, run controls, and AI support.', result: 'Proof through execution', image: '/screenshots/vscode.png', icon: Code2, group: 'Career core', accent: '#2dd4bf' },
  { id: 'ats', label: 'Resume + ATS', eyebrow: 'Application readiness', title: 'Make every line of the resume earn its place.', description: 'Score structure, evidence, alignment, and readability while keeping every proposed change under your control.', result: 'A stronger role-aligned resume', image: '/screenshots/ats.png', icon: ShieldCheck, group: 'Career core', accent: '#10b981' },
  { id: 'finder', label: 'Finder', eyebrow: 'Career memory', title: 'Every generated asset stays organized.', description: 'Lessons, exercises, interview material, and supporting documents are stored in a familiar file system.', result: 'Nothing gets lost', image: '/screenshots/finder.png', icon: FileSearch, group: 'Work suite', accent: '#60a5fa' },
  { id: 'notes', label: 'Notes', eyebrow: 'Knowledge capture', title: 'Capture insights without breaking your flow.', description: 'Keep role research, revisions, answers, and preparation notes beside the work that created them.', result: 'Searchable preparation context', image: '/screenshots/notes.png', icon: NotebookPen, group: 'Work suite', accent: '#fbbf24' },
  { id: 'mail', label: 'Mail', eyebrow: 'Career communication', title: 'Keep important conversations in the same system.', description: 'Review recruiter communication and stay connected to the opportunity without changing context.', result: 'Faster, calmer follow-up', image: '/screenshots/mail.png', icon: Mail, group: 'Work suite', accent: '#f87171' },
  { id: 'maps', label: 'Maps', eyebrow: 'Opportunity context', title: 'Understand where the opportunity takes you.', description: 'Explore company locations and interview logistics from the same agentic desktop.', result: 'Location-aware planning', image: '/screenshots/map.png', icon: Map, group: 'Work suite', accent: '#34d399' },
  { id: 'data', label: 'Data table', eyebrow: 'Structured analysis', title: 'Turn scattered information into decisions.', description: 'Compare opportunities, requirements, and preparation data in fast, structured tables.', result: 'Clearer trade-offs', image: '/screenshots/table.png', icon: Table2, group: 'Work suite', accent: '#22d3ee' },
  { id: 'excel', label: 'Spreadsheets', eyebrow: 'Planning tools', title: 'Model the details without leaving your workspace.', description: 'Use familiar spreadsheet workflows for tracking, planning, and analysis.', result: 'Operational clarity', image: '/screenshots/excel.png', icon: LayoutGrid, group: 'Work suite', accent: '#4ade80' },
  { id: 'terminal', label: 'Terminal', eyebrow: 'Execution layer', title: 'The desktop is capable, not decorative.', description: 'Run real commands and workflows from the same environment that holds your career plan.', result: 'Work completed in place', image: '/screenshots/terminal.png', icon: TerminalSquare, group: 'System', accent: '#a3e635' },
  { id: 'apps', label: 'App Store', eyebrow: 'Expandable system', title: 'Add capabilities as your goals evolve.', description: 'A dedicated app layer lets the workspace grow beyond a fixed set of AI features.', result: 'A system that compounds', image: '/screenshots/appstore.png', icon: AppWindow, group: 'System', accent: '#38bdf8' },
  { id: 'settings', label: 'Settings', eyebrow: 'Personal control', title: 'Your workspace behaves the way you need it to.', description: 'Manage preferences and system behavior from a familiar, deliberate control surface.', result: 'Control without complexity', image: '/screenshots/settings.png', icon: Settings, group: 'System', accent: '#a78bfa' },
  { id: 'about', label: 'System profile', eyebrow: 'Built as a platform', title: 'A cohesive environment, not a collection of tabs.', description: 'SmartyAI presents a complete product identity and operating layer across every capability.', result: 'One coherent experience', image: '/screenshots/about.png', icon: Command, group: 'System', accent: '#94a3b8' },
  { id: 'youtube', label: 'Learning media', eyebrow: 'Curated resources', title: 'Use the best material at the right moment.', description: 'Bring external learning into the plan while the agent keeps the objective and timing intact.', result: 'Focused learning, less browsing', image: '/screenshots/yt.png', icon: Video, group: 'System', accent: '#f43f5e' },
  { id: 'game', label: 'Interactive lab', eyebrow: 'Practice that engages', title: 'Preparation can be immersive too.', description: 'Interactive experiences make repetition more useful when a conventional lesson is not enough.', result: 'More ways to build fluency', image: '/screenshots/game.png', icon: Sparkles, group: 'System', accent: '#f472b6' },
]

const groups = ['Career core', 'Work suite', 'System'] as const

export default function ProductSystemTour() {
  const scrubRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState('desktop')
  const activeItem = tourItems.find((item) => item.id === activeId) ?? tourItems[0]
  const activeIndex = tourItems.findIndex((item) => item.id === activeItem.id)
  const activeGroup = activeItem.group
  const visibleItems = tourItems.filter((item) => item.group === activeGroup)
  const { scrollYProgress } = useScroll({ target: scrubRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextIndex = Math.min(tourItems.length - 1, Math.floor(progress * tourItems.length))
    setActiveId((currentId) => currentId === tourItems[nextIndex].id ? currentId : tourItems[nextIndex].id)
  })

  const seekTo = (id: string) => {
    const index = tourItems.findIndex((item) => item.id === id)
    const scrub = scrubRef.current
    if (index < 0 || !scrub) return

    const scrubTop = window.scrollY + scrub.getBoundingClientRect().top
    const scrollableDistance = Math.max(scrub.offsetHeight - window.innerHeight, 1)
    const itemProgress = index / Math.max(tourItems.length - 1, 1)
    window.scrollTo({ top: scrubTop + scrollableDistance * itemProgress, behavior: reduceMotion ? 'auto' : 'smooth' })
    setActiveId(id)
  }

  const selectGroup = (group: (typeof groups)[number]) => {
    seekTo(tourItems.find((item) => item.group === group)?.id ?? 'desktop')
  }

  const move = (direction: number) => {
    const nextIndex = Math.min(tourItems.length - 1, Math.max(0, activeIndex + direction))
    seekTo(tourItems[nextIndex].id)
  }

  const skipToLast = () => {
    seekTo(tourItems[tourItems.length - 1].id)
  }

  return (
    <section id="product" className="relative scroll-mt-16 overflow-clip border-y border-white/8 bg-[#050608] pt-24 sm:pt-32 lg:scroll-mt-20">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[64px_64px] mask-[linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
      <div className="relative mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 pb-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300">
              <span className="h-px w-8 bg-cyan-300/70" /> Real product. Real workflows.
            </div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-white sm:text-6xl lg:text-7xl">
              Your career now has an <span className="text-cyan-300">operating system.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Not a chatbot with more buttons. SmartyAI connects strategy, learning, practice, applications, files, and action inside one macOS-inspired workspace.
          </p>
        </div>
      </div>

      <div ref={scrubRef} className="relative" style={{ height: `calc(100dvh + ${(tourItems.length - 1) * 35}dvh)` }}>
        <div data-active-tour-item={activeItem.id} className="sticky top-[calc(4rem+env(safe-area-inset-top))] flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] items-center overflow-hidden py-3 sm:py-5 lg:top-[calc(5rem+env(safe-area-inset-top))] lg:h-[calc(100dvh-5rem-env(safe-area-inset-top))] [@media(max-height:600px)]:py-2">
          <div className="relative mx-auto w-full max-w-375 px-5 sm:px-8 lg:px-12">
        <div className="mb-3 flex flex-col justify-between gap-3 border-y border-white/10 py-3 lg:mb-5 lg:flex-row lg:items-center lg:py-4 [@media(max-height:600px)]:mb-2 [@media(max-height:600px)]:flex-row [@media(max-height:600px)]:items-center [@media(max-height:600px)]:py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Product tour categories">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  role="tab"
                  aria-selected={activeGroup === group}
                  onClick={() => selectGroup(group)}
                  className={`shrink-0 px-4 py-2 text-sm font-medium transition ${activeGroup === group ? 'bg-white text-black' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}
                >
                  {group}
                </button>
              ))}
            </div>
            <button type="button" onClick={skipToLast} title="Skip to last product" className="flex h-10 shrink-0 items-center gap-2 border border-white/12 px-3 text-xs font-medium text-white/55 transition hover:border-white/30 hover:bg-white hover:text-black sm:px-4" aria-label="Skip to last product">
              <span className="sm:hidden">Skip</span>
              <span className="hidden sm:inline">Skip to last</span>
              <ChevronsDown className="h-4 w-4" />
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-white/35 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Scroll to explore all 18 live product surfaces
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[360px_minmax(0,1fr)] [@media(min-width:640px)_and_(max-height:600px)]:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex min-h-0 min-w-0 flex-col justify-between py-1 lg:h-[min(62dvh,620px)] lg:py-2 [@media(max-height:600px)]:h-[58dvh]">
            <motion.div
              key={activeItem.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
                <div className="mb-4 flex items-center gap-3 sm:mb-8 [@media(max-height:600px)]:mb-3">
                  <span className="text-sm tabular-nums text-white/30">{String(activeIndex + 1).padStart(2, '0')} / {tourItems.length}</span>
                  <span className="h-px flex-1 bg-white/10" />
                  <activeItem.icon className="h-5 w-5" style={{ color: activeItem.accent }} />
                </div>
                <p className="mb-3 text-xs font-semibold uppercase" style={{ color: activeItem.accent }}>{activeItem.eyebrow}</p>
                <h3 className="max-w-full wrap-break-word text-2xl font-semibold leading-tight text-white sm:text-4xl [@media(max-height:600px)]:text-2xl">{activeItem.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50 sm:mt-5 sm:text-base sm:leading-7 [@media(max-height:600px)]:hidden">{activeItem.description}</p>
                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-white/75 sm:mt-8 sm:pt-5 [@media(max-height:600px)]:mt-3 [@media(max-height:600px)]:pt-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>
                  {activeItem.result}
                </div>
            </motion.div>

            <div className="mt-4 lg:mt-10 [@media(max-height:600px)]:mt-2">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:mb-5 lg:flex-wrap">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => seekTo(item.id)}
                    className={`flex h-9 shrink-0 items-center gap-2 border px-3 text-xs transition ${item.id === activeItem.id ? 'border-white/30 bg-white/10 text-white' : 'border-white/8 text-white/35 hover:border-white/20 hover:text-white/75'}`}
                  >
                    <item.icon className="h-3.5 w-3.5" /> {item.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label="Previous product" className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/55 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(1)} disabled={activeIndex === tourItems.length - 1} aria-label="Next product" className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/55 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div
            className="group relative min-w-0 overflow-hidden border border-white/12 bg-[#0b0d10] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
          >
            <div className="flex h-11 items-center justify-between border-b border-white/8 bg-[#15171a] px-4">
              <div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
              <span className="text-xs font-medium text-white/45">{activeItem.label} · SmartyAI</span>
              <ArrowUpRight className="h-4 w-4 text-white/25" />
            </div>
            <div className="relative h-[min(24dvh,220px)] w-full overflow-hidden bg-black sm:h-[min(38dvh,420px)] lg:h-[min(62dvh,620px)] [@media(max-height:600px)]:h-[52dvh]">
              <motion.div
                key={activeItem.image}
                className="absolute inset-0"
                initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={activeItem.image} alt={`${activeItem.label} inside SmartyAI`} fill priority={activeItem.id === 'desktop'} sizes="(max-width: 1024px) 100vw, 72vw" className="object-contain" />
              </motion.div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/45 to-transparent pointer-events-none" />
          </div>
        </div>
        <div className="mt-3 h-px overflow-hidden bg-white/10">
          <motion.div className="h-full origin-left bg-cyan-300" style={{ scaleX: scrollYProgress }} />
        </div>
          </div>
        </div>
      </div>
    </section>
  )
}