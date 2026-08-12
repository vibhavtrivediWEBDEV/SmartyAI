"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
}

interface DraggableWidgetProps {
  widget: Widget;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

export default function DraggableWidget({ 
  widget, 
  desktopRef, 
  onPositionChange, 
  onRemove, 
  children 
}: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, [isDragging, desktopRef, dragOffset, widget.id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={widgetRef}
      className="absolute group z-10 cursor-grab active:cursor-grabbing pointer-events-auto"
      style={{ 
        left: widget.x, 
        top: widget.y,
        userSelect: isDragging ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
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
    </div>
  );
}
