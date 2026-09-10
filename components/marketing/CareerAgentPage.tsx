'use client'

import Navigation from './career-agent/Navigation'
import RichHeroSection from './career-agent/RichHeroSection'
import PermissionAutomationShowcase from './career-agent/PermissionAutomationShowcase'
import RichHowItWorks from './career-agent/RichHowItWorks'
import ProductSystemTour from './career-agent/ProductSystemTour'
import ProductProofSections from './career-agent/ProductProofSections'
import PricingSection from '../VibhavMarketing/PricingSection'
import FinalCTA from './career-agent/FinalCTA'
import Footer from './career-agent/Footer'

export default function CareerAgentMarketingPage() {
  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-black text-white">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <RichHeroSection />

        {/* Permission-controlled OS automation */}
        <PermissionAutomationShowcase />

        {/* Real Product System */}
        <ProductSystemTour />

        {/* How It Works */}
        <RichHowItWorks />

        {/* Screenshot-led product chapters */}
        <ProductProofSections />

        {/* Plans and checkout */}
        <PricingSection />

        {/* Final CTA */}
        <FinalCTA />

        {/* Footer */}
        <Footer />
      </main>

      {/* Global Styles */}
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

        ::selection {
          background: rgba(59, 130, 246, 0.5);
          color: white;
        }

        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  )
}
