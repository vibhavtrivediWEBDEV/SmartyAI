"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react"
import { gsap } from "gsap"
import { SearchIcon } from "lucide-react"

interface WindowProps {
  id: string
  title: string
  icon: string
  initialX: number
  initialY: number
  initialWidth: number
  initialHeight: number
  isMinimized: boolean
  zIndex: number
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onFocus: (id: string) => void
  desktopRef: React.RefObject<HTMLDivElement>
  children: React.ReactNode
}

export function Window({
  id,
  title,
  icon,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  isMinimized,
  zIndex,
  onClose,
  onMinimize,
  onFocus,
  desktopRef,
  children,
}: WindowProps) {
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const [isMaximized, setIsMaximized] = useState(false)
const [prevBounds, setPrevBounds] = useState<{
  x: number
  y: number
  width: number
  height: number
} | null>(null)


  // --- macOS-like Open Animation ---
  useLayoutEffect(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      // gsap.fromTo(
      //   windowRef.current,
      //   {
      //     scale: 0.2,
      //     opacity: 0,
      //     x: 0,
      //     y: window.innerHeight - rect.top - rect.height / 2 - 40,
      //   },
      //   {
      //     scale: 1,
      //     opacity: 1,
      //     x: 0,
      //     y: 0,
      //     duration: 0.45,
      //     ease: "power4.out",
      //   }
      // )
      gsap.fromTo(
  windowRef.current,
  { scale: 0.96, opacity: 0 },
  {
    scale: 1,
    opacity: 1,
    duration: 0.35,
    ease: "power3.out",
    clearProps: "transform",
  }
)

    }
  }, [])

  // --- macOS-like Close Animation ---
  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      gsap.to(windowRef.current, {
        scale: 0.05,
        x: window.innerWidth - rect.left - rect.width / 2 - 30,
        y: window.innerHeight - rect.top - rect.height / 2 - 20,
        opacity: 0,
        duration: 0.4,
        ease: "power4.in",
        onComplete: () => onClose(id),
      })
    }
  }, [id, onClose])

  // --- Click outside to minimize ---
  // useEffect(() => {
  //   const handleClickOutside = (e: MouseEvent) => {
  //     if (windowRef.current && !windowRef.current.contains(e.target as Node)) {
  //       onMinimize(id)
  //     }
  //   }
  //   document.addEventListener("mousedown", handleClickOutside)
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside)
  //   }
  // }, [id, onMinimize])

  // --- Dragging ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(".window-control-button")
      )
        return
      if (windowRef.current) {
        onFocus(id) // Bring this window to front
        setIsDragging(true)
        dragOffset.current = {
          x: e.clientX - windowRef.current.getBoundingClientRect().left,
          y: e.clientY - windowRef.current.getBoundingClientRect().top,
        }
      }
    },
    [id, onFocus]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!desktopRef.current) return

      const desktopRect = desktopRef.current.getBoundingClientRect()

      if (isDragging) {
        let newX = e.clientX - dragOffset.current.x
        let newY = e.clientY - dragOffset.current.y
        // Clamp position inside desktop bounds
        newX = Math.max(0, Math.min(newX, desktopRect.width - width))
        newY = Math.max(0, Math.min(newY, desktopRect.height - height))
        setX(newX)
        setY(newY)
      } else if (isResizing) {
        let newWidth =
          resizeStart.current.width + (e.clientX - resizeStart.current.x)
        let newHeight =
          resizeStart.current.height + (e.clientY - resizeStart.current.y)
        // Clamp size and keep window inside desktop bounds
        newWidth = Math.max(300, Math.min(newWidth, desktopRect.width - x))
        newHeight = Math.max(200, Math.min(newHeight, desktopRect.height - y))
        setWidth(newWidth)
        setHeight(newHeight)
      }
    },
    [isDragging, isResizing, width, height, x, y, desktopRef]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // --- Resize Mouse Down ---
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onFocus(id) // Bring to front on resize start
      setIsResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        width,
        height,
      }
    },
    [id, onFocus, width, height]
  )

  // maximise 

  const handleMaximize = useCallback(() => {
    if (!desktopRef.current) return
  
    const desktopRect = desktopRef.current.getBoundingClientRect()
  
    if (isMaximized) {
      // Restore to previous bounds
      if (prevBounds) {
        setX(prevBounds.x)
        setY(prevBounds.y)
        setWidth(prevBounds.width)
        setHeight(prevBounds.height)
      }
      setIsMaximized(false)
    } else {
      // Save current bounds before maximizing
      setPrevBounds({ x, y, width, height })
  
      setX(0)
      setY(0)
      setWidth(desktopRect.width)
      setHeight(desktopRect.height)
  
      setIsMaximized(true)
    }
  }, [isMaximized, x, y, width, height, desktopRef, prevBounds])
  

  // --- Global Mouse Move/Up Listeners ---
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // if (isMinimized) return null

  if (isMinimized) {
    return (
      <div style={{ display: "none" }} /> // keep alive, but hidden
    )
  }
  

  return (
    <div
      ref={windowRef}
      className="absolute bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-700"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
        transformOrigin: "center center",
        userSelect: isDragging || isResizing ? "none" : "auto",
        display: isMinimized ? "none" : "block", // 👈 hide window when minimized

      }}
      onMouseDown={() => onFocus(id)} // Ensure clicking anywhere brings to front
        // onPointerDownCapture={() => onFocus(id)}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between bg-gray-700 px-3 py-2 border-b border-gray-600 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex space-x-2">
          <button
            onClick={handleClose}
            className="window-control-button cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"
            aria-label="Close window"
          />
          <button
            onClick={() => onMinimize(id)}
            className="window-control-button w-3 h-3 cursor-pointer rounded-full bg-yellow-500 hover:bg-yellow-600"
            aria-label="Minimize window"
          />
          <button
          onClick={handleMaximize}
            className="window-control-button w-3 h-3 cursor-pointer rounded-full bg-green-500 hover:bg-green-600"
            aria-label="Maximize window"
          />
        </div>

        <div className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {icon && <SearchIcon size={12} />}
          <span className="text-sm text-gray-200 font-semibold">{title}</span>
        </div>

        <div className="w-16" />
      </div>

      {/* Window Content */}
      <div className="flex-1  scroll-smooth
    overscroll-contain overflow-auto"   style={{
    WebkitOverflowScrolling: "touch",
  }}  >{children}</div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}
