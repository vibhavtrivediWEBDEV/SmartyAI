"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Brain, MessageSquare, Mic } from "lucide-react";

export default function AISection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-white/20 via-gray-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-gray-200/20 via-white/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6">
            <Brain className="w-4 h-4 text-gray-200" />
            <span className="text-sm text-gray-300 font-medium tracking-wide">
              Powered by Advanced AI
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Meet Your AI Assistant
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Like having ChatGPT, Claude, and a personal Jarvis in one intelligent workspace
          </p>
        </motion.div>

        {/* AI Visual */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="relative mb-20"
        >
          <div className="relative max-w-5xl mx-auto">
            {/* AI Orb */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl">
              {/* Glowing Orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-64 h-64 rounded-full bg-gradient-to-br from-white/40 via-gray-200/30 to-transparent blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-40 h-40 rounded-full border-2 border-gray-200/30"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-48 h-48 rounded-full border-2 border-gray-200/20"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl">🤖</div>
                </div>
              </div>

              {/* conversation bubbles */}
              <div className="absolute top-8 left-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 }}
                  className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-xs"
                >
                  <p className="text-sm text-white">
                    "Show me my meeting schedule for today"
                  </p>
                </motion.div>
              </div>

              <div className="absolute bottom-8 right-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-br from-white/20 to-gray-100/20 backdrop-blur-xl border border-gray-200/30 max-w-sm"
                >
                  <p className="text-sm text-gray-300">
                    You have 5 meetings scheduled. Opening Calendar...
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <MessageSquare className="w-6 h-6" />,
              title: "Natural Conversations",
              description: "Talk naturally. Ask questions. Get intelligent responses. Like talking to a real assistant.",
            },
            {
              icon: <Mic className="w-6 h-6" />,
              title: "Voice Interactions",
              description: "Speak commands. Open apps. Search documents. Complete workflows hands-free.",
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "Continuous Learning",
              description: "Remembers your preferences. Learns your patterns. Gets smarter with every interaction.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-gray-100/20 flex items-center justify-center text-gray-200 mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
