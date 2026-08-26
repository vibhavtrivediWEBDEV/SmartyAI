'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Calendar, Youtube, Search, FileSearch, ArrowRight, Cpu, Shield } from 'lucide-react'

export default function AgenticDesktop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const actions = [
    {
      command: "Create a meeting tomorrow at 5 PM.",
      flow: [
        { icon: Calendar, label: "Calendar", desc: "Meeting created" }
      ]
    },
    {
      command: "Open YouTube and search React performance.",
      flow: [
        { icon: Youtube, label: "Desktop", desc: "YouTube opened" },
        { icon: Search, label: "Search", desc: "Results found" }
      ]
    },
    {
      command: "Find my resume.",
      flow: [
        { icon: Cpu, label: "Agent Core", desc: "Processing" },
        { icon: Shield, label: "Capability", desc: "Permission" },
        { icon: FileSearch, label: "Mac filesystem", desc: "Resume found" }
      ]
    }
  ]

  return (
    <section
      id="agentic"
      ref={containerRef}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#03030a]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-gradient-radial from-blue-900/15 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            It can actually
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8">
            do things.
          </p>
          <p className="max-w-3xl mx-auto text-xl text-white/60 font-light">
            SmartyAI is an agent, not just another chat window. It can act on your behalf.
          </p>
        </motion.div>

        {/* Agent Actions */}
        <div className="space-y-12">
          {actions.map((action, sectionIdx) => (
            <motion.div
              key={sectionIdx}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + sectionIdx * 0.2 }}
              className="max-w-4xl mx-auto"
            >
              {/* Command */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg">
                 👤
                </div>
                <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                  <p className="text-white/90">"{action.command}"</p>
                </div>
              </div>

              {/* Flow */}
              <div className="ml-14 flex items-center gap-3 mb-6">
                <ArrowRight className="w-5 h-5 text-white/30 rotate-90" />
                <span className="text-sm font-medium text-blue-400">SmartyAI</span>
              </div>

              {/* Steps */}
              <div className="ml-14 flex flex-wrap items-end gap-4">
                {action.flow.map((step, stepIdx) => {
                  const Icon = step.icon
                  return (
                    <div key={stepIdx} className="flex items-center gap-4">
                      <div className="w-28 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-2">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-xs font-medium text-white/70 mb-1">{step.label}</div>
                        <div className="text-[10px] text-white/40">{step.desc}</div>
                      </div>
                      {stepIdx < action.flow.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-24 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-white/10 px-12 py-8">
            <p className="text-2xl font-semibold text-white">
              SmartyAI is an <span className="text-blue-400">agent</span>.
            </p>
            <p className="text-lg text-white/60 mt-2">
              Not merely an AI assistant.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
