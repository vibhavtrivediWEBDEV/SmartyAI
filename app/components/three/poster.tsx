import React, { useEffect, useRef, useState } from "react"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"
import gsap from "gsap"

interface PosterProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  width?: number
  height?: number
  depth?: number
  color?: string
  image?: string
  controlsRef?: any
}

export function Poster({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  width = 1,
  height = 1,
  depth = 0.1,
  color = "white",
  image,
  controlsRef
}: PosterProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const texture = useTexture(image || "")
  const { camera , gl } = useThree()

  // Store camera's previous state
  const prevCameraRef = useRef<{ pos: THREE.Vector3; fov: number } | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const defaultCamera = useRef({
    pos: camera.position.clone(),
    fov: camera.fov,
  })
  
  const resetCamera = (duration: number = 1.5,useDefault = false) => {
    if (!prevCameraRef.current) return
    let target: { pos: THREE.Vector3; fov: number } | null

    if (useDefault) {
      target = defaultCamera.current
    } else {
      target = prevCameraRef.current
    }

    if (!target) return

    const { pos, fov } = prevCameraRef.current

    gsap.to(camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        controlsRef?.current?.update()
      },
      onComplete: () => {
        // ✅ Clear so next poster can store its own state
        prevCameraRef.current = null
      }
    })

    gsap.to(camera, {
      fov,
      duration,
      ease: "power2.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    })

    setIsFocused(false)
  }

  const handleFocusPoster = (e: any) => {
    const { position, fov, duration = 2 } = e.detail

    // ✅ Save original state only once
    if (!prevCameraRef.current) {
      prevCameraRef.current = {
        pos: camera.position.clone(),
        fov: camera.fov,
      }
    }

    const posterPos = new THREE.Vector3(...position)

    const posterRotation = new THREE.Euler(rotation[0], rotation[1], rotation[2])
    const posterDir = new THREE.Vector3(0, 0, 1)
    posterDir.applyEuler(posterRotation).normalize()

    const cameraTargetPos = posterPos.clone().add(posterDir.multiplyScalar(3))

    gsap.to(camera.position, {
      x: rotation[1] === 5 ? cameraTargetPos.x-1 :  cameraTargetPos.x + 0.5,
      y: rotation[1] === 5 ? -cameraTargetPos.y  : -cameraTargetPos.y + 4,
      z: rotation[1] === 5 ? -cameraTargetPos.z : -cameraTargetPos.z,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(posterPos)
        camera.updateProjectionMatrix()
        controlsRef.current?.update()
      },
    })

    if (fov) {
      gsap.to(camera, {
        fov:rotation[1]===5 ? 10 : fov,
        duration,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      })
    }

    setIsFocused(true)
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (!meshRef.current) return

    if (isFocused) {
      resetCamera()
    } else {
      handleFocusPoster({
        detail: {
          position: [-2, 6, 7],
          rotation: [0, THREE.MathUtils.degToRad(190), 0],
          fov: 13,
          distance: 4,
          duration: 2,
        },
      })
    }
  }


  useEffect(() => {
    const handlePointerMissed = () => {
      if (isFocused) {
        resetCamera(1.5, true) // reset to default
      }
    }

    // listen on WebGL canvas
    const domElement = gl.domElement
    domElement.addEventListener("pointerdown", handlePointerMissed)

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerMissed)
    }
  }, [gl, isFocused])

  const materials = [
    new THREE.MeshStandardMaterial({ color }),
    new THREE.MeshStandardMaterial({ color }),
    new THREE.MeshStandardMaterial({ color }),
    new THREE.MeshStandardMaterial({ color }),
    new THREE.MeshStandardMaterial({ map: texture }), // ✅ front face
    new THREE.MeshStandardMaterial({ color }),
  ]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        ref={meshRef}
        material={materials}
        onClick={handleClick}
        // castShadow
        // receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
      </mesh>
    </group>
  )
}
