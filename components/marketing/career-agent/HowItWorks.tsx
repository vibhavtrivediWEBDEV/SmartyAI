'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { 
  Target, 
  BookOpen, 
  MessageSquare, 
  Code, 
  Calendar, 
  FileText, 
  Youtube,
  Mail,
  ArrowRight
} from 'lucide-react'

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: "Job Description",
      subtitle: "Understanding your opportunity",
      icon: Target,
      details: ["React", "Next.js", "TypeScript", "Performance", "System Design"],
      color: "blue"
    },
    {
      title: "Skill Analysis",
      subtitle: "Finding the gaps",
      icon: BookOpen,
      details: ["Your skills analyzed", "Requirements matched", "Gaps identified"],
      color: "cyan"
    },
    {
      title: "Preparation Plan",
      subtitle: "Building your system",
      icon: Calendar,
      details: ["Learning schedule", "Practice sessions", "Mock interviews"],
      color: "emerald"
    }
  ]

  const capabilities = [
    { name: "Resume", icon: FileText, desc: "optimize for role" },
    { name: "Teacher", icon: BookOpen, desc: "teach weak topics" },
    { name: "Interview", icon: MessageSquare, desc: "create role-specific mock" },
    { name: "VS Code", icon: Code, desc: "generate coding practice" },
    { name: "Notes", icon: FileText, desc: "create interview notes" },
    { name: "Calendar", icon: Calendar, desc: "schedule preparation" },
    { name: "YouTube", icon: Youtube, desc: "build learning playlist" },
    { name: "Mail", icon: Mail, desc: "handle career communication" },
  ]

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-32 lg:py-48 bg-black overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a12] to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Give it a goal.
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-light">
            SmartyAI builds the system.
          </p>
        </motion.div>

        {/* Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-24"
        >
          {/* User Input */}
          <div className="flex justify-center mb-12">
            <div className="max-w-xl w-full bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <div className="text-sm text-white/40 mb-1">You</div>
                  <p className="text-lg text-white/90">
                    "I have a frontend developer interview in 4 days."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center mb-12">
            <ArrowRight className="w-8 h-8 text-white/20 rotate-90" />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  className="relative"
                >
                  <div 
                    className={`h-full bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-colors`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${step.color}-400`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-white/50 mb-4">{step.subtitle}</p>
                    
                    <div className="space-y-2">
                      {step.details.map((detail, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${step.color}-500`} />
                          <span className="text-white/70">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Connector (except last) */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 w-6 h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Result: Preparation System */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-medium">Preparation system created</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Capabilities Flow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h3 className="text-2xl font-semibold text-white text-center mb-12">
            One Agent. Many Capabilities.
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.05 }}
                  className="group bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                >
                  <Icon className="w-6 h-6 text-blue-400 mb-3" />
                  <div className="text-sm font-medium text-white mb-1">{cap.name}</div>
                  <div className="text-xs text-white/40">→ {cap.desc}</div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 text-center"
        >
          <p className="text-xl sm:text-2xl text-white/60 font-light italic">
            One intelligent workflow. Not ten products.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
