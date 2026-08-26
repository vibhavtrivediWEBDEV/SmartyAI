'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { MessageSquare, Terminal, Mic, Monitor, Cpu } from 'lucide-react'

export default function MultiPlatform() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const platforms = [
    { 
      name: "Telegram", 
      icon: "📱", 
      Icon: MessageSquare, 
      example: {
        user: "What should I study tonight?",
        agent: "You have React performance scheduled at 7 PM. Your weak area is memoization, so I prepared a 35-minute lesson."
      }
    },
    { 
      name: "Terminal", 
      icon: "⌨️", 
      Icon: Terminal, 
      example: {
        user: "Open my coding practice.",
        agent: "Opening workspace: react-performance..."
      }
    },
    { 
      name: "Voice", 
      icon: "🎤", 
      Icon: Mic, 
      example: {
        user: "Start my mock interview.",
        agent: "Starting interview session. Remember: speak clearly."
      }
    },
    { 
      name: "Desktop", 
      icon: "🖥️", 
      Icon: Monitor, 
      example: {
        agent: "Visual progress and workspace."
      }
    },
  ]

  return (
    <section
      id="platforms"
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
            Your Career Agent isn't trapped
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8">
            inside one window.
          </p>
        </motion.div>

        {/* Architecture Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          {/* Platform Connections */}
          <div className="max-w-3xl mx-auto">
            {/* Top Row: Platforms */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {platforms.map((platform, i) => {
                const Icon = platform.Icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                      <Icon className="w-7 h-7 text-white/60" />
                    </div>
                    <span className="text-sm text-white/50">{platform.name}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Connecting Lines */}
            <div className="relative h-20 mb-8">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="xMidYMid meet">
                {/* Lines from platforms to center */}
                <line x1="50" y1="0" x2="200" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
                <line x1="150" y1="0" x2="200" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
                <line x1="250" y1="0" x2="200" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
                <line x1="350" y1="0" x2="200" y2="40" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
                
                {/* Line from center to bottom */}
                <line x1="200" y1="60" x2="200" y2="80" stroke="url(#lineGradient)" strokeWidth="1" opacity="0.3" />
                
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center Agent Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Label */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-white mb-2">Career Agent</h3>
              <p className="text-white/40">Same agent. Different interfaces.</p>
            </div>
          </div>
        </motion.div>

        {/* Example Interactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, i) => {
            const Icon = platform.Icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-white/60" />
                  <span className="text-sm font-medium text-white">{platform.name}</span>
                </div>
                
                {platform.example.user && (
                  <div className="mb-4">
                    <div className="text-xs text-white/30 mb-1">You</div>
                    <p className="text-sm text-white/70">"{platform.example.user}"</p>
                  </div>
                )}
                
                {platform.example.agent && (
                  <div>
                    <div className="text-xs text-white/30 mb-1">SmartyAI</div>
                    <p className="text-sm text-blue-300">"{platform.example.agent}"</p>
                  </div>
                )}
                
                {!platform.example.user && !platform.example.agent && platform.example.agent && (
                  <div className="text-sm text-white/60">{platform.example.agent}</div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
