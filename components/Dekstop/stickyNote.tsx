"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { XIcon, Check } from 'lucide-react'

interface StickyNoteProps {
  initialX: number
  initialY: number
  desktopRef: React.RefObject<HTMLDivElement>
}

export function StickyNote({ initialX, initialY, desktopRef }: StickyNoteProps) {
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const noteRef = useRef<HTMLDivElement>(null)

  // Dynamic features from your laptop
  const features = [
    { id: 1, text: "Terminal with AI", completed: true },
    { id: 2, text: "Excel Editor", completed: true },
    { id: 3, text: "Mail Sender", completed: true },
    { id: 4, text: "PDF Viewer", completed: true },
    { id: 5, text: "AI Search", completed: true },
    { id: 6, text: "Science Book", completed: true },
    { id: 7, text: "Interview System", completed: true },
    { id: 8, text: "Stock Viewer", completed: true },
    { id: 9, text: "Data Table (AG Grid)", completed: true },
    { id: 10, text: "Photos Gallery", completed: true },
    { id: 11, text: "News TV", completed: true },
    { id: 12, text: "Game", completed: true },
    { id: 13, text: "Project Explorer", completed: true },
    { id: 14, text: "FIX USER NEEDS", completed: false },
    { id: 15, text: "AUTOMATION", completed: false },
    { id: 16, text: "USE TANSTACK ONLY", completed: false },
    { id: 17, text: "RE-DESIGN", completed: false },
  ]

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (noteRef.current) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - noteRef.current.getBoundingClientRect().left,
        y: e.clientY - noteRef.current.getBoundingClientRect().top,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && desktopRef.current) {
      const desktopRect = desktopRef.current.getBoundingClientRect();
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      newX = Math.max(0, Math.min(newX, desktopRect.width - (noteRef.current?.offsetWidth || 0)));
      newY = Math.max(0, Math.min(newY, desktopRect.height - (noteRef.current?.offsetHeight || 0) - 60));

      setX(newX);
      setY(newY);
    }
  }, [isDragging, desktopRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const completedCount = features.filter(f => f.completed).length
  const totalCount = features.length

  return (
    <div
      ref={noteRef}
      className="absolute bg-gradient-to-br from-pink-100 to-pink-200 p-4 rounded-lg shadow-xl text-sm text-gray-800 cursor-grab select-none border-2 border-pink-500"
      style={{ left: x, top: y, width: 280, zIndex: 10 }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-3 cursor-grab">
        <div>
          <span className="font-bold text-lg text-gray-900">Features 🚀</span>
          <div className="text-xs text-gray-600 mt-1">
            {completedCount}/{totalCount} completed
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className=" overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`flex items-start gap-2 text-xs ${
              feature.completed ? 'opacity-60' : 'font-semibold'
            }`}
          >
            {feature.completed ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <span className="text-orange-500 flex-shrink-0">•</span>
            )}
            <span className={feature.completed ? 'line-through text-gray-600' : 'text-gray-900'}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 pt-3 border-t border-pink-300">
        <div className="w-full bg-yellow-300 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}