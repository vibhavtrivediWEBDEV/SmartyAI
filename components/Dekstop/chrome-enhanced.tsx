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

  // Update URL when searchQuery or directUrl changes
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
    } else {
      setCurrentUrl("https://www.google.com/webhp?igu=1");
    }
  }, [searchQuery, directUrl]);

  const addToHistory = (url: string) => {
    setNavigationHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
  };

  // Calculate position styles
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "absolute",
      zIndex: config.zIndex,
      height: config.height === "full" ? "100vh" : config.height,
      width: config.width,
      transition: "all 0.3s ease-in-out"
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

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
    
    // Try to communicate with iframe for real-time interaction
    try {
      if (iframeRef.current?.contentWindow) {
        // Post message to iframe for potential GLM integration
        iframeRef.current.contentWindow.postMessage({
          type: 'BROWSER_READY',
          url: currentUrl,
          searchQuery: searchQuery
        }, '*');
      }
    } catch (e) {
      console.log('Cannot communicate with iframe due to CORS');
    }
  };

  const handleError = () => {
    setIsLoading(false);
    onError?.("Failed to load page");
  };

  // Navigation handlers
  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCurrentUrl(navigationHistory[historyIndex - 1]);
    }
  };

  const handleForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCurrentUrl(navigationHistory[historyIndex + 1]);
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(e.target.value);
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

  if (!isAppOpen) return null;

  return (
    <div style={getPositionStyles()}>
      <div className="bg-gray-900 h-full w-full rounded-l-xl overflow-hidden border-l-2 border-t-2 border-b-2 border-blue-500/30 shadow-2xl">
        {/* Browser Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          {/* Traffic lights and title */}
          <div className="h-8 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer hover:bg-yellow-600" />
              <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer hover:bg-green-600" />
              <span className="text-xs text-gray-400 ml-2 font-medium">
                Chrome {searchQuery && `- Searching: ${searchQuery}`}
              </span>
            </div>
            {isLoading && (
              <span className="text-xs text-blue-400 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Loading...
              </span>
            )}
          </div>

          {/* Navigation bar */}
          <div className="h-10 flex items-center gap-2 px-3">
            {/* Back/Forward/Refresh */}
            <div className="flex gap-1">
              <button 
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Back"
              >
                ←
              </button>
              <button 
                onClick={handleForward}
                disabled={historyIndex >= navigationHistory.length - 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Forward"
              >
                →
              </button>
              <button 
                onClick={handleRefresh}
                className="p-1 text-gray-400 hover:text-white"
                title="Refresh"
              >
                ⟳
              </button>
            </div>

            {/* URL Bar */}
            <form onSubmit={handleUrlSubmit} className="flex-1">
              <input
                type="text"
                value={currentUrl}
                onChange={handleUrlChange}
                className="w-full bg-gray-700 text-white text-xs px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter URL..."
              />
            </form>
          </div>

          {/* Search Bar */}
          <div className="h-10 flex items-center px-3 pb-2">
            <form onSubmit={handleManualSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-gray-700 text-white text-xs px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Search Google..."
              />
              <button
                type="submit"
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="h-[calc(100vh-112px)] w-full relative bg-white">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Loading {searchQuery ? `"${searchQuery}"` : 'page'}...</p>
              </div>
            </div>
          )}
          
          <iframe 
            ref={iframeRef}
            src={currentUrl} 
            className="w-full h-full border-0" 
            id="chrome-browser" 
            title="Chrome Browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            onLoad={handleIframeLoad}
            onError={handleError}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}

export default Browser;
