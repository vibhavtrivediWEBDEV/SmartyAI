"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WebCaptureWidgetProps {
  image: string; // Base64 PNG
  title: string;
  sourceUrl: string;
  sourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  capturedAt: string;
  refreshInterval?: number;
  width: number;
  height: number;
  isDarkMode: boolean;
  onRemove?: () => void;
  onOpenInBrowser?: () => void;
  onRefresh?: () => void;
}

export default function WebCaptureWidget({
  image: initialImage,
  title,
  sourceUrl,
  sourceRect,
  viewport,
  capturedAt,
  refreshInterval = 0,
  width: initialWidth,
  height: initialHeight,
  isDarkMode,
  onRemove,
  onOpenInBrowser,
  onRefresh
}: WebCaptureWidgetProps) {
  const [showControls, setShowControls] = useState(false);
  const [image, setImage] = useState(initialImage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCapturedAt, setLastCapturedAt] = useState(capturedAt);

  // Auto-refresh logic
  useEffect(() => {
    if (refreshInterval > 0 && onRefresh) {
      const intervalId = setInterval(async () => {
        setIsRefreshing(true);
        try {
          const response = await fetch('/api/web-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: sourceUrl,
              rect: sourceRect,
              viewport: viewport,
            }),
          });

          const data = await response.json();
          
          if (data.success && data.image) {
            setImage(data.image);
            setLastCapturedAt(data.capturedAt);
          }
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }, refreshInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, sourceUrl, sourceRect, viewport, onRefresh]);

  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-black/10';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden backdrop-blur-2xl border ${bgColor} ${borderColor} shadow-2xl`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Header */}
      <div className={`h-10 flex items-center justify-between px-3 border-b ${borderColor} ${isDarkMode ? 'bg-black/40' : 'bg-white/60'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-4 h-4 rounded flex items-center justify-center ${
            isDarkMode ? 'bg-purple-500/30' : 'bg-purple-100'
          }`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#a855f7' : '#7c3aed'} strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <span className={`text-sm font-medium truncate ${textColor}`}>
            {title}
          </span>
        </div>

        {/* Control Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="flex items-center gap-1.5"
        >
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              }`}
              title="Refresh capture"
            >
              {isRefreshing ? (
                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.73 2.24" />
                  <path d="M21 3v6h-6" />
                </svg>
              )}
            </button>
          )}

          {onOpenInBrowser && (
            <button
              onClick={onOpenInBrowser}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              }`}
              title="Open in Browser"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15,3 21,3 21,9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}

          {onRemove && (
            <button
              onClick={onRemove}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'
              }`}
              title="Remove Widget"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </motion.div>
      </div>

      {/* Screenshot Image */}
      <div className="relative" style={{ height: 'calc(100% - 40px)' }}>
        {image && image.startsWith('data:') ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="text-center">
              <div className={`text-4xl mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>📷</div>
              <p className={`text-sm ${mutedText}`}>{title}</p>
            </div>
          </div>
        )}

        {/* Refreshing Overlay */}
        {isRefreshing && (
          <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}>
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className={`text-xs ${mutedText}`}>Refreshing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Web Capture Badge */}
      <div className="absolute top-12 right-2 z-20">
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          refreshInterval > 0 
            ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            : isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
        }`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {refreshInterval > 0 ? `LIVE (${refreshInterval}s)` : 'CAPTURE'}
        </div>
      </div>

      {/* Region Info Badge */}
      <div className="absolute bottom-2 left-2 right-2 z-20">
        <div className={`px-3 py-2 rounded-lg backdrop-blur-xl ${
          isDarkMode 
            ? 'bg-black/60 text-white/80 border border-white/10' 
            : 'bg-white/80 text-gray-700 border border-black/10'
        }`}>
          <div className="text-xs truncate flex items-center gap-2">
            <span className="font-medium">{sourceRect.width}×{sourceRect.height}px</span>
            <span className="opacity-60">•</span>
            <span className="truncate">{sourceUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
