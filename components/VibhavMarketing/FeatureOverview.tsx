"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles,
  Zap,
  Shield,
  Globe,
  Layers,
  Cpu
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Extraction",
    description: "Upload resume → AI extracts your profile, projects, skills, and experience automatically.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Personal Desktop",
    description: "Your own macOS-style desktop with folders: Projects, Skills, Experience, About, and custom apps.",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "Your AI Assistant",
    description: "User-specific AI that knows YOUR background. Answers HR questions about your experience accurately.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Shareable URL",
    description: "Get your unique link: smarty-ai.com/u/yourname. Send to HR, clients, or anyone instantly.",
    gradient: "from-orange-500 to-yellow-400",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Privacy Controls",
    description: "Set visibility: Public, Private, or Unlisted. Control what's shareable, what's private.",
    gradient: "from-red-500 to-pink-400",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "5-Minute Setup",
    description: "From resume to professional desktop in under 5 minutes. No manual portfolio building needed.",
    gradient: "from-indigo-500 to-purple-400",
  },
];

export default function FeatureOverview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="relative py-32 bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-white/10 via-gray-400/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 backdrop-blur-xl rounded-full border border-blue-400/20 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Powered by AI</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Your Resume Becomes Your Desktop
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            AI extracts your profile, projects, skills, and experience. Your interactive desktop is ready in minutes, not weeks.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
                {/* Icon Container */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-gray-100/20 flex items-center justify-center text-gray-200 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "50+", label: "AI Applications" },
            { value: "100k+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-200 to-gray-200 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
