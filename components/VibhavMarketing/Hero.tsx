"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, ArrowRight } from "lucide-react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-black"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-cyan-600/20 via-blue-600/10 to-transparent blur-3xl"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300 font-medium tracking-wide">
              Introducing VibhavMacOS
            </span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-6"
        >
          <span className="block text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent leading-tight tracking-tight">
            Your AI
          </span>
          <span className="block text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight tracking-tight mt-2">
            Operating System
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-400 text-center max-w-3xl mb-12 leading-relaxed"
        >
          One desktop. Every AI. Every productivity tool. Every workflow.{" "}
          <span className="text-white font-medium">Powered by intelligence.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a href="/desktop">
            <Button
              size="lg"
              className="group relative px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-lg rounded-2xl shadow-2xl shadow-blue-600/25 border border-white/10 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </Button>
          </a>
          
          <a href="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300"
            >
              Sign In
            </Button>
          </a>
        </motion.div>

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-500 mb-6 tracking-wide uppercase">
            Trusted by 10,000+ professionals
          </p>
          <div className="flex items-center justify-center gap-12 opacity-50">
            {["Apple", "Google", "Microsoft", "Netflix", "Stripe"].map((company) => (
              <div
                key={company}
                className="text-2xl font-bold text-gray-600 tracking-tight"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating Preview */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="mt-16 w-full max-w-6xl"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-2">
            {/* Preview Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-t-2xl">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 text-center text-sm text-gray-500 font-mono">
                VibhavMacOS Desktop
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-b-2xl relative overflow-hidden">
              {/* Placeholder for actual screenshot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖥️</div>
                  <p className="text-gray-600 text-lg">Desktop Preview</p>
                </div>
              </div>
              
              {/* Glass Dock */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20">
                {["🤖", "💻", "📝", "🔍", "📧", "🗺️", "🎵", "⚙️"].map((icon, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, y: -8 }}
                    className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center cursor-pointer transition-all hover:bg-white/20"
                  >
                    <span className="text-2xl">{icon}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
