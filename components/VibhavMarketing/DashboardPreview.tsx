'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Folder, Terminal, Settings, Mail, Calendar, Music, Image, FileText, Code, Globe, MessageSquare, Search, Trash2 } from 'lucide-react'

const dockApps = [
  { id: 'finder', icon: Folder, name: 'Finder', bounce: 0, running: true },
  { id: 'terminal', icon: Terminal, name: 'Terminal', bounce: 0.1, running: true },
  { id: 'vscode', icon: Code, name: 'VS Code', bounce: 0.2, running: true },
  { id: 'mail', icon: Mail, name: 'Mail', bounce: 0.3 },
  { id: 'calendar', icon: Calendar, name: 'Calendar', bounce: 0.4, running: true },
  { id: 'music', icon: Music, name: 'Music', bounce: 0.5, running: true },
  { id: 'photos', icon: Image, name: 'Photos', bounce: 0.6 },
  { id: 'notes', icon: FileText, name: 'Notes', bounce: 0.7 },
  { id: 'safari', icon: Globe, name: 'Safari', bounce: 0.8, running: true },
  { id: 'messages', icon: MessageSquare, name: 'Messages', bounce: 0.9 },
  { id: 'settings', icon: Settings, name: 'Settings', bounce: 1.0 },
]

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-white/15 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-r from-gray-400/15 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            See It In Action
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A glimpse into your future workspace
          </p>
        </motion.div>

        {/* App Store Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 60 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative"
        >
          {/* Image Container */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-white/20">
            <img
              src="/screenshots/appstore.png"
              alt="VibhavMacOS App Store"
              className="w-full h-auto"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-white/20 via-gray-400/20 to-gray-300/20 rounded-[2.5rem] blur-3xl opacity-30 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  )
}
