'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  
  const springConfig = { damping: 20, stiffness: 150 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Animate gradient orbs without timeline
    gsap.to(".gradient-orb-1", {
      scale: 1.2,
      x: 50,
      y: -30,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    gsap.to(".gradient-orb-2", {
      scale: 1.3,
      x: -60,
      y: 40,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2
    });
    
    gsap.to(".gradient-orb-3", {
      scale: 1.15,
      opacity: 0.6,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 4
    });
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 50
      const y = (e.clientY - rect.top - rect.height / 2) / 50
      mouseX.set(x)
      mouseY.set(y)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])
  
  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#0d0d20] to-[#000000]"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Giant Gradient Orbs - Blue theme */}
        <motion.div
          className="gradient-orb-1 absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-transparent blur-3xl"
        />
        
        <motion.div
          className="gradient-orb-2 absolute -bottom-1/4 -right-1/4 w-[900px] h-[900px] rounded-full bg-gradient-to-bl from-cyan-500/35 via-blue-600/25 to-transparent blur-3xl"
        />
        
        <motion.div
          className="gradient-orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-700/30 via-transparent to-transparent blur-3xl"
        />
        
        {/* Rotating Gradient Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full border border-blue-500/[0.03]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-blue-400/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-cyan-500/[0.05]" />
        </motion.div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_-20%,#000_70%,transparent_110%)]" />
        
        {/* Animated Noise Texture */}
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_50%_50%,transparent_0%,black_100%)]" />
        
        {/* Mouse Spotlight */}
        <motion.div
          style={{
            x: mouseXSpring,
            y: mouseYSpring
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-white/[0.04] via-transparent to-transparent pointer-events-none"
        />
      </div>
      
      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
      >
        {/* Badge */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="hero-badge mb-10 lg:mb-12"
        >
          <Badge />
        </motion.div>
        
        {/* Main Headline */}
        <motion.h1
          variants={headlineVariants}
          initial="hidden"
          animate="visible"
          className="hero-headline text-center mb-6 lg:mb-8"
        >
          <span className="hero-headline-text block text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] xl:text-[7rem] font-bold tracking-[-0.04em] leading-[1.1] bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent mb-2">
            Your Resume.
          </span>
          <span className="hero-headline-text block text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] xl:text-[7rem] font-bold tracking-[-0.04em] leading-[1.1] mb-2">
            <span className="bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">Your </span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Personal Desktop.</span>
          </span>
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="hero-subheadline text-lg sm:text-xl md:text-2xl text-gray-300 text-center max-w-3xl mb-12 lg:mb-16 leading-relaxed px-4"
        >
          Upload your resume → AI extracts your profile → Get a professional developer desktop. {" "}
          <span className="text-blue-300 font-medium">Share with anyone, anywhere.</span>
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          variants={btnVariants}
          initial="hidden"
          animate="visible"
          className="hero-cta flex flex-col sm:flex-row gap-4 mb-20 lg:mb-24"
        >
          <PrimaryButton />
          <SecondaryButton />
        </motion.div>
        
        {/* Trusted By */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="hero-trust text-center mb-20 lg:mb-28"
        >
          <p className="text-sm text-gray-400 mb-8 tracking-widest uppercase font-medium">
            Trusted by developers from
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 lg:gap-16 flex-wrap">
            {['Apple', 'Google', 'OpenAI', 'Microsoft', 'Stripe'].map((company) => (
              <div
                key={company}
                className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-500 tracking-tight hover:text-blue-400 transition-colors duration-300"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Floating Preview */}
        <motion.div
          variants={previewVariants}
          initial="hidden"
          animate="visible"
          className="hero-preview w-full max-w-7xl px-4"
        >
          <Preview mouseX={mouseXSpring} mouseY={mouseYSpring} />
        </motion.div>
      </motion.div>
    </section>
  )
}

function Badge() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.02, 1],
        opacity: [0.9, 1, 0.9]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className="relative group"
    >
      <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-blue-500/50 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-blue-400/20 bg-blue-950/30 backdrop-blur-xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </motion.div>
        <span className="text-sm text-gray-200 font-medium tracking-wide">
          No manual portfolio building anymore
        </span>
      </div>
    </motion.div>
  )
}

function PrimaryButton() {
  return (
    <a href="/sign-up" className="group relative inline-flex">
      <button className="relative flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-2xl shadow-2xl shadow-blue-600/30 transition-all duration-300">
        <span>Create My Desktop</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </button>
    </a>
  )
}

function SecondaryButton() {
  return (
    <button className="group flex items-center gap-2.5 px-8 py-4 bg-transparent hover:bg-blue-600/10 text-white font-semibold text-lg rounded-2xl border-2 border-blue-500/50 hover:border-blue-400/80 backdrop-blur-xl transition-all duration-300">
      <div className="relative">
        <Play className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
      </div>
      <span className="text-gray-100">Watch Demo</span>
    </button>
  )
}

function Preview({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  return (
    <motion.div
      style={{
        x: mouseX,
        y: mouseY
      }}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-blue-600/30 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Outer Frame */}
      <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-400/30 to-blue-600/10 rounded-[1.75rem] backdrop-blur-sm" />
      
      {/* Main Container */}
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-950/40 to-black/50 rounded-[1.7rem] overflow-hidden border border-blue-500/20 shadow-2xl shadow-blue-900/20">
        {/* Glass Header Bar */}
        <div className="relative h-12 bg-gradient-to-r from-blue-900/20 via-blue-800/30 to-blue-900/20 border-b border-blue-500/10 flex items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/30" />
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-6 py-1.5 bg-blue-950/50 rounded-lg border border-blue-500/20">
              <div className="text-xs text-blue-300 font-medium">VibhavMacOS</div>
            </div>
          </div>
        </div>
        
        {/* Screenshot */}
        <div className="relative aspect-video bg-gradient-to-br from-[#0a0a1a] to-black overflow-hidden">
          <img
            src="/screenshots/main.png"
            alt="VibhavMacOS Desktop Interface"
            className="w-full h-full object-cover"
          />
          
          {/* Reflection Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-500/5 to-transparent pointer-events-none" />
          
          {/* Corner Shine */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-400/10 to-transparent pointer-events-none" />
        </div>
        
        {/* Inner Shadow */}
        <div className="absolute inset-0 pointer-events-none shadow-inner rounded-[1.7rem]" />
      </div>
      
      {/* Bottom Reflection */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-4/5 h-32 bg-gradient-to-b from-blue-600/20 to-transparent blur-2xl opacity-50 pointer-events-none" />
    </motion.div>
  )
}

// Animation Variants
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const headlineVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const btnVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const previewVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.2,
      delay: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}
