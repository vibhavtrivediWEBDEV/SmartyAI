'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Youtube } from 'lucide-react'

export default function YoutubeLearning() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      id="youtube"
      ref={containerRef}
      className="relative py-32 lg:py-48 bg-black overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Turn the internet
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-8">
            into your curriculum.
          </p>
        </motion.div>

        {/* Flow */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Visual Flow */}
          <div className="flex flex-col items-center">
            {/* Job Requirement */}
            <div className="w-full max-w-md mb-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6 text-center">
                <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Job Requirement</div>
                <div className="text-lg text-white/90">React Performance</div>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
            
            {/* SmartyAI */}
            <div className="w-full max-w-xs mb-4">
              <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="text-lg font-semibold text-white mb-1">SmartyAI</div>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
            
            {/* Relevant Videos */}
            <div className="w-full max-w-md mb-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-2 justify-center mb-4">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-white/60">Relevant Videos</span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className="w-24 h-14 bg-white/[0.05] rounded flex items-center justify-center">
                        <Youtube className="w-5 h-5 text-white/30" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/70">React Performance Optimization</div>
                        <div className="text-xs text-white/40">12:34</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
            
            {/* Learning Playlist */}
            <div className="w-full max-w-md mb-4">
              <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-6 text-center">
                <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Learning Playlist</div>
                <div className="text-lg text-emerald-400 font-medium">Added to Calendar</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-white/60">
            SmartyAI orchestrates your learning from the web.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
