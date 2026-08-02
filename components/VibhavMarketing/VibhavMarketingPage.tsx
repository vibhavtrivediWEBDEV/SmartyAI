"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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

export default function VibhavMarketingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <Hero />

        {/* Feature Overview */}
        <FeatureOverview />

        {/* Role-specific solutions */}
        <AudienceSection />

        {/* Application Showcase */}
        <ApplicationShowcase />

        {/* AI Section */}
        <AISection />

        {/* Productivity Section */}
        <ProductivitySection />

        {/* Dashboard Preview */}
        <DashboardPreview />

        {/* Pricing Section */}
        <PricingSection />

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
        className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-2xl shadow-blue-600/30 text-white font-semibold flex items-center gap-2"
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
