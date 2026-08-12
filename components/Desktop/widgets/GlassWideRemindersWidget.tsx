"use client";

import React, { useState } from 'react';
import { FiList } from 'react-icons/fi';

interface GlassWideRemindersWidgetProps {
  isDarkMode?: boolean;
}

export default function GlassWideRemindersWidget({ isDarkMode = true }: GlassWideRemindersWidgetProps) {
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Update presentation images', completed: false },
    { id: 2, text: 'Edit speaker notes', completed: false },
    { id: 3, text: 'Compile sources', completed: false },
    { id: 4, text: 'Email draft to Brian', completed: false }
  ]);

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const activeCount = reminders.filter(r => !r.completed).length;

  const textColorPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textColorMuted = isDarkMode ? 'text-white/50' : 'text-black/50';
  const textColorSubtle = isDarkMode ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`w-80 h-40 flex p-5 select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Left Column - Indicator Panel */}
      <div className="relative z-10 w-[28%] flex flex-col justify-between h-full pr-1">
        {/* Bullet List Icon with Circle Background */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.15)] ${
          isDarkMode 
            ? 'bg-white/10 hover:bg-white/15' 
            : 'bg-black/10 hover:bg-black/15'
        }`}>
          <FiList className={`w-5 h-5 ${isDarkMode ? 'text-white/90' : 'text-black/90'}`} />
        </div>

        {/* Counter and Label */}
        <div className="flex flex-col mt-auto select-none cursor-default">
          <span className={`text-[36px] font-semibold leading-none tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${textColorPrimary}`}>
            {activeCount}
          </span>
          <span className={`text-[10px] font-semibold leading-tight tracking-wide mt-1 uppercase ${textColorMuted}`}>
            Don&apos;t forget
          </span>
        </div>
      </div>

      {/* Right Column - Checklist */}
      <div className="relative z-10 flex-1 flex flex-col justify-center gap-3.5 pl-4 h-full">
        {reminders.map(item => (
          <div 
            key={item.id} 
            className="flex items-center gap-3 cursor-pointer group py-0.5"
            onClick={() => toggleReminder(item.id)}
          >
            {/* Custom Circular Checkbox matching screenshot style */}
            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
              item.completed 
                ? isDarkMode
                  ? 'bg-white/90 border-white text-neutral-800 shadow-sm'
                  : 'bg-black/80 border-black text-white shadow-sm'
                : `${isDarkMode ? 'border-white/35 group-hover:border-white/55 bg-white/5' : 'border-black/25 group-hover:border-black/50 bg-black/5'}`
            }`}>
              {item.completed && (
                <svg className={`w-2.5 h-2.5 ${isDarkMode ? 'text-neutral-900' : 'text-white'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            
            {/* Text */}
            <span className={`text-[11.5px] font-normal leading-none transition-all tracking-wide ${
              item.completed 
                ? `line-through ${textColorSubtle}` 
                : `${isDarkMode ? 'text-white/90 group-hover:text-white' : 'text-black/80 group-hover:text-black'}`
            }`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
