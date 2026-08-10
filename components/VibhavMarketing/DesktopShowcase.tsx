"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Folder, 
  FileText, 
  Github, 
  Globe, 
  Brain, 
  Briefcase,
  Award,
  ExternalLink
} from "lucide-react";

const desktopItems = [
  {
    icon: Folder,
    label: "Projects",
    description: "Your GitHub projects auto-populated",
    color: "text-blue-400",
  },
  {
    icon: FileText,
    label: "Resume",
    description: "Interactive, clickable resume",
    color: "text-purple-400",
  },
  {
    icon: Briefcase,
    label: "Experience",
    description: "Timeline with rich details",
    color: "text-emerald-400",
  },
  {
    icon: Award,
    label: "Skills",
    description: "Visual skill charts & badges",
    color: "text-orange-400",
  },
  {
    icon: Github,
    label: "GitHub",
    description: "Live repos & contributions",
    color: "text-gray-400",
  },
  {
    icon: Globe,
    label: "Website",
    description: "Your custom links & portfolio",
    color: "text-cyan-400",
  },
  {
    icon: Brain,
    label: "Your AI",
    description: "Knows YOUR background",
    color: "text-pink-400",
  },
  {
    icon: ExternalLink,
    label: "Custom Apps",
    description: "Add any app or link",
    color: "text-yellow-400",
  },
];

export default function DesktopShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-cyan-600/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            This Is{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Your Desktop
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Every folder and app is populated from YOUR resume data. Clickable. Interactive. Shareable.
          </p>
        </motion.div>

        {/* Desktop Grid */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Desktop Container */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
            {/* Desktop Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {desktopItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                    className="group cursor-pointer"
                  >
                    {/* Folder Icon */}
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/20 group-hover:to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Icon Container */}
                        <div className={`relative p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl`}>
                          <Icon className={`w-12 h-12 ${item.color} transition-all duration-300`} />
                        </div>
                      </div>
                      
                      {/* Label */}
                      <p className="text-white font-semibold text-lg mb-1">{item.label}</p>
                      <p className="text-gray-500 text-xs text-center">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Dock Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-12 pt-8 border-t border-white/10"
            >
              <div className="flex items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/10 hover:scale-110 hover:border-white/20 transition-all duration-300"
                  />
                ))}
              </div>
              <p className="text-center text-gray-600 text-sm mt-4">Your customizable dock</p>
            </motion.div>
          </div>

          {/* URL Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-950/30 backdrop-blur-xl rounded-full border border-blue-500/20">
              <Globe className="w-4 h-4 text-blue-400" />
              <code className="text-blue-300 font-mono text-sm">
                smarty-ai.com/u/<span className="text-white font-semibold">yourname</span>
              </code>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
