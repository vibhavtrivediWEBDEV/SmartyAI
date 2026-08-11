"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Hero from "./Hero";
import FeatureOverview from "./FeatureOverview";
import ApplicationShowcase from "./ApplicationShowcase";
import AISection from "./AISection";
import ProductivitySection from "./ProductivitySection";
import DashboardPreview from "./DashboardPreview";
import PricingSection from "./PricingSection";
import Testimonials from "./Testimonials";
import Footer from "./Footer";
import Navigation from "./Navigation";
import AudienceSection from "./AudienceSection";
import HowItWorks from "./HowItWorks";
import DesktopShowcase from "./DesktopShowcase";
import SocialProof from "./SocialProof";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function VibhavMarketingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No GSAP timeline animations needed - using CSS visibility
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#000000] text-white overflow-x-hidden relative">
      {/* Global Gradient Overlay */}
      <div className="gradient-overlay fixed inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#0f0f1a] to-[#000000]" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-blue-900/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-900/20 via-transparent to-transparent blur-3xl" />
      </div>
      
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <Hero />

        {/* How It Works */}
        <HowItWorks />

        {/* Feature Overview */}
        <FeatureOverview />

        {/* Role-specific solutions */}
        <AudienceSection />

        {/* Desktop Showcase */}
        <DesktopShowcase />

        {/* Social Proof */}
        {/* <SocialProof /> */}

        {/* Application Showcase */}
        {/* <ApplicationShowcase /> */}

        {/* Testimonials */}
        <Testimonials />

        {/* Footer */}
        <Footer />
      </main>

      {/* Floating CTA (appears on scroll) */}
      <FloatingCTA />

      {/* Global Styles for Smooth Scroll */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        Pricing Section */}
        <PricingSection />

        {/* 
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
      `}</style>
    </div>
  );
}

function FloatingCTA() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="fixed bottom-8 right-8 z-40 hidden md:block"
    >
      <motion.a
        href="/sign-up"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-4 bg-gradient-to-r from-white to-gray-100 rounded-2xl shadow-2xl shadow-white/30 text-white font-semibold flex items-center gap-2"
      >
        Start Free Trial
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          →
        </motion.span>
      </motion.a>
    </motion.div>
  );
}
