"use client";

import React, { useState, useEffect } from 'react';

interface GlassWorldClockWidgetProps {
  isDarkMode?: boolean;
}

function AnalogClock({ timezone, cityCode, isDarkMode }: { timezone: string; cityCode: string; isDarkMode: boolean }) {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only set time on client to avoid hydration mismatch
    setTime(new Date());
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate local time for timezone
  const getLocalTime = (tz: string) => {
    try {
      const string = new Date().toLocaleString("en-US", { timeZone: tz });
      return new Date(string);
    } catch (e) {
      return new Date();
    }
  };

  // Don't render until mounted
  if (!mounted || !time) {
    return null;
  }

  const localTime = getLocalTime(timezone);
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();
  const seconds = localTime.getSeconds();

  const hrAngle = (hours % 12) * 30 + minutes * 0.5;
  const minAngle = minutes * 6;
  const secAngle = seconds * 6;

  const textColor = isDarkMode ? 'text-white/90' : 'text-black/90';
  const textColorMuted = isDarkMode ? 'text-white/60' : 'text-black/60';
  const textColorSubtle = isDarkMode ? 'text-white/40' : 'text-black/40';

  return (
    <svg width="56" height="56" viewBox="0 0 60 60" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
      {/* Outer Dial Circle */}
      <circle cx="30" cy="30" r="28" stroke={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" fill="none" />
      
      {/* City Code inside clock */}
      <text x="30" y="22" textAnchor="middle" fontSize="6" fontWeight="bold" className={`fill-current uppercase letter-spacing-widest ${textColorMuted}`}>
        {cityCode}
      </text>

      {/* Markers/Numbers */}
      <text x="30" y="11" textAnchor="middle" fontSize="5" className={`fill-current ${textColorMuted}`}>12</text>
      <text x="30" y="55" textAnchor="middle" fontSize="5" className={`fill-current ${textColorMuted}`}>6</text>
      <text x="10" y="32" textAnchor="middle" fontSize="5" className={`fill-current ${textColorMuted}`}>9</text>
      <text x="50" y="32" textAnchor="middle" fontSize="5" className={`fill-current ${textColorMuted}`}>3</text>
      
      {/* Small number markers for others */}
      <text x="40" y="15" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>1</text>
      <text x="48" y="23" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>2</text>
      <text x="48" y="41" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>4</text>
      <text x="40" y="49" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>5</text>
      <text x="20" y="49" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>7</text>
      <text x="12" y="41" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>8</text>
      <text x="12" y="23" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>10</text>
      <text x="20" y="15" textAnchor="middle" fontSize="4.5" className={`fill-current ${textColorSubtle}`}>11</text>

      {/* Hour Hand */}
      <line 
        x1="30" y1="30" 
        x2={30 + 12 * Math.sin((hrAngle * Math.PI) / 180)} 
        y2={30 - 12 * Math.cos((hrAngle * Math.PI) / 180)} 
        stroke={isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'} strokeWidth="1.8" strokeLinecap="round" 
      />
      {/* Minute Hand */}
      <line 
        x1="30" y1="30" 
        x2={30 + 18 * Math.sin((minAngle * Math.PI) / 180)} 
        y2={30 - 18 * Math.cos((minAngle * Math.PI) / 180)} 
        stroke={isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'} strokeWidth="1.2" strokeLinecap="round" 
      />
      {/* Second Hand */}
      <line 
        x1="30" y1="30" 
        x2={30 + 20 * Math.sin((secAngle * Math.PI) / 180)} 
        y2={30 - 20 * Math.cos((secAngle * Math.PI) / 180)} 
        stroke="#ff453a" strokeWidth="0.6" strokeLinecap="round" 
      />
      
      {/* Center Pin */}
      <circle cx="30" cy="30" r="1.5" fill={isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'} />
      <circle cx="30" cy="30" r="0.6" fill="#303030" />
    </svg>
  );
}

export default function GlassWorldClockWidget({ isDarkMode = true }: GlassWorldClockWidgetProps) {
  const clocks = [
    { name: 'Cupertino', tz: 'America/Los_Angeles', code: 'SF', offset: '+0HRS', rel: 'Today' },
    { name: 'Tokyo', tz: 'Asia/Tokyo', code: 'TOK', offset: '+16HRS', rel: 'Tomorrow' },
    { name: 'Sydney', tz: 'Australia/Sydney', code: 'SYD', offset: '+17HRS', rel: 'Tomorrow' },
    { name: 'Paris', tz: 'Europe/Paris', code: 'PAR', offset: '+9HRS', rel: 'Today' }
  ];

  const textColorPrimary = isDarkMode ? 'text-white/95' : 'text-black/90';
  const textColorMuted = isDarkMode ? 'text-white/50' : 'text-black/50';
  const textColorSubtle = isDarkMode ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`w-80 h-40 p-4 flex flex-col justify-between select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Clocks Layout */}
      <div className="relative z-10 flex justify-between items-center w-full px-1 mt-1">
        {clocks.map((clock, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {/* Clock Dial */}
            <AnalogClock timezone={clock.tz} cityCode={clock.code} isDarkMode={isDarkMode} />
            
            {/* Clock Labels */}
            <span className={`text-[10px] font-bold mt-2 leading-none ${textColorPrimary}`}>
              {clock.name}
            </span>
            <span className={`text-[8.5px] font-medium leading-none mt-1 ${textColorMuted}`}>
              {clock.rel}
            </span>
            <span className={`text-[8.5px] font-semibold leading-none mt-0.5 ${textColorSubtle}`}>
              {clock.offset}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
