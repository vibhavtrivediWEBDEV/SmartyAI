"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-blue-600/15 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/15 via-transparent to-transparent rounded-full blur-3xl" />
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
            See It In Action
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A glimpse into your future workspace
          </p>
        </motion.div>

        {/* Main Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 60 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-600/20">
            {/* Browser Frame */}
            <div className="bg-gradient-to-b from-white/10 to-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10">
              {/* Browser Controls */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              
              {/* URL Bar */}
              <div className="flex-1 mx-12">
                <div className="bg-white/5 rounded-xl px-6 py-2 text-center text-sm text-gray-400 border border-white/10 max-w-md mx-auto">
                  vibhavos.app — Your AI Desktop
                </div>
              </div>
              
              {/* Browser Actions */}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="w-8 h-8 rounded-lg bg-white/5" />
              </div>
            </div>

            {/* Desktop Preview */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-950 via-black to-gray-950 overflow-hidden">
              {/* Wallpaper Pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15)0%,transparent50%)]" />
              </div>

              {/* Top Menu Bar */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold text-white">🍎 VibhavOS</div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Window</span>
                    <span>Help</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>🔋 100%</span>
                  <span>WiFi</span>
                  <span>11:59 PM</span>
                </div>
              </div>

              {/* Floating Windows */}
              {/* AI Assistant */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-16 left-8 w-80 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl"
              >
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm text-white font-medium">🤖 AI Assistant</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0" />
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-sm text-gray-300">
                      Opening VS Code... Analyzing your project structure.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500"
                      readOnly
                    />
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                      🎤
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Code Editor Window */}
              <div className="absolute top-32 right-8 w-96 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-white font-medium">💻 AI Code Editor</span>
                </div>
                <div className="p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400">const</span>
                    <span className="text-blue-300">App</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-yellow-400">()</span>
                    <span className="text-gray-500">=&gt;</span>
                    <span className="text-blue-300">{"{"}</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    <div>
                      <span className="text-purple-400">return</span>
                      <span className="text-gray-500">(</span>
                    </div>
                    <div className="pl-4 text-gray-400">
                      {"<div>App</div>"}
                    </div>
                    <div>
                      <span className="text-gray-500">)</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-300">{"}"}</span>
                  </div>
                </div>
              </div>

              {/* Calendar Widget */}
              <div className="absolute bottom-24 right-24 w-64 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl p-4">
                <div className="text-sm font-medium text-white mb-2">📅 Today's Schedule</div>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>10:00 - Team Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>14:00 - Code Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>16:00 - 1:1 Meeting</span>
                  </div>
                </div>
              </div>

              {/* Glass Dock */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20"
              >
                {["🤖", "💻", "📝", "🔍", "📧", "🗺️", "🎵", "⚙️"].map((icon, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, y: -8 }}
                    className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all shadow-lg"
                  >
                    <span className="text-2xl">{icon}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-3xl -z-10" />
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { icon: "🖱️", label: "Smooth Interactions" },
            { icon: "🎨", label: "Glassmorphic Design" },
            { icon: "⚡", label: "Instant Response" },
            { icon: "🔒", label: "Secure & Private" },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="text-sm text-gray-400">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
