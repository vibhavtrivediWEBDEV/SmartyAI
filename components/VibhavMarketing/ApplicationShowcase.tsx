'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { ExternalLink, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const applications = [
  {
    id: 'ai-interview',
    icon: '🎯',
    title: 'AI Interview',
    tagline: 'Master every interview',
    description: 'Practice real-time interviews in any domain. Get instant AI feedback, performance analysis, and skill reports.',
    features: ['Real-time simulation', 'AI feedback', 'Performance analysis', 'Skill reports', 'Domain-agnostic'],
    color: 'from-blue-600 to-blue-700',
    screenshot: '/screenshots/interview.png',
  },
  {
    id: 'ai-coding',
    icon: '💻',
    title: 'AI Coding',
    tagline: 'Code with superpowers',
    description: 'Supports 20+ languages including TypeScript, Python, Java. Live preview, code generation, debugging, and AI suggestions.',
    features: ['20+ languages', 'Live preview', 'Code generation', 'Debugging', 'AI suggestions'],
    color: 'from-blue-500 to-blue-600',
    screenshot: '/screenshots/vscode.png',
  },
  {
    id: 'ai-teacher',
    icon: '📚',
    title: 'AI Teacher',
    tagline: 'Learn anything, anywhere',
    description: 'Generate books, study material. Real-time teaching with voice interaction. Ask questions and export to PDF.',
    features: ['Book generation', 'Voice interaction', 'Real-time Q&A', 'PDF export', 'Study material'],
    color: 'from-blue-600 to-blue-800',
    screenshot: '/screenshots/book.png',
  },
  {
    id: 'ai-search',
    icon: '🔍',
    title: 'AI Search',
    tagline: 'Find everything instantly',
    description: 'Search Google, YouTube, GitHub, StackOverflow, Reddit, Docs. Ultra-fast aggregated results.',
    features: ['Multi-source', 'Ultra-fast', 'AI-curated', 'Smart filters', 'Saved searches'],
    color: 'from-gray-600 to-black',
    screenshot: '/screenshots/ats.png',
  },
  {
    id: 'maps',
    icon: '🗺️',
    title: 'Maps',
    tagline: 'Navigate the world',
    description: 'Google Maps integration. Nearby places, multiple views, navigation, directions.',
    features: ['Google Maps', 'Nearby places', 'Navigation', 'Directions', 'Traffic updates'],
    color: 'from-blue-500 to-blue-700',
    screenshot: '/screenshots/map.png',
  },
  {
    id: 'notes',
    icon: '📝',
    title: 'Smart Notes',
    tagline: 'Never forget anything',
    description: 'Rich notes with images, colors, folders. Markdown support, pinned notes, instant search.',
    features: ['Rich formatting', 'Markdown', 'Folders', 'Pinned notes', 'Instant search'],
    color: 'from-gray-500 to-gray-700',
    screenshot: '/screenshots/notes.png',
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendar',
    tagline: 'Time, organized',
    description: 'Events, reminders, timers, notifications. Meeting integrations with smart scheduling.',
    features: ['Events', 'Reminders', 'Timers', 'Notifications', 'Smart scheduling'],
    color: 'from-blue-400 to-blue-600',
    screenshot: '/screenshots/settings.png',
  },
  {
    id: 'mail-ai',
    icon: '📧',
    title: 'Mail AI',
    tagline: 'Emails, elevated',
    description: 'Generate professional emails, cold emails, replies. Grammar correction and templates.',
    features: ['AI generation', 'Cold emails', 'Smart replies', 'Grammar check', 'Templates'],
    color: 'from-blue-600 to-blue-800',
    screenshot: '/screenshots/mail.png',
  },
  {
    id: 'image-search',
    icon: '🖼️',
    title: 'Image Search',
    tagline: 'Visual discovery',
    description: 'Search images across multiple sources. Download, apply filters, create collections.',
    features: ['Multi-source', 'Smart filters', 'Collections', 'Download', 'Visual search'],
    color: 'from-gray-600 to-black',
    screenshot: '/screenshots/game.png',
  },
  {
    id: 'terminal',
    icon: '⌨️',
    title: 'Terminal',
    tagline: 'Command the system',
    description: 'Real terminal with command execution. Automation, file management, window controls.',
    features: ['Real commands', 'Automation', 'File management', 'Custom scripts', 'Window controls'],
    color: 'from-gray-700 to-gray-900',
    screenshot: '/screenshots/terminal.png',
  },
  {
    id: 'storage',
    icon: '💾',
    title: 'Personal Storage',
    tagline: 'Your digital memory',
    description: 'Desktop folders, files, images, links, bookmarks. Everything synchronized and accessible.',
    features: ['Folders', 'Files', 'Bookmarks', 'Auto-sync', 'Quick access'],
    color: 'from-blue-700 to-blue-900',
    screenshot: '/screenshots/finder.png',
  },
  {
    id: 'browser',
    icon: '🌐',
    title: 'Browser',
    tagline: 'Web, integrated',
    description: 'Integrated browser with multiple tabs, bookmarks, downloads, and history.',
    features: ['Multiple tabs', 'Bookmarks', 'Downloads', 'History', 'AI suggestions'],
    color: 'from-blue-600 to-blue-800',
    screenshot: '/screenshots/dekstop.png',
  },
]

