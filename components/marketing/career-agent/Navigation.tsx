'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
    { name: 'Automation', href: '#automation' },
    { name: 'Product', href: '#product' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Career Agent', href: '#career-agent' },
    { name: 'Teacher', href: '#teacher' },
    { name: 'Interview', href: '#interviewer' },
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
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/6'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl pt-[env(safe-area-inset-top)] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-semibold">SmartyAI</span>
          </Link>

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
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/sign-in"
              className="hidden text-sm text-white/70 transition-colors hover:text-white min-[360px]:block"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)] transition-colors hover:bg-gray-100 sm:px-5"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
