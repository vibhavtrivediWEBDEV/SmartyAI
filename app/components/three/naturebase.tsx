import React, { useRef, useEffect } from "react"
import { useTexture } from "@react-three/drei"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import gsap from "gsap"

type Mode = "day" | "night"

const metadata = {
  urls: {
    sun: { surfaceMaterial: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/297733/sunSurfaceMaterial.jpg", 
    atmosphereMaterial: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/297733/sunAtmosphereMaterial.png", },
    moon: {
      color: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg",
      displacement: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg",
      stars: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg",
    },
    daySky: "https://plus.unsplash.com/premium_photo-1733259691737-6b9a4f78c6c6?q=80&w=1170",
  },
}

export function NatureBase({
  mode,
  position = [0, -45, 0],
}: {
  mode: Mode
  position?: [number, number, number]
}) {
  const sunRef = useRef<THREE.Mesh>(null!)
  const sunGlowRef = useRef<THREE.Mesh>(null!)
  const moonRef = useRef<THREE.Mesh>(null!)
  const starsRef = useRef<THREE.Mesh>(null!)
  const daySkyRef = useRef<THREE.Mesh>(null!)

  // Textures
  const [moonColor, moonDisplacement, starsMap] = useTexture([
    metadata.urls.moon.color,
    metadata.urls.moon.displacement,
    metadata.urls.moon.stars,
  ])
  const daySkyTexture = useTexture(metadata.urls.daySky)
  const sunGlowTexture = useTexture(metadata.urls.sun.surfaceMaterial)

  // Day/night animation
  useEffect(() => {
    const tl = gsap.timeline()
    if (mode === "day") {
      tl.to(moonRef.current.position, { y: -60, duration: 3, ease: "power2.inOut" })
        .to(sunRef.current.position, { y: 50, duration: 3, ease: "power2.inOut" }, "<")
        .to(sunGlowRef.current.position, { y: 50, duration: 3 }, "<")
        .to(starsRef.current.material, { opacity: 0.15, duration: 2 }, "<")
        .to((daySkyRef.current.material as THREE.MeshBasicMaterial).opacity, { value: 1, duration: 2 }, "<")
    } else {
      tl.to(sunRef.current.position, { y: -60, duration: 3, ease: "power2.inOut" })
        .to(sunGlowRef.current.position, { y: -60, duration: 3 }, "<")
        .to(moonRef.current.position, { y: 50, duration: 3, ease: "power2.inOut" }, "<")
        .to(starsRef.current.material, { opacity: 1, duration: 2 }, "<")
        .to((daySkyRef.current.material as THREE.MeshBasicMaterial).opacity, { value: 0, duration: 2 }, "<")
    }
  }, [mode])

  // Continuous rotation
  useFrame(() => {
    sunGlowRef.current.rotation.y += 0.001
    moonRef.current.rotation.y += 0.001
    starsRef.current.rotation.y += 0.0005
  })

  return (
    <group position={position}>
      {/* Day Sky */}
      <mesh ref={daySkyRef}>
        <sphereGeometry args={[900, 64, 64]} />
        <meshBasicMaterial
          map={daySkyTexture}
          side={THREE.BackSide}
          transparent
          opacity={mode === "day" ? 1 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Sun Core (no black circle) */}
      <mesh ref={sunRef} position={[0, mode === "day" ? 50 : -60, -100]}>
        {/* <sphereGeometry args={[4, 64, 64]} /> */}
        <meshPhongMaterial color="#fff"
         toneMapped={false} 
          emissive="#ffbb44" emissiveIntensity={2} shininess={0} />
      </mesh>

      {/* Sun Glow */}
      <mesh ref={sunGlowRef} position={[0, mode === "day" ? 50 : -60, -100]}>
  <sphereGeometry args={[4.5, 64, 64]} />
  <meshBasicMaterial
    map={sunGlowTexture}
    blending={THREE.AdditiveBlending}
    transparent
    opacity={0.5}
    toneMapped={false}
  />
</mesh>


      {/* Moon */}
      <mesh ref={moonRef} position={[0, mode === "night" ? 50 : -60, -100]} rotation={[Math.PI * 0.02, Math.PI * 1.54, 0]}>
        <sphereGeometry args={[3, 60, 60]} />
        <meshPhongMaterial
          map={moonColor}
          displacementMap={moonDisplacement}
          displacementScale={0.06}
          bumpMap={moonDisplacement}
          bumpScale={0.04}
          reflectivity={0}
          shininess={0}
        />
      </mesh>

      {/* Stars */}
      <mesh ref={starsRef}>
        <sphereGeometry args={[1000, 80, 80]} />
        <meshBasicMaterial
          map={starsMap}
          side={THREE.BackSide}
          transparent
          opacity={mode === "night" ? 1 : 0.15}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Lighting */}
      <directionalLight color={0xffffff} intensity={mode === "night" ? 1 : 0.3} position={[-100, 20, 50]} />
      <hemisphereLight skyColor={0xffffff} groundColor={0x222244} intensity={mode === "night" ? 0.2 : 0.1} />
    </group>
  )
}
