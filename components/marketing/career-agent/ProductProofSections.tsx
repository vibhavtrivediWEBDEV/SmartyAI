'use client'

import Image from 'next/image'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Command, Layers3, Mic2, ShieldCheck, Sparkles, TerminalSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import LatestPublicArtifact from './LatestPublicArtifact'

type Story = {
  id: string
  index: string
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  accent: string
  proof: string[]
  detail: { label: string; value: string }[]
  reverse?: boolean
}

const stories: Story[] = [
  {
    id: 'career-agent',
    index: '01',
    eyebrow: 'Career command center',
    title: 'A plan that behaves like a live product, not a PDF.',
    description: 'Start with a role and a deadline. SmartyAI turns both into a visible mission with priorities, task status, progress, and the next action already prepared.',
    image: '/screenshots/main.png',
    imageAlt: 'SmartyAI career plan with mission progress and tasks',
    accent: '#38bdf8',
    proof: ['Role intelligence', 'Daily priorities', 'Progress evidence'],
    detail: [{ label: 'Input', value: 'Target role' }, { label: 'Output', value: 'Living mission' }],
  },
  {
    id: 'teacher',
    index: '02',
    eyebrow: 'Adaptive learning',
    title: 'The curriculum is generated around the job.',
    description: 'The AI Teacher focuses on the concepts the opportunity actually requires. Lessons, examples, and revision material remain connected to your mission instead of becoming another forgotten course.',
    image: '/screenshots/book.png',
    imageAlt: 'SmartyAI interactive learning book generated for a career goal',
    accent: '#fbbf24',
    proof: ['Gap-based lessons', 'Focused explanations', 'Persistent learning context'],
    detail: [{ label: 'Avoid', value: 'Generic courses' }, { label: 'Learn', value: 'What matters now' }],
    reverse: true,
  },
  {
    id: 'interviewer',
    index: '03',
    eyebrow: 'Interview room',
    title: 'Practice the pressure before it counts.',
    description: 'Enter a dedicated voice interview environment built around the company and role. Speak naturally, receive structured evaluation, and turn weak answers into tomorrow’s work.',
    image: '/screenshots/interview.png',
    imageAlt: 'SmartyAI voice mock interview room with live conversation',
    accent: '#fb7185',
    proof: ['Voice-led sessions', 'Role-specific questions', 'Actionable feedback'],
    detail: [{ label: 'Mode', value: 'Live voice' }, { label: 'Result', value: 'Measured readiness' }],
  },
  {
    id: 'workspace',
    index: '04',
    eyebrow: 'Coding studio',
    title: 'Learning becomes working code in one click.',
    description: 'Every technical task opens in a complete coding workspace with the right files, instructions, console, and execution controls. The context follows you; setup does not slow you down.',
    image: '/screenshots/vscode.png',
    imageAlt: 'SmartyAI coding workspace with files, editor, task and terminal',
    accent: '#2dd4bf',
    proof: ['Prepared workspaces', 'Real file execution', 'Mission-linked tasks'],
    detail: [{ label: 'Setup time', value: 'Near zero' }, { label: 'Evidence', value: 'Working code' }],
    reverse: true,
  },
  {
    id: 'notes-live',
    index: '05',
    eyebrow: 'Career notes',
    title: 'The preparation brief stays visible, structured, and useful.',
    description: 'Published Career notes appear in the same focused Notes interface people use inside SmartyAI. Visitors see real work, while private drafts remain private by default.',
    image: '/screenshots/notes.png',
    imageAlt: 'Latest published SmartyAI Career note',
    accent: '#fbbf24',
    proof: ['Owner-approved publishing', 'Read-only public snapshot', 'Newest publication only'],
    detail: [{ label: 'Surface', value: 'Notes' }, { label: 'Privacy', value: 'Explicit publish' }],
  },
  {
    id: 'youtube-live',
    index: '06',
    eyebrow: 'Learning playlist',
    title: 'The research queue becomes a focused watch list.',
    description: 'Career-generated YouTube topics are grouped into one public learning playlist, showing how the agent turns a role into concrete resources without exposing account data.',
    image: '/screenshots/youtube.png',
    imageAlt: 'Latest published SmartyAI Career YouTube playlist',
    accent: '#ef4444',
    proof: ['Role-focused topics', 'Safe YouTube links', 'Read-only playlist'],
    detail: [{ label: 'Source', value: 'Career Agent' }, { label: 'Items', value: 'Latest playlist' }],
    reverse: true,
  },
  {
    id: 'resume',
    index: '07',
    eyebrow: 'Resume intelligence',
    title: 'See exactly why a resume wins or gets filtered.',
    description: 'The ATS workspace scores alignment, structure, evidence, and readability against the target role. Recommendations stay specific, visible, and under your control.',
    image: '/screenshots/ats.png',
    imageAlt: 'SmartyAI ATS resume analysis and scoring workspace',
    accent: '#a78bfa',
    proof: ['Role alignment', 'Evidence quality', 'Controlled revisions'],
    detail: [{ label: 'Analysis', value: 'Role-specific' }, { label: 'Editing', value: 'Human-approved' }],
  },
]

