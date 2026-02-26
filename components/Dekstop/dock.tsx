"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"

interface DockProps {
  appIcons: { name: string; icon?: React.ReactNode | string }[]
  minappIcons: { id: string; icon: string; title: string; isMinimized?: boolean }[]
  onAppClick: (appName: string) => void
  onminAppClick: (id: string) => void
}

export function Dock({ appIcons, minappIcons, onAppClick, onminAppClick }: DockProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [drawerExpanded, setDrawerExpanded] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Desktop: Show dock when mouse is near bottom
  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY
      setIsVisible(distanceFromBottom < 80)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isMobile])

  // Mobile: Bottom swipe-up gesture
  useEffect(() => {
    if (!isMobile) return

    let touchStartY = 0
    let touchStartX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchStartX = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY
      const touchX = e.touches[0].clientX
      const deltaY = touchStartY - currentTouchY
      const deltaX = Math.abs(touchX - touchStartX)

      // Only process if started near bottom (within bottom 150px)
      if (touchStartY > window.innerHeight - 150) {
        // Vertical swipe up with minimal horizontal movement
        if (deltaY > 50 && deltaX < 100) {
          e.preventDefault()
          setDrawerExpanded(true)
        }
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [isMobile])

  // Map app names to image URLs
  const lucideIconMap: { [key: string]: string } = {
    Finder: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png",
    Safari: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png",
    Mail: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png",
    Messages: "https://framerusercontent.com/images/CwKoPLck9kD8CifRkrpug3socM.png",
    Maps: "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png",
    Photos: "https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png",
    chrome: "https://tse2.mm.bing.net/th/id/OIP.psOZ1V2b8TrCOZ-Mp42IHAHaHa?pid=Api&P=0&h=180",
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

  const mergedIcons = appIcons.map((app) => ({
    name: app.name,
    icon: typeof app.icon === "string" ? app.icon : lucideIconMap[app.name] || "/icons/default.png",
  }))

  const handleAppClick = (appName: string) => {
    onAppClick(appName)
    if (isMobile) {
      setDrawerExpanded(false)
    }
  }

  const handleMinAppClick = (id: string) => {
    onminAppClick(id)
    if (isMobile) {
      setDrawerExpanded(false)
    }
  }

  // Get first 5 icons for mobile preview
  const previewIcons = mergedIcons.slice(0, 5)

  if (isMobile) {
    return (
      <>
        {/* Collapsed Dock - 5 Icons Always Visible */}
        {!drawerExpanded && (
          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur-xl px-4 py-3 z-50 flex items-center justify-center gap-2"
            style={{ background: "rgba(45, 45, 45, 0.47)" }}
          >
            {/* Swipe indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />

            {/* 5 App Icons */}
            <div className="flex items-center gap-3 mt-2">
              {previewIcons.map((app) => (
                <button
                  key={app.name}
                  onClick={() => handleAppClick(app.name)}
                  className="flex flex-col items-center active:scale-90 transition-transform"
                  aria-label={`Launch ${app.name}`}
                >
                  <div className="w-14 h-14 relative">
                    <Image
                      src={app.icon as string}
                      alt={`${app.name} icon`}
                      fill
                      className="object-contain"
                      sizes="56px"
                      priority
                      unoptimized
                    />
                  </div>
                </button>
              ))}

              {/* More button */}
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
            </div>
          </div>
        )}

        {/* Expanded App Drawer - All Apps */}
        {drawerExpanded && (
          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur-2xl rounded-t-3xl z-50 shadow-2xl overflow-hidden animate-slide-up"
            style={{
              background: "rgba(39, 31, 31, 0.98)",
              height: '70vh',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-12 h-1.5 bg-white/30 rounded-full cursor-pointer"
                onClick={() => setDrawerExpanded(false)}
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => setDrawerExpanded(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10"
            >
              ×
            </button>

            {/* Apps Grid */}
            <div className="px-4 pb-6 h-full overflow-y-auto">
              <h2 className="text-white text-lg font-semibold mb-4 mt-2">All Apps</h2>

              <div className="grid grid-cols-4 gap-4">
                {mergedIcons.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleAppClick(app.name)}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl active:bg-white/10 transition-all active:scale-95"
                    aria-label={`Launch ${app.name}`}
                  >
                    <div className="w-14 h-14 relative mb-2">
                      <Image
                        src={app.icon as string}
                        alt={`${app.name} icon`}
                        fill
                        className="object-contain"
                        sizes="56px"
                        priority
                        unoptimized
                      />
                    </div>
                    <span className="text-white text-[11px] text-center leading-tight">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Minimized Apps Section */}
              {minappIcons.length > 0 && (
                <>
                  <div className="mt-6 mb-3 flex items-center">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="px-3 text-white/50 text-xs">Minimized Windows</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {minappIcons.map((app) => {
                      const iconSrc = lucideIconMap["Finder"]
                      return (
                        <button
                          key={app.id}
                          onClick={() => handleMinAppClick(app.id)}
                          className="flex flex-col items-center p-2 rounded-2xl active:bg-white/10 transition-all active:scale-95"
                        >
                          <img src={iconSrc} alt={app.title} className="w-12 h-12 mb-2" />
                          <span className="text-white text-[11px] text-center leading-tight">
                            {app.title.slice(0, 8)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Backdrop overlay */}
        {drawerExpanded && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            onClick={() => setDrawerExpanded(false)}
          />
        )}
      </>
    )
  }

  // Desktop Dock (original)
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 bottom-0 mb-2 bg-opacity-70 backdrop-blur-md rounded-xl p-2 flex space-x-2 shadow-lg z-40 transform transition-all duration-300 ease-out
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
      style={{ background: "rgba(155, 152, 152, 0.09)", zIndex: 9999999 }}
    >
      {mergedIcons.map((app) => (
        <button
          key={app.name}
          onClick={() => onAppClick(app.name)}
          className="group relative flex flex-col items-center justify-center p-1 rounded-lg transition-transform duration-200 hover:scale-110 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={`Launch ${app.name}`}
          type="button"
        >
          <div className="w-10 h-10 relative">
            <Image
              src={app.icon as string}
              alt={`${app.name} icon`}
              fill
              className="object-contain"
              sizes="40px"
              priority
              unoptimized
            />
          </div>

          <span className="absolute -top-8 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {app.name}
          </span>
        </button>
      ))}
      <span style={{ fontSize: "30px" }}>|</span>
      {minappIcons.map((app) => {
        const iconSrc = lucideIconMap["Finder"]
        return (
          <button
            key={app.id}
            onClick={() => onminAppClick(app.id)}
            className="flex flex-col items-center p-0 text-gray-200 hover:scale-110 transition-transform"
          >
            <img src={iconSrc} alt={app.title} className="w-8 h-8" />
            <span className="text-xs">{app.title.slice(0, 6)}</span>
          </button>
        )
      })}
    </div>
  )
}