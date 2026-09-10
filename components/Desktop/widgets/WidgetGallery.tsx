"use client";

import React from 'react';
import { FiX } from 'react-icons/fi';
import CalendarWidget from './CalendarWidget';
import WeatherWidget from './WeatherWidget';
import PhotoWidget from './PhotoWidget';
import ClockWidget from './ClockWidget';
import GlassClockWidget from './GlassClockWidget';
import GlassCalendarWidget from './GlassCalendarWidget';
import GlassWeatherWidget from './GlassWeatherWidget';
import GlassRemindersWidget from './GlassRemindersWidget';
import GlassDayWidget from './GlassDayWidget';
import GlassMiniCalendarWidget from './GlassMiniCalendarWidget';
import GlassWorldClockWidget from './GlassWorldClockWidget';
import GlassSmallWorldClockWidget from './GlassSmallWorldClockWidget';
import GlassWideRemindersWidget from './GlassWideRemindersWidget';
import GlassSFWeatherWidget from './GlassSFWeatherWidget';
import CareerAgentWidget from './CareerAgentWidget';
import LoveCounter from '../../Dekstop/macFeedback';

interface WidgetGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
  isDarkMode?: boolean;
}

export default function WidgetGallery({ isOpen, onClose, onAddWidget, isDarkMode = true }: WidgetGalleryProps) {
  if (!isOpen) return null;

  const textColor = isDarkMode ? 'text-white' : 'text-black';
  const textColorPrimary = isDarkMode ? 'text-white/90' : 'text-black/90';
  const buttonBg = isDarkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30';

  return (
    <div 
      className={`absolute top-10 right-4 bottom-24 w-[400px] max-h-[80vh] backdrop-blur-2xl rounded-3xl z-[100000] overflow-hidden flex flex-col border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-black/45 to-black/20 border-white/10 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.45)]' 
          : 'bg-gradient-to-b from-white/70 to-white/40 border-black/10 shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.05),0_12px_40px_rgba(0,0,0,0.15)]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Liquid Glass Overlay Effect */}
      <div className={`absolute inset-0 pointer-events-none z-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-white/5 via-transparent to-black/10' 
          : 'bg-gradient-to-br from-white/10 via-transparent to-black/5'
      }`} />

      <div className={`relative z-10 p-5 flex justify-between items-center ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>
        <h2 className={`text-xl font-semibold cursor-default ${textColor}`}>Widgets</h2>
        <button 
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${buttonBg} ${textColor}`}
        >
          <FiX />
        </button>
      </div>
      
      <div className="relative z-10 flex-1 overflow-y-auto p-5 pb-10 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Reactions</span>
            <button
              onClick={() => onAddWidget('reaction')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none h-16 w-full flex justify-center">
            <LoveCounter enabled={false} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Career Agent</span>
            <button
              onClick={() => onAddWidget('career-agent')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none h-44 w-full">
            <CareerAgentWidget preview onOpen={() => undefined} />
          </div>
        </div>

        {/* Glass Clock Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Clock</span>
            <button 
              onClick={() => onAddWidget('glass-clock')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassClockWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Calendar Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Calendar</span>
            <button 
              onClick={() => onAddWidget('glass-calendar')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassCalendarWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Weather Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Weather</span>
            <button 
              onClick={() => onAddWidget('glass-weather')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-75 transform origin-top w-full flex justify-center">
            <GlassWeatherWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Reminders Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Reminders</span>
            <button 
              onClick={() => onAddWidget('glass-reminders')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassRemindersWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Day Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Day</span>
            <button 
              onClick={() => onAddWidget('glass-day')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassDayWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Mini Calendar Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Mini Calendar</span>
            <button 
              onClick={() => onAddWidget('glass-mini-calendar')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassMiniCalendarWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass World Clock Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass World Clock</span>
            <button 
              onClick={() => onAddWidget('glass-world-clock')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-75 transform origin-top w-full flex justify-center">
            <GlassWorldClockWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Small World Clock Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Small World Clock</span>
            <button 
              onClick={() => onAddWidget('glass-small-world-clock')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassSmallWorldClockWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass Wide Reminders Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass Wide Reminders</span>
            <button 
              onClick={() => onAddWidget('glass-wide-reminders')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-75 transform origin-top w-full flex justify-center">
            <GlassWideRemindersWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Glass SF Weather Widget */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Glass SF Weather</span>
            <button 
              onClick={() => onAddWidget('glass-sf-weather')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <GlassSFWeatherWidget isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Calendar Widget (Original) */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Calendar (Classic)</span>
            <button 
              onClick={() => onAddWidget('calendar')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <CalendarWidget />
          </div>
        </div>

        {/* Weather Widget (Original) */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Weather (Classic)</span>
            <button 
              onClick={() => onAddWidget('weather')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <WeatherWidget />
          </div>
        </div>

        {/* Photos Widget (Original) */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Photos (Classic)</span>
            <button 
              onClick={() => onAddWidget('photo')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <PhotoWidget />
          </div>
        </div>

        {/* Clock Widget (Original) */}
        <div className="flex flex-col items-center">
          <div className="w-full mb-3 flex items-center justify-between">
            <span className={`font-medium ${textColorPrimary}`}>Clock (Classic)</span>
            <button 
              onClick={() => onAddWidget('clock')}
              className={`px-3 py-1 rounded-full text-xs ${buttonBg} ${textColor} transition-colors`}
            >
              Add
            </button>
          </div>
          <div className="pointer-events-none scale-90 transform origin-top w-full flex justify-center">
            <ClockWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
