'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

import Navigation from '@/components/marketing/career-agent/Navigation'
import HeroSection from '@/components/marketing/career-agent/HeroSection'
import HowItWorks from '@/components/marketing/career-agent/HowItWorks'
import CareerAgentSection from '@/components/marketing/career-agent/CareerAgentSection'
import InterviewExample from '@/components/marketing/career-agent/InterviewExample'
import AITeacher from '@/components/marketing/career-agent/AITeacher'
import AIInterviewer from '@/components/marketing/career-agent/AIInterviewer'
import CodingWorkspace from '@/components/marketing/career-agent/CodingWorkspace'
import ResumeATS from '@/components/marketing/career-agent/ResumeATS'
import CalendarIntelligence from '@/components/marketing/career-agent/CalendarIntelligence'
import YoutubeLearning from '@/components/marketing/career-agent/YoutubeLearning'
import NotesOrganization from '@/components/marketing/career-agent/NotesOrganization'
import AgenticDesktop from '@/components/marketing/career-agent/AgenticDesktop'
import MultiPlatform from '@/components/marketing/career-agent/MultiPlatform'
import Demo from '@/components/marketing/career-agent/Demo'
import FinalCTA from '@/components/marketing/career-agent/FinalCTA'
import Footer from '@/components/marketing/career-agent/Footer'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function CareerAgentMarketingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Career Agent Section */}
        <CareerAgentSection />

        {/* Real Example */}
        <InterviewExample />

        {/* AI Teacher */}
        <AITeacher />

        {/* AI Interviewer */}
        <AIInterviewer />

        {/* Coding Workspace */}
        <CodingWorkspace />

        {/* Resume + ATS */}
        <ResumeATS />

        {/* Calendar Intelligence */}
        <CalendarIntelligence />

        {/* YouTube Learning */}
        <YoutubeLearning />

        {/* Notes */}
        <NotesOrganization />

        {/* Agentic Desktop */}
        <AgenticDesktop />

        {/* Multi-Platform */}
        <MultiPlatform />

        {/* Interactive Demo */}
        <Demo />

        {/* Final CTA */}
        <FinalCTA />

        {/* Footer */}
        <Footer />
      </main>

      {/* Global Styles for Smooth Scroll */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }
        
        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Selection Color */
        ::selection {
          background: rgba(59, 130, 246, 0.5);
          color: white;
        }

        /* Custom gradient backgrounds */
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  )
}
