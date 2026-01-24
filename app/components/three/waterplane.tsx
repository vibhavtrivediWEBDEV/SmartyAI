import React, { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

export function WaterPlane({ position = [0, 0.2, 0] as [number,number,number], radius = 8, mode = "day" } : { position?: [number,number,number], radius?: number, mode?: "day"|"night" }) {
  const normal = useTexture("/textures/water-normal.jpg")
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping
  normal.repeat.set(6, 6)

  const matRef = useRef<THREE.MeshStandardMaterial | null>(null)
  useFrame((state, dt) => {
    // animate the normal map to simulate flow
    normal.offset.y += dt * 0.03
    normal.offset.x += dt * 0.01
    if (matRef.current) {
      matRef.current.metalness = 0.2
      matRef.current.roughness = mode === "day" ? 0.35 : 0.15
    }
  })

  return (
    <mesh position={position} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
      <circleGeometry args={[radius, 128]} />
      <meshStandardMaterial ref={matRef} normalMap={normal} transparent opacity={0.95} />
    </mesh>
  )
}
