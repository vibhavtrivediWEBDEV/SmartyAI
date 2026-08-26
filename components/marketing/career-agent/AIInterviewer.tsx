'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { MessageSquare, BarChart3, BookOpen, ChevronRight } from 'lucide-react'

export default function AIInterviewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const evaluation = {
    scores: [
      { label: "Technical accuracy", value: 82 },
      { label: "Communication", value: 74 },
      { label: "Depth", value: 61 },
    ],
    recommendations: ["React rendering", "memoization", "profiling"]
  }

  return (
    <section
      id="interviewer"
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
            Practice the interview
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-8">
            before the interviewer does.
          </p>
        </motion.div>

        {/* Interview Simulation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Interview Window */}
          <div className="bg-[#0a0a0f] rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#050508] border-b border-white/[0.05]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="ml-4 text-sm text-white/40 font-mono">Interview Agent</span>
              <span className="ml-auto px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                Live
              </span>
            </div>
            
            {/* Content */}
            <div className="p-8">
              {/* Question */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/40 mb-1">Interviewer</div>
                  <div className="bg-white/[0.02] rounded-xl p-6 border border-white/[0.06]">
                    <p className="text-white/90">
                      "Explain how you would optimize a slow React application."
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Answer (visual representation) */}
              <div className="flex items-start gap-4 mb-8 ml-8">
                <div className="flex-1">
                  <div className="text-xs text-white/40 mb-1 text-right">Your answer</div>
                  <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="h-24 bg-gradient-to-b from-white/10 to-transparent rounded" />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg">
                 👤
                </div>
              </div>

              {/* Evaluation */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-lg font-semibold text-white">Evaluation</h4>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {evaluation.scores.map((score, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/60">{score.label}</span>
                        <span className={`text-lg font-semibold ${
                          score.value >= 80 ? 'text-emerald-400' :
                          score.value >= 60 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {score.value}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${score.value}%` } : {}}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className={`h-full rounded-full ${
                            score.value >= 80 ? 'bg-emerald-500' :
                            score.value >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="border-t border-white/[0.06] pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white/50">Recommended next:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.recommendations.map((rec, i) => (
                      <span key={i} className="px-3 py-1.5 text-sm text-blue-300 bg-blue-500/10 rounded-full border border-blue-500/20">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Understands job description",
              "Generates relevant questions",
              "Adapts difficulty",
              "Evaluates answers",
              "Identifies weak areas",
              "Creates follow-ups",
              "Gives feedback",
              "Recommends study topics"
            ].map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
              >
                <ChevronRight className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white/70">{cap}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
