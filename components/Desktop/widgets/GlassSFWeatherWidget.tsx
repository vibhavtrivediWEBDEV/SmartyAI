"use client";

import React from 'react';

interface GlassSFWeatherWidgetProps {
  isDarkMode?: boolean;
}

const PartlyCloudyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" className="text-yellow-300" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" className="text-yellow-300 stroke-none" />
    <path d="M17.5 19H9a5 5 0 0 1-5-5c0-2.3 1.5-4.3 3.6-4.8A6 6 0 0 1 18 13.5a5 5 0 0 1-.5 5.5Z" fill="currentColor" className="text-white/80 stroke-none" />
  </svg>
);

export default function GlassSFWeatherWidget({ isDarkMode = true }: GlassSFWeatherWidgetProps) {
  const textColorPrimary = isDarkMode ? 'text-white/95' : 'text-black/90';
  const textColorMuted = isDarkMode ? 'text-white/60' : 'text-black/60';

  return (
    <div className={`w-40 h-40 p-4 flex flex-col justify-between select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Top half */}
      <div className="relative z-10">
        <div className={`text-[13px] font-bold leading-none ${textColorPrimary}`}>
          San Francisco
        </div>
        <div className={`text-[38px] font-light mt-1.5 leading-none ${textColorPrimary}`}>
          53°
        </div>
      </div>

      {/* Bottom half */}
      <div className="relative z-10 mt-auto">
        <div className="flex items-center text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.4)] mb-1">
          <PartlyCloudyIcon />
        </div>
        <div className={`text-[11px] font-bold leading-none ${textColorPrimary}`}>
          Partly Cloudy
        </div>
        <div className={`text-[9.5px] font-medium tracking-tight mt-1 leading-none ${textColorMuted}`}>
          H:56° L:50°
        </div>
      </div>
    </div>
  );
}
