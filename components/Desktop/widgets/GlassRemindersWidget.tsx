"use client";

import React, { useState } from 'react';

interface GlassRemindersWidgetProps {
  isDarkMode?: boolean;
}

export default function GlassRemindersWidget({ isDarkMode = true }: GlassRemindersWidgetProps) {
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Spring cleaning', completed: false },
    { id: 2, text: 'Volunteer project', completed: false },
    { id: 3, text: 'Family vacation', completed: false }
  ]);

  const toggleReminder = (id: number) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const activeCount = 7 - reminders.filter(r => r.completed).length;

  const textColor = isDarkMode ? 'text-white' : 'text-black';
  const textColorMuted = isDarkMode ? 'text-white/50' : 'text-black/50';
  const textColorPrimary = isDarkMode ? 'text-white/95' : 'text-black/90';
  const borderColor = isDarkMode ? 'border-white/35' : 'border-black/25';
  const borderColorHover = isDarkMode ? 'border-white/60' : 'border-black/50';

  return (
    <div className={`w-40 h-40 p-4 flex flex-col justify-between select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center w-full">
        <span className={`text-[12px] font-bold ${textColorPrimary}`}>
          Reminders
        </span>
        <span className={`text-[14px] font-bold ${textColorMuted}`}>
          {activeCount}
        </span>
      </div>

      {/* List */}
      <div className="relative z-10 flex flex-col gap-2.5 mt-2 flex-1 justify-center">
        {reminders.map(item => (
          <div 
            key={item.id} 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => toggleReminder(item.id)}
          >
            {/* Custom Circular Checkbox */}
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
              item.completed 
                ? isDarkMode 
                  ? 'bg-white/25 border-white/40' 
                  : 'bg-black/20 border-black/40'
                : `${borderColor} group-hover:${borderColorHover} bg-transparent`
            }`}>
              {item.completed && (
                <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
              )}
            </div>
            {/* Text */}
            <span className={`text-[10px] font-normal transition-all ${
              item.completed 
                ? `line-through ${textColorMuted}` 
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
