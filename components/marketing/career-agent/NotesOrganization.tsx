'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Folder, ChevronRight } from 'lucide-react'

export default function NotesOrganization() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const notesStructure = {
    name: "Interview Preparation",
    children: [
      {
        name: "React",
        children: [
          { name: "Rendering" },
          { name: "Hooks" },
          { name: "Performance" }
        ]
      },
      {
        name: "Next.js",
        children: [
          { name: "App Router" },
          { name: "Server Components" }
        ]
      },
      { name: "System Design" },
      { name: "Interview Questions" }
    ]
  }

  const renderTree = (node: any, depth = 0) => (
    <div className={`${depth > 0 ? 'ml-4' : ''}`}>
      <div className="flex items-center gap-2 py-2">
        {node.children ? (
          <Folder className="w-4 h-4 text-blue-400" />
        ) : (
          <FileText className="w-4 h-4 text-white/40" />
        )}
        <span className={`${node.children ? 'text-white/80 font-medium' : 'text-white/60'}`}>
          {node.name}
        </span>
      </div>
      {node.children && node.children.map((child: any, i: number) => (
        <div key={i}>
          {renderTree(child, depth + 1)}
        </div>
      ))}
    </div>
  )

  return (
    <section
      id="notes"
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
            Everything you learn
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-8">
            stays organized.
          </p>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          {/* Notes Window */}
          <div className="bg-[#0a0a0f] rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#050508] border-b border-white/[0.05]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="ml-4 text-sm text-white/40 font-mono">Notes</span>
            </div>
            
            {/* Tree View */}
            <div className="p-6">
              {renderTree(notesStructure)}
            </div>
          </div>
        </motion.div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-white/60">
            The Career Agent creates and organizes your preparation material.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
