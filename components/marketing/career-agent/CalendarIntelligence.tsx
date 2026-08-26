'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Calendar } from 'lucide-react'

export default function CalendarIntelligence() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const weekSchedule = [
    { day: "Monday", title: "React revision", color: "blue" },
    { day: "Tuesday", title: "Next.js + TypeScript", color: "cyan" },
    { day: "Wednesday", title: "Coding practice", color: "purple" },
    { day: "Thursday", title: "Mock interview", color: "emerald" },
    { day: "Friday", title: "Final revision", color: "emerald" },
  ]

  return (
    <section
      id="calendar"
      ref={containerRef}
      className="relative py-32 lg:py-48 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050508]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Your preparation
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
            becomes a schedule.
          </p>
        </motion.div>

        {/* Example Interaction */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          {/* User Input */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg">
             👤
            </div>
            <div className="flex-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <p className="text-white/80">"Interview Friday at 5 PM."</p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="text-sm text-white/40">SmartyAI automatically creates:</div>
          </motion.div>
        </motion.div>

        {/* Weekly Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Preparation Week</h3>
              </div>
              <div className="text-sm text-white/40">Interview: Friday, 5:00 PM</div>
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {weekSchedule.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="text-xs text-white/40 mb-2">{item.day}</div>
                  <div className={`w-2 h-2 rounded-full bg-${item.color}-500 mb-2`} />
                  <div className="text-sm text-white/80">{item.title}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-white/60">
            Calendar becomes part of the Career Agent's{" "}
            <span className="text-white font-medium">execution system.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
