"use client"

import { useState, useEffect } from "react"
import { commands } from "@/lib/commands" // Import commands for resume data

export function ResumeAnimation() {
  const [visibleSection, setVisibleSection] = useState(0) // 0: none, 1: header, 2: summary, 3: skills, 4: experience, 5: education, 6: projects

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    const sectionDelays = [
      500, // Header
      1000, // Summary
      1500, // Skills
      2000, // Experience
      2500, // Education
      3000, // Projects
    ]

    sectionDelays.forEach((delay, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleSection(index + 1)
        }, delay),
      )
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="p-4 bg-gray-800 text-gray-200 rounded-lg shadow-md font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 1 ? "opacity-100" : "opacity-0"}`}
      >
        <h1 className="text-3xl font-bold text-green-400 mb-1">{commands.name}</h1>
        <h2 className="text-xl font-semibold text-blue-400 mb-2">{commands.title}</h2>
        <p className="text-sm mb-4">
          Email:{" "}
          <a href={`mailto:${commands.contact.email}`} className="underline text-blue-300">
            {commands.contact.email}
          </a>{" "}
          | GitHub:{" "}
          <a
            href={commands.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-300"
          >
            {commands.contact.github}
          </a>
        </p>
        <hr className="border-gray-600 mb-4" />
      </div>

      {/* Summary */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 2 ? "opacity-100" : "opacity-0"}`}
      >
        <h3 className="text-lg font-bold text-green-400 mb-2">Summary</h3>
        <p className="text-sm mb-4">
          Highly motivated and results-driven Frontend Developer with a passion for creating intuitive and dynamic user
          experiences. Proficient in modern web technologies and dedicated to continuous learning and improvement.
        </p>
        <hr className="border-gray-600 mb-4" />
      </div>

      {/* Skills */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 3 ? "opacity-100" : "opacity-0"}`}
      >
        <h3 className="text-lg font-bold text-green-400 mb-2">Skills</h3>
        <p className="text-sm mb-4">{commands.skills}</p>
        <hr className="border-gray-600 mb-4" />
      </div>

      {/* Experience (Placeholder) */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 4 ? "opacity-100" : "opacity-0"}`}
      >
        <h3 className="text-lg font-bold text-green-400 mb-2">Experience</h3>
        <div className="mb-4">
          <h4 className="font-semibold text-md">Senior Frontend Developer - Tech Solutions Inc.</h4>
          <p className="text-xs text-gray-400">Jan 2022 - Present</p>
          <ul className="list-disc list-inside text-sm ml-4">
            <li>Developed and maintained high-performance web applications using React and Next.js.</li>
            <li>Collaborated with UX/UI designers to translate wireframes into responsive web interfaces.</li>
            <li>Optimized application performance, reducing load times by 20%.</li>
          </ul>
        </div>
        <hr className="border-gray-600 mb-4" />
      </div>

      {/* Education (Placeholder) */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 5 ? "opacity-100" : "opacity-0"}`}
      >
        <h3 className="text-lg font-bold text-green-400 mb-2">Education</h3>
        <div className="mb-4">
          <h4 className="font-semibold text-md">Bachelor of Science in Computer Science - University of Tech</h4>
          <p className="text-xs text-gray-400">Sept 2018 - May 2022</p>
        </div>
        <hr className="border-gray-600 mb-4" />
      </div>

      {/* Projects */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${visibleSection >= 6 ? "opacity-100" : "opacity-0"}`}
      >
        <h3 className="text-lg font-bold text-green-400 mb-2">Projects</h3>
        {commands.projects.map((project, index) => (
          <div key={index} className="mb-2">
            <h4 className="font-semibold text-md">{project.title}</h4>
            <p className="text-sm">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
