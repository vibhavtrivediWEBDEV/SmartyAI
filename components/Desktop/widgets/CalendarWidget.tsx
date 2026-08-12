"use client";

import React, { useState, useEffect } from 'react';

export default function CalendarWidget() {
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
      <div className="w-40 h-40 bg-white rounded-3xl p-3 flex flex-col shadow-sm select-none shrink-0 pointer-events-auto animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-20 mb-3 ml-1"></div>
        <div className="flex justify-between px-1 mb-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-[2px] gap-x-0 w-full place-items-center flex-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // Simple date formatting functions (no external dependencies)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysInMonth = getDaysInMonth(date);
  const firstDayOfMonth = getFirstDayOfMonth(date);
  const currentDay = date.getDate();
  
  // Build calendar grid
  const days: JSX.Element[] = [];
  
  // Empty cells before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full text-gray-300" />);
  }
  
  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === currentDay;
    days.push(
      <div 
        key={i} 
        className={`text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full
          ${isToday ? 'bg-[#ff3b30] text-white' : 'text-gray-800'}
        `}
      >
        {i}
      </div>
    );
  }

  return (
    <div className="w-40 h-40 bg-white rounded-3xl p-3 flex flex-col shadow-sm select-none shrink-0 pointer-events-auto">
      <div className="text-[#ff3b30] text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1 leading-none">
        {monthNames[date.getMonth()]}
      </div>
      <div className="flex justify-between px-1 mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-[8px] font-bold text-gray-400 w-full text-center leading-none">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-[2px] gap-x-0 w-full place-items-center flex-1">
        {days}
      </div>
    </div>
  );
}
