'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sparkles, Brain, MessageSquare, Zap, Shield } from 'lucide-react'

const aiFeatures = [
  {
    title: 'Natural Language Processing',
    description: 'Interact with your desktop using plain English. No commands to memorize.',
    icon: MessageSquare,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Contextual Memory',
    description: 'AI remembers your preferences, habits, and workflows across all applications.',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Predictive Assistance',
    description: 'Anticipates your needs and suggests actions before you ask.',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'Privacy-First AI',
    description: 'All AI processing happens locally or with end-to-end encryption. Your data stays yours.',
    icon: Shield,
    gradient: 'from-green-500 to-emerald-500'
  }
]

export default function AIFeatures() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/20 to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">AI Features</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Intelligence
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                At Your Service
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Powered by multiple AI models working together to understand, predict, and execute your needs. 
              From writing code to organizing your day.
            </p>

            <div className="space-y-6">
              {aiFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-gray-500">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - AI Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Central Brain Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="p-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl">
                    <Brain className="w-32 h-32 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl blur-3xl opacity-50 animate-pulse" />
                </div>
              </div>

              {/* Orbiting Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
                >
                  <div
                    className="absolute w-20 h-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center"
                    style={{
                      top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
                      left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                </motion.div>
              ))}

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r="150" fill="none" stroke="url(#gradient)" strokeWidth="1" opacity="0.3" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
