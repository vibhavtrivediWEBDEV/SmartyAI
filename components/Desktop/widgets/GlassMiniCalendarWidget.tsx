"use client";

import React, { useState, useEffect } from 'react';

interface GlassMiniCalendarWidgetProps {
  isDarkMode?: boolean;
}

export default function GlassMiniCalendarWidget({ isDarkMode = true }: GlassMiniCalendarWidgetProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only set date on client to avoid hydration mismatch
    setDate(new Date());
    setMounted(true);
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Don't render until mounted on client to prevent null errors
  if (!mounted || !date) {
    return (
      <div className="w-72 h-64 bg-gray-800/50 backdrop-blur-md rounded-3xl p-4 flex flex-col shadow-md select-none shrink-0 animate-pulse">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-32 h-32 rounded-lg bg-gray-700/50"></div>
        </div>
      </div>
    );
  }

  const monthName = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  
  // Get days for the calendar
  const getDaysInMonth = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    
    // Next month days (fill to 35)
    const remaining = 35 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    
    return days;
  };

  const days = getDaysInMonth();
  const today = date.getDate();

  return (
    <div className={`w-40 h-40 p-3 flex flex-col justify-between select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10' 
        : 'bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-black/5'
    }`}>
      {/* Header Month */}
      <div className={`relative z-10 text-[9px] font-bold tracking-wider mb-1 ml-1 leading-none uppercase ${
        isDarkMode ? 'text-white/50' : 'text-black/50'
      }`}>
        {monthName}
      </div>

      {/* Weekdays Header */}
      <div className="relative z-10 flex justify-between px-1 mb-1 leading-none">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className={`text-[7.5px] font-bold w-full text-center ${
            isDarkMode ? 'text-white/45' : 'text-black/45'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="relative z-10 grid grid-cols-7 gap-y-[1px] gap-x-0 w-full place-items-center flex-1 mt-0.5">
        {days.map((day, i) => {
          const isToday = day.currentMonth && day.day === today;
          return (
            <div 
              key={i} 
              className={`text-[8.5px] font-semibold w-4 h-4 flex items-center justify-center rounded-full transition-all
                ${isToday 
                  ? 'bg-white text-neutral-900 shadow-sm font-bold scale-105' 
                  : !day.currentMonth 
                    ? isDarkMode ? 'text-white/20' : 'text-black/20'
                    : isDarkMode ? 'text-white/85' : 'text-black/85'
                }
              `}
            >
              {day.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
