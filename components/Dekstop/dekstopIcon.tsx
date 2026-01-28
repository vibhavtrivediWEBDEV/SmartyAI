// "use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import type { LucideIcon } from 'lucide-react' // Import type for LucideIcon
import Image from "next/image"
import Folder from "../animationComponents/dekstopFolder"

interface DesktopIconProps {
  name: string
  icon: LucideIcon | React.ReactNode // Changed to accept LucideIcon component or ReactNode
  initialX: number
  initialY: number
  onDoubleClick: () => void
  desktopRef: React.RefObject<HTMLDivElement>
}

export function DesktopIcon({ name, icon: IconComponent, initialX, initialY, onDoubleClick, desktopRef }: DesktopIconProps) {
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const iconRef = useRef<HTMLDivElement>(null)

  // Update position when initialX or initialY change (e.g., from auto arrange)
  useEffect(() => {
    setX(initialX)
    setY(initialY)
  }, [initialX, initialY])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent desktop drag
    if (iconRef.current) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - iconRef.current.getBoundingClientRect().left,
        y: e.clientY - iconRef.current.getBoundingClientRect().top,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && desktopRef.current) {
      const desktopRect = desktopRef.current.getBoundingClientRect();
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // Boundary checks
      newX = Math.max(0, Math.min(newX, desktopRect.width - (iconRef.current?.offsetWidth || 0)));
      newY = Math.max(0, Math.min(newY, desktopRect.height - (iconRef.current?.offsetHeight || 0) - 60)); // Account for dock/bottom bar

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
      ref={iconRef}
      className="absolute flex flex-col items-center text-center text-xs text-gray-800 cursor-grab select-none"
      style={{ left: x, top: y, zIndex: 10 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {typeof IconComponent === 'string' ? ( // Check if it's a string (image path)
        <Image src={IconComponent || "/placeholder.svg"} alt={name} width={64} height={64} className="mb-1" />
      ) : ( // Assume it's a ReactNode (Lucide icon)
        // <div className="w-16 h-16 flex items-center justify-center mb-1">
        //   {React.isValidElement(IconComponent) ? React.cloneElement(IconComponent as React.ReactElement, { size: 48, className: "text-gray-700" }) : null}
        // </div>
        <Folder />
      )}
      <span className="bg-gray-300 bg-opacity-70 px-2 py-0.5 rounded-md whitespace-nowrap">{name}</span>
    </div>
  );
}
