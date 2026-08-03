"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Workflow, Clock, Layers } from "lucide-react";

export default function ProductivitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-r from-gray-400/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-white/10 via-transparent to-transparent rounded-full blur-3xl" />
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
            Supercharge Your Productivity
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Automate the mundane. Focus on what matters. Ship faster.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Workflow Automation */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-400/20 to-gray-300/20 flex items-center justify-center text-gray-400 flex-shrink-0">
                <Workflow className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Smart Workflows
                </h3>
                <p className="text-gray-400">
                  Automate daily tasks with AI-powered workflows that learn your patterns.
                </p>
              </div>
            </div>

            {/* Visual Example */}
            <div className="relative">
              <div className="p-6 rounded-2xl bg-black/50 border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-200" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/50 to-transparent" />
                  <div className="text-sm text-gray-500">9:00 AM</div>
                </div>
                
                <div className="space-y-3 pl-14">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-gray-300">Open Calendar</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="text-sm text-gray-300">Check emails</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-gray-300">Start development environment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="text-sm text-gray-300">Generate daily report</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Keyboard Shortcuts */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-200/20 to-green-600/20 flex items-center justify-center text-gray-200 flex-shrink-0">
                <Zap className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Lightning Shortcuts
                </h3>
                <p className="text-gray-400">
                  Master your desktop with powerful keyboard shortcuts for every action.
                </p>
              </div>
            </div>

            {/* Shortcut Examples */}
            <div className="space-y-4">
              {[
                { keys: ["⌘", "K"], action: "Quick Search" },
                { keys: ["⌘", "J"], action: "Toggle AI Assistant" },
                { keys: ["⌘", "T"], action: "Open Terminal" },
                { keys: ["⌘", "B"], action: "Open Browser" },
              ].map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 transition-all"
                >
                  <span className="text-gray-300">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <div
                        key={i}
                        className="min-w-[32px] h-8 px-2 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white font-mono border border-white/20"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-white/10 via-gray-400/10 to-gray-100/10 border border-white/10 backdrop-blur-xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10x", label: "Faster Work" },
              { value: "80%", label: "Automation Rate" },
              { value: "50+", label: "Workflows" },
              { value: "100%", label: "Customizable" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-200 to-gray-200 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
