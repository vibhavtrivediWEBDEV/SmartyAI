'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  Clock, 
  FolderTree, 
  GitBranch, 
  Timer, 
  CheckCircle2,
  Workflow
} from 'lucide-react'

const productivityFeatures = [
  {
    icon: FolderTree,
    title: 'Smart Organization',
    description: 'AI automatically organizes your files, notes, and projects based on your workflow.',
    metric: '90%',
    metricLabel: 'Time Saved'
  },
  {
    icon: Timer,
    title: 'Time Tracking',
    description: 'Track time across all applications with automatic logging and reports.',
    metric: '2x',
    metricLabel: 'More Productive'
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Every file versioned automatically. Never lose work again.',
    metric: '∞',
    metricLabel: 'Unlimited Versions'
  },
  {
    icon: CheckCircle2,
    title: 'Task Automation',
    description: 'Create workflows that run automatically based on triggers.',
    metric: '5hrs',
    metricLabel: 'Saved Daily'
  }
]

export default function ProductivitySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
            <Workflow className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Productivity</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Work Smarter,
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Intelligent tools designed to amplify your productivity and eliminate repetitive tasks.
          </p>
        </motion.div>

        {/* Productivity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productivityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative p-8 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
            >
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl w-fit mb-6">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {feature.metric}
                  </div>
                  <div className="text-gray-500 text-sm uppercase tracking-wider mt-2">
                    {feature.metricLabel}
                  </div>
                </div>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Workflow Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative p-12 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-white">Automate Everything</h3>
              <p className="text-gray-400">Create intelligent workflows that trigger based on events, time, or conditions.</p>
            </div>
            
            <div className="col-span-2 flex items-center justify-center gap-4">
              {['Trigger', 'Condition', 'Action', 'Result'].map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white font-semibold">
                    {step}
                  </div>
                  {i < 3 && (
                    <div className="w-12 h-px bg-gradient-to-r from-purple-500 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
