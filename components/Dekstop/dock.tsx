"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"
import { useSettings } from "@/app/context/settingContext"

// ─────────────────────────────────────────────────────────────────────────────
// Window state type — matches your existing openWindows shape
// ─────────────────────────────────────────────────────────────────────────────
interface WindowState {
  id: string
  title: string
  icon: string
  appName: string
  x: number
  y: number
  zIndex?: number
}

interface DockProps {
  appIcons: { name: string; icon?: React.ReactNode | string }[]
  minappIcons: { id: string; icon: string; title: string; appName: string; isMinimized?: boolean }[]
  onAppClick: (appName: string) => void
  onminAppClick: (id: string) => void
  // Pass your openWindows array so gesture pinch can maximise the top window
  openWindows?: WindowState[]
}

// ─────────────────────────────────────────────────────────────────────────────
// App icon image map
// ─────────────────────────────────────────────────────────────────────────────
const lucideIconMap: Record<string, string> = {
  Finder: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png",
  ATS: "/assets/pdfIcon.png",
  Safari: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png",
  Mail: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png",
  Messages: "https://framerusercontent.com/images/CwKoPLck9kD8CifRkrpug3socM.png",
  Maps: "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png",
  Photos: "https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png",
  chrome: "https://tse2.mm.bing.net/th/id/OIP.psOZ1V2b8TrCOZ-Mp42IHAHa?pid=Api&P=0&h=180",
  Calendar: "https://framerusercontent.com/images/VeljykK560qBRDkQkYyhx8ChI.png",
  Youtube: "https://tse4.mm.bing.net/th/id/OIP.S5AlRQcHrpCLzWUdKMWS2AHaHa?pid=Api&P=0&h=180",
  Notes: "https://framerusercontent.com/images/Z0d1XNe7wVINUiHydSL6noKho.png",
  "App Store": "https://framerusercontent.com/images/KCaz69s4OvhKMUI25E1RBeuNIyA.png",
  Settings: "https://framerusercontent.com/images/VbY44vBZlQp4srNQK6ohxpco.png",
  TV: "https://framerusercontent.com/images/1pORyCnfgAxpXWyCa1l7s8IJeK0.png",
  vscode: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
  figma: "https://hexadecimal.work/icons/apps/figma.png",
  Spotify: "https://m.media-amazon.com/images/I/51rttY7a+9L.png",
  Terminal: "https://cdn2.iconfinder.com/data/icons/web-application-icons-part-i/100/Artboard_18-512.png",
  Trash: "https://framerusercontent.com/images/XYN0Nl9HILu4c0bzhEPmjha0Cg.png",
}

