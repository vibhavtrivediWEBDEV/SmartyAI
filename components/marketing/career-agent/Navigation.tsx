'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const sections = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Career Agent', href: '#career-agent' },
    { name: 'Teacher', href: '#teacher' },
    { name: 'Interview', href: '#interviewer' },
    { name: 'Workspace', href: '#workspace' },
  ]

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!mounted) return null

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06]' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-semibold">SmartyAI</span>
          </a>
          
          {/* Center Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {sections.map((section) => (
              <button
                key={section.name}
                onClick={() => scrollToSection(section.href)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {section.name}
              </button>
            ))}
          </div>
          
          {/* CTA */}
          <div className="flex items-center gap-4">
            <a
              href="/sign-in"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
