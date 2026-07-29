'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  Brain, 
  Code2, 
  Sparkles, 
  Zap, 
  Shield, 
  Globe,
  Cpu,
  Layers
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Everything',
    description: 'Every application is infused with artificial intelligence. From coding to writing, from search to organization.',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Code2,
    title: 'Built for Developers',
    description: 'Professional coding environment with AI assistance, live preview, debugging, and multi-language support.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Sparkles,
    title: 'Magical Automation',
    description: 'Automate repetitive tasks with intelligent workflows. Let AI handle the mundane while you focus on creation.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Zap,
    title: 'Blazing Fast',
    description: 'Optimized performance with instant search, real-time collaboration, and zero-lag interactions.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays private. End-to-end encryption with local-first architecture and zero tracking.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Access your AI desktop from any device. Responsive, adaptive, and always synchronized.',
    gradient: 'from-blue-500 to-indigo-500'
  }
]

export default function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section ref={containerRef} id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-300">Features</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Everything You Need
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A complete operating system designed for the AI era. Powerful features that feel simple.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/[0.05] overflow-hidden">
                {/* Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-3xl`} />
                
                {/* Icon */}
                <div className={`relative inline-flex p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                {/* Hover Line */}
                <div className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '50+', label: 'Applications' },
            { value: '100M+', label: 'AI Queries' },
            { value: '99.9%', label: 'Uptime' },
            { value: '10x', label: 'Faster' }
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
