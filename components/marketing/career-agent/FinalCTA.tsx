'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={containerRef}
      className="relative py-48 lg:py-64 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#030308] to-black" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />
      
      {/* Abstract Desktop Preview (faded) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl opacity-10 pointer-events-none">
        <div className="bg-[#1a1a1f] rounded-2xl border border-white/10 h-[400px] flex items-center justify-center">
          <div className="text-white/20 text-2xl">SmartyAI Desktop</div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl lg:text-[5rem] font-semibold tracking-tight text-white mb-8"
        >
          Stop preparing randomly.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-xl sm:text-2xl text-white/60 font-light mb-12 max-w-3xl mx-auto"
        >
          Give SmartyAI the job.
          <br />
          Let it build the path to the interview.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="/sign-up"
            className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.5)]"
          >
            Build My Career Workspace
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <button
            onClick={() => {
              document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group inline-flex items-center justify-center px-10 py-5 text-lg font-medium text-white/80 hover:text-white transition-colors"
          >
            Explore SmartyAI
            <ArrowRight className="ml-2 w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        </motion.div>

        {/* Final Architectural Visual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-24 opacity-30"
        >
          <div className="max-w-md mx-auto space-y-4 text-white/50 text-sm">
            <div className="flex items-center justify-center gap-4">
              <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10">YOUR GOAL</span>
              <span className="text-white/30">↓</span>
              <span className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300">SMARTYAI</span>
              <span className="text-white/30">↓</span>
              <span className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">INTERVIEW</span>
            </div>
            <p className="text-xs text-white/30 mt-4">Understands → Plans → Executes → Tracks → You're Ready.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
