'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, ArrowRight, Check, Sparkles } from 'lucide-react'

export default function ResumeATS() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const setupSteps = [
    { label: "Job Description", desc: "Paste the job posting" },
    { label: "AI Analysis", desc: "Extract key requirements" },
    { label: "Resume Analysis", desc: "Analyze your resume" },
    { label: "Missing Skills", desc: "Identify gaps" },
    { label: "Keyword Alignment", desc: "Match terminology" },
    { label: "Experience Optimization", desc: "Frame achievements" },
    { label: "ATS-ready Resume", desc: "Export optimized PDF" },
  ]

  return (
    <section
      id="resume"
      ref={containerRef}
      className="relative py-32 lg:py-48 bg-black overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-black to-[#050508]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Your resume should speak
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
            the language of the job.
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Vertical Flow */}
          <div className="relative flex flex-col items-center">
            {setupSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="w-full max-w-md mb-4"
              >
                <div className="flex items-center gap-4 group">
                  {/* Step Number */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i === 6 
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' 
                      : 'bg-white/[0.05] border border-white/[0.1] text-white/60'
                  }`}>
                    {i === 6 ? <Check className="w-5 h-5" /> : i + 1}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white mb-1">{step.label}</div>
                        <div className="text-sm text-white/40">{step.desc}</div>
                      </div>
                      {i < setupSteps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-white/20 rotate-90 absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100" style={{ position: 'relative' }} />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Connector */}
                {i < setupSteps.length - 1 && (
                  <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent ml-5" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Before/After Example */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Before */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-white/40" />
              <span className="text-sm font-medium text-white/40">Before</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/30 mb-1">Experience</div>
                <p className="text-white/70 text-sm">
                  "Built React applications for clients"
                </p>
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1">Skills</div>
                <p className="text-white/70 text-sm">
                  JavaScript, React, HTML, CSS
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-xs text-red-400">⚠ Missing: Next.js, TypeScript, Performance optimization</span>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 relative overflow-hidden">
            <Sparkles className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">ATS-Optimized</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/30 mb-1">Experience</div>
                <p className="text-white/90 text-sm">
                  "Developed high-performance React applications with Next.js and TypeScript, improving load times by 40%"
                </p>
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1">Skills</div>
                <p className="text-white/90 text-sm">
                  React, Next.js, TypeScript, Performance Optimization, Server Components
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-emerald-400">✓ Keywords aligned with job requirements</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
