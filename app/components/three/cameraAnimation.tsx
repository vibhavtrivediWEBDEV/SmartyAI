import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";

import * as THREE from "three"
import { useAIVoice } from "@/hooks/useAIVoice";


export function CameraAnimation({ controlsRef, humanRef ,setShowDesktop ,setdekstopView}: { controlsRef: any; humanRef: any ;setShowDesktop:any;setdekstopView:any}) {
  const { camera } = useThree()
  const hasIntroPlayed = useRef(false)
  const initialFov = useRef(camera.fov)
  const isAnimating = useRef(false)
  const isDesktopView = useRef(false)
  const needsUpdate = useRef(false) // Only update when needed
  const LAPTOP_POS = new THREE.Vector3(5.2, 3.8, -3.5)

  const {speak} = useAIVoice();

  const prevCameraPos = useRef<THREE.Vector3>(new THREE.Vector3());
const lastSpokenDirection = useRef<"left" | "right" | null>(null);
const lastSpokenTime = useRef<number>(0);


  
const savedCameraRef = useRef({
    position: camera.position.clone(),
    target: new THREE.Vector3(0, 0, 0),
    fov: camera.fov,
  })

  const ROOM_BOUNDS = {
    minX: -80,
    maxX: 20,
    minY: 4.0,
    maxY: 20.0,
    minZ: -23,
    maxZ: 23,
  }

  function detectHorizontalDirection(
  prev: THREE.Vector3,
  curr: THREE.Vector3
): "left" | "right" | null {
  const dx = curr.x - prev.x;
  const threshold = 0.05;

  if (dx > threshold) return "right";
  if (dx < -threshold) return "left";
  return null;
}


  const clampCameraPosition = (position: THREE.Vector3) => {
    const margin = 0.2
    position.x = THREE.MathUtils.clamp(position.x, ROOM_BOUNDS.minX + margin, ROOM_BOUNDS.maxX - margin)
    position.y = THREE.MathUtils.clamp(position.y, ROOM_BOUNDS.minY + margin, ROOM_BOUNDS.maxY - margin)
    position.z = THREE.MathUtils.clamp(position.z, ROOM_BOUNDS.minZ + margin, ROOM_BOUNDS.maxZ - margin)
    return position
  }

  const updateCameraAndControls = (target: THREE.Vector3) => {
  clampCameraPosition(camera.position);

  const clampedTarget = target.clone();
  clampedTarget.x = THREE.MathUtils.clamp(
    target.x,
    ROOM_BOUNDS.minX + 1,
    ROOM_BOUNDS.maxX - 1
  );
  clampedTarget.y = THREE.MathUtils.clamp(
    target.y,
    ROOM_BOUNDS.minY,
    ROOM_BOUNDS.maxY - 1
  );
  clampedTarget.z = THREE.MathUtils.clamp(
    target.z,
    ROOM_BOUNDS.minZ + 1,
    ROOM_BOUNDS.maxZ - 1
  );

  // 👀 LOOK AT TARGET
  camera.lookAt(clampedTarget);

  if (controlsRef?.current) {
    controlsRef.current.target.copy(clampedTarget);
    controlsRef.current.update();
  }

  // ===============================
  // 🎤 DYNAMIC VOICE (LEFT / RIGHT)
  // ===============================
  const currentPos = camera.position.clone();
  const direction = detectHorizontalDirection(
    prevCameraPos.current,
    currentPos
  );

  const now = Date.now();

  if (
    direction &&
    direction !== lastSpokenDirection.current &&
    now - lastSpokenTime.current > 2000 // debounce (2s)
  ) {
    if (direction === "right") {
      // speak("Moving right. Feel the openness of the space.");
    }

    if (direction === "left") {
      // speak("Moving left. Notice the depth and balance.");
    }

    lastSpokenDirection.current = direction;
    lastSpokenTime.current = now;
  }

  prevCameraPos.current.copy(currentPos);
  needsUpdate.current = true;
};


  useEffect(() => {
    if (!hasIntroPlayed.current) {
      hasIntroPlayed.current = true
      isAnimating.current = true

      if (controlsRef?.current) {
        controlsRef.current.enabled = false
      }

      camera.position.set(-12, 7, 8)
      const initialTarget = new THREE.Vector3(-2, 3, -2)
      updateCameraAndControls(initialTarget)

      gsap.timeline().to(camera.position, {
        duration: 2, // Reduced from 3 to 2
        x: -8,
        y: 6,
        z: 5,
        ease: "power2.out",
        onUpdate: () => updateCameraAndControls(initialTarget),
        onComplete: () => {
          isAnimating.current = false
          if (controlsRef?.current) {
            controlsRef.current.enabled = true
          }
        },
      })
    }

    const handleAnimationFocus = (e: any) => {
      const animationName = e.detail
      if (!camera) return

      isAnimating.current = true
      if (controlsRef?.current) {
        controlsRef.current.enabled = false
      }
speak("Zooming ")
      camera.fov = initialFov.current
      camera.updateProjectionMatrix()

      const fallbackHumanPos = new THREE.Vector3(-3, 2, -3)
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false
          if (controlsRef?.current) {
            controlsRef.current.enabled = true
            if (animationName === "mixamo.com") {
              isDesktopView.current = true
              controlsRef.current.minDistance = 1.8
              controlsRef.current.maxDistance = 4
              controlsRef.current.maxPolarAngle = Math.PI / 2.2
              controlsRef.current.minPolarAngle = Math.PI / 8
              controlsRef.current.minAzimuthAngle = -Math.PI / 3
              controlsRef.current.maxAzimuthAngle = Math.PI / 3
            } else {
              isDesktopView.current = false
              controlsRef.current.minDistance = 3
              controlsRef.current.maxDistance = 15
              controlsRef.current.maxPolarAngle = Math.PI / 1.8
              controlsRef.current.minPolarAngle = Math.PI / 8
              controlsRef.current.minAzimuthAngle = -Math.PI
              controlsRef.current.maxAzimuthAngle = Math.PI
            }
          }
          setShowDesktop(true)
         
      
        },
      })

      if (animationName === "mixamo.com") {

         setTimeout(() => {
          speak("Moving to vibhav's Mac OS")
      setdekstopView(true)
    },8000)

        tl.to(camera.position, {
          duration: 0.8, // Reduced from 1.0
          x: -10,
          y: 6.5,
          z: 3,
          ease: "power2.out",
          onUpdate: () => {
            const humanPos = humanRef?.current?.position ? humanRef.current.position.clone() : fallbackHumanPos
            updateCameraAndControls(humanPos)
          },
          
        })

        tl.to(
          { progress: 0 },
          {
            duration: 0.6, // Reduced from 2.6
            progress: 1,
            ease: "power1.inOut",
            onUpdate: function () {
              const progress = this.targets()[0].progress
              const humanPos = humanRef?.current?.position ? humanRef.current.position.clone() : fallbackHumanPos

              const radius = 7
              const angle = -Math.PI / 2.5 + (progress * Math.PI) / 4
              const height = 5.5 + progress * 0.8

              const newPos = new THREE.Vector3(
                humanPos.x + radius * Math.cos(angle),
                height,
                humanPos.z + radius * Math.sin(angle),
              )

              camera.position.copy(clampCameraPosition(newPos))
              updateCameraAndControls(humanPos)
            },
          },
        )

        tl.to(
          { transition: 0 },
          {
            duration: 1.8, // Reduced from 2.5
            transition: 1,
            ease: "power2.inOut",
            onUpdate: function () {
              const t = this.targets()[0].transition

              const startPos = camera.position.clone()
              const endPos = new THREE.Vector3(LAPTOP_POS.x - 3.0, LAPTOP_POS.y + 0.5, LAPTOP_POS.z + 2.0)

              const newPos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
              camera.position.copy(clampCameraPosition(newPos))
              updateCameraAndControls(LAPTOP_POS)
            },
          },
        )

        tl.to(camera.position, {
          duration: 1.0, // Reduced from 1.2
          x: LAPTOP_POS.x - 2.8,
          y: LAPTOP_POS.y + 0.3,
          z: LAPTOP_POS.z + 1.8,
          ease: "power1.inOut",
          onUpdate: () => updateCameraAndControls(LAPTOP_POS),
        })

        tl.to(camera, {
          duration: 0.8, // Reduced from 1.0
          fov: 38,
          ease: "power1.inOut",
          onUpdate: () => camera.updateProjectionMatrix(),
          
        })

     
      } else {
        isDesktopView.current = false
        tl.to(camera.position, {
          duration: 0.8, // Reduced from 1.0
          x: -4,
          y: 5,
          z: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            const humanPos = humanRef?.current?.position ? humanRef.current.position.clone() : fallbackHumanPos
            updateCameraAndControls(humanPos)
          },
        })

        tl.to(
          camera,
          {
            duration: 0.4, // Reduced from 0.5
            fov: initialFov.current,
            ease: "power1.inOut",
            onUpdate: () => camera.updateProjectionMatrix(),
            onComplete: () => {
              setdekstopView(true) 
            }
          },
          "-=0.4",
        )
      }
    }
