'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'

export default function FinalCTA() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const reduceMotion = useReducedMotion()

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-t border-white/8 bg-[#050608] py-24 sm:py-32 lg:py-40"
    >
      <div className="absolute inset-0">
        <Image src="/screenshots/dekstop.png" alt="" fill sizes="100vw" className="object-cover opacity-24" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.98)_0%,rgba(5,6,8,0.86)_48%,rgba(5,6,8,0.52)_100%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050608] via-transparent to-[#050608]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-375 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
        <div>
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300"><Sparkles className="h-4 w-4" /> Your workspace is ready</p>
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl"
        >
          Stop preparing across disconnected tabs.
        </motion.h2>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-7 max-w-xl text-lg leading-8 text-white/55"
        >
          Give SmartyAI the opportunity. Open one workspace with the plan, tools, files, and practice already connected.
        </motion.p>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/48">{['Start with a real role', 'Keep every action visible', 'Cancel anytime'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" />{item}</span>)}</div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/sign-up" className="group inline-flex h-14 items-center justify-center gap-3 bg-white px-7 text-sm font-semibold text-black transition hover:bg-cyan-200">Build my career workspace<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
          <button onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })} className="h-14 border border-white/15 bg-black/30 px-7 text-sm font-semibold text-white transition hover:bg-white/8">Explore product</button>
        </motion.div>
        </div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: 35 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.9, delay: 0.1 }} className="overflow-hidden border border-white/15 bg-black shadow-[0_35px_100px_rgba(0,0,0,0.7)]">
          <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#17191c] px-4"><div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div><span className="text-[10px] text-white/38">SmartyAI · Career OS</span><span className="h-1.5 w-10 bg-white/8" /></div>
          <div className="relative aspect-16/10"><Image src="/screenshots/dekstop.png" alt="SmartyAI Career OS desktop ready to use" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-contain" /></div>
        </motion.div>
      </div>
    </section>
  )
}
