"use client";

import React, { useState, useEffect } from 'react';

interface GlassDayWidgetProps {
  isDarkMode?: boolean;
}

export default function GlassDayWidget({ isDarkMode = true }: GlassDayWidgetProps) {
  const [day, setDay] = useState('');

  useEffect(() => {
    const updateDay = () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[new Date().getDay()];
      setDay(currentDay);
    };
    updateDay();
    const interval = setInterval(updateDay, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col justify-center items-center select-none shrink-0 pointer-events-auto relative transition-all duration-300 min-w-[180px] min-h-[80px] rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Load Calligraphy Fonts for Frutilla style */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playball&family=Dancing+Script&display=swap');
        .frutilla-text {
          font-family: 'Great Vibes', 'Dancing Script', 'Playball', cursive;
          text-shadow: 0 4px 20px ${isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)'}, 0 2px 4px ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'};
        }
      `}} />

      {/* Day display */}
      <span className={`frutilla-text text-[60px] text-center leading-none select-text cursor-default ${
        isDarkMode ? 'text-white/95' : 'text-black/90'
      }`}>
        {day}
      </span>
    </div>
  );
}
