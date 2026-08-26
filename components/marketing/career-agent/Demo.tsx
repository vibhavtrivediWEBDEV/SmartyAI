'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'

export default function Demo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    "Job analyzed",
    "Skills identified",
    "Resume optimized",
    "Skill gaps found",
    "Learning plan created",
    "Calendar prepared",
    "Coding challenges generated",
    "Interview created",
    "Notes generated",
    "Learning resources found"
  ]

  const jobOptions = [
    "Frontend Developer — React / Next.js",
    "Backend Engineer — Node.js / Python",
    "Full Stack Developer",
    "Senior Software Engineer"
  ]

  const [selectedJob, setSelectedJob] = useState(0)

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length) return prev + 1
          return prev
        })
      }, 600)
      return () => clearInterval(interval)
    }
  }, [isInView])

  return (
    <section
      id="demo"
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
            From Job Description
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
            to Interview Ready.
          </p>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Job Selection */}
          <div className="mb-12">
            <label className="block text-sm text-white/40 mb-4">Select target role:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobOptions.map((job, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedJob(i)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedJob === i 
                      ? 'bg-blue-500/10 border-blue-500/30 text-white' 
                      : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/[0.12]'
                  }`}
                >
                  {job}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
            <div className="flex items-center gap-2 mb-8">
              {currentStep > 0 && currentStep <= steps.length ? (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Generating...</span>
                </>
              ) : currentStep > steps.length ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Complete</span>
                </>
              ) : (
                <span className="text-sm text-white/40">Ready</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: i < currentStep ? 1 : 0.5,
                    scale: i === currentStep - 1 ? [1, 1.02, 1] : 1
                  }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02]"
                >
                  <CheckCircle2 className={`w-4 h-4 transition-colors ${
                    i < currentStep ? 'text-emerald-400' : 'text-white/20'
                  }`} />
                  <span className={`text-sm transition-colors ${
                    i < currentStep ? 'text-white/80' : 'text-white/40'
                  }`}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Completion Message */}
          {currentStep > steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-8 text-center"
            >
              <div className="inline-block bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl border border-white/10 px-12 py-8">
                <p className="text-3xl font-semibold text-white mb-2">
                  You're not preparing alone anymore.
                </p>
                <p className="text-white/60">SmartyAI has your back.</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
