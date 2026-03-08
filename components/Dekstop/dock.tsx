"use client"

import Image from "next/image"
import React, { useEffect, useState, useCallback } from "react"
import GestureDock from "./gestureDock"

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
  minappIcons: { id: string; icon: string; title: string; isMinimized?: boolean }[]
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
function EyeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
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
}: {
  active: boolean
  onToggle: () => void
  gestureMode: boolean
}) {
  const [ripple, setRipple] = useState(false)

  const handleClick = () => {
    setRipple(true)
    setTimeout(() => setRipple(false), 600)
    onToggle()
  }

  return (
    <>
      <button
        onClick={handleClick}
        title={active ? "Gesture Control ON — click to disable" : "Enable Gesture Control"}
        className="relative flex flex-col items-center justify-center p-1 rounded-lg focus:outline-none"
        style={{
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          transform: "scale(1)",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15) translateY(-4px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Icon container */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            background: active
              ? "linear-gradient(135deg, rgba(10,132,255,0.35) 0%, rgba(48,209,88,0.25) 100%)"
              : "rgba(255,255,255,0.06)",
            border: active
              ? "1px solid rgba(10,132,255,0.55)"
              : "1px solid rgba(255,255,255,0.08)",
            boxShadow: active
              ? "0 0 16px rgba(10,132,255,0.4), 0 0 32px rgba(10,132,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "inset 0 1px 0 rgba(255,255,255,0.04)",
            transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
            color: active ? "#0A84FF" : "rgba(255,255,255,0.5)",
          }}
        >
          <EyeIcon active={active} />

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
            top: -34,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.3px",
            padding: "4px 10px",
            borderRadius: 7,
            fontFamily: "'SF Pro Text', -apple-system, sans-serif",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="tooltip-label"
        >
          {active ? "Gesture ON" : "Gesture OFF"}
        </span>
      </button>

      <style>{`
        button:hover .tooltip-label { opacity: 1 !important; }
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
// MAIN DOCK
// ─────────────────────────────────────────────────────────────────────────────
export function Dock({
  appIcons,
  minappIcons,
  onAppClick,
  onminAppClick,
  openWindows = [],
}: DockProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [drawerExpanded, setDrawerExpanded] = useState(false)
  const [gestureActive, setGestureActive] = useState(false)

  // ── Mobile detect ─────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Desktop: show on hover near bottom ───────────────────────────────
  useEffect(() => {
    if (isMobile) return
    const onMove = (e: MouseEvent) => {
      setIsVisible(window.innerHeight - e.clientY < 80)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [isMobile])

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

  // ── GestureDock app launch handler ───────────────────────────────────
  // Finds the top-most (highest zIndex) open window and triggers its app.
  // Falls back to onAppClick with the app name.
  const handleGestureAppLaunch = useCallback((app: { id: string; name: string }) => {
    // Find topmost window
    if (openWindows.length > 0) {
      const top = [...openWindows].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))[0]
      // You can call maximize logic here — for now we call onAppClick with topmost appName
      onAppClick(top.appName)
    }
    // Also launch the gesture-selected app
    onAppClick(app.name)
  }, [openWindows, onAppClick])

  // ── Merge icons ───────────────────────────────────────────────────────
  const mergedIcons = appIcons.map((app) => ({
    name: app.name,
    icon: typeof app.icon === "string" ? app.icon : lucideIconMap[app.name] ?? "/icons/default.png",
  }))

  const handleAppClick = (appName: string) => {
    onAppClick(appName)
    if (isMobile) setDrawerExpanded(false)
  }

  const handleMinAppClick = (id: string) => {
    onminAppClick(id)
    if (isMobile) setDrawerExpanded(false)
  }

  const previewIcons = mergedIcons.slice(0, 5)

  // ─────────────────────────────────────────────────────────────────────
  // MOBILE
  // ─────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* GestureDock overlay — only when toggled */}
        <GestureDock
          visible={gestureActive}
          onAppLaunch={handleGestureAppLaunch}
          accentColor="#0A84FF"
        />

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
                  onToggle={() => setGestureActive((v) => !v)}
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
                <GestureToggleBtn active={gestureActive} gestureMode={gestureActive} onToggle={() => setGestureActive((v) => !v)} />
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
      {/* GestureDock overlay — only when toggled */}
      <GestureDock
        visible={gestureActive}
        onAppLaunch={handleGestureAppLaunch}
        accentColor="#0A84FF"
      />

      {/* Normal Mac dock */}
      <div
        className={`
          fixed left-1/2 -translate-x-1/2 bottom-0 mb-2
          backdrop-blur-md rounded-xl p-2
          flex items-end space-x-1
          shadow-lg z-40
          transform transition-all duration-300 ease-out
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}
        `}
        style={{
          background: "rgba(155,152,152,0.09)",
          zIndex: 9999999,
          // When gesture mode is on: add a subtle accent shadow to the dock itself
          boxShadow: gestureActive
            ? "0 0 0 1px rgba(10,132,255,0.25), 0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(10,132,255,0.12)"
            : "0 8px 32px rgba(0,0,0,0.4)",
          transition: "box-shadow 0.5s ease, transform 0.3s ease-out, opacity 0.3s ease-out",
        }}
      >
        {/* App icons */}
        {mergedIcons.map((app) => (
          <DockIcon
            key={app.name}
            name={app.name}
            src={app.icon as string}
            gestureMode={gestureActive}
            onClick={() => onAppClick(app.name)}
          />
        ))}

        {/* Separator */}
        {minappIcons.length > 0 && (
          <div
            style={{
              width: 1,
              height: 36,
              margin: "0 4px",
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
            onClick={() => onminAppClick(app.id)}
          />
        ))}

        {/* Separator before gesture toggle */}
        <div
          style={{
            width: 1,
            height: 36,
            margin: "0 6px 0 4px",
            borderRadius: 1,
            background: "rgba(255,255,255,0.12)",
            alignSelf: "center",
          }}
        />

        {/* Gesture toggle button */}
        <GestureToggleBtn
          active={gestureActive}
          gestureMode={gestureActive}
          onToggle={() => setGestureActive((v) => !v)}
        />
      </div>

      <style>{`
        @keyframes dockIconEnter {
          from { transform: scale(0.6) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0);       opacity: 1; }
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
  gestureMode,
  onClick,
}: {
  name: string
  src: string
  gestureMode: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [pressing, setPressing] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressing(false) }}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      className="relative flex flex-col items-center justify-end focus:outline-none"
      aria-label={`Launch ${name}`}
      type="button"
      style={{
        padding: "2px 4px",
        borderRadius: 10,
        // macOS-style magnify
        transform: pressing
          ? "scale(0.92) translateY(2px)"
          : hovered
            ? "scale(1.28) translateY(-10px)"
            : "scale(1) translateY(0)",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin: "bottom center",
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
          top: -36,
          left: "50%",
          transform: "translateX(-50%)",
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
          width: 40,
          height: 40,
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          // Gesture mode: subtle ring around icon
          boxShadow: gestureMode
            ? "0 0 0 1px rgba(10,132,255,0.3), 0 4px 16px rgba(0,0,0,0.45)"
            : "0 4px 16px rgba(0,0,0,0.35)",
          transition: "box-shadow 0.35s ease",
        }}
      >
        <Image
          src={src}
          alt={`${name} icon`}
          fill
          className="object-contain"
          sizes="40px"
          priority
          unoptimized
        />
      </div>

      {/* Active dot */}
      <div
        style={{
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: gestureMode ? "rgba(10,132,255,0.7)" : "rgba(255,255,255,0.2)",
          marginTop: 2,
          transition: "background 0.3s",
          boxShadow: gestureMode ? "0 0 6px rgba(10,132,255,0.5)" : "none",
        }}
      />
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
  onClick,
}: {
  id: string
  title: string
  gestureMode: boolean
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
        transform: hovered ? "scale(1.22) translateY(-8px)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin: "bottom center",
        filter: gestureMode && hovered ? "drop-shadow(0 0 8px rgba(10,132,255,0.6))" : "none",
      }}
    >
      <img
        src={lucideIconMap["Finder"]}
        alt={title}
        style={{
          width: 32,
          height: 32,
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