type PublishedPage = {
  type: 'cover' | 'text' | 'image' | 'end'
  content: { title?: string; subtitle?: string; author?: string; body?: string; question?: string; answer?: string; imageUrl?: string; alt?: string; caption?: string; message?: string }
}

type PublishedBook = { id: string; subject: string; title: string; pages: PublishedPage[]; pageCount: number }

function LatestPublishedBook() {
  const previewRef = useRef<HTMLDivElement>(null)
  const requested = useRef(false)
  const [book, setBook] = useState<PublishedBook | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    const preview = previewRef.current
    if (!preview) return

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || requested.current) return
      requested.current = true
      observer.disconnect()
      void fetch('/api/library/books/latest', { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json().catch(() => null)
          if (!response.ok || !data?.book) throw new Error(data?.error || 'Published book unavailable')
          setBook(data.book)
        })
        .catch(() => setBook(null))
    }, { rootMargin: '200px 0px' })

    observer.observe(preview)
    return () => observer.disconnect()
  }, [])

  const page = book?.pages[pageIndex]
  const pageTotal = book?.pages.length || 0

  return (
    <div ref={previewRef} className="flex h-full min-h-0 flex-col bg-[#111315] text-white">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#17191c] px-3 sm:h-12 sm:px-4">
        <div className="flex min-w-0 items-center gap-2"><BookOpen className="h-4 w-4 shrink-0 text-emerald-400" /><div className="min-w-0"><p className="text-[8px] font-semibold uppercase text-white/30">Latest public edition</p><p className="truncate text-[11px] font-medium text-white/80 sm:text-xs">{book?.title || 'Loading published book...'}</p></div></div>
        <span className="ml-3 shrink-0 rounded border border-emerald-400/20 bg-emerald-400/8 px-2 py-1 text-[8px] font-semibold uppercase text-emerald-300">Read only</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-[linear-gradient(135deg,#13231e,#16181c_58%,#272113)]">
        {!page ? (
          <div className="flex h-full items-center justify-center text-xs text-white/35">Loading the latest published book...</div>
        ) : page.type === 'cover' ? (
          <div className="relative flex h-full flex-col items-center justify-center px-8 text-center"><div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-400" /><BookOpen className="mb-4 h-8 w-8 text-emerald-400 sm:h-10 sm:w-10" /><h3 className="max-w-xl font-serif text-2xl font-medium leading-tight sm:text-4xl">{page.content.title || book?.title}</h3><div className="mt-4 h-px w-12 bg-amber-300" /><p className="mt-4 max-w-md text-xs leading-5 text-white/55 sm:text-sm">{page.content.subtitle || book?.subject}</p></div>
        ) : page.type === 'image' ? (
          <div className="flex h-full flex-col items-center justify-center p-5">{page.content.imageUrl ? <div className="relative min-h-0 w-full flex-1"><Image src={page.content.imageUrl} alt={page.content.alt || page.content.caption || 'Published book illustration'} fill unoptimized sizes="(max-width: 1024px) 90vw, 55vw" className="object-contain" /></div> : <div className="flex flex-1 items-center justify-center"><BookOpen className="h-12 w-12 text-white/15" /></div>}{page.content.caption && <p className="mt-2 text-center text-[10px] text-white/45">{page.content.caption}</p>}</div>
        ) : page.type === 'end' ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center"><Sparkles className="mb-4 h-8 w-8 text-amber-300" /><p className="font-serif text-2xl font-medium sm:text-3xl">{page.content.message || 'Keep learning.'}</p></div>
        ) : (
          <div className="h-full overflow-y-auto p-6 sm:p-9"><div className="mx-auto max-w-xl">{page.content.question && <p className="mb-2 text-[9px] font-semibold uppercase text-amber-300">Student question</p>}<h3 className="font-serif text-xl font-medium leading-snug sm:text-2xl">{page.content.question || page.content.title}</h3>{page.content.answer && <p className="mt-4 text-[9px] font-semibold uppercase text-emerald-300">Teacher&apos;s answer</p>}<div className="mt-3 space-y-3 text-xs leading-5 text-white/68 sm:text-sm sm:leading-6">{(page.content.answer || page.content.body || '').split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div></div>
        )}
      </div>
      <div className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 bg-[#17191c] px-3">
        <button aria-label="Previous book page" onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0} className="flex h-7 w-7 items-center justify-center border border-white/10 text-white/60 disabled:opacity-20"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="text-[9px] font-semibold uppercase text-white/35">Page {pageTotal ? pageIndex + 1 : 0} / {pageTotal}</span>
        <button aria-label="Next book page" onClick={() => setPageIndex((value) => Math.min(Math.max(0, pageTotal - 1), value + 1))} disabled={!pageTotal || pageIndex >= pageTotal - 1} className="flex h-7 w-7 items-center justify-center border border-white/10 text-white/60 disabled:opacity-20"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

function ProductWindow({ story }: { story: Story }) {
  return (
    <div className="relative min-w-0 overflow-hidden border border-white/14 bg-[#0b0d10] shadow-[0_35px_100px_rgba(0,0,0,0.62)]">
      <div className="flex h-11 items-center justify-between border-b border-white/9 bg-[#17191c] px-4">
        <div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
        <span className="text-[11px] font-medium text-white/42">{story.eyebrow} · SmartyAI</span>
        <ArrowUpRight className="h-4 w-4 text-white/25" />
      </div>
      <div className="relative aspect-16/10 bg-black">
        {story.id === 'teacher' ? <LatestPublishedBook />
          : story.id === 'workspace' ? <LatestPublicArtifact kind="workspace" />
            : story.id === 'notes-live' ? <LatestPublicArtifact kind="note" />
              : story.id === 'youtube-live' ? <LatestPublicArtifact kind="youtube" />
                : <Image src={story.image} alt={story.imageAlt} fill sizes="(max-width: 1024px) 100vw, 62vw" className="object-contain" />}
      </div>
      <div className="grid grid-cols-2 border-t border-white/8 bg-black/75">
        {story.detail.map((item) => <div key={item.label} className="border-r border-white/8 p-4 last:border-r-0"><p className="text-[9px] font-semibold uppercase text-white/28">{item.label}</p><p className="mt-1 text-xs font-medium text-white/72">{item.value}</p></div>)}
      </div>
    </div>
  )
}

function ProductStory({ story }: { story: Story }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const reduceMotion = useReducedMotion()

  return (
    <section id={story.id} ref={ref} className="relative overflow-hidden border-t border-white/7 bg-[#07080a] py-24 sm:py-32 lg:py-40">
      <div className="absolute inset-0 opacity-45" style={{ background: `radial-gradient(circle at ${story.reverse ? '20%' : '80%'} 45%, ${story.accent}18, transparent 34%)` }} />
      <div className="relative mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        <div className={`grid items-center gap-14 lg:grid-cols-[0.82fr_1.38fr] lg:gap-20 ${story.reverse ? 'lg:grid-cols-[1.38fr_0.82fr]' : ''}`}>
          <motion.div initial={reduceMotion ? false : { opacity: 0, x: story.reverse ? 30 : -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.75 }} className={story.reverse ? 'lg:order-2' : ''}>
            <div className="mb-8 flex items-center gap-4"><span className="font-mono text-xs text-white/28">{story.index}</span><span className="h-px w-10" style={{ backgroundColor: story.accent }} /><span className="text-xs font-semibold uppercase" style={{ color: story.accent }}>{story.eyebrow}</span></div>
            <h2 className="text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">{story.title}</h2>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/52 sm:text-lg sm:leading-8">{story.description}</p>
            <div className="mt-9 space-y-3 border-t border-white/9 pt-7">
              {story.proof.map((item) => <div key={item} className="flex items-center gap-3 text-sm text-white/72"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/12"><Check className="h-3 w-3" style={{ color: story.accent }} /></span>{item}</div>)}
            </div>
          </motion.div>
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 34 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, delay: 0.1 }} className={story.reverse ? 'lg:order-1' : ''}><ProductWindow story={story} /></motion.div>
        </div>
      </div>
    </section>
  )
}

const suiteScreens = [
  { src: '/screenshots/finder.png', label: 'Finder', className: 'lg:col-span-7' },
  { src: '/screenshots/notes.png', label: 'Notes', className: 'lg:col-span-5' },
  { src: '/screenshots/mail.png', label: 'Mail', className: 'lg:col-span-4' },
  { src: '/screenshots/table.png', label: 'Data', className: 'lg:col-span-4' },
  { src: '/screenshots/map.png', label: 'Maps', className: 'lg:col-span-4' },
]

function ConnectedSuite() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  return (
    <section id="agentic" ref={ref} className="relative overflow-hidden border-t border-white/8 bg-[#050608] py-24 sm:py-32 lg:py-40">
      <span id="calendar" className="absolute top-0" /><span id="youtube" className="absolute top-0" /><span id="notes" className="absolute top-0" /><span id="platforms" className="absolute top-0" /><span id="demo" className="absolute top-0" />
      <div className="mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14 grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div><p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-300"><Layers3 className="h-4 w-4" /> Connected work suite</p><h2 className="text-4xl font-semibold leading-[1.06] text-white sm:text-6xl lg:text-7xl">The agent does not stop at an answer.<br /><span className="text-white/35">It works across the desktop.</span></h2></div>
          <p className="text-base leading-7 text-white/52 sm:text-lg">Files, notes, mail, maps, data, spreadsheets, media, settings, and terminal tools remain connected to the same career objective.</p>
        </motion.div>
        <div className="grid gap-4 lg:grid-cols-12">
          {suiteScreens.map((screen, index) => (
            <motion.div key={screen.label} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: index * 0.08 }} className={`overflow-hidden border border-white/12 bg-[#111317] ${screen.className}`}>
              <div className="flex h-10 items-center justify-between border-b border-white/8 px-4"><span className="text-xs font-medium text-white/55">{screen.label}</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div>
              <div className="relative aspect-16/10"><Image src={screen.src} alt={`SmartyAI ${screen.label} application`} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-top" /></div>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 grid gap-px bg-white/8 sm:grid-cols-3">
          {[{ icon: Command, value: '18', label: 'Connected product surfaces' }, { icon: TerminalSquare, value: '1', label: 'Shared mission context' }, { icon: ShieldCheck, value: '100%', label: 'Actions remain visible' }].map((item) => <div key={item.label} className="bg-[#090a0c] p-6"><item.icon className="h-5 w-5 text-cyan-300" /><p className="mt-6 text-3xl font-semibold text-white">{item.value}</p><p className="mt-1 text-xs text-white/38">{item.label}</p></div>)}
        </div>
      </div>
    </section>
  )
}

export default function ProductProofSections() {
  return <>{stories.map((story) => <ProductStory key={story.id} story={story} />)}<ConnectedSuite /></>
}