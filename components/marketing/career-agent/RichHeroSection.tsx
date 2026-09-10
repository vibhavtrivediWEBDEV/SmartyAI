'use client'

import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, Play, ShieldCheck, Sparkles, Workflow, Zap } from 'lucide-react'
import { useRef } from 'react'

const outcomes = [
  'Role-specific plan',
  'Adaptive learning',
  'Voice mock interviews',
  'Coding practice',
  'ATS-ready resume',
]

export default function RichHeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const screenshotY = useTransform(scrollYProgress, [0, 1], [0, 110])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 55])

  return (
    <section ref={sectionRef} className="relative min-h-dvh overflow-hidden bg-[#030405] pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-[calc(7rem+env(safe-area-inset-top))] lg:pt-[calc(8rem+env(safe-area-inset-top))] [@media(max-height:600px)]:pt-[calc(4.25rem+env(safe-area-inset-top))]">
      <div className="absolute inset-0">
        <Image
          src="/screenshots/dekstop.png"
          alt="SmartyAI Career operating system desktop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-22 sm:opacity-28"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,4,5,0.96)_0%,rgba(3,4,5,0.87)_30%,rgba(3,4,5,0.48)_68%,rgba(3,4,5,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-size-[120px_100%] opacity-30" />
      </div>

      <motion.div style={reduceMotion ? undefined : { y: copyY }} className="relative z-10 mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-4 inline-flex items-center gap-3 border border-white/12 bg-black/35 px-3 py-2 backdrop-blur-xl sm:mb-7 sm:px-4 [@media(max-height:600px)]:hidden"
          >
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
            <span className="text-xs font-semibold uppercase text-white/65">AI career agent · execution included</span>
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08 }}
            className="text-[42px] font-semibold leading-[0.98] text-white min-[360px]:text-5xl sm:text-7xl lg:text-[92px] [@media(max-height:600px)]:text-4xl"
          >
            The career<br />operating system.
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/58 min-[360px]:text-base sm:mt-7 sm:text-xl sm:leading-8 [@media(max-height:600px)]:mt-3 [@media(max-height:600px)]:line-clamp-2 [@media(max-height:600px)]:text-sm [@media(max-height:600px)]:leading-5"
          >
            Give SmartyAI a role. It builds the strategy, teaches the missing skills, runs realistic interviews, opens coding tasks, improves your resume, and keeps the entire journey moving.
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.28 }}
            className="mt-5 flex flex-col items-center justify-center gap-2 sm:mt-9 sm:flex-row sm:gap-3 [@media(max-height:600px)]:mt-4"
          >
            <a href="/sign-up" className="group flex h-12 w-full items-center justify-center gap-3 bg-white px-5 text-sm font-semibold text-black transition hover:bg-cyan-200 sm:h-14 sm:w-auto sm:px-7 [@media(max-height:600px)]:h-10">
              Build my career workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <button type="button" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} className="flex h-12 w-full items-center justify-center gap-3 border border-white/15 bg-black/25 px-5 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-white/35 hover:bg-white/8 sm:h-14 sm:w-auto sm:px-7 [@media(max-height:600px)]:h-10">
              <Play className="h-4 w-4 fill-white" /> Explore the real product
            </button>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="mt-8 hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/42 sm:flex [@media(max-height:600px)]:hidden"
          >
            {outcomes.map((outcome) => <span key={outcome} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" />{outcome}</span>)}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        style={reduceMotion ? undefined : { y: screenshotY }}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-3 top-[70dvh] z-10 mx-auto max-w-375 min-[360px]:top-[67dvh] sm:inset-x-8 sm:top-[64dvh] lg:top-[68dvh] lg:px-12 [@media(max-height:600px)]:hidden"
      >
        <div className="relative overflow-hidden border border-white/18 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(56,189,248,0.10)]">
          <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#17191c] px-4">
            <div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-white/40"><Sparkles className="h-3 w-3 text-cyan-300" /> SmartyAI · Career workspace</div>
            <div className="h-2 w-12 rounded-full bg-white/6" />
          </div>
          <div className="relative aspect-16/10 w-full bg-[#090b0d]">
            <Image src="/screenshots/dekstop.png" alt="Full SmartyAI desktop with connected career applications" fill priority sizes="(max-width: 1500px) 96vw, 1440px" className="object-contain" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-11 items-center justify-center gap-5 border-t border-white/8 bg-black/75 px-4 backdrop-blur-xl sm:justify-between">
            <span className="hidden items-center gap-2 text-[11px] text-white/45 sm:flex"><Workflow className="h-3.5 w-3.5 text-cyan-300" /> 18 connected product surfaces</span>
            <div className="flex items-center gap-4 text-[10px] text-white/50 sm:text-xs"><span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-300" /> Acts across apps</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> You stay in control</span></div>
          </div>
        </div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-20 h-24 bg-linear-to-t from-black to-transparent" />
    </section>
  )
}