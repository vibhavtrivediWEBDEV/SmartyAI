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
import { useSettings } from "@/app/context/settingContext"

interface WindowProps {
  id: string
  title: string
  icon: string
  appName: string
  initialX: number
  initialY: number
  initialWidth: number
  initialHeight: number
  isMinimized: boolean
  isMaximized?: boolean
  isPanel?: boolean
  zIndex: number
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onFocus: (id: string) => void
  desktopRef: React.RefObject<HTMLDivElement>
  themeColor: string
  children: React.ReactNode
}

export function Window({
  id,
  title,
  icon,
  appName,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  isMinimized,
  isMaximized: initialIsMaximized = false,
  isPanel = false,
  zIndex,
  onClose,
  onMinimize,
  onFocus,
  desktopRef,
  themeColor,
  children,
}: WindowProps) {


  const { settings } = useSettings()
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const [isMaximized, setIsMaximized] = useState(initialIsMaximized)
  const [prevBounds, setPrevBounds] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Auto-maximize on mobile using full viewport
      if (mobile && !isMaximized) {
        setPrevBounds({ x, y, width, height })
        setX(0)
        setY(0)
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
        setIsMaximized(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // --- macOS-like Open Animation ---
  useLayoutEffect(() => {
    if (windowRef.current) {
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

  // --- Dragging (disabled on mobile when maximized) ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile && isMaximized) return // Disable drag on mobile when maximized

      if (
        e.target instanceof HTMLElement &&
        e.target.closest(".window-control-button")
      )
        return
      if (windowRef.current) {
        onFocus(id)
        setIsDragging(true)

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

        dragOffset.current = {
          x: clientX - windowRef.current.getBoundingClientRect().left,
          y: clientY - windowRef.current.getBoundingClientRect().top,
        }
      }
    },
    [id, onFocus, isMobile, isMaximized]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!desktopRef.current) return

      const desktopRect = desktopRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      if (isDragging && !isMobile) {
        let newX = clientX - dragOffset.current.x
        let newY = clientY - dragOffset.current.y
        newX = Math.max(0, Math.min(newX, desktopRect.width - width))
        newY = Math.max(0, Math.min(newY, desktopRect.height - height))
        setX(newX)
        setY(newY)
      } else if (isResizing && !isMobile) {
        let newWidth =
          resizeStart.current.width + (clientX - resizeStart.current.x)
        let newHeight =
          resizeStart.current.height + (clientY - resizeStart.current.y)
        newWidth = Math.max(300, Math.min(newWidth, desktopRect.width - x))
        newHeight = Math.max(200, Math.min(newHeight, desktopRect.height - y))
        setWidth(newWidth)
        setHeight(newHeight)
      }
    },
    [isDragging, isResizing, width, height, x, y, desktopRef, isMobile]
  )

  const handleMouseUp = useCallback(() => {
    // 🆕 Check if window was dragged to right edge (panel snap)
    if (isDragging && !isMobile) {
      const viewportWidth = window.innerWidth;
      const PANEL_THRESHOLD = viewportWidth * 0.15; // If within 15% of right edge
      
      if (x > viewportWidth - width - PANEL_THRESHOLD) {
        // Snap to panel mode
        const panelWidth = Math.floor(viewportWidth * 0.30);
        setX(viewportWidth - panelWidth);
        setWidth(panelWidth);
        setY(0);
        setHeight(window.innerHeight);
        // Note: We don't have setIsPanel here, would need to pass through props
        // For now, the visual snap is enough
      }
    }
    setIsDragging(false)
    setIsResizing(false)
  }, [isDragging, isMobile, x, width])

  // --- Resize Mouse Down (disabled on mobile) ---
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return // Disable resize on mobile

      e.stopPropagation()
      onFocus(id)
      setIsResizing(true)

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      resizeStart.current = {
        x: clientX,
        y: clientY,
        width,
        height,
      }
    },
    [id, onFocus, width, height, isMobile]
  )

  // Handle initial maximize state
  useEffect(() => {
    if (initialIsMaximized && desktopRef.current && !isMobile) {
      const desktopRect = desktopRef.current.getBoundingClientRect()
      setPrevBounds({ x, y, width, height })
      setX(0)
      setY(0)
      setWidth(desktopRect.width)
      setHeight(desktopRect.height)
    }
  }, [initialIsMaximized, desktopRef])

  // Maximize
  const handleMaximize = useCallback(() => {
    if (!desktopRef.current) return

    const desktopRect = desktopRef.current.getBoundingClientRect()

    if (isMaximized) {
      if (prevBounds && !isMobile) {
        setX(prevBounds.x)
        setY(prevBounds.y)
        setWidth(prevBounds.width)
        setHeight(prevBounds.height)
      }
      setIsMaximized(false)
    } else {
      setPrevBounds({ x, y, width, height })
      setX(0)
      setY(0)
      setWidth(desktopRect.width)
      setHeight(desktopRect.height)
      setIsMaximized(true)
    }
  }, [isMaximized, x, y, width, height, desktopRef, prevBounds, isMobile])

  // --- Global Mouse/Touch Move/Up Listeners ---
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleMouseMove)
      document.addEventListener("touchend", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleMouseMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleMouseMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  if (isMinimized) {
    return <div style={{ display: "none" }} />
  }

  return (
    <div
      ref={windowRef}
      // 🎯 AUTOMATION: Main window container ID
      id={id}
      data-window-title={title}
      data-window-app={appName}
      data-window-type="window"
      className={`shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ${
        isMobile 
          ? "fixed inset-0 rounded-none" 
          : isPanel 
            ? "fixed right-0 top-0 rounded-l-xl rounded-r-none" // Panel style
            : "absolute rounded-xl"
      }`}
      style={{
        ...(isMobile
          ? {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }
          : isPanel
            ? {
              right: 0,
              top: 0,
              width,
              height: "100vh",
            }
            : {
              left: x,
              top: y,
              width,
              height,
            }),
        zIndex,
        transformOrigin: "center center",
        userSelect: isDragging || isResizing ? "none" : "auto",
        display: isMinimized
          ? "none"
          : "flex",
        background: settings.darkMode ? `hsl(${themeColor})` : '',
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
    >
      {/* Title Bar - Responsive */}
      <div
        // 🎯 AUTOMATION: Title bar ID
        id={`${id}-titlebar`}
        data-automation="titlebar"
        className={`flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none flex-shrink-0 backdrop-blur-xl ${isMobile ? "py-3 h-14" : "py-2 h-10"
          }`}
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleClose}
            // 🎯 AUTOMATION: Close button ID
            id={`${id}-close`}
            data-automation="close-button"
            data-window-id={id}
            className={`window-control-button cursor-pointer rounded-full bg-red-500/90 hover:bg-red-600 flex-shrink-0 transition-colors backdrop-blur-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"
              }`}
            aria-label="Close window"
          />
          <button
            onClick={() => onMinimize(id)}
            // 🎯 AUTOMATION: Minimize button ID
            id={`${id}-minimize`}
            data-automation="minimize-button"
            data-window-id={id}
            className={`window-control-button cursor-pointer rounded-full bg-yellow-500/90 hover:bg-yellow-600 flex-shrink-0 transition-colors backdrop-blur-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"
              }`}
            aria-label="Minimize window"
          />
          <button
            onClick={handleMaximize}
            // 🎯 AUTOMATION: Maximize button ID
            id={`${id}-maximize`}
            data-automation="maximize-button"
            data-window-id={id}
            className={`window-control-button cursor-pointer rounded-full bg-green-500/90 hover:bg-green-600 flex-shrink-0 transition-colors backdrop-blur-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"
              }`}
            aria-label="Maximize window"
          />
        </div>

        <div className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2 pointer-events-none flex-shrink-0">
          {icon && (
            <SearchIcon
              size={isMobile ? 16 : 12}
              className="text-white/90"
            />
          )}
          <span
            className={`font-semibold text-white/90 truncate drop-shadow-sm ${isMobile ? "text-base" : "text-sm"
              }`}
          >
            {title}
            {/* [{zIndex}] */}
            {/* [ID: {id}] */}
          </span>
        </div>

        <div className="w-16 flex-shrink-0" />
      </div>

      {/* Window Content - Responsive */}
      <div
        // 🎯 AUTOMATION: Content area ID
        id={`${id}-content`}
        data-automation="window-content"
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          minHeight: 0,
          maxHeight: "calc(100% - 40px)",
          background: "transparent",
        }}
      >
        {children}
      </div>

      {/* Resize Handle - Hidden on mobile */}
      {!isMobile && (
        <div
          // 🎯 AUTOMATION: Resize handle ID
          id={`${id}-resize`}
          data-automation="resize-handle"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{
            background:
              "radial-gradient(circle at bottom right, rgba(255,255,255,0.3), transparent)",
          }}
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeMouseDown}
        />
      )}
    </div>
  )
}