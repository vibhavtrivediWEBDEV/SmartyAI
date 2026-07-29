'use client'

import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import gsap from 'gsap'

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-letter', {
        opacity: 0,
        y: 100,
        rotateX: -90,
        stagger: 0.05,
        duration: 1.2,
        ease: 'power4.out'
      })
    }, containerRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-900/10 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Floating Windows Preview */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 flex items-center justify-center opacity-20"
      >
        <div className="relative w-[900px] h-[600px]">
          {/* Main Desktop Window */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            {/* Dock */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl"
                />
              ))}
            </div>
            
            {/* Menu Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 backdrop-blur-xl flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-gray-500 text-xs">VibhavMacOS</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-gray-300">Introducing VibhavMacOS v2.0</span>
        </motion.div>

        {/* Main Headline */}
        <div className="overflow-hidden mb-8">
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-none">
            <span className="hero-letter inline-block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Your AI
            </span>
          </h1>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tight leading-none -mt-4 md:-mt-6">
            <span className="hero-letter inline-block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Operating System
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          One desktop. <span className="text-white">Every AI.</span> Every productivity tool.{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Powered by intelligence.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/50">
            <span className="relative z-10 flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button className="group px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300">
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Watch Demo
            </span>
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <p className="text-gray-500 text-sm">Trusted by developers and teams worldwide</p>
          <div className="flex items-center gap-8 opacity-40">
            {['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta'].map((company) => (
              <div key={company} className="text-gray-400 text-lg font-semibold">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <div className="w-1 h-16 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          <span className="text-gray-500 text-xs uppercase tracking-widest">Scroll</span>
        </div>
      </motion.div>
    </section>
  )
}
