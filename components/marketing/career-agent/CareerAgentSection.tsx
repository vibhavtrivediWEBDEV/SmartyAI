'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Briefcase, 
  Search, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Code, 
  MessageSquare, 
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function CareerAgentSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const timelineSteps = [
    { icon: Briefcase, label: "Job Found", status: "complete" },
    { icon: Search, label: "Job Analysed", status: "complete" },
    { icon: FileText, label: "Resume Optimized", status: "complete" },
    { icon: BarChart3, label: "Skill Gaps Identified", status: "complete" },
    { icon: BookOpen, label: "Learning Plan Created", status: "complete" },
    { icon: Code, label: "Coding Practice Generated", status: "current" },
    { icon: MessageSquare, label: "Interview Created", status: "pending" },
    { icon: Calendar, label: "Calendar Scheduled", status: "pending" },
    { icon: BarChart3, label: "Daily Progress Tracked", status: "pending" },
    { icon: CheckCircle2, label: "Interview Ready", status: "pending" },
  ]

  return (
    <section
      id="career-agent"
      ref={containerRef}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1500px] h-[800px] bg-gradient-radial from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Meet your Career Agent.
          </h2>
          <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-white/60 font-light">
            Your Career Agent stays with you throughout the job search — from the first job description to the final interview.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
          
          {/* Timeline Steps */}
          <div className="space-y-8">
            {timelineSteps.map((step, i) => {
              const Icon = step.icon
              const isComplete = step.status === "complete"
              const isCurrent = step.status === "current"
              const isLeft = i % 2 === 0
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                  className={`relative flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Content Card */}
                  <div className={`w-[calc(50%-3rem)] ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className={`
                      inline-flex items-center gap-3 px-5 py-3 rounded-full 
                      ${isComplete 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : isCurrent 
                          ? 'bg-blue-500/10 border border-blue-500/30' 
                          : 'bg-white/[0.02] border border-white/[0.06]'
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${
                        isComplete ? 'text-emerald-400' : 
                        isCurrent ? 'text-blue-400' : 
                        'text-white/40'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isComplete ? 'text-emerald-400' : 
                        isCurrent ? 'text-blue-300' : 
                        'text-white/60'
                      }`}>
                        {step.label}
                      </span>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {isCurrent && <Clock className="w-4 h-4 text-blue-400 animate-pulse" />}
                    </div>
                  </div>
                  
                  {/* Center Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10">
                    <div className={`
                      w-4 h-4 rounded-full 
                      ${isComplete 
                        ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : isCurrent 
                          ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' 
                          : 'bg-white/10 border border-white/20'
                      }
                    `} />
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Key Differentiator */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-24 text-center"
        >
          <div className="inline-block">
            <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-white/10 p-8 max-w-3xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-400 text-sm font-medium uppercase tracking-wider">Key Differentiator</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                SmartyAI doesn't just answer you.
              </h3>
              <p className="text-xl text-white/60 font-light">
                SmartyAI works for you.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
