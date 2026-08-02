// "use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import type { LucideIcon } from 'lucide-react' // Import type for LucideIcon
import Image from "next/image"
import Folder from "../animationComponents/dekstopFolder"
import type { RepositoryItem } from "@/lib/github-data"
import { useSettings } from "@/app/context/settingContext"

interface DesktopIconProps {
  name: string
  icon: LucideIcon | React.ReactNode // Changed to accept LucideIcon component or ReactNode
  initialX: number
  initialY: number
  onDoubleClick: () => void
  onPositionChange?: (x: number, y: number) => void
  desktopRef: React.RefObject<HTMLDivElement | null>
  folderColor?: string
  folderItems?: RepositoryItem[]
}

export function DesktopIcon({ name, icon: IconComponent, initialX, initialY, onDoubleClick, onPositionChange, desktopRef, folderColor = 'red', folderItems = [] }: DesktopIconProps) {
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const iconRef = useRef<HTMLDivElement>(null)

  const { settings } = useSettings();

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
      onPositionChange?.(newX, newY);
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

  // const isMobile = window.innerWidth < 868

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
      ) : ( // Assume it's a ReactNode (Lucide icon or Folder)
        <Folder
          color={folderColor}
          size={(settings.fontSize / (30))}
          items={folderItems.map((item, idx) => (
            item.label === 'Description' ? (<></>
              // <div 
              //   key={idx} 
              //   className="w-full h-full p-3 flex items-center justify-center text-xs text-gray-500 group relative cursor-help"
              //   title={item.value}
              // >
              //   <div className="text-center">Description</div>
              //   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-normal max-w-xs break-words opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              //     {item.value}
              //   </div>
              // </div>
            ) : (
              <div key={idx} className="w-full h-full p-3 overflow-y-auto text-xs flex flex-col">
                <div className="font-semibold text-gray-700 break-words">{item.label}</div>
                {item.type === 'url' ? (
                  <a
                    href={item.value}

                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline break-all  mt-1"
                    onClick={(e) => e.stopPropagation()}

                  >
                    {item.value}
                  </a>
                ) : (
                  <div className="text-gray-600 break-words text-[10px] mt-1">{item.value}</div>
                )}
              </div>
            )
          ))}
        />
      )}
      <span style={{ fontSize: settings.fontSize }} className="bg-gray-300 bg-opacity-70 px-2 py-0.5 rounded-md whitespace-nowrap">
        {name.length > 12 ? name.substring(0, 12) + '...' : name}
      </span>    </div>
  );
}
