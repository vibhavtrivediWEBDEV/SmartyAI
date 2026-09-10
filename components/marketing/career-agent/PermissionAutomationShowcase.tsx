'use client'

import Image from 'next/image'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  ChevronsDown,
  Check,
  ChevronRight,
  FileCheck2,
  FileSearch,
  FolderOpen,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Send,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react'

type Story = 'local' | 'remote'

const stories = {
  local: {
    label: 'On this Mac',
    icon: TerminalSquare,
    eyebrow: 'Terminal to Finder',
    title: 'Find the document you forgot existed.',
    description: 'Ask naturally. SmartyAI requests one scoped permission, searches your Mac, and returns the result without uploading the rest of your files.',
    command: 'Find my PAN card. I cannot remember where I saved it.',
    result: 'PAN_Card_Final.pdf',
    location: '~/Documents/Personal/KYC/',
    image: '/screenshots/terminal.png',
    imageAlt: 'SmartyAI Terminal running on the desktop',
    accent: '#a3e635',
  },
  remote: {
    label: 'Remote request',
    icon: Mic2,
    eyebrow: 'Telegram to desktop',
    title: 'Your desktop can act while you are away.',
    description: 'Send a voice request from Telegram. Your Mac receives the command, pauses for remote approval, then finds and delivers only the selected file.',
    command: 'Find my March salary slip and send it to Riya on Telegram.',
    result: 'Salary_Slip_March_2026.pdf',
    location: '~/Downloads/Payroll/',
    image: '/screenshots/finder.png',
    imageAlt: 'SmartyAI Finder showing files on the desktop',
    accent: '#38bdf8',
  },
} as const

const flow = [
  { number: '01', label: 'Understand', detail: 'Resolve the request and destination' },
  { number: '02', label: 'Ask', detail: 'Pause at the permission boundary' },
  { number: '03', label: 'Search', detail: 'Check only approved locations' },
  { number: '04', label: 'Act', detail: 'Use only the selected result' },
]

