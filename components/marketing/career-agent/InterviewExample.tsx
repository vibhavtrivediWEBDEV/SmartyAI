'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Calendar, BookOpen, Code, MessageSquare, Youtube, FileText, Sparkles } from 'lucide-react'

export default function InterviewExample() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [currentDay, setCurrentDay] = useState(0)

  const preparationData = {
    days: [
      {
        day: 1,
        title: "React + JavaScript Fundamentals",
        focus: "Core concepts",
        schedule: [
          { time: "6:00 PM", title: "React Hooks Deep Dive", type: "learning" },
          { time: "7:30 PM", title: "JS Closures & Promises", type: "learning" },
          { time: "9:00 PM", title: "Practice Problems", type: "coding" },
        ]
      },
      {
        day: 2,
        title: "Performance + Next.js",
        focus: "Optimization",
        schedule: [
          { time: "6:00 PM", title: "React Performance Patterns", type: "learning" },
          { time: "7:30 PM", title: "Next.js App Router", type: "learning" },
          { time: "9:00 PM", title: "Build Sample App", type: "coding" },
        ]
      },
      {
        day: 3,
        title: "Coding Problems + System Design",
        focus: "Practice",
        schedule: [
          { time: "6:00 PM", title: "LeetCode-style Problems", type: "coding" },
          { time: "8:00 PM", title: "System Design Basics", type: "learning" },
          { time: "9:30 PM", title: "Review Notes", type: "notes" },
        ]
      },
      {
        day: 4,
        title: "Mock Interview + Final Revision",
        focus: "Confidence",
        schedule: [
          { time: "5:00 PM", title: "Mock Interview", type: "interview" },
          { time: "7:00 PM", title: "Feedback Review", type: "review" },
          { time: "8:00 PM", title: "Final Prep", type: "notes" },
        ]
      }
    ],
    generated: [
      { label: "Calendar events", count: 12, icon: Calendar },
      { label: "Notes created", count: 8, icon: FileText },
      { label: "Coding exercises", count: 15, icon: Code },
      { label: "Teacher lessons", count: 6, icon: BookOpen },
      { label: "Interview questions", count: 24, icon: MessageSquare },
      { label: "YouTube resources", count: 10, icon: Youtube },
    ]
  }

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCurrentDay(prev => (prev + 1) % 4)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isInView])

  return (
    <section
      id="example"
      ref={containerRef}
      className="relative py-32 lg:py-48 bg-black overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-black to-[#0a0a12]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Imagine your interview is in 4 days.
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-light">
            SmartyAI handles the entire preparation journey.
          </p>
        </motion.div>

        {/* 4-Day Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          {/* Days Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {preparationData.days.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                onClick={() => setCurrentDay(i)}
                className={`
                  relative cursor-pointer rounded-2xl border transition-all duration-300 p-6
                  ${currentDay === i 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    currentDay === i ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/60'
                  }`}>
                    {day.day}
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wider ${
                    currentDay === i ? 'text-blue-400' : 'text-white/40'
                  }`}>
                    Day {day.day}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{day.title}</h3>
                <p className="text-sm text-white/50">{day.focus}</p>
                
                {currentDay === i && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Day Detail */}
          <motion.div
            key={currentDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8"
          >
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Day {preparationData.days[currentDay].day} Schedule
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {preparationData.days[currentDay].schedule.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-sm font-mono text-white/40 w-20">{item.time}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'learning' ? 'bg-blue-500' :
                    item.type === 'coding' ? 'bg-purple-500' :
                    item.type === 'interview' ? 'bg-emerald-500' :
                    item.type === 'review' ? 'bg-amber-500' :
                    'bg-white/30'
                  }`} />
                  <span className="text-sm text-white/80">{item.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Generated Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h3 className="text-2xl font-semibold text-white text-center mb-12">
            SmartyAI automatically creates:
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {preparationData.generated.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                  className="text-center p-4"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{item.count}</div>
                  <div className="text-xs text-white/50">{item.label}</div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 text-center"
        >
          <p className="text-3xl sm:text-4xl font-semibold text-white">
            You understand the value in 10 seconds.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