export default function ApplicationShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !scrollContainerRef.current) return

    // Create GSAP scroll-triggered animation
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollContainerRef.current!,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
        onUpdate: (self) => {
          // Calculate which app should be active based on scroll progress
          const progress = self.progress
          const newActiveIndex = Math.min(
            Math.floor(progress * applications.length),
            applications.length - 1
          )
          
          setActiveIndex(newActiveIndex)
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="applications" className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gray-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            A complete AI app ecosystem
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Everything you need. One unified desktop. Zero context switching.
          </p>
        </motion.div>

        {/* Main Showcase Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* App List - Left Side */}
          <div ref={scrollContainerRef} className="col-span-4 space-y-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-4">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <button
                  className={`w-full text-left p-4 rounded-xl transition-all duration-500 border ${
                    activeIndex === index
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/30 shadow-xl scale-105'
                      : 'bg-black/50 border-gray-800 hover:bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {app.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {app.tagline}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* App Preview - Right Side */}
          <div className="col-span-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="sticky top-32"
            >
              {/* Preview Card */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-950/50 to-black border border-blue-900/30 backdrop-blur-xl shadow-2xl">
                {/* Progress Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-black/50 z-20">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                    style={{ width: `${(activeIndex / (applications.length - 1)) * 100}%` }}
                  />
                </div>
                
                {/* Screenshot */}
                <div className="relative aspect-video">
                  <motion.img
                    key={`screenshot-${activeIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    src={applications[activeIndex].screenshot}
                    alt={applications[activeIndex].title}
                    className="w-full h-full object-cover"
                  />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  {/* Icon Badge */}
                  <motion.div 
                    key={`icon-${activeIndex}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="absolute top-8 left-8"
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${applications[activeIndex].color} flex items-center justify-center shadow-2xl backdrop-blur-xl border border-blue-500/20`}>
                      <span className="text-4xl">{applications[activeIndex].icon}</span>
                    </div>
                  </motion.div>
                </div>

                {/* Content */}
                <motion.div 
                  key={`content-${activeIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-8"
                >
<div className="mb-5">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {applications[activeIndex].title}
                  </h3>
                  <p className="text-base text-gray-400">
                      {applications[activeIndex].description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {applications[activeIndex].features.map((feature, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="px-3 py-1.5 rounded-full text-xs bg-blue-600/10 text-gray-300 border border-blue-600/20"
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href="/apps">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg text-sm px-5 py-2 shadow-lg shadow-blue-600/25">
                      Explore all apps
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
