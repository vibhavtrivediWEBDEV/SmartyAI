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
  zIndex: number
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onFocus: (id: string) => void
  desktopRef: React.RefObject<HTMLDivElement | null>
  themeColor: string
  children: React.ReactNode
  onDrag?: (windowId: string, bounds: { x: number; y: number; width: number; height: number }) => void
  onDragEnd?: (windowId: string) => void
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
  zIndex,
  onClose,
  onMinimize,
  onFocus,
  desktopRef,
  themeColor,
  children,
  onDrag,
  onDragEnd,
}: WindowProps) {

  // 🎯 TOP BAR HEIGHT - Must stay above all windows
  const TOP_BAR_HEIGHT = 28; // h-7 = 28px (TopBar z-index: 999998)

  const { settings } = useSettings()
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const previousMinimizedRef = useRef(isMinimized)
  const hasOpenedRef = useRef(false)
  const isTransitioningRef = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const [isMaximized, setIsMaximized] = useState(initialIsMaximized)
  const [prevBounds, setPrevBounds] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  
  // Sync window position/size when parent updates (e.g., after snap)
  useEffect(() => {
    if (!isDragging && !isResizing && !isMaximized) {
      if (initialX !== x) setX(initialX)
      if (initialY !== y) setY(initialY)
      if (initialWidth !== width) setWidth(initialWidth)
      if (initialHeight !== height) setHeight(initialHeight)
    }
  }, [initialX, initialY, initialWidth, initialHeight, isDragging, isResizing, isMobile, isMaximized])

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

  const getDockTarget = useCallback(() => {
    const dock = document.querySelector<HTMLElement>('[data-smarty-dock="desktop"]')
    const dockRect = dock?.getBoundingClientRect()
    const isVertical = dockRect ? dockRect.height > dockRect.width : false

    return {
      x: dockRect ? (isVertical ? dockRect.right - 18 : dockRect.right - 64) : window.innerWidth / 2,
      y: dockRect ? (isVertical ? dockRect.bottom - 64 : dockRect.bottom - 18) : window.innerHeight - 18,
    }
  }, [])

  // --- macOS-like Open / Genie Restore Animation ---
  useLayoutEffect(() => {
    const element = windowRef.current
    const wasMinimized = previousMinimizedRef.current
    previousMinimizedRef.current = isMinimized

    if (!element || isMinimized) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      gsap.set(element, { visibility: "visible", clearProps: "transform,opacity,clipPath,filter,willChange" })
      hasOpenedRef.current = true
      return
    }

    if (wasMinimized) {
      const rect = element.getBoundingClientRect()
      const target = getDockTarget()
      const deltaX = target.x - (rect.left + rect.width / 2)
      const deltaY = target.y - (rect.top + rect.height / 2)

      isTransitioningRef.current = true
      gsap.fromTo(
        element,
        {
          x: deltaX,
          y: deltaY,
          scaleX: 0.025,
          scaleY: 0.035,
          skewX: deltaX >= 0 ? 7 : -7,
          opacity: 0.18,
          clipPath: "polygon(49% 0%, 51% 0%, 51% 100%, 49% 100%)",
          transformOrigin: "bottom center",
          filter: "blur(1.5px)",
          visibility: "visible",
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          opacity: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          filter: "blur(0px)",
          duration: 0.52,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(element, { clearProps: "transform,opacity,clipPath,filter,willChange" })
            isTransitioningRef.current = false
          },
          onInterrupt: () => {
            isTransitioningRef.current = false
          },
        },
      )
    } else if (!hasOpenedRef.current) {
      gsap.fromTo(
        element,
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          ease: "power3.out",
          clearProps: "transform",
          onComplete: () => {
            isTransitioningRef.current = false
          },
        }
      )
    }
    hasOpenedRef.current = true
  }, [getDockTarget, isMinimized])

  // --- macOS Genie Minimize Animation ---
  const handleMinimize = useCallback(() => {
    const element = windowRef.current
    if (isTransitioningRef.current) return
    if (!element) {
      onMinimize(id)
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onMinimize(id)
      return
    }

    window.dispatchEvent(new CustomEvent("smarty:dock-reveal"))
    const rect = element.getBoundingClientRect()
    const target = getDockTarget()
    const deltaX = target.x - (rect.left + rect.width / 2)
    const deltaY = target.y - (rect.top + rect.height / 2)
    const bend = deltaX >= 0 ? 7 : -7
    const genieLayer = element.cloneNode(true) as HTMLElement
    genieLayer.removeAttribute("id")
    genieLayer.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"))
    genieLayer.setAttribute("aria-hidden", "true")
    Object.assign(genieLayer.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "2147483646",
      pointerEvents: "none",
      overflow: "hidden",
      contain: "layout paint style",
      transformOrigin: "bottom center",
      willChange: "transform, opacity, clip-path, filter",
    })
    document.body.appendChild(genieLayer)

    isTransitioningRef.current = true
    gsap.killTweensOf(element)
    gsap.set(element, {
      visibility: "hidden",
      willChange: "transform, opacity, clip-path, filter",
      pointerEvents: "none",
    })

    gsap.fromTo(genieLayer, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      opacity: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      filter: "blur(0px)",
    }, {
      x: deltaX,
      y: deltaY,
      scaleX: 0.025,
      scaleY: 0.035,
      skewX: bend,
      opacity: 0.12,
      clipPath: "polygon(49% 0%, 51% 0%, 51% 100%, 49% 100%)",
      filter: "blur(1.5px)",
      duration: 0.58,
      ease: "power3.in",
      onComplete: () => {
        genieLayer.remove()
        isTransitioningRef.current = false
        onMinimize(id)
      },
      onInterrupt: () => {
        genieLayer.remove()
        isTransitioningRef.current = false
        gsap.set(element, { clearProps: "visibility,willChange,pointerEvents" })
      },
    })
  }, [getDockTarget, id, onMinimize])

  // --- macOS-like Close Animation (single fade/scale, no dock travel) ---
  const handleClose = useCallback(() => {
    const element = windowRef.current
    if (!element || isTransitioningRef.current) return

    isTransitioningRef.current = true
    gsap.killTweensOf(element)
    gsap.to(element, {
        scale: 0.88,
        y: 10,
        opacity: 0,
        filter: "blur(3px)",
        duration: 0.24,
        transformOrigin: "center center",
        ease: "power2.in",
        onComplete: () => onClose(id),
    })
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
        
        // Notify parent about drag for snap detection
        if (onDrag) {
          onDrag(id, { x: newX, y: newY, width, height })
        }
      } else if (isResizing && !isMobile) {
        let newWidth =
          resizeStart.current.width + (clientX - resizeStart.current.x)
        let newHeight =
          resizeStart.current.height + (clientY - resizeStart.current.y)
        const availableWidth = desktopRect.width - x
        const availableHeight = desktopRect.height - y
        const minimumWidth = appName === "ATS"
          ? Math.min(900, availableWidth)
          : appName === "Excel Editor" || appName === "Data Table"
            ? Math.min(760, availableWidth)
            : 300
        const minimumHeight = appName === "ATS"
          ? Math.min(600, availableHeight)
          : appName === "Excel Editor" || appName === "Data Table"
            ? Math.min(520, availableHeight)
            : 200
        newWidth = Math.max(minimumWidth, Math.min(newWidth, availableWidth))
        newHeight = Math.max(minimumHeight, Math.min(newHeight, availableHeight))
        setWidth(newWidth)
        setHeight(newHeight)
      }
    },
    [isDragging, isResizing, width, height, x, y, desktopRef, isMobile, appName]
  )

  const handleMouseUp = useCallback(() => {
    // Notify parent about drag end (for snap detection)
    if (isDragging && onDragEnd) {
      onDragEnd(id)
    }
    setIsDragging(false)
    setIsResizing(false)
  }, [isDragging, onDragEnd, id])

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
      setY(TOP_BAR_HEIGHT) // Start below TopBar
      setWidth(desktopRect.width)
      setHeight(desktopRect.height - TOP_BAR_HEIGHT) // Account for TopBar height
    }
  }, [initialIsMaximized, desktopRef])

  // Maximize
  const handleMaximize = useCallback(() => {
    const element = windowRef.current
    if (!desktopRef.current || !element) return
    gsap.killTweensOf(element)
    isTransitioningRef.current = false

    const desktopRect = desktopRef.current.getBoundingClientRect()
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const target = isMaximized && prevBounds && !isMobile
      ? prevBounds
      : { x: 0, y: TOP_BAR_HEIGHT, width: desktopRect.width, height: desktopRect.height - TOP_BAR_HEIGHT } // Account for TopBar

    const commitBounds = () => {
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
        setY(TOP_BAR_HEIGHT) // Start below TopBar
        setWidth(desktopRect.width)
        setHeight(desktopRect.height - TOP_BAR_HEIGHT) // Account for TopBar
        setIsMaximized(true)
      }
      isTransitioningRef.current = false
    }

    if (reduceMotion || isMobile) {
      commitBounds()
      return
    }

    isTransitioningRef.current = true
    gsap.to(element, {
      left: target.x,
      top: target.y,
      width: target.width,
      height: target.height,
      borderRadius: isMaximized ? 12 : 0,
      duration: 0.42,
      ease: "power3.inOut",
      willChange: "left, top, width, height, border-radius",
      onComplete: commitBounds,
      onInterrupt: () => {
        isTransitioningRef.current = false
      },
    })
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
          : "absolute rounded-xl"
      }`}
      style={{
        ...(isMobile
          ? {
            left: 0,
            top: TOP_BAR_HEIGHT,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
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
      {/* 🎨 Modern macOS Traffic Light Buttons - Left Side */}
      <div
        // 🎯 AUTOMATION: Title bar ID
        id={`${id}-titlebar`}
        data-automation="titlebar"
        className={`absolute left-4 flex items-center gap-2 group z-10 ${isMobile ? "top-4" : "top-3"}`}
      >
        {/* Close Button */}
        <div
          onClick={handleClose}
          // 🎯 AUTOMATION: Close button ID
          id={`${id}-close`}
          data-automation="close-button"
          data-window-id={id}
          className={`window-control-button w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff4136] transition-all duration-150 shadow-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"}`}
          title="Close"
        >
          <svg className={`text-[#820005] opacity-0 group-hover:opacity-100 transition-opacity ${isMobile ? "w-2.5 h-2.5" : "w-1.5 h-1.5"}`} viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        {/* Minimize Button */}
        <div
          onClick={handleMinimize}
          // 🎯 AUTOMATION: Minimize button ID
          id={`${id}-minimize`}
          data-automation="minimize-button"
          data-window-id={id}
          className={`window-control-button w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff9500] transition-all duration-150 shadow-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"}`}
          title="Minimize"
        >
          <svg className={`text-[#9a6400] opacity-0 group-hover:opacity-100 transition-opacity ${isMobile ? "w-2.5 h-2.5" : "w-1.5 h-1.5"}`} viewBox="0 0 10 10">
            <path d="M1 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        {/* Maximize Button */}
        <div
          onClick={handleMaximize}
          // 🎯 AUTOMATION: Maximize button ID
          id={`${id}-maximize`}
          data-automation="maximize-button"
          data-window-id={id}
          className={`window-control-button w-3 h-3 bg-[#28c840] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#1aab29] transition-all duration-150 shadow-sm ${isMobile ? "w-5 h-5" : "w-3 h-3"}`}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg className={`text-[#006400] opacity-0 group-hover:opacity-100 transition-opacity ${isMobile ? "w-2.5 h-2.5" : "w-1.5 h-1.5"}`} viewBox="0 0 10 10">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg className={`text-[#006400] opacity-0 group-hover:opacity-100 transition-opacity ${isMobile ? "w-2.5 h-2.5" : "w-1.5 h-1.5"}`} viewBox="0 0 10 10">
              <path d="M2 2L8 2M2 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      </div>
      
      {/* Window Title - Center */}
      <div
        className={`flex items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0 backdrop-blur-xl ${
          isMobile ? "py-3 h-14" : "py-2.5 h-11"
        }`}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="flex items-center space-x-2 pointer-events-none">
          {icon && (
            <SearchIcon
              size={isMobile ? 16 : 14}
              className="text-white/80"
            />
          )}
          <span
            className={`font-semibold text-white/90 truncate drop-shadow-sm ${
              isMobile ? "text-base" : "text-sm"
            }`}
          >
            {title}
          </span>
        </div>
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