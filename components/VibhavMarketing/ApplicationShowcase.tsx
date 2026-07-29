"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const applications = [
  {
    id: "ai-interview",
    icon: "🎯",
    title: "AI Interview",
    tagline: "Master every interview",
    description: "Practice real-time interviews in any domain. Get instant AI feedback, performance analysis, and skill reports.",
    features: ["Real-time simulation", "AI feedback", "Performance analysis", "Skill reports", "Domain-agnostic"],
    color: "from-purple-600 to-blue-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=AI+Interview",
  },
  {
    id: "ai-coding",
    icon: "💻",
    title: "AI Coding",
    tagline: "Code with superpowers",
    description: "Supports 20+ languages including TypeScript, Python, Java. Live preview, code generation, debugging, and AI suggestions.",
    features: ["20+ languages", "Live preview", "Code generation", "Debugging", "AI suggestions"],
    color: "from-blue-600 to-cyan-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=AI+Coding",
  },
  {
    id: "ai-teacher",
    icon: "📚",
    title: "AI Teacher",
    tagline: "Learn anything, anywhere",
    description: "Generate books, study material. Real-time teaching with voice interaction. Ask questions and export to PDF.",
    features: ["Book generation", "Voice interaction", "Real-time Q&A", "PDF export", "Study material"],
    color: "from-green-600 to-emerald-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=AI+Teacher",
  },
  {
    id: "ai-search",
    icon: "🔍",
    title: "AI Search",
    tagline: "Find everything instantly",
    description: "Search Google, YouTube, GitHub, StackOverflow, Reddit, Docs. Ultra-fast aggregated results.",
    features: ["Multi-source", "Ultra-fast", "AI-curated", "Smart filters", "Saved searches"],
    color: "from-orange-600 to-red-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=AI+Search",
  },
  {
    id: "maps",
    icon: "🗺️",
    title: "Maps",
    tagline: "Navigate the world",
    description: "Google Maps integration. Nearby places, multiple views, navigation, directions.",
    features: ["Google Maps", "Nearby places", "Navigation", "Directions", "Traffic updates"],
    color: "from-emerald-600 to-teal-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Maps",
  },
  {
    id: "notes",
    icon: "📝",
    title: "Smart Notes",
    tagline: "Never forget anything",
    description: "Rich notes with images, colors, folders. Markdown support, pinned notes, instant search.",
    features: ["Rich formatting", "Markdown", "Folders", "Pinned notes", "Instant search"],
    color: "from-yellow-600 to-orange-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Smart+Notes",
  },
  {
    id: "calendar",
    icon: "📅",
    title: "Calendar",
    tagline: "Time, organized",
    description: "Events, reminders, timers, notifications. Meeting integrations with smart scheduling.",
    features: ["Events", "Reminders", "Timers", "Notifications", "Smart scheduling"],
    color: "from-rose-600 to-pink-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Calendar",
  },
  {
    id: "mail-ai",
    icon: "📧",
    title: "Mail AI",
    tagline: "Emails, elevated",
    description: "Generate professional emails, cold emails, replies. Grammar correction and templates.",
    features: ["AI generation", "Cold emails", "Smart replies", "Grammar check", "Templates"],
    color: "from-indigo-600 to-purple-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Mail+AI",
  },
  {
    id: "image-search",
    icon: "🖼️",
    title: "Image Search",
    tagline: "Visual discovery",
    description: "Search images across multiple sources. Download, apply filters, create collections.",
    features: ["Multi-source", "Smart filters", "Collections", "Download", "Visual search"],
    color: "from-pink-600 to-rose-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Image+Search",
  },
  {
    id: "terminal",
    icon: "⌨️",
    title: "Terminal",
    tagline: "Command the system",
    description: "Real terminal with command execution. Automation, file management, window controls.",
    features: ["Real commands", "Automation", "File management", "Custom scripts", "Window controls"],
    color: "from-gray-600 to-slate-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Terminal",
  },
  {
    id: "storage",
    icon: "💾",
    title: "Personal Storage",
    tagline: "Your digital memory",
    description: "Desktop folders, files, images, links, bookmarks. Everything synchronized and accessible.",
    features: ["Folders", "Files", "Bookmarks", "Auto-sync", "Quick access"],
    color: "from-cyan-600 to-blue-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Personal+Storage",
  },
  {
    id: "browser",
    icon: "🌐",
    title: "Browser",
    tagline: "Web, integrated",
    description: "Integrated browser with multiple tabs, bookmarks, downloads, and history.",
    features: ["Multiple tabs", "Bookmarks", "Downloads", "History", "AI suggestions"],
    color: "from-blue-600 to-indigo-600",
    screenshot: "https://via.placeholder.com/800x600/1a1a1a/ffffff?text=Browser",
  },
];

export default function ApplicationShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeApp, setActiveApp] = useState(applications[1]);

  return (
    <section ref={ref} className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            50+ AI-Powered Apps
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need. One unified desktop. Zero context switching.
          </p>
        </motion.div>

        {/* Main Showcase Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* App List - Left Side */}
          <div className="col-span-4 space-y-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-4">
            {applications.map((app, index) => (
              <motion.button
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => setActiveApp(app)}
                className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border ${
                  activeApp.id === app.id
                    ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20 shadow-xl"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{app.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {app.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {app.tagline}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* App Preview - Right Side */}
          <div className="col-span-8">
            <motion.div
              key={activeApp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="sticky top-32"
            >
              {/* Preview Card */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                {/* Screenshot */}
                <div className="relative aspect-video">
                  <img
                    src={activeApp.screenshot}
                    alt={activeApp.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  {/* Icon Badge */}
                  <div className="absolute top-8 left-8">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeApp.color} flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/20`}>
                      <span className="text-4xl">{activeApp.icon}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {activeApp.title}
                    </h3>
                    <p className="text-lg text-gray-400">
                      {activeApp.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {activeApp.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full text-sm bg-white/5 text-gray-300 border border-white/10"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl">
                    Try {activeApp.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </section>
  );
}
