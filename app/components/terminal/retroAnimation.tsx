"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text3D, Environment } from "@react-three/drei"
import PortfolioView from "./PortfolioView"

interface TerminalLineProps {
  text: string
  delay: number
  onComplete?: () => void
}

function TerminalLine({ text, delay, onComplete }: TerminalLineProps) {
  const [displayText, setDisplayText] = useState("")
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCursor(true)
      let currentIndex = 0

      const typeInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typeInterval)
          setShowCursor(false)
          onComplete?.()
        }
      }, 25)

      return () => clearInterval(typeInterval)
    }, delay)

    return () => clearTimeout(timer)
  }, [text, delay, onComplete])

  return (
    <div className="font-mono text-primary">
      {displayText}
      {showCursor && <span className="terminal-cursor">_</span>}
    </div>
  )
}

function RotatingCube() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4caf50" wireframe />
    </mesh>
  )
}

// function Scene3D() {
//   return (
//     <Canvas className="w-full h-full">
//       <ambientLight intensity={0.5} />
//       <pointLight position={[10, 10, 10]} />
//       <RotatingCube />
//       <Text3D font="/fonts/Geist_Bold.json" size={0.5} height={0.1} position={[0, -3, 0]}>
//         Welcome
//         <meshStandardMaterial color="#00ff00" />
//       </Text3D>
//       <OrbitControls enableZoom={false} />
//       <Environment preset="night" />
//     </Canvas>
//   )
// }

export default function RetroTerminal({progress}:{progress:number}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showName, setShowName] = useState(false)
  const [show3D, setShow3D] = useState(false)

  const terminalLines = [
    "SYSTEM BOOT SEQUENCE INITIATED...",
    "LOADING CORE MODULES...",
    "MEMORY CHECK: 16384 KB OK",
    "GRAPHICS SUBSYSTEM: ONLINE",
    "AUDIO DRIVER: LOADED",
    "NETWORK INTERFACE: READY",
    "USER PROFILE: AUTHENTICATED",
    "BOOT SEQUENCE COMPLETE",
  ]

  const handleLineComplete = () => {
    if (currentStep < terminalLines.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Show name after all lines complete
      setTimeout(() => setShowName(true), 500)
      // Transition to 3D after name appears
      setTimeout(() => setShow3D(true), 4000)
    }
  }

  if (show3D) {
    return (
      <div className="w-full h-screen bg-background">
      <PortfolioView />
      </div>
    )
  }

  
  return (
    <div className="w-full h-screen bg-background flex items-center justify-center scanlines">
      <div className="max-w-2xl w-full p-8">
        <div className="space-y-2 mb-8">
          {terminalLines.slice(0, currentStep + 1).map((line, index) => (
            <TerminalLine
              key={index}
              text={line}
              delay={index === currentStep ? 0 : 0}
              onComplete={index === currentStep ? handleLineComplete : undefined}
            />
          ))}
        </div>

        {showName && (
          <div className="text-center">
            <h1 className="text-6xl font-bold text-primary typewriter">ft. VIBHAV TRIVEDI</h1>
            <p className="text-xl text-secondary mt-4 font-mono">SOFTWARE ENGINEER</p>
            <span>Loading... {progress.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
