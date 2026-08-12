"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WebWidgetProps {
  url: string;
  title: string;
  favicon?: string;
  width: number;
  height: number;
  isDarkMode: boolean;
  onRemove?: () => void;
  onRefresh?: () => void;
  onOpenInBrowser?: () => void;
  onResize?: (width: number, height: number) => void;
  canEmbed?: boolean;
}

export default function WebWidget({
  url,
  title,
  favicon,
  width: initialWidth,
  height: initialHeight,
  isDarkMode,
  onRemove,
  onRefresh,
  onOpenInBrowser,
  onResize,
  canEmbed = true
}: WebWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if embedding is blocked
  useEffect(() => {
    // Known blocked domains
    const blockedDomains = [
      'youtube.com', 'youtu.be', 'facebook.com', 'twitter.com', 'x.com',
      'instagram.com', 'linkedin.com', 'github.com', 'stackoverflow.com'
    ];

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      if (blockedDomains.some(blocked => domain.includes(blocked))) {
        setEmbedError(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  }, [url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Check if iframe loaded successfully
    try {
      // Try to access iframe content - if blocked, this will throw
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        // This will throw if cross-origin
        // const doc = iframe.contentWindow.document;
      }
    } catch (error) {
      // If we can't access content, it might still be loaded
      // We'll rely on the blocked domain list
    }
  };

  const handleIframeError = () => {
    setEmbedError(true);
    setIsLoading(false);
  };

  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDarkMode ? 'border-white/10' : 'border-black/10';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full rounded-2xl overflow-hidden backdrop-blur-2xl border ${bgColor} ${borderColor} shadow-2xl`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Header */}
      <div className={`h-10 flex items-center justify-between px-3 border-b ${borderColor} ${isDarkMode ? 'bg-black/40' : 'bg-white/60'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {favicon && (
            <img src={favicon} alt="" className="w-4 h-4 rounded" />
          )}
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
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              }`}
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.73 2.24" />
                <path d="M21 3v6h-6" />
              </svg>
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

      {/* Content Area */}
      <div className="relative" style={{ height: 'calc(100% - 40px)' }}>
        {/* Loading State */}
        {isLoading && !embedError && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${cardBg}`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
              <p className={`text-sm ${mutedText}`}>Loading webpage...</p>
            </div>
          </div>
        )}

        {/* Embed Error State */}
        {embedError && (
          <div className={`absolute inset-0 flex items-center justify-center p-4 ${cardBg}`}>
            <div className="text-center max-w-md">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'
              }`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#fbbf24' : '#f59e0b'} strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className={`font-semibold mb-2 ${textColor}`}>Live Embedding Not Available</h3>
              <p className={`text-sm ${mutedText} mb-4`}>
                This website doesn't allow iframe embedding due to security policies.
              </p>
              <button
                onClick={() => {
                  // Trigger snapshot creation instead
                  window.dispatchEvent(new CustomEvent('widget:convert-to-snapshot', {
                    detail: { url, title }
                  }));
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Snapshot Instead
              </button>
            </div>
          </div>
        )}

        {/* Webpage Iframe */}
        {!embedError && (
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
          />
        )}
      </div>

      {/* Live Indicator */}
      <div className="absolute top-12 right-2 z-20">
        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          LIVE
        </div>
      </div>
    </div>
  );
}
