'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Zap, Bot, Mic, Keyboard, Mouse } from 'lucide-react'

const automationMethods = [
  {
    icon: Bot,
    title: 'AI Agent Automation',
    description: 'Let AI agents handle repetitive tasks. They learn from your patterns and execute autonomously.',
    example: 'Schedule meetings, send emails, organize files'
  },
  {
    icon: Mic,
    title: 'Voice Commands',
    description: 'Control your entire desktop with natural voice commands. Works like talking to a human assistant.',
    example: 'Hey Vibhav, open my project and start the server'
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description: 'Lightning-fast keyboard shortcuts for power users. Customizable and context-aware.',
    example: 'Cmd+K to search, Cmd+Shift+A for AI actions'
  }
]

export default function AutomationSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/10 to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">Automation</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Intelligent
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Automation
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Three ways to interact. All powered by AI. Choose the method that fits your workflow.
          </p>
        </motion.div>

        {/* Automation Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {automationMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full p-8 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden">
                {/* Icon */}
                <div className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl w-fit mb-6">
                  <method.icon className="w-12 h-12 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4">{method.title}</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{method.description}</p>

                {/* Example */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Mouse className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Example</span>
                  </div>
                  <p className="text-gray-300 text-sm italic">"{method.example}"</p>
                </div>

                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Automation Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative p-12 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-white mb-6">
                Create Custom Workflows
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                Build complex automation sequences without code. Connect apps, set conditions, and let VibhavMacOS handle the rest.
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl text-white font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300">
                Explore Automation
              </button>
            </div>
            
            {/* Workflow Diagram */}
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 400 300">
                {/* Connection Lines */}
                <path
                  d="M50 150 L150 150 L200 100 L250 100 L300 150 L350 150"
                  fill="none"
                  stroke="url(#automationGradient)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
                
                {/* Nodes */}
                {[
                  { x: 50, y: 150, label: 'Trigger' },
                  { x: 150, y: 150, label: 'Check' },
                  { x: 250, y: 100, label: 'Process' },
                  { x: 350, y: 150, label: 'Complete' }
                ].map((node, i) => (
                  <g key={i}>
                    <circle cx={node.x} cy={node.y} r="30" fill="white" fillOpacity="0.05" stroke="url(#automationGradient)" strokeWidth="2" />
                    <text x={node.x} y={node.y + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                      {node.label}
                    </text>
                  </g>
                ))}
                
                <defs>
                  <linearGradient id="automationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
