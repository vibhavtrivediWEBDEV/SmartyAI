import * as THREE from "three"
import { useGLTF } from "@react-three/drei"
import { forwardRef, useEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import gsap from "gsap"

export const Human = forwardRef<THREE.Group>((props, ref) => {
  const { scene, animations } = useGLTF("/assets/Strut_Walking.glb")
  const group = useRef<THREE.Group>(null)
  const hasReachedChair = useRef(false)
  const isWalking = useRef(false)

  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const actions = useRef<{ [key: string]: THREE.AnimationAction }>({})
  const [activeClip, setActiveClip] = useState<string | null>(
    animations[0]?.name || null
  )

  // Mesh setup
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.castShadow = true
        child.receiveShadow = false
      }
    })
  }, [scene])

  // Forward ref
  useEffect(() => {
    if (!ref) return
    if (typeof ref === "function") ref(group.current!)
    else (ref as any).current = group.current
  }, [ref])

  // Animation setup
  useEffect(() => {
    if (!animations.length || !group.current) return

    mixer.current = new THREE.AnimationMixer(group.current)

    animations.forEach((clip) => {
      const action = mixer.current!.clipAction(clip)
      actions.current[clip.name] = action
      action.clampWhenFinished = true
      action.loop = THREE.LoopOnce
    })

    if (activeClip && actions.current[activeClip]) {
      actions.current[activeClip].play()
    }

    const playHandler = (e: any) => {
      Object.values(actions.current).forEach((a) => a.stop())

     if (e.detail === "mixamo.com" && group.current) {
  isWalking.current = true
  hasReachedChair.current = false

  // Rotate once before walk
  group.current.rotation.y = 1.6

  const walkAction = actions.current[e.detail]
  const idleAction = actions.current["Idle"]

  if (walkAction) {
    walkAction.reset().play()

    // Stop walking after 1 second
    setTimeout(() => {
      isWalking.current = false
      hasReachedChair.current = true

      // Switch to idle
      if (idleAction) {
        walkAction.crossFadeTo(idleAction, 0.3, false)
        idleAction.play()
      }
    }, 1000) // 1000ms = 1 second
  }
}
else {
        actions.current[e.detail]?.reset().play()
      }

      setActiveClip(e.detail)
    }

    window.addEventListener("playAnimation", playHandler)
    return () => {
      mixer.current?.stopAllAction()
      window.removeEventListener("playAnimation", playHandler)
    }
  }, [animations, activeClip])



  // new useEffect
  // Inside your Human component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!group.current) return
  
      const walkAction = actions.current["mixamo.com"]
      const idleAction = actions.current["Idle"]
  
      switch (e.key) {
        case "ArrowUp":
          // Resume walking
          if (walkAction) {
            Object.values(actions.current).forEach((a) => a.stop())
  
            walkAction.paused = false // resume if paused
            if (!isWalking.current) {
              walkAction.play()
            }
            isWalking.current = true
          }
          break
  
        case "ArrowDown":
          // Pause walking (don’t reset)
          if (walkAction && isWalking.current) {
            walkAction.paused = true
          }
          isWalking.current = false
          break
          case "ArrowLeft":
            case "ArrowRight": {
              const idleAction = actions.current["Idle"]
              const walkAction = actions.current["mixamo.com"]
            
              // Pause walk
              if (walkAction) walkAction.paused = true
              isWalking.current = false
            
              // Play idle
              if (idleAction) {
                Object.values(actions.current).forEach((a) => a.stop())
                idleAction.reset().play()
              }
            
              // Snap current rotation to nearest 90°
              const currentY = group.current.rotation.y
              const snappedY = Math.round(currentY / (Math.PI / 2)) * (Math.PI / 2)
            
              // Now rotate exactly ±90° from snapped
              const rotationAmount = e.key === "ArrowLeft" ? Math.PI / 2 : -Math.PI / 2
              gsap.to(group.current.rotation, {
                y: snappedY + rotationAmount,
                duration: 0.4,
                ease: "power2.out",
              })
              break
            }
            
      }
    }
  
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
  
  

  useFrame((state, delta) => {
  mixer.current?.update(delta)

  if (!group.current) return

  // Only move forward if walking is true AND animation is not paused AND hasn't reached chair
  if (isWalking.current && actions.current["mixamo.com"] && !actions.current["mixamo.com"].paused && !hasReachedChair.current) {
    const dir = new THREE.Vector3(0, 0, 1)
    dir.applyQuaternion(group.current.quaternion)
    dir.normalize()

    // Calculate distance to chair
    const chairPos = new THREE.Vector3(5.2, 0, -3.5) // adjust to your chair position
    const nextPos = group.current.position.clone().addScaledVector(dir, delta * 2)

    if (nextPos.distanceTo(chairPos) < 0.3) { // stop close enough
      group.current.position.copy(chairPos)
      isWalking.current = false
      hasReachedChair.current = true

      // Switch to idle
      const idleAction = actions.current["Idle"]
      if (idleAction) {
        Object.values(actions.current).forEach((a) => a.stop())
        idleAction.reset().play()
      }
    } else {
      group.current.position.addScaledVector(dir, delta * 2)
    }
  }
})



  return (
    <group
      ref={group}
      scale={2.8}
      position={[-4.5, 0, -2.5]}
      rotation={[0, 1.3, 0]}
    >
      <primitive object={scene} />
    </group>
  )
})