"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Sparkles, Monitor, Share2, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Resume",
    description: "Simply upload your existing resume. PDF, DOC, or LinkedIn profile.",
    detail: "No boring form-filling. No manual entry.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Sparkles,
    title: "AI Extracts Your Profile",
    description: "AI analyzes your resume, projects, skills, experience, education.",
    detail: "Projects + Skills + Experience + Education",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    icon: Monitor,
    title: "Desktop Automatically Created",
    description: "Your personal developer desktop appears with all your data organized.",
    detail: "Folders, apps, AI assistant - all ready.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: Share2,
    title: "Share Your Desktop URL",
    description: "Get your unique shareable link: smarty-ai.com/u/yourname",
    detail: "Send to HR. Share with clients. Make public.",
    gradient: "from-orange-500 to-yellow-400",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="how-it-works" className="relative py-32 bg-gradient-to-b from-black via-[#0a0a1a] to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-transparent rounded-full blur-3xl" />
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
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">Simple 4-Step Process</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            From Resume to Desktop in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              5 Minutes
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            No templates. No coding. No design skills needed. Your resume becomes an interactive professional desktop.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm z-10">
                    {index + 1}
                  </div>

                  {/* Card */}
                  <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 h-full hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${step.gradient} mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-300 text-lg mb-4 leading-relaxed">{step.description}</p>
                    <p className="text-sm text-gray-500 font-medium">{step.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 text-lg mb-6">
            That's it. Your professional desktop is ready to share.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-2xl shadow-2xl shadow-blue-600/30 transition-all duration-300"
          >
            Upload My Resume Now
            <Share2 className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
