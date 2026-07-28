'use client'

import React, { useEffect, useState, useRef } from "react";

interface BrowserProps {
  isAppOpen: boolean;
  searchQuery?: string;
  directUrl?: string;
  windowConfig?: {
    position?: "right" | "left" | "center";
    width?: string;
    height?: string;
    zIndex?: number;
  };
  onLoad?: () => void;
  onNavigate?: (url: string) => void;
  onError?: (error: string) => void;
}

function Browser({ 
  isAppOpen, 
  searchQuery, 
  directUrl,
  windowConfig,
  onLoad,
  onNavigate,
  onError
}: BrowserProps) {
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/webhp?igu=1");
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const config = {
    position: windowConfig?.position || "right",
    width: windowConfig?.width || "30%",
    height: windowConfig?.height || "full",
    zIndex: windowConfig?.zIndex || 9999
  };

  const addToHistory = (url: string) => {
    setNavigationHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
  };

  useEffect(() => {
    if (directUrl) {
      setCurrentUrl(directUrl);
      addToHistory(directUrl);
      setIsLoading(true);
    } else if (searchQuery) {
      const encoded = encodeURIComponent(searchQuery);
      const googleUrl = `https://www.google.com/search?q=${encoded}`;
      setCurrentUrl(googleUrl);
      setSearchInput(searchQuery);
      addToHistory(googleUrl);
      setIsLoading(true);
    }
  }, [searchQuery, directUrl]);

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "absolute",
      zIndex: config.zIndex,
      height: config.height === "full" ? "100vh" : config.height,
      width: config.width,
      transition: "all 0.2s ease"
    };

    switch (config.position) {
      case "right":
        return { ...baseStyles, right: 0, top: 0 };
      case "left":
        return { ...baseStyles, left: 0, top: 0 };
      case "center":
        return { ...baseStyles, left: "50%", top: 0, transform: "translateX(-50%)" };
      default:
        return baseStyles;
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCurrentUrl(navigationHistory[historyIndex - 1]);
      setIsLoading(true);
    }
  };

  const handleForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCurrentUrl(navigationHistory[historyIndex + 1]);
      setIsLoading(true);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const encoded = encodeURIComponent(searchInput.trim());
      const googleUrl = `https://www.google.com/search?q=${encoded}`;
      setCurrentUrl(googleUrl);
      addToHistory(googleUrl);
      setIsLoading(true);
      onNavigate?.(googleUrl);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = currentUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setCurrentUrl(url);
    addToHistory(url);
    setIsLoading(true);
    onNavigate?.(url);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    onError?.("Failed to load page");
  };

  if (!isAppOpen) return null;

  return (
    <div style={getPositionStyles()}>
      <div className="bg-[hsl(240,5.9%,10%)] h-full w-full overflow-hidden flex flex-col">
        {/* Header - Desktop Theme Match */}
        <div className="border-b border-gray-700/30 flex-shrink-0">
          {/* Traffic lights row */}
          <div className="h-10 flex items-center justify-between px-3 bg-[hsl(240,5.9%,10%)]">
            <div className="flex items-center gap-2">
              <button 
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                onClick={() => window.dispatchEvent(new CustomEvent('close-chrome-browser'))}
                title="Close"
              >
                <span className="text-red-900 text-[9px] opacity-0 hover:opacity-100">×</span>
              </button>
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
              
              <span className="text-xs text-gray-400 ml-2">
                Chrome{searchQuery && <span className="text-gray-500"> • {searchQuery}</span>}
              </span>
            </div>
            {isLoading && <span className="text-xs text-gray-500 animate-pulse">Loading...</span>}
          </div>

          {/* Navigation row */}
          <div className="h-9 flex items-center gap-2 px-3 py-1">
            <div className="flex gap-0.5">
              <button 
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"
                title="Back"
              >
                ←
              </button>
              <button 
                onClick={handleForward}
                disabled={historyIndex >= navigationHistory.length - 1}
                className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"
                title="Forward"
              >
                →
              </button>
              <button 
                onClick={handleRefresh}
                className="p-1 text-gray-500 hover:text-gray-300 text-xs"
                title="Refresh"
              >
                ⟳
              </button>
            </div>

            <form onSubmit={handleUrlSubmit} className="flex-1">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                className="w-full bg-gray-800/50 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700/50 focus:border-blue-500/50 focus:outline-none"
                placeholder="URL"
              />
            </form>
          </div>

          {/* Search row */}
          <div className="h-9 flex items-center px-3 py-1">
            <form onSubmit={handleManualSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-gray-800/50 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700/50 focus:border-blue-500/50 focus:outline-none"
                placeholder="Search Google..."
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs rounded"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        
        {/* Content - Google Search */}
        <div className="flex-1 relative bg-white">
          {isLoading && (
            <div className="absolute inset-0 bg-[hsl(240,5.9%,10%)] flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-xs">Loading...</p>
              </div>
            </div>
          )}
          
          <iframe 
            ref={iframeRef}
            src={currentUrl} 
            className="w-full h-full border-0" 
            id="chrome-browser" 
            title="Google Search"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            onLoad={handleIframeLoad}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}

export default Browser;
