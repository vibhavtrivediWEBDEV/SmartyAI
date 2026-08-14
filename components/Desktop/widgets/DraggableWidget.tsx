"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface DraggableWidgetProps {
  widget: Widget;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

export default function DraggableWidget({ 
  widget, 
  desktopRef, 
  onPositionChange, 
  onRemove,
  onResize,
  children 
}: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ 
    width: widget.width || 160, 
    height: widget.height || 160 
  });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't drag if clicking on resize handle
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    
    e.stopPropagation();
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && desktopRef.current && widgetRef.current) {
      const desktopRect = desktopRef.current.getBoundingClientRect();
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Boundary checks
      const widgetWidth = widgetRef.current.offsetWidth || 160;
      const widgetHeight = widgetRef.current.offsetHeight || 160;
      
      newX = Math.max(0, Math.min(newX, desktopRect.width - widgetWidth));
      newY = Math.max(0, Math.min(newY, desktopRect.height - widgetHeight - 80)); // Account for dock

      onPositionChange(widget.id, newX, newY);
    }

    if (isResizing && desktopRef.current) {
      const desktopRect = desktopRef.current.getBoundingClientRect();
      const widgetRect = widgetRef.current?.getBoundingClientRect();
      
      if (widgetRect) {
        let newWidth = e.clientX - widgetRect.left;
        let newHeight = e.clientY - widgetRect.top;
        
        // Minimum size
        newWidth = Math.max(150, newWidth);
        newHeight = Math.max(150, newHeight);
        
        // Maximum size (stay within desktop)
        newWidth = Math.min(newWidth, desktopRect.width - widget.x);
        newHeight = Math.min(newHeight, desktopRect.height - widget.y - 80);
        
        setSize({ width: newWidth, height: newHeight });
        
        if (onResize) {
          onResize(widget.id, newWidth, newHeight);
        }
      }
    }
  }, [isDragging, isResizing, desktopRef, dragOffset, widget.id, onPositionChange, onResize, widget.x, widget.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Update size when widget props change
  useEffect(() => {
    if (widget.width && widget.height) {
      setSize({ width: widget.width, height: widget.height });
    }
  }, [widget.width, widget.height]);

  return (
    <div
      ref={widgetRef}
      className="absolute group z-10 cursor-grab active:cursor-grabbing pointer-events-auto"
      style={{ 
        left: widget.x, 
        top: widget.y,
        width: size.width,
        height: size.height,
        userSelect: isDragging || isResizing ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>
      
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(widget.id);
        }}
        className="absolute -top-2 -left-2 bg-white/80 hover:bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 text-xs backdrop-blur-md"
      >
        ×
      </button>
      
      {/* Resize handle - bottom right corner */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 hover:bg-purple-700 rounded-br-lg cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(147, 51, 234, 0.8) 50%)'
        }}
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-70">
          <path d="M21 15l-6 6M21 9l-12 12" />
        </svg>
      </div>
    </div>
  );
}
