'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  GraduationCap, 
  Search, 
  MessageSquare, 
  Map, 
  FileText,
  Calendar,
  Mail,
  Image,
  Terminal,
  Folder,
  Globe,
  Music,
  Brain,
  Database
} from 'lucide-react'

const applications = [
  {
    id: 'interview',
    name: 'AI Interview',
    icon: MessageSquare,
    description: 'Create real-time interviews for any domain with AI feedback and performance analysis.',
    features: ['Multiple domains', 'Real-time feedback', 'Performance reports', 'Skill assessment'],
    gradient: 'from-blue-500 to-cyan-500',
    screenshot: '/screenshots/interview.png'
  },
  {
    id: 'coding',
    name: 'AI Coding',
    icon: Code,
    description: 'Professional IDE with AI assistance, live preview, and multi-language support.',
    features: ['HTML/CSS/JS/TS', 'Python/Java/C++', 'Live preview', 'AI suggestions', 'Debugging'],
    gradient: 'from-indigo-500 to-purple-500',
    screenshot: '/screenshots/coding.png'
  },
  {
    id: 'teacher',
    name: 'AI Teacher',
    icon: GraduationCap,
    description: 'Generate study material, teach in real time, and create educational content.',
    features: ['Voice interaction', 'Book generation', 'Study material', 'PDF export', 'Q&A support'],
    gradient: 'from-purple-500 to-pink-500',
    screenshot: '/screenshots/teacher.png'
  },
  {
    id: 'search',
    name: 'AI Search',
    icon: Search,
    description: 'Ultra-fast search across Google, YouTube, GitHub, StackOverflow, and more.',
    features: ['Multi-source search', 'Instant results', 'Smart filtering', 'AI summaries'],
    gradient: 'from-green-500 to-emerald-500',
    screenshot: '/screenshots/search.png'
  },
  {
    id: 'maps',
    name: 'Maps',
    icon: Map,
    description: 'Google Maps integration with nearby places, navigation, and directions.',
    features: ['Multiple views', 'Navigation', 'Location search', 'Directions'],
    gradient: 'from-teal-500 to-cyan-500',
    screenshot: '/screenshots/maps.png'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: FileText,
    description: 'Rich notes with images, colors, folders, markdown support, and pinning.',
    features: ['Rich editing', 'Markdown', 'Folder organization', 'Pin important'],
    gradient: 'from-yellow-500 to-orange-500',
    screenshot: '/screenshots/notes.png'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    description: 'Events, reminders, timers, notifications, and meeting management.',
    features: ['Event scheduling', 'Reminders', 'Timers', 'Notifications'],
    gradient: 'from-red-500 to-pink-500',
    screenshot: '/screenshots/calendar.png'
  },
  {
    id: 'mail',
    name: 'Mail AI',
    icon: Mail,
    description: 'Generate professional emails, cold emails, replies, and templates.',
    features: ['Email generation', 'Grammar fix', 'Templates', 'Cold emails'],
    gradient: 'from-blue-500 to-indigo-500',
    screenshot: '/screenshots/mail.png'
  },
  {
    id: 'images',
    name: 'Image Search',
    icon: Image,
    description: 'Search images, download, filter, and create collections.',
    features: ['Advanced filters', 'Collections', 'Easy download', 'High quality'],
    gradient: 'from-pink-500 to-rose-500',
    screenshot: '/screenshots/images.png'
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: Terminal,
    description: 'Real terminal with command execution, automation, and file management.',
    features: ['Command execution', 'Automation', 'File management', 'Window controls'],
    gradient: 'from-gray-500 to-slate-500',
    screenshot: '/screenshots/terminal.png'
  },
  {
    id: 'storage',
    name: 'Personal Storage',
    icon: Folder,
    description: 'Desktop folders, files, images, links, bookmarks, and memory sync.',
    features: ['File organization', 'Bookmarks', 'Cloud sync', 'Everything organized'],
    gradient: 'from-amber-500 to-yellow-500',
    screenshot: '/screenshots/storage.png'
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: Globe,
    description: 'Integrated browser with multiple tabs, bookmarks, downloads, and history.',
    features: ['Multiple tabs', 'Bookmarks', 'Downloads', 'History'],
    gradient: 'from-cyan-500 to-blue-500',
    screenshot: '/screenshots/browser.png'
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    description: 'Spotify, YouTube Music, JioSaavn integration with playlist management.',
    features: ['Spotify integration', 'YouTube Music', 'Playlists', 'Multi-platform'],
    gradient: 'from-green-600 to-emerald-600',
    screenshot: '/screenshots/music.png'
  },
  {
    id: 'assistant',
    name: 'AI Assistant',
    icon: Brain,
    description: 'Jarvis-like assistant with voice, memory, navigation, and automation.',
    features: ['Voice control', 'Memory AI', 'Open apps', 'Execute workflows'],
    gradient: 'from-violet-500 to-purple-500',
    screenshot: '/screenshots/assistant.png'
  },
  {
    id: 'memory',
    name: 'Memory',
    icon: Database,
    description: 'AI remembers your preferences, coding style, projects, and conversations.',
    features: ['User preferences', 'Coding style', 'Resume & projects', 'Private storage'],
    gradient: 'from-indigo-600 to-blue-600',
    screenshot: '/screenshots/memory.png'
  }
]

export default function AppsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [selectedApp, setSelectedApp] = useState(applications[0])

  return (
    <section ref={containerRef} id="apps" className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-300">Applications</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              50+ Powerful Apps
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Every application designed for productivity, powered by AI, and built for professionals.
          </p>
        </motion.div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Apps List */}
          <div className="lg:col-span-1 space-y-3">
            {applications.map((app, index) => (
              <motion.button
                key={app.id}
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => setSelectedApp(app)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                  selectedApp.id === app.id
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-br ${app.gradient} rounded-xl`}>
                    <app.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{app.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-1">{app.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected App Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedApp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
              >
                {/* Screenshot Placeholder */}
                <div className="aspect-video w-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className={`p-8 bg-gradient-to-br ${selectedApp.gradient} rounded-3xl bg-opacity-20`}>
                      <selectedApp.icon className="w-24 h-24 text-white opacity-50" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 bg-gradient-to-br ${selectedApp.gradient} rounded-lg`}>
                        <selectedApp.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{selectedApp.name}</h3>
                    </div>
                    <p className="text-gray-400 mb-4">{selectedApp.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-lg text-sm text-gray-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${selectedApp.gradient} opacity-20 blur-3xl -z-10`} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Layers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
