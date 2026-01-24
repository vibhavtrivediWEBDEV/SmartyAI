import React, { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function FountainParticles({ position = [0, 0.3, 0] as [number,number,number], count = 220 }) {
  const pointsRef = useRef<THREE.Points | null>(null)

  // initial positions and per-particle speeds
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.5
      const angle = Math.random() * Math.PI * 2
      positions[i*3 + 0] = Math.cos(angle) * r
      positions[i*3 + 1] = Math.random() * 0.2
      positions[i*3 + 2] = Math.sin(angle) * r
      speeds[i] = 0.02 + Math.random() * 0.04
    }
    return { positions, speeds }
  }, [count])

  useFrame((_, dt) => {
    const geom = pointsRef.current!.geometry
    const pos = geom.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      pos[idx + 1] += speeds[i] * (dt * 60) // move up
      pos[idx + 0] += (Math.random() - 0.5) * 0.002 // tiny x jitter
      pos[idx + 2] += (Math.random() - 0.5) * 0.002 // tiny z jitter
      // reset when high
      if (pos[idx + 1] > 2.0 + Math.random() * 0.5) {
        pos[idx + 0] = (Math.random() * 2 - 1) * 0.3
        pos[idx + 1] = 0
        pos[idx + 2] = (Math.random() * 2 - 1) * 0.3
      }
    }
    geom.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attachObject={{ name: "position" }} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} sizeAttenuation color={"#8fe8ff"} depthWrite={false} transparent opacity={0.9} />
    </points>
  )
}
