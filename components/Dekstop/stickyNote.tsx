"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { XIcon } from 'lucide-react'

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

  return (
    <div
      ref={noteRef}
      className="absolute bg-pink-100 p-4 rounded-lg shadow-md text-sm text-gray-800 cursor-grab select-none"
      style={{ left: x, top: y, width: 200, zIndex: 10 }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-2 cursor-grab">
        <span className="font-bold">To do:</span>
        {/* <button className="text-gray-500 hover:text-gray-700" aria-label="Close note">
          <XIcon className="w-4 h-4" />
        </button> */}
      </div>
      <ul className="list-none space-y-1 text-black" >
        <li className="text-black">• FIX USER NEEDS</li>
        <li className="text-black">• AUTOMATION </li>
        <li className="text-black">• USE TANSTACK ONLY</li>
        <li className="text-black">• RE-DESIGN</li>
     
      </ul>
    </div>
  );
}
