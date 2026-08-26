'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, AlertTriangle, BookOpen, Target } from 'lucide-react'

export default function AITeacher() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const jobRequires = [
    { name: "React", status: "known" },
    { name: "Next.js", status: "partial" },
    { name: "TypeScript", status: "known" },
    { name: "Performance", status: "unknown" },
  ]

  const preparation = [
    { topic: "React", status: "done" },
    { topic: "TypeScript", status: "done" },
    { topic: "Next.js App Router", status: "needs-work" },
    { topic: "React performance", status: "needs-work" },
    { topic: "Server Components", status: "needs-work" },
  ]

  return (
    <section
      id="teacher"
      ref={containerRef}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Don't just practice.
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8">
            Understand.
          </p>
          <p className="max-w-3xl mx-auto text-xl text-white/60 font-light">
            SmartyAI's Teacher uses the job description and your current knowledge to determine what you should learn — not everything on the internet.
          </p>
        </motion.div>

        {/* Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Job Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Job Requirements</h3>
              </div>
              
              <div className="space-y-3">
                {jobRequires.map((skill, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      skill.status === 'known' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : skill.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {skill.status === 'known' ? '✓' : skill.status === 'partial' ? '~' : '?'}
                    </div>
                    <span className="text-white/90">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Your Preparation */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Your Preparation</h3>
              </div>
              
              <div className="space-y-3">
                {preparation.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      {item.status === 'done' ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      )}
                      <span className={item.status === 'done' ? 'text-white/70' : 'text-white/90'}>
                        {item.topic}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      item.status === 'done' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status === 'done' ? 'Completed' : 'Needs Work'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-transparent via-white/[0.05] to-transparent py-4 px-8 rounded-full">
            <p className="text-lg text-white/70">
              SmartyAI teaches what matters for the job —{" "}
              <span className="text-white font-medium">not everything on the internet.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
