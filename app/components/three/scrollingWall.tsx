"use client"
import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"

export function RetroScrollingTextWall({mode}) {
  const groupRef = useRef<THREE.Group>(null)
  const [currentLine, setCurrentLine] = useState(0)
  const [typedText, setTypedText] = useState<string[]>([])

  const lines = [
    "Welcome to Your Portfolio 🚀",
    "Your Personal AI-Powered Desktop",
    "Over 4 year of professional experience",
    "Skilled in Next.js, Tailwind, GSAP, Framer Motion",
    "Built subscription platforms and dashboards",
    "Worked on doctor apps with PDF exports",
    "Designed marketplaces with AI-powered flows",
    "Created real-time delivery systems for vendors",
    "Integrated AWS Rekognition for automation",
    "Implemented Excel/PDF reporting features",
    "Made interactive 3D environments with R3F",
    "Built admin APIs for payments and vendors",
    "Animated features with GSAP scroll triggers",
    "Created AI-powered storytelling tools",
    "Designed turn.js-like interactive books",
    "Developed eye-tracking research prototypes",
    "Optimized performance with React Fiber",
    "Passionate about UX and smooth interactions",
    "Always learning and improving daily 💡",
    "Let’s build something amazing together ✨"
  ]

  // ⌨️ Typewriter effect
  useEffect(() => {
    if (currentLine < lines.length) {
      let index = 0
      const interval = setInterval(() => {
        setTypedText(prev => {
          const updated = [...prev]
          updated[currentLine] = lines[currentLine].slice(0, index)
          return updated
        })
        index++
        if (index > lines[currentLine].length) {
          clearInterval(interval)
          // After line completes, move to next line
          setTimeout(() => setCurrentLine(l => l + 1), 500)
        }
      }, 30) // typing speed

      return () => clearInterval(interval)
    }
  }, [currentLine])

  // 🎞️ Scroll upward slowly
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y += 0.005
      if (groupRef.current.position.y > 20) {
        groupRef.current.position.y = -10
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, -1, -20]}>
      {typedText.map((line, i) => (
        <Text
          key={i}
          position={[0, -i * 2, 0]}
          fontSize={1}
          color={mode === "day" ? "black" : "white"}
          anchorX="center"
          anchorY="middle"
        >
          {line}
        </Text>
      ))}
    </group>
  )
}