export default function PermissionAutomationShowcase() {
  const scrubRef = useRef<HTMLDivElement>(null)
  const [activeStory, setActiveStory] = useState<Story>('local')
  const reduceMotion = useReducedMotion()
  const story = stories[activeStory]
  const storyKeys = Object.keys(stories) as Story[]
  const { scrollYProgress } = useScroll({ target: scrubRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextIndex = Math.min(storyKeys.length - 1, Math.floor(progress * storyKeys.length))
    setActiveStory((currentStory) => currentStory === storyKeys[nextIndex] ? currentStory : storyKeys[nextIndex])
  })

  const seekToStory = (key: Story) => {
    const scrub = scrubRef.current
    if (!scrub) return

    const index = storyKeys.indexOf(key)
    const scrubTop = window.scrollY + scrub.getBoundingClientRect().top
    const scrollableDistance = Math.max(scrub.offsetHeight - window.innerHeight, 1)
    window.scrollTo({
      top: scrubTop + scrollableDistance * index,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    setActiveStory(key)
  }

  const skipToLast = () => {
    seekToStory(storyKeys[storyKeys.length - 1])
  }

  return (
    <section id="automation" className="relative scroll-mt-16 overflow-clip border-y border-white/8 bg-[#080a0c] pt-24 sm:pt-32 lg:scroll-mt-20">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(163,230,53,0.06),transparent_34%,transparent_66%,rgba(56,189,248,0.07))]" />
      <div className="relative mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-lime-300">
              <span className="h-px w-8 bg-lime-300/70" /> The OS layer
            </div>
            <h2 className="max-w-5xl text-4xl font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
              It does not just answer. <span className="text-white/35">It operates your Mac.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/55 sm:text-lg">
            One execution engine connects Terminal, Telegram, Finder, and messaging. Every sensitive action stops for your permission before it touches a file or sends anything.
          </p>
        </div>

        <div className="grid border-b border-white/10 lg:grid-cols-4">
          {flow.map((step) => (
            <div key={step.number} className="border-white/10 py-5 lg:border-r lg:px-6 first:pl-0 last:border-r-0">
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-xs text-white/25">{step.number}</span>
                <span className="text-sm font-semibold text-white">{step.label}</span>
              </div>
              <p className="text-xs leading-5 text-white/40">{step.detail}</p>
            </div>
          ))}
        </div>

      </div>

      <div ref={scrubRef} className="relative" style={{ height: '180dvh' }}>
        <div data-active-automation-story={activeStory} className="sticky top-[calc(4rem+env(safe-area-inset-top))] flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] items-center overflow-hidden py-3 lg:top-[calc(5rem+env(safe-area-inset-top))] lg:h-[calc(100dvh-5rem-env(safe-area-inset-top))] [@media(max-height:600px)]:py-2">
          <div className="relative mx-auto w-full max-w-375 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Automation examples">
          {(Object.keys(stories) as Story[]).map((key) => {
            const item = stories[key]
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeStory === key}
                onClick={() => seekToStory(key)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition sm:px-5 ${activeStory === key ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{key === 'local' ? 'Local' : 'Remote'}</span>
                <span className="hidden truncate sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>
        <button type="button" onClick={skipToLast} title="Skip to last automation" className="flex h-12 shrink-0 items-center gap-2 border border-white/12 px-3 text-xs font-medium text-white/55 transition hover:border-white/30 hover:bg-white hover:text-black sm:px-4" aria-label="Skip to last automation">
          <span className="sm:hidden">Skip</span>
          <span className="hidden sm:inline">Skip to last</span>
          <ChevronsDown className="h-4 w-4" />
        </button>
        </div>

        <motion.div
          key={activeStory}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 grid min-w-0 overflow-hidden border border-white/12 bg-[#0d0f12] xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] [@media(max-height:600px)]:mt-2 [@media(min-width:640px)_and_(max-height:600px)]:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]"
        >
            <div className="min-w-0 border-b border-white/10 xl:border-r xl:border-b-0">
              <div className="flex h-12 items-center justify-between border-b border-white/8 bg-[#17191c] px-4">
                <div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
                <span className="text-xs text-white/40">{story.eyebrow}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Mac online</span>
              </div>
              <div className="relative h-[20dvh] overflow-hidden bg-black sm:h-[28dvh] xl:aspect-16/10 xl:h-auto [@media(max-height:600px)]:h-[50dvh]">
                <Image src={story.image} alt={story.imageAlt} fill sizes="(max-width: 1280px) 100vw, 58vw" className="object-contain" />
                <div className="absolute inset-x-3 bottom-3 border border-white/15 bg-black/88 p-3 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase text-white/35">
                    {activeStory === 'local' ? <TerminalSquare className="h-3.5 w-3.5" /> : <Mic2 className="h-3.5 w-3.5" />}
                    {activeStory === 'local' ? 'smarty terminal' : 'telegram voice · transcribed'}
                  </div>
                  <p className="text-xs leading-5 text-white sm:text-sm">“{story.command}”</p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:p-8 [@media(max-height:600px)]:p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: story.accent }}>{story.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight text-white sm:text-3xl [@media(max-height:600px)]:text-lg">{story.title}</h3>
                </div>
                <ShieldCheck className="h-7 w-7 shrink-0 text-emerald-300" />
              </div>
              <p className="mt-4 hidden text-sm leading-6 text-white/45 sm:block [@media(max-height:600px)]:hidden">{story.description}</p>

              <div className="mt-4 border border-amber-300/20 bg-amber-300/5 p-3 sm:mt-6 sm:p-4 [@media(max-height:600px)]:mt-2 [@media(max-height:600px)]:p-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-amber-300/10 text-amber-200"><LockKeyhole className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">Permission required</p>
                      <span className="text-[10px] uppercase text-amber-200/70">Awaiting approval</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/45 [@media(max-height:600px)]:hidden">
                      Search Desktop, Documents, and Downloads for one matching document.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
                      <span className="bg-white px-3 py-1.5 text-[11px] font-semibold text-black">Allow once</span>
                      <span className="border border-white/12 px-3 py-1.5 text-[11px] text-white/55">Always allow</span>
                      <span className="px-2 py-1.5 text-[11px] text-white/30">Deny</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 border border-emerald-300/18 bg-emerald-300/5 p-3 sm:mt-4 sm:p-4 [@media(max-height:600px)]:mt-2 [@media(max-height:600px)]:p-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-300/10 text-emerald-300"><FileCheck2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 break-all text-sm font-semibold text-white">{story.result}</p>
                      <span className="shrink-0 text-[10px] text-emerald-300">1 match</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] text-white/30">{story.location}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 hidden grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid [@media(max-height:600px)]:hidden">
                {[
                  { label: 'Inspect result', icon: FileSearch },
                  { label: 'Keep private', icon: LockKeyhole },
                  { label: 'Send to Telegram', icon: Send },
                  { label: 'Send to WhatsApp', icon: MessageCircle },
                ].map((action) => (
                  <div key={action.label} className="flex min-h-12 items-center justify-between gap-2 bg-[#111316] px-3 text-[11px] text-white/60 sm:px-4 sm:text-xs">
                    <span className="flex min-w-0 items-center gap-2"><action.icon className="h-3.5 w-3.5 shrink-0" /><span>{action.label}</span></span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-white/35 sm:pt-6 [@media(max-height:600px)]:hidden">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                The command pauses again before delivery.
              </div>
            </div>
        </motion.div>

        <div className="mt-3 flex flex-col justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/35 sm:flex-row sm:items-center [@media(max-height:600px)]:hidden">
          <span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-lime-300" /> Files stay on your Mac until you choose an action.</span>
          <span>Scoped access · Explicit destinations · Revocable permissions</span>
        </div>
        <div className="mt-3 h-px overflow-hidden bg-white/10">
          <motion.div className="h-full origin-left bg-lime-300" style={{ scaleX: scrollYProgress }} />
        </div>
          </div>
        </div>
      </div>
    </section>
  )
}