// inside CameraAnimation useEffect (you already have camera & controlsRef available)

const handleFocusPoster = (e: any) => {
  const { position, fov, duration = 2 } = e.detail;

  const posterPos = new THREE.Vector3(...position);

  // Create a dummy object with same rotation as poster
  const posterRotation = new THREE.Euler(0, THREE.MathUtils.degToRad(190), 0);
  const posterDir = new THREE.Vector3(0, 0, 1); // forward direction in local space
  posterDir.applyEuler(posterRotation).normalize(); // rotate to match poster

  // Move camera a few units in front of poster
  const cameraTargetPos = posterPos.clone().add(posterDir.multiplyScalar(3));

  gsap.to(camera.position, {
    x: cameraTargetPos.x+0.5,
    y: -cameraTargetPos.y+4,
    z: -cameraTargetPos.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(posterPos);
      camera.updateProjectionMatrix();
      controlsRef.current?.update();
      speak("Charcoal Painting")
    },
  });

  if (fov) {
    gsap.to(camera, {
      fov,
      duration,
      ease: "power2.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
  }
};




    const handleResetPoster = () => {
      const { position, fov } = savedCameraRef.current
      gsap.to(camera.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: 1.2,
        ease: "power2.inOut",
      })
      gsap.to(camera, {
        fov,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      })
       speak("How was the Painting")
      
    }

    // window.addEventListener("focusPoster", handleFocusPoster)
    window.addEventListener("resetPoster", handleResetPoster)

    window.addEventListener("playAnimation", handleAnimationFocus)
    
   return () => {
  window.removeEventListener("playAnimation", handleAnimationFocus)
  window.removeEventListener("focusPoster", handleFocusPoster)
  window.removeEventListener("resetCamera", handleAnimationFocus)
}

  }, [camera, controlsRef, humanRef])

  useFrame(() => {
    if (controlsRef?.current && (needsUpdate.current || isAnimating.current)) {
      clampCameraPosition(camera.position)

      const target = controlsRef.current.target
      // target.x = THREE.MathUtils.clamp(target.x, ROOM_BOUNDS.minX + 1, ROOM_BOUNDS.maxX - 1)
      // target.y = THREE.MathUtils.clamp(target.y, ROOM_BOUNDS.minY, ROOM_BOUNDS.maxY - 1)
      // target.z = THREE.MathUtils.clamp(target.z, ROOM_BOUNDS.minZ + 1, ROOM_BOUNDS.maxZ - 1)

      controlsRef.current.update()
      needsUpdate.current = false
    }
  })

  return null
}