// ─────────────────────────────────────────────────────────────────────────────
// Eye icon for the gesture toggle button
// ─────────────────────────────────────────────────────────────────────────────
function EyeIcon({ active, size = 18 }: { active: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "all 0.3s ease" }}
    >
      {active ? (
        // Open eye — gesture mode ON
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          {/* Scan lines */}
          <path d="M12 5v1M12 18v1M5 12H4M20 12h-1" strokeWidth={1.2} opacity={0.5} />
        </>
      ) : (
        // Closed eye — gesture mode OFF
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gesture toggle button — with Mac-style ripple + glow when active
// ─────────────────────────────────────────────────────────────────────────────
function GestureToggleBtn({
  active,
  onToggle,
  gestureMode,
  size = 40,
  dockPosition = "bottom",
}: {
  active: boolean
  onToggle: () => void
  gestureMode: boolean
  size?: number
  dockPosition?: "bottom" | "right"
}) {
  const [ripple, setRipple] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    setRipple(true)
    setTimeout(() => setRipple(false), 600)
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      title={active ? "Gesture Control ON — click to disable" : "Enable Gesture Control"}
      className="relative flex flex-col items-center justify-end focus:outline-none"
      style={{
        padding: "2px 3px",
        margin: dockPosition === "right"
          ? `${hovered ? 8 : 0}px 0`
          : `0 ${hovered ? 8 : 0}px`,
        borderRadius: 10,
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), margin 0.2s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered
          ? `scale(1.25) ${dockPosition === "right" ? "translateX(-9px)" : "translateY(-9px)"}`
          : "scale(1)",
        transformOrigin: dockPosition === "right" ? "right center" : "bottom center",
        filter: active
          ? "drop-shadow(0 0 10px rgba(10,132,255,0.5)) drop-shadow(0 0 20px rgba(10,132,255,0.2))"
          : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon container - match dock icon size */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(7, size * 0.22),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: active
            ? "linear-gradient(135deg, rgba(10,132,255,0.4) 0%, rgba(48,209,88,0.3) 100%)"
            : "rgba(255,255,255,0.08)",
          border: active
            ? "1px solid rgba(10,132,255,0.55)"
            : "1px solid rgba(255,255,255,0.12)",
          boxShadow: active
            ? "0 0 0 1px rgba(10,132,255,0.3), 0 4px 16px rgba(0,0,0,0.45)"
            : "0 4px 16px rgba(0,0,0,0.35)",
          transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
          color: active ? "#0A84FF" : "rgba(255,255,255,0.6)",
        }}
      >
        <EyeIcon active={active} size={Math.max(18, size * 0.44)} />

        {/* Ripple on click */}
        {ripple && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: active ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.12)",
              animation: "dockBtnRipple 0.55s ease-out forwards",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Pulse ring when active */}
        {active && (
          <div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: 13,
              border: "1px solid rgba(10,132,255,0.4)",
              animation: "dockBtnPulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <span
        className="absolute pointer-events-none whitespace-nowrap"
        style={{
          top: dockPosition === "right" ? "50%" : -40,
          left: dockPosition === "right" ? "auto" : "50%",
          right: dockPosition === "right" ? size + 14 : "auto",
          transform: dockPosition === "right" ? "translateY(-50%)" : "translateX(-50%)",
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.92)",
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 7,
          whiteSpace: "nowrap",
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {active ? "Gesture ON" : "Gesture OFF"}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCK
// ─────────────────────────────────────────────────────────────────────────────
export function Dock({
  appIcons,
  minappIcons,
  onAppClick,
  onminAppClick,
  openWindows = [],
}: DockProps) {
  const { settings, updateSettings } = useSettings()
  const dockPosition = settings.dockPosition ?? "bottom"
  const [isVisible, setIsVisible] = useState(!settings.autoHideDock)
  const [isMobile, setIsMobile] = useState(false)
  const [drawerExpanded, setDrawerExpanded] = useState(false)
  const gestureActive = settings.gestureControl
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 })
  const [contextMenu, setContextMenu] = useState<{ name: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const handleGestureHover = (event: Event) => {
      const appName = (event as CustomEvent<{ appName?: string | null }>).detail?.appName
      if (!appName) {
        setHoveredIndex(null)
        return
      }
      const index = appIcons.findIndex((app) => app.name.toLowerCase() === appName.toLowerCase())
      setHoveredIndex(index >= 0 ? index : null)
    }
    window.addEventListener("smarty:dock-hover", handleGestureHover)
    return () => window.removeEventListener("smarty:dock-hover", handleGestureHover)
  }, [appIcons])

  useEffect(() => {
    if (!contextMenu) return
    const closeMenu = () => setContextMenu(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu()
    }
    window.addEventListener("click", closeMenu)
    window.addEventListener("blur", closeMenu)
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      window.removeEventListener("click", closeMenu)
      window.removeEventListener("blur", closeMenu)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [contextMenu])

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    const revealDock = () => {
      setIsVisible(true)
      if (hideTimer) clearTimeout(hideTimer)
      if (settings.autoHideDock) hideTimer = setTimeout(() => setIsVisible(false), 1400)
    }

    const setDockVisibility = (event: Event) => {
      const nextVisible = (event as CustomEvent<{ visible?: boolean }>).detail?.visible
      if (typeof nextVisible !== "boolean") return
      if (hideTimer) clearTimeout(hideTimer)
      setIsVisible(nextVisible)
    }

    window.addEventListener("smarty:dock-reveal", revealDock)
    window.addEventListener("smarty:dock-visibility", setDockVisibility)
    return () => {
      window.removeEventListener("smarty:dock-reveal", revealDock)
      window.removeEventListener("smarty:dock-visibility", setDockVisibility)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [settings.autoHideDock])

  // ── Mobile detect ─────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Desktop: reveal from the configured screen edge (including its corners) ──
  useEffect(() => {
    if (isMobile) return

    if (!settings.autoHideDock) {
      setIsVisible(true)
      return
    }

    const onMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY
      const distanceFromRight = window.innerWidth - e.clientX
      const distanceFromEdge = dockPosition === "right" ? distanceFromRight : distanceFromBottom

      if (distanceFromEdge <= 12) {
        setIsVisible(true)
      } else if (distanceFromEdge > 100) {
        setIsVisible(false)
      }
    }

    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [dockPosition, isMobile, settings.autoHideDock])

  // ── Mobile: swipe up from bottom ─────────────────────────────────────
  useEffect(() => {
    if (!isMobile) return
    let startY = 0, startX = 0
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; startX = e.touches[0].clientX }
    const onMove = (e: TouchEvent) => {
      const dy = startY - e.touches[0].clientY
      const dx = Math.abs(e.touches[0].clientX - startX)
      if (startY > window.innerHeight - 150 && dy > 50 && dx < 100) {
        e.preventDefault()
        setDrawerExpanded(true)
      }
    }
    document.addEventListener("touchstart", onStart, { passive: true })
    document.addEventListener("touchmove", onMove, { passive: false })
    return () => {
      document.removeEventListener("touchstart", onStart)
      document.removeEventListener("touchmove", onMove)
    }
  }, [isMobile])

  // ── Merge icons ───────────────────────────────────────────────────────
  const mergedIcons = appIcons.map((app) => ({
    name: app.name,
    icon: typeof app.icon === "string" ? app.icon : lucideIconMap[app.name] ?? "/icons/default.png",
  }))

  const dockItemCount = Math.max(1, mergedIcons.length + minappIcons.length + 1)
  const availableDockLength = dockPosition === "right" ? viewportSize.height - 112 : viewportSize.width - 112
  const dockIconSize = Math.max(20, Math.min(settings.dockSize, Math.floor(availableDockLength / dockItemCount - 10)))

  const handleAppClick = (appName: string) => {
    onAppClick(appName)
    if (isMobile) setDrawerExpanded(false)
  }

  const handleMinAppClick = (id: string) => {
    onminAppClick(id)
    if (isMobile) setDrawerExpanded(false)
  }

  const previewIcons = mergedIcons.slice(0, 5)
  const minimizedAppNames = new Set(minappIcons.map((app) => app.appName.toLowerCase()))

  // ─────────────────────────────────────────────────────────────────────
  // MOBILE
  // ─────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Collapsed mobile dock */}
        {!drawerExpanded && (
          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur-xl px-4 py-3 z-50 flex items-center justify-center gap-2"
            style={{ background: "rgba(45,45,45,0.47)" }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />

            <div className="flex items-center gap-3 mt-2">
              {previewIcons.map((app) => (
                <button
                  key={app.name}
                  onClick={() => handleAppClick(app.name)}
                  className="flex flex-col items-center active:scale-90 transition-transform"
                  aria-label={`Launch ${app.name}`}
                >
                  <div className="w-14 h-14 relative">
                    <Image src={app.icon as string} alt={`${app.name} icon`} fill className="object-contain" sizes="56px" priority unoptimized />
                  </div>
                </button>
              ))}

              {mergedIcons.length > 5 && (
                <button
                  onClick={() => setDrawerExpanded(true)}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/10 active:scale-90 transition-transform"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              )}

              {/* Gesture toggle on mobile dock */}
              <div style={{ marginLeft: 4 }}>
                <GestureToggleBtn
                  active={gestureActive}
                  gestureMode={gestureActive}
                  onToggle={() => updateSettings({ gestureControl: !gestureActive })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Expanded drawer */}
        {drawerExpanded && (
          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl rounded-t-3xl z-50 shadow-2xl overflow-hidden animate-slide-up"
            style={{ background: "rgba(39,31,31,0.98)", height: "70vh" }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/30 rounded-full cursor-pointer" onClick={() => setDrawerExpanded(false)} />
            </div>
            <button onClick={() => setDrawerExpanded(false)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10">×</button>

            <div className="px-4 pb-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4 mt-2">
                <h2 className="text-white text-lg font-semibold">All Apps</h2>
                <GestureToggleBtn active={gestureActive} gestureMode={gestureActive} onToggle={() => updateSettings({ gestureControl: !gestureActive })} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                {mergedIcons.map((app) => (
                  <button key={app.name} onClick={() => handleAppClick(app.name)} className="flex flex-col items-center justify-center p-2 rounded-2xl active:bg-white/10 transition-all active:scale-95" aria-label={`Launch ${app.name}`}>
                    <div className="w-14 h-14 relative mb-2">
                      <Image src={app.icon as string} alt={`${app.name} icon`} fill className="object-contain" sizes="56px" priority unoptimized />
                    </div>
                    <span className="text-white text-[11px] text-center leading-tight">{app.name}</span>
                  </button>
                ))}
              </div>

              {minappIcons.length > 0 && (
                <>
                  <div className="mt-6 mb-3 flex items-center">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="px-3 text-white/50 text-xs">Minimized Windows</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {minappIcons.map((app) => (
                      <button key={app.id} onClick={() => handleMinAppClick(app.id)} className="flex flex-col items-center p-2 rounded-2xl active:bg-white/10 transition-all active:scale-95">
                        <img src={lucideIconMap["Finder"]} alt={app.title} className="w-12 h-12 mb-2" />
                        <span className="text-white text-[11px] text-center leading-tight">{app.title.slice(0, 8)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {drawerExpanded && (
          <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300" onClick={() => setDrawerExpanded(false)} />
        )}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────
  // DESKTOP
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Normal Mac dock */}
      <div
        data-smarty-dock="desktop"
        className={`
          fixed
          rounded-[20px] p-2
          flex gap-[6px]
          shadow-lg z-40
          transform transition-all duration-300 ease-out
          ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{
          ...(dockPosition === "right"
            ? {
              right: 6,
              top: "50%",
              flexDirection: "column" as const,
              alignItems: "center",
              transform: isVisible ? "translate(0, -50%)" : "translate(calc(100% + 8px), -50%)",
            }
            : {
              left: "50%",
              bottom: 6,
              alignItems: "flex-end",
              transform: isVisible ? "translate(-50%, 0)" : "translate(-50%, calc(100% + 8px))",
            }),
          background: "linear-gradient(145deg, rgba(106,106,112,0.52) 0%, rgba(55,55,60,0.46) 48%, rgba(30,30,34,0.5) 100%)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(36px) saturate(210%) brightness(1.08)",
          WebkitBackdropFilter: "blur(36px) saturate(210%) brightness(1.08)",
          zIndex: 9999999,
          // When gesture mode is on: add a subtle accent shadow to the dock itself
          boxShadow: gestureActive
            ? "0 0 0 1px rgba(10,132,255,0.25), 0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(10,132,255,0.12)"
            : "0 18px 48px rgba(0,0,0,0.46), 0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.22)",
          transition: "box-shadow 0.45s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-1 h-[42%] rounded-[15px]"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0))" }}
        />

        {/* App icons */}
        {mergedIcons.map((app, index) => (
          <DockIcon
            key={app.name}
            name={app.name}
            src={app.icon as string}
            isMinimized={minimizedAppNames.has(app.name.toLowerCase())}
            gestureMode={gestureActive}
            dockPosition={dockPosition}
            size={dockIconSize}
            index={index}
            hoveredIndex={settings.dockMagnification ? hoveredIndex : null}
            onHover={setHoveredIndex}
            onClick={() => onAppClick(app.name)}
            onContextMenu={(event) => {
              event.preventDefault()
              setContextMenu({
                name: app.name,
                x: Math.min(event.clientX, window.innerWidth - 190),
                y: Math.min(event.clientY, window.innerHeight - 112),
              })
            }}
          />
        ))}

        {/* Separator */}
        {minappIcons.length > 0 && (
          <div
            style={{
              width: dockPosition === "right" ? dockIconSize * 0.78 : 1,
              height: dockPosition === "right" ? 1 : dockIconSize * 0.78,
              margin: dockPosition === "right" ? "4px 0" : "0 4px",
              borderRadius: 1,
              background: "rgba(255,255,255,0.18)",
              alignSelf: "center",
            }}
          />
        )}

        {/* Minimised windows */}
        {minappIcons.map((app) => (
          <MinDockIcon
            key={app.id}
            id={app.id}
            title={app.title}
            gestureMode={gestureActive}
            dockPosition={dockPosition}
            size={dockIconSize}
            onClick={() => onminAppClick(app.id)}
          />
        ))}

        {/* Gesture toggle button - aligned as an icon */}
        <GestureToggleBtn
          active={gestureActive}
          gestureMode={gestureActive}
          size={dockIconSize}
          dockPosition={dockPosition}
          onToggle={() => updateSettings({ gestureControl: !gestureActive })}
        />
      </div>

      {contextMenu && (
        <div
          role="menu"
          aria-label={`${contextMenu.name} Dock options`}
          className="fixed z-[10000000] w-44 overflow-hidden rounded-xl border border-white/20 bg-[#262628]/90 p-1.5 text-[13px] text-white shadow-2xl backdrop-blur-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="truncate border-b border-white/10 px-2.5 py-1.5 text-center text-xs font-semibold text-white/70">{contextMenu.name}</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAppClick(contextMenu.name)
              setContextMenu(null)
            }}
            className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left hover:bg-[#0a84ff]"
          >
            Open
          </button>
          {!['Finder', 'App Store'].includes(contextMenu.name) && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                updateSettings({ pinnedDockApps: (settings.pinnedDockApps ?? []).filter((name) => name !== contextMenu.name) })
                setContextMenu(null)
              }}
              className="w-full rounded-md px-2.5 py-1.5 text-left hover:bg-[#0a84ff]"
            >
              Remove from Dock
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes dockIconEnter {
          from { transform: scale(0.6) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0);       opacity: 1; }
        }
        @keyframes dockBtnRipple {
          from { transform: scale(0.6); opacity: 1; }
          to   { transform: scale(2.2); opacity: 0; }
        }
        @keyframes dockBtnPulse {
          0%,100% { opacity: 0.5; transform: scale(1);    }
          50%     { opacity: 0.9; transform: scale(1.08); }
        }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DockIcon — individual app icon with macOS magnify + gesture-mode glow
// ─────────────────────────────────────────────────────────────────────────────
function DockIcon({
  name,
  src,
  isMinimized,
  gestureMode,
  dockPosition,
  size,
  index,
  hoveredIndex,
  onHover,
  onClick,
  onContextMenu,
}: {
  name: string
  src: string
  isMinimized: boolean
  gestureMode: boolean
  dockPosition: "bottom" | "right"
  size: number
  index: number
  hoveredIndex: number | null
  onHover: (index: number | null) => void
  onClick: () => void
  onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const [pressing, setPressing] = useState(false)
  const distance = hoveredIndex === null ? Number.POSITIVE_INFINITY : Math.abs(index - hoveredIndex)
  const scale = distance === 0 ? 1.55 : distance === 1 ? 1.3 : distance === 2 ? 1.12 : 1
  const lift = distance === 0 ? 18 : distance === 1 ? 9 : distance === 2 ? 3 : 0
  const expansion = ((scale - 1) * size) / 2
  const hovered = distance === 0

  return (
    <button
      data-smarty-app={name}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => setPressing(false)}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      className="relative flex flex-col items-center justify-end focus:outline-none"
      aria-label={`Launch ${name}`}
      type="button"
      style={{
        padding: "2px 3px",
        margin: dockPosition === "right" ? `${expansion}px 0` : `0 ${expansion}px`,
        borderRadius: 10,
        // macOS-style magnify
        transform: pressing
          ? `scale(0.92) ${dockPosition === "right" ? "translateX(-2px)" : "translateY(2px)"}`
          : `scale(${scale}) ${dockPosition === "right" ? `translateX(-${lift}px)` : `translateY(-${lift}px)`}`,
        transition: "transform 220ms cubic-bezier(0.2,0.9,0.25,1.18), margin 220ms cubic-bezier(0.2,0.9,0.25,1), filter 180ms ease",
        transformOrigin: dockPosition === "right" ? "right center" : "bottom center",
        zIndex: hovered ? 30 : distance === 1 ? 20 : distance === 2 ? 10 : 1,
        // Gesture mode: add per-icon glow
        filter: gestureMode && hovered
          ? "drop-shadow(0 0 10px rgba(10,132,255,0.7)) drop-shadow(0 0 24px rgba(10,132,255,0.35))"
          : gestureMode
            ? "drop-shadow(0 2px 8px rgba(10,132,255,0.2))"
            : "none",
      }}
    >
      {/* Tooltip */}
      <span
        style={{
          position: "absolute",
          top: dockPosition === "right" ? "50%" : -36,
          left: dockPosition === "right" ? "auto" : "50%",
          right: dockPosition === "right" ? size + 14 : "auto",
          transform: dockPosition === "right" ? "translateY(-50%)" : "translateX(-50%)",
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.92)",
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 7,
          whiteSpace: "nowrap",
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          letterSpacing: "0.2px",
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {name}
      </span>

      {/* Icon */}
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          borderRadius: Math.max(7, size * 0.22),
          overflow: "hidden",
          // Gesture mode: subtle ring around icon
          boxShadow: gestureMode
            ? "0 0 0 1px rgba(10,132,255,0.3), 0 4px 16px rgba(0,0,0,0.45)"
            : hovered
              ? "0 14px 28px rgba(0,0,0,0.42), 0 3px 8px rgba(0,0,0,0.34)"
              : "0 6px 16px rgba(0,0,0,0.36)",
          transition: "box-shadow 0.22s ease",
        }}
      >
        <Image
          src={src}
          alt={`${name} icon`}
          fill
          className="object-contain"
          sizes={`${size}px`}
          priority
          unoptimized
        />
      </div>

      {/* A Dock indicator exists only while this app has a minimized window. */}
      {isMinimized && (
        <div
          aria-hidden="true"
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: gestureMode ? "rgba(10,132,255,0.9)" : "rgba(255,255,255,0.9)",
            marginTop: 2,
            boxShadow: gestureMode ? "0 0 6px rgba(10,132,255,0.6)" : "none",
          }}
        />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MinDockIcon — minimised window thumbnail
// ─────────────────────────────────────────────────────────────────────────────
function MinDockIcon({
  id,
  title,
  gestureMode,
  dockPosition,
  size,
  onClick,
}: {
  id: string
  title: string
  gestureMode: boolean
  dockPosition: "bottom" | "right"
  size: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center focus:outline-none"
      style={{
        padding: "2px 4px",
        transform: hovered ? `scale(1.22) ${dockPosition === "right" ? "translateX(-8px)" : "translateY(-8px)"}` : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin: dockPosition === "right" ? "right center" : "bottom center",
        filter: gestureMode && hovered ? "drop-shadow(0 0 8px rgba(10,132,255,0.6))" : "none",
      }}
    >
      <img
        src={lucideIconMap["Finder"]}
        alt={title}
        style={{
          width: Math.max(20, size * 0.82),
          height: Math.max(20, size * 0.82),
          objectFit: "contain",
          borderRadius: 8,
          boxShadow: gestureMode
            ? "0 0 0 1px rgba(10,132,255,0.3), 0 3px 12px rgba(0,0,0,0.4)"
            : "0 3px 12px rgba(0,0,0,0.35)",
          transition: "box-shadow 0.3s",
        }}
      />
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.7)",
          marginTop: 2,
          fontFamily: "'SF Pro Text', -apple-system, sans-serif",
          maxWidth: 38,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title.slice(0, 6)}
      </span>
    </button>
  )
}