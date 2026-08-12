"use client";

import React, { useState, useEffect } from 'react';

interface GlassCalendarWidgetProps {
  isDarkMode?: boolean;
}

export default function GlassCalendarWidget({ isDarkMode = true }: GlassCalendarWidgetProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only set date on client to avoid hydration mismatch
    setDate(new Date());
    setMounted(true);
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Don't render until mounted on client to prevent hydration errors
  if (!mounted || !date) {
    return (
      <div className={`w-40 h-40 p-4 flex flex-col justify-center items-center select-none shrink-0 pointer-events-auto animate-pulse rounded-3xl ${
        isDarkMode 
          ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
          : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
      }`}>
        <div className={`h-3 bg-gray-400/30 rounded w-24 mb-3`}></div>
        <div className={`h-10 bg-gray-400/30 rounded w-12`}></div>
      </div>
    );
  }

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dayNumber = date.getDate().toString();

  const textColor = isDarkMode ? 'text-white' : 'text-black';
  const textColorMuted = isDarkMode ? 'text-white/50' : 'text-black/50';
  const textColorSubtle = isDarkMode ? 'text-white/60' : 'text-black/60';
  const textColorPrimary = isDarkMode ? 'text-white/95' : 'text-black/90';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-black/10';

  return (
    <div className={`w-40 h-40 p-4 flex flex-col justify-between select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Top Header */}
      <div className="relative z-10">
        <div className={`text-[10px] font-bold tracking-wider uppercase leading-none ${textColorMuted}`}>
          {dayOfWeek}
        </div>
        <div className={`text-4xl font-light mt-1 leading-none ${textColorPrimary}`}>
          {dayNumber}
        </div>
      </div>

      {/* Center Event Counts */}
      <div className="relative z-10 flex items-center gap-1.5 mt-1">
        {/* Overlapping circle avatars */}
        <div className="flex -space-x-1.5">
          <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#ff453a]" />
          <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#30d158]" />
          <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#0a84ff]" />
        </div>
        <span className={`text-[11px] font-medium leading-none ${textColorMuted}`}>
          3 all-day events
        </span>
      </div>

      {/* Bottom Event Detail Card */}
      <div className={`relative z-10 backdrop-blur-sm border rounded-xl p-2 mt-auto ${
        isDarkMode 
          ? 'bg-white/10 border-white/10' 
          : 'bg-black/5 border-black/10'
      }`}>
        <div className="flex items-center gap-1.5">
          {/* Vertical line indicator */}
          <div className="w-[3px] h-6 rounded-full bg-[#ff9f0a]" />
          <div>
            <div className={`text-[11px] font-semibold leading-tight ${textColorPrimary}`}>
              Supper Club
            </div>
            <div className={`text-[9px] font-medium leading-none mt-0.5 ${textColorSubtle}`}>
              5:30 – 6:30 PM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
