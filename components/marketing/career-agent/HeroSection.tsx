'use client'

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Play, ChevronRight } from 'lucide-react'

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [mounted, setMounted] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  
  const springConfig = { damping: 20, stiffness: 150 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)
  
  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 50
      const y = (e.clientY - rect.top - rect.height / 2) / 50
      mouseX.set(x)
      mouseY.set(y)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  if (!mounted) return null
  
  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-black"
    >
      {/* Minimal Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2000px] h-[1000px] bg-gradient-to-b from-blue-950/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        
        {/* Mouse Spotlight */}
        <motion.div
          style={{
            x: mouseXSpring,
            y: mouseYSpring
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-blue-500/[0.03] via-transparent to-transparent pointer-events-none"
        />
      </div>
      
      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 lg:px-8"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 lg:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-white/70">AI-Powered Career Agent</span>
          </div>
        </motion.div>
        
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mb-6 lg:mb-8"
        >
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[7rem] font-semibold tracking-[-0.03em] leading-[1.05] bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
            Your Career.
          </span>
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[7rem] font-semibold tracking-[-0.03em] leading-[1.05] bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600/80 bg-clip-text text-transparent">
            On Autopilot.
          </span>
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-3xl mx-auto text-center text-lg sm:text-xl lg:text-2xl text-white/60 font-light leading-relaxed mb-12"
        >
          One AI agent that turns a job opportunity into a complete preparation system.
          <br className="hidden sm:block" />
          <span className="text-white/80">Teaches. Practices. Schedules. Tracks.</span>
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/sign-up"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)]"
          >
            Start Your Career Workspace
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <button
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white/80 hover:text-white transition-colors"
          >
            <Play className="mr-2 w-5 h-5" />
            See How It Works
          </button>
        </motion.div>
        
        {/* Desktop Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 lg:mt-24 w-full max-w-6xl mx-auto"
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50" />
            
            {/* Desktop Window */}
            <div className="relative bg-[#1a1a1f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0f] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-4 text-sm text-white/40 font-mono">SmartyAI</span>
              </div>
              
              {/* Desktop Content */}
              <div className="p-6 lg:p-8">
                {/* Career Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Career Agent Status */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Job Card */}
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Google — Frontend Developer</h3>
                          <p className="text-sm text-white/50">Interview in 4 days</p>
                        </div>
                        <span className="px-3 py-1 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-full">Active</span>
                      </div>
                      
                      {/* Progress */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white/60">Preparation Progress</span>
                          <span className="font-semibold text-white">68%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-[68%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Checklist */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Resume optimized', done: true },
                          { label: 'Interview plan created', done: true },
                          { label: '12 coding questions', done: true },
                          { label: 'Learning topics identified', done: true },
                          { label: 'Mock interview scheduled', done: false },
                          { label: 'Final revision', done: false },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                              {item.done ? (
                                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                              )}
                            </div>
                            <span className={item.done ? 'text-white/70' : 'text-white/40'}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Today's Schedule */}
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
                      <h4 className="text-sm font-medium text-white/50 mb-4">Today's Schedule</h4>
                      <div className="space-y-3">
                        {[
                          { time: '7:00 PM', title: 'React Performance', type: 'learning' },
                          { time: '8:00 PM', title: 'Coding Practice', type: 'coding' },
                          { time: '9:00 PM', title: 'Mock Interview', type: 'interview' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <span className="text-sm font-mono text-white/40 w-20">{item.time}</span>
                            <div className={`w-2 h-2 rounded-full ${item.type === 'learning' ? 'bg-blue-500' : item.type === 'coding' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                            <span className="text-sm text-white/80">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Dock */}
                  <div className="space-y-4">
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
                      <h4 className="text-xs font-medium text-white/40 mb-4 uppercase tracking-wider">Agent Capabilities</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Career Agent', icon: '🎯', active: true },
                          { name: 'AI Teacher', icon: '📚', active: true },
                          { name: 'Interview Agent', icon: '💬', active: true },
                          { name: 'VS Code', icon: '💻', active: true },
                          { name: 'Calendar', icon: '📅', active: true },
                          { name: 'Notes', icon: '📝', active: true },
                          { name: 'Resume', icon: '📄', active: true },
                          { name: 'YouTube', icon: '🎬', active: true },
                        ].map((app, i) => (
                          <div 
                            key={i} 
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${app.active ? 'bg-white/[0.05]' : 'opacity-50'}`}
                          >
                            <span className="text-lg">{app.icon}</span>
                            <span className="text-sm text-white/70">{app.name}</span>
                            {app.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Activity */}
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
                      <h4 className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">Agent Activity</h4>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Analyzing your React skills...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </motion.div>
      </motion.div>
    </section>
  )
}
