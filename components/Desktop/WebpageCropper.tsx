"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebpageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onCropComplete: (croppedImage: string, title: string, sourceUrl: string) => void;
  onWebCaptureComplete?: (captureData: {
    image: string;
    title: string;
    url: string;
    rect: { x: number; y: number; width: number; height: number };
    viewport: { width: number; height: number; scrollX: number; scrollY: number };
    capturedAt: string;
  }) => void;
  isDarkMode: boolean;
  enableWebCapture?: boolean; // Enable Puppeteer-based capture (default: false)
}

export default function WebpageCropper({
  isOpen,
  onClose,
  url,
  title,
  onCropComplete,
  onWebCaptureComplete,
  isDarkMode,
  enableWebCapture = false
}: WebpageCropperProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [editMode, setEditMode] = useState(true); // Start in edit mode to interact with page
  const [currentIframeUrl, setCurrentIframeUrl] = useState(url);
  const [currentIframeTitle, setCurrentIframeTitle] = useState(title);
  const [iframeScroll, setIframeScroll] = useState({ x: 0, y: 0 });
  const [iframeViewport, setIframeViewport] = useState({ width: 1280, height: 720 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIframeLoaded(false);
      setCropArea(null);
      setIsSelecting(false);
      setStartPos(null);
      setEditMode(true); // Reset to edit mode when opening
      // IMPORTANT: Don't reset currentIframeUrl here - it should track navigation
    }
  }, [isOpen]);
  
  // Update URL when prop changes
  useEffect(() => {
    if (url && url !== currentIframeUrl) {
      setCurrentIframeUrl(url);
      setCurrentIframeTitle(title);
    }
  }, [url, title]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    
    // Try to get current URL and title from iframe (works for same-origin only)
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        // Update URL and title
        try {
          const newUrl = iframe.contentWindow.location.href;
          const newTitle = iframe.contentDocument?.title || title;
          
          // Only update if URL actually changed
          if (newUrl !== 'about:blank' && newUrl !== currentIframeUrl) {
            console.log('📍 Iframe navigated to:', newUrl);
            setCurrentIframeUrl(newUrl);
            setCurrentIframeTitle(newTitle);
          }
        } catch (e) {
          // Cross-origin - can't read location
          console.log('🔒 Cross-origin iframe - cannot track URL');
        }
        
        // Get scroll position and viewport size (may fail cross-origin)
        try {
          setIframeScroll({
            x: iframe.contentWindow.scrollX || 0,
            y: iframe.contentWindow.scrollY || 0
          });
          setIframeViewport({
            width: iframe.contentWindow.innerWidth || 1280,
            height: iframe.contentWindow.innerHeight || 720
          });
        } catch (e) {
          // Cross-origin - use defaults
          console.log('🔒 Using default viewport for cross-origin');
        }
      }
    } catch (crossOriginError) {
      // Cross-origin - use prop values
      console.log('Cross-origin iframe, using prop values for URL/title');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode && !containerRef.current) return;
    if (editMode) return; // Don't select in edit mode
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setIsSelecting(true);
    setCropArea(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos || !containerRef.current || editMode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);
    
    setCropArea({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const captureScreenshot = useCallback(async () => {
    if (!cropArea || !containerRef.current) return;
    
    setIsCapturing(true);
    
    try {
      // If web capture is enabled, use Puppeteer backend
      if (enableWebCapture && onWebCaptureComplete) {
        const captureData = {
          image: '', // Will be filled by backend
          title: currentIframeTitle,
          url: currentIframeUrl,
          rect: {
            x: cropArea.x + iframeScroll.x,
            y: cropArea.y + iframeScroll.y,
            width: cropArea.width,
            height: cropArea.height,
          },
          viewport: {
            width: iframeViewport.width,
            height: iframeViewport.height,
            scrollX: iframeScroll.x,
            scrollY: iframeScroll.y,
          },
          capturedAt: new Date().toISOString(),
        };
        
        onWebCaptureComplete(captureData);
        onClose();
        setIsCapturing(false);
        return;
      }
      
      // Fallback to html2canvas for same-origin capture
      let finalImage: string;
      
      try {
        // Dynamically import html2canvas
        const html2canvasModule = await import('html2canvas');
        const html2canvas = html2canvasModule.default;
        
        const iframe = iframeRef.current;
        if (!iframe) throw new Error('Iframe not found');
        
        // Try to access iframe content (same-origin only)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error('Cannot access iframe document');
        
        // Capture iframe body
        const iframeCanvas = await html2canvas(iframeDoc.body, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          scale: 1
        });
        
        // Crop the specific area from iframe canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(150, cropArea.width);
        canvas.height = Math.max(150, cropArea.height);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) throw new Error('Cannot create canvas context');
        
        // Calculate scale factors
        const containerRect = containerRef.current.getBoundingClientRect();
        const scaleX = iframeCanvas.width / containerRect.width;
        const scaleY = iframeCanvas.height / containerRect.height;
        
        // Draw cropped area
        ctx.drawImage(
          iframeCanvas,
          cropArea.x * scaleX,
          cropArea.y * scaleY,
          cropArea.width * scaleX,
          cropArea.height * scaleY,
          0, 0,
          canvas.width,
          canvas.height
        );
        
        finalImage = canvas.toDataURL('image/png');
        
      } catch (captureError) {
        console.warn('Actual capture failed, using placeholder:', captureError);
        
        // Fallback: Create beautiful placeholder card
        const canvas = document.createElement('canvas');
      canvas.width = Math.max(200, cropArea.width);
      canvas.height = Math.max(180, cropArea.height);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot create canvas');
      }
      
      // Beautiful gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, isDarkMode ? '#2a2a4a' : '#ffffff');
      gradient.addColorStop(0.5, isDarkMode ? '#1e1e3a' : '#f8f8ff');
      gradient.addColorStop(1, isDarkMode ? '#1a1a3a' : '#f0f0f8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Subtle grid pattern
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Website icon with glow
      ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
      ctx.beginPath();
      ctx.arc(40, 50, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#9333ea';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌐', 40, 58);
      ctx.textAlign = 'left';
      
      // Title
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const maxTitleWidth = canvas.width - 100;
      let displayTitle = title;
      if (ctx.measureText(displayTitle).width > maxTitleWidth) {
        while (ctx.measureText(displayTitle + '...').width > maxTitleWidth && displayTitle.length > 0) {
          displayTitle = displayTitle.slice(0, -1);
        }
        displayTitle += '...';
      }
      ctx.fillText(displayTitle, 75, 48);
      
      // URL
      ctx.fillStyle = isDarkMode ? '#aaaaaa' : '#666666';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const displayUrl = url.replace('https://', '').replace('http://', '').split('/')[0];
      ctx.fillText(displayUrl, 75, 70);
      
      // Info box
      ctx.fillStyle = isDarkMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.08)';
      roundRect(ctx, 20, 95, canvas.width - 40, 50, 8);
      ctx.fill();
      
      // Badge
      ctx.fillStyle = '#9333ea';
      roundRect(ctx, 25, 100, 140, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✂️ CROPPED AREA', 32, 118);
      
      // Size
      ctx.fillStyle = isDarkMode ? '#888888' : '#999999';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${Math.round(cropArea.width)} × ${Math.round(cropArea.height)} pixels`, 175, 118);
      
      // Instructions
      ctx.fillStyle = isDarkMode ? '#666666' : '#aaaaaa';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click widget to open in browser', canvas.width / 2, canvas.height - 25);
      ctx.textAlign = 'left';
      
      // Timestamp
      ctx.fillStyle = isDarkMode ? '#555555' : '#bbbbbb';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(new Date().toLocaleString(), 20, canvas.height - 12);
      
      // Dashed border
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 12);
      ctx.stroke();
      
      finalImage = canvas.toDataURL('image/png');
      }
      
      onCropComplete(finalImage, currentIframeTitle, currentIframeUrl);
      onClose();
      
    } catch (error) {
      console.error('Widget creation failed:', error);
      alert('Failed to create widget. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [cropArea, currentIframeUrl, currentIframeTitle, onCropComplete, onClose, isDarkMode, url, title]);

  // Helper function to draw rounded rectangles
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const bgColor = isDarkMode ? 'bg-black/90' : 'bg-white/90';
  const cardBg = isDarkMode 
    ? 'bg-gradient-to-b from-gray-900/95 to-black/95 border-white/10' 
    : 'bg-gradient-to-b from-white/95 to-gray-50/95 border-black/10';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const mutedText = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[2147483645] ${bgColor} backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className={`text-xl font-semibold ${textColor}`}>Create Web Widget</h2>
            <p className={`text-sm ${mutedText}`}>
              {editMode ? 'Interact with the page, then switch to Crop Mode' : 'Draw a selection area to crop'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle Button */}
            <button
              onClick={() => {
                setEditMode(!editMode);
                setCropArea(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                editMode 
                  ? 'bg-blue-600/20 border border-blue-600 text-blue-400' 
                  : 'bg-green-600/20 border border-green-600 text-green-400'
              }`}
            >
              {editMode ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  Edit Mode
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  Crop Mode
                </>
              )}
            </button>
            
            {cropArea && !editMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={captureScreenshot}
                disabled={isCapturing}
                className={`px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Widget...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    Create Widget
                  </>
                )}
              </motion.button>
            )}
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-gray-900'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Instructions or Edit Mode Badge */}
        {!editMode && !cropArea && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-purple-600/90 backdrop-blur-xl rounded-full text-white text-sm font-medium shadow-xl"
          >
            📐 Click and drag to select the area you want as a widget
          </motion.div>
        )}
        
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-blue-600/90 backdrop-blur-xl rounded-full text-white text-sm font-medium shadow-xl whitespace-nowrap"
          >
            ✏️ Navigate to the page you want, then switch to Crop Mode
          </motion.div>
        )}

        {cropArea && !editMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-green-600/90 backdrop-blur-xl rounded-xl text-white text-sm font-medium shadow-xl max-w-lg text-center"
          >
            ✅ Area selected! Click "Create Widget" to make it appear on your desktop.
            <br />
            <span className="text-xs opacity-90">The widget will show the page title, URL, and size.</span>
          </motion.div>
        )}

        {/* Webpage Container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 pt-20"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: editMode ? 'default' : isSelecting ? 'crosshair' : cropArea ? 'default' : 'crosshair' }}
        >
          {/* Loading Overlay */}
          {!iframeLoaded && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-lg z-5`}>
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className={textColor}>Loading webpage...</p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={handleIframeLoad}
            className="w-full h-full border-0"
            style={{ 
              pointerEvents: editMode ? 'auto' : 'none', // Enable interaction in edit mode
              opacity: cropArea && !editMode ? 0.5 : 1 
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />

          {/* Selection Box */}
          {cropArea && (
            <motion.div
              ref={selectionRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute border-4 border-purple-500 bg-purple-500/10 shadow-2xl pointer-events-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Resize handles */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg" />
              
              {/* Dimensions label */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs rounded-full whitespace-nowrap font-medium">
                {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
              </div>
            </motion.div>
          )}
        </div>

        {/* Hidden canvas for screenshot */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
