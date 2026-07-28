"use client"

import React, { useEffect, useState, useRef } from "react";
import { useSettings } from "@/app/context/settingContext";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface BrowserContentProps {
  searchQuery?: string;
  directUrl?: string;
  onLoad?: () => void;
  onNavigate?: (url: string) => void;
  onError?: (error: string) => void;
}

export function BrowserContent({ 
  searchQuery,
  directUrl,
  onLoad,
  onNavigate,
  onError
}: BrowserContentProps) {
  const { settings } = useSettings();
  const isDark = settings?.darkMode ?? true;
  
  const [searchInput, setSearchInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/webhp?igu=1");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Use ref to track if we've already searched this query
  const searchedQueryRef = useRef<string>("");

  // Execute search when searchQuery changes (from GLM/voice)
  useEffect(() => {
    console.log('🔍 BrowserContent received searchQuery:', searchQuery, 'already searched:', searchedQueryRef.current);
    
    if (searchQuery && searchQuery.trim() && searchQuery !== searchedQueryRef.current) {
      searchedQueryRef.current = searchQuery; // Mark as searched
      const encoded = encodeURIComponent(searchQuery.trim());
      // Use igu=1 for Google iframe compatibility
      const googleUrl = `https://www.google.com/search?igu=1&q=${encoded}`;
      setCurrentUrl(googleUrl);
      setSearchInput(searchQuery);
      setIsLoading(true);
      onLoad?.();
      
      // Also fetch results for cards view
      executeSearch(searchQuery);
    }
  }, [searchQuery]);

  // Direct URL navigation
  useEffect(() => {
    if (directUrl) {
      setCurrentUrl(directUrl);
      setIsLoading(true);
      onNavigate?.(directUrl);
    }
  }, [directUrl]);

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    
    console.log('🔍 Fetching results for:', query);

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });

      const data = await response.json();
      
      setSearchResults(data.results || []);
      
      console.log(`✅ Found ${data.results?.length || 0} results from all sources`);
    } catch (error) {
      console.error('Search failed:', error);
      onError?.('Search failed. Please try again.');
    }
  };

  const handleManualSearch = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault?.();
    if (searchInput.trim()) {
      const encoded = encodeURIComponent(searchInput.trim());
      // Use igu=1 for Google iframe compatibility
      const googleUrl = `https://www.google.com/search?igu=1&q=${encoded}`;
      setCurrentUrl(googleUrl);
      setIsLoading(true);
      setShowResults(false); // Switch to iframe view
      executeSearch(searchInput);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const placeholderColor = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentColor = isDark ? 'text-blue-400' : 'text-blue-600';
  const linkColor = isDark ? 'text-blue-400' : 'text-blue-600';

  return (
    <div className={`h-full w-full flex flex-col ${bgColor} ${textColor}`}>
      {/* Header - Search Bar & Navigation */}
      <div className={`flex-shrink-0 p-2 border-b flex items-center gap-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
        {/* View Toggle */}
        <div className="flex gap-1 mr-2">
          <button
            onClick={() => setShowResults(false)}
            className={`px-2 py-1 text-xs rounded ${!showResults ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
          >
            🔍 Browser
          </button>
          <button
            onClick={() => setShowResults(true)}
            className={`px-2 py-1 text-xs rounded ${showResults ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
          >
            📋 Sources ({searchResults.length})
          </button>
        </div>
        
        {/* URL Bar */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualSearch(e);
            }
          }}
          className={`flex-1 px-3 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${textColor} ${borderColor} ${placeholderColor}`}
          placeholder="Search Google..."
        />
        <button
          onClick={handleManualSearch}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Search
        </button>
      </div>

      {/* Browser Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Google Iframe */}
        {!showResults && (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className={`text-sm ${mutedText}`}>Loading...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </>
        )}

        {/* Results List (All Sources) */}
        {showResults && (
          <div className={`h-full overflow-y-auto p-3 space-y-2 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {searchResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-3 rounded-lg border transition-colors hover:opacity-80 ${cardBg} ${borderColor}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {result.source}
                  </span>
                </div>
                <div className={`font-medium ${linkColor}`}>
                  {result.title}
                </div>
                <div className={`text-xs truncate ${mutedText}`}>
                  {result.url}
                </div>
              </a>
            ))}
            {searchResults.length === 0 && (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🔍</p>
                <p className={`text-sm ${mutedText}`}>No results yet. Search above!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`flex-shrink-0 px-3 py-1 text-xs border-t flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
        <span>🌐 {currentUrl.replace('https://', '').split('/')[0]}</span>
        <span>{showResults ? `📋 ${searchResults.length} sources` : '🔍 Google Search'}</span>
      </div>
    </div>
  );
}

export default BrowserContent;
