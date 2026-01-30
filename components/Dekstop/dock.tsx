"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"
import Folder from "../animationComponents/dekstopFolder";

interface DockProps {
  appIcons: { name: string; icon?: React.ReactNode | string }[]
  minappIcons: { id: string; icon: string; title: string; isMinimized?: boolean }[]

  onAppClick: (appName: string) => void
}

export function Dock({ appIcons,minappIcons, onAppClick ,onminAppClick }: DockProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Show dock when mouse is near bottom
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY
      setIsVisible(distanceFromBottom < 80)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Map app names to image URLs (update URLs here as needed)
  const lucideIconMap: { [key: string]: string } = {
    Finder: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png",
    Safari: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png",
    Mail: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png",
    Messages: "https://framerusercontent.com/images/CwKoPLck9kD8CifRkrpug3socM.png",
    Maps: "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png",
    Photos: "https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png",
    chrome: "https://p7.hiclipart.com/preview/893/776/984/5bbc0fcb4393a.jpg",
    Calendar: "https://framerusercontent.com/images/VeljykK560qBRDkQkYyhx8ChI.png",
    Youtube: "https://framerusercontent.com/images/NMuItXJj2OKiPiAC2EdivhRPYY.png",
    Notes: "https://framerusercontent.com/images/Z0d1XNe7wVINUiHydSL6noKho.png",
    "App Store": "https://framerusercontent.com/images/KCaz69s4OvhKMUI25E1RBeuNIyA.png",
    Settings: "https://framerusercontent.com/images/VbY44vBZlQp4srNQK6ohxpco.png",
    TV: "https://framerusercontent.com/images/1pORyCnfgAxpXWyCa1l7s8IJeK0.png",
    vscode: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
    Spotify: "https://m.media-amazon.com/images/I/51rttY7a+9L.png",
    Terminal: "https://cdn2.iconfinder.com/data/icons/web-application-icons-part-i/100/Artboard_18-512.png",
    // "Science Book": "https://icons.veryicon.com/png/o/business/colorful-office-icons/book-52.png",
    // "AI Search": "/icons/aisearch.png",
    // "Excel Editor": "/icons/exceleditor.png",
    // "Mail Sender": "/icons/mailsender.png",
    // "PDF Viewer": "/icons/pdfviewer.png",
    // "To-Do List": "/icons/todolist.png",
    // "Project Explorer": "/icons/projectexplorer.png",
    Trash: "https://framerusercontent.com/images/XYN0Nl9HILu4c0bzhEPmjha0Cg.png",
  }

  // Merge appIcons with lucideIconMap URLs (fallback icon URL)
  const mergedIcons = appIcons.map((app) => ({
    name: app.name,
    icon:
      typeof app.icon === "string"
        ? app.icon
        : lucideIconMap[app.name] || "/icons/default.png", // fallback default icon url
  }))

  return (
   <>
    <div
      className={`fixed left-1/2 -translate-x-1/2 bottom-0 mb-2 bg-gray-700 bg-opacity-70 backdrop-blur-md rounded-xl p-2 flex space-x-2 shadow-lg z-40 transform transition-all duration-300 ease-out
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
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
      <span style={{fontSize:"30px"}}>|</span>
     {minappIcons.map((app) => {
  // Determine icon: use app.icon if provided, otherwise check lucideIconMap, else default to Finder
  const iconSrc =
     lucideIconMap["Finder"];

  return (
    <button
      key={app.id}
      onClick={() => onminAppClick(app.id)}
      className="flex flex-col items-center p-0 text-gray-200 hover:scale-110 transition-transform"
    >
      <img src={iconSrc} alt={app.title} className="w-8 h-8" />
      <span className="text-xs">{app.title.slice(0,6)}</span>
    </button>
  );
})}

    </div>
    
   </>
  )
}
