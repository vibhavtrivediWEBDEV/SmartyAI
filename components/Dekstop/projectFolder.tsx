"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { FolderIcon } from 'lucide-react'

interface ProjectsFolderProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function ProjectsFolder({ isOpen, setIsOpen }: ProjectsFolderProps) {
  const folderRef = useRef<HTMLDivElement>(null)
  const projectsContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (folderRef.current) {
      // Initial animation (optional, e.g., slight bounce on load)
      gsap.fromTo(folderRef.current, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(1.7)" });
    }
  }, []);

  useEffect(() => {
    if (projectsContentRef.current) {
        if (isOpen) {
            gsap.set(projectsContentRef.current, { display: "block" }); // Make visible before animating
          }
          
      gsap.to(projectsContentRef.current, {
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
        duration: 0.3,
        ease: "power2.inOut",
        overflow: "hidden",
        onComplete: () => {
          if (!isOpen) {
            gsap.set(projectsContentRef.current, { display: "none" });
          }
        }
      });
      if (isOpen) {
        gsap.set(projectsContentRef.current, { display: "block" });
      }
    }
  }, [isOpen]);

  const toggleFolder = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={folderRef}
        onClick={toggleFolder}
        className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md px-2 py-1 text-xs"
        aria-expanded={isOpen}
        aria-controls="projects-dropdown"
      >
        <FolderIcon className="w-4 h-4" />
        <span>Projects</span>
      </button>

      <div
        id="projects-dropdown"
        ref={projectsContentRef}
        className="absolute top-full left-0 mt-2 bg-gray-700 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl p-3 min-w-[200px] text-xs text-gray-200"
        style={{ height: 0, opacity: 0, display: "none" }} // Initial hidden state
      >
        <h4 className="font-bold mb-2 text-green-300">My Projects</h4>
        <ul className="space-y-1">
          <li>E-commerce Platform</li>
          <li>Task Management App</li>
          <li>Portfolio Website</li>
          {/* Add more projects here */}
        </ul>
      </div>
    </div>
  );
}
