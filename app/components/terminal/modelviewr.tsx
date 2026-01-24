"use client"

import { Html, useProgress, useTexture } from "@react-three/drei"
import { Suspense, useEffect, useRef, useState, forwardRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Text } from "@react-three/drei"
import * as THREE from "three"
import { gsap } from "gsap"
import { Desktop } from "@/components/Dekstop/deskstop"
import { finished } from "stream"
import RetroTerminal from "./retroAnimation"
import { Room } from "../three/room"
import { Lights } from "../three/lights"
import { CameraAnimation } from "../three/cameraAnimation"
import { LaptopScreen } from "../three/laptopScreen"
import { Poster } from "../three/poster"
import { Human } from "../three/vibhavModel"
import { CameraDebugger } from "../three/cameraDebugger"
import { RetroScrollingTextWall } from "../three/scrollingWall"
import { NatureBase } from "../three/naturebase"
import { useAIVoice  } from "@/hooks/useAIVoice"


export default function PortfolioScene({ setdekstopView }: { setdekstopView: any }) {
  const controlsRef = useRef<any>(null)
  const [showDesktop, setShowDesktop] = useState(false)
  const [mode, setMode] = useState("night")


  const {speak} = useAIVoice()
  const humanRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(-2, 3, -2)
      controlsRef.current.update()
    }
  }, [])

  useEffect(() => {
  speak("Welcome to my interactive portfolio .");
}, []);


  function Loader() {
    const { progress } = useProgress()
    return (
      <Html center>
        <div style={{
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "14px",
          width: "100vw"
        }}>

          <RetroTerminal progress={progress} />
            
        </div>
      </Html>
    )
  }

  const ROOM_Y = 20


  return (
    <div className="w-full h-screen relative overflow-hidden">
      <Canvas
        camera={{ position: [-12,ROOM_Y  +  7, 8], fov: 55 }}
        shadows
        gl={{
          antialias: false, // Disable for better performance
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
      >
         {/* <CameraDebugger /> */}
       
        <Suspense fallback={<Loader />}>
        <Suspense fallback={null}>
        <NatureBase mode={mode} controlsRef={controlsRef} position={[0, -45, 0]} />
        </Suspense>
        
          <CameraAnimation controlsRef={controlsRef} humanRef={humanRef} setShowDesktop={setShowDesktop} setdekstopView={setdekstopView} />
          <Lights />
          <Room />
          <Human ref={humanRef} />
          <LaptopScreen onclick={() => window.dispatchEvent(new CustomEvent("playAnimation", { detail: "mixamo.com" }))} showDesktop={showDesktop} setdekstopView={setdekstopView} />


//posters

          <Poster position={[-2, 6, 7]} rotation={[0, THREE.MathUtils.degToRad(190), 0]}
            scale={1}
            image="/loinPainting.jpeg"
            width={2}
            depth={0.6}
            color="black"
            height={3}
            controlsRef={controlsRef}
          />

          <Poster position={[5.3, 6.4, 3.2]} rotation={[0, 5, 0]} scale={0.34} image="/covers/amazon.png"
            depth={1}

            width={4}
            color="black"
            height={3}
            controlsRef={controlsRef}
          />


          <Poster
            position={[5.3, 7, 4.9]}
            rotation={[0, 5, 0]}
            scale={0.34}
            image="/covers/adobe.png"
            // text="Back Wall Poster"
            width={4}
            depth={3}
            color="black"
            height={3}
            controlsRef={controlsRef}
          />

          <Poster
            position={[5.3, 5.6, 4.9]}
            rotation={[0, 5, 0]}
            scale={0.34}
            image="/covers/spotify.png"
            // text="Back Wall Poster"
            width={4}
            depth={3}
            color="black"
            height={3}
            controlsRef={controlsRef}
          />




<RetroScrollingTextWall mode={mode} />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.08} // Slightly increased for smoother feel
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 8}
            minDistance={3}
            maxDistance={15}
            minAzimuthAngle={-Math.PI}
            maxAzimuthAngle={Math.PI}
            rotateSpeed={0.8} // Increased for more responsive controls
            zoomSpeed={1.0} // Increased for better zoom response
          />
        </Suspense>
       
      </Canvas>

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>


        <button
          onClick={() => window.dispatchEvent(new CustomEvent("playAnimation", { detail: "mixamo.com" }))}
          className="bg-white text-black px-4 py-2 rounded-md"
        >
          Go to vibhav's Desktop
        </button>
 

        <button className="bg-white text-black px-4 ml-2 py-2 rounded-md" onClick={() => setMode(mode==="day"?"night":"day")}>
  Toggle {mode ? "Night" : "Day"}
</button>
      </div>
    </div>
  )
}
