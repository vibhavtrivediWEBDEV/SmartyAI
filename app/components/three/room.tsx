import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import * as THREE from "three"


export function Room() {
  const { scene } = useGLTF("/assets/gaming_room.glb")

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Reduce material complexity
        if (child.material) {
          child.material.shadowSide = THREE.FrontSide
          child.castShadow = false // Disable shadows for room to improve performance
          child.receiveShadow = true
        }
      }
    })
  }, [scene])

  return <primitive object={scene} scale={1} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />
}



// import { useGLTF } from "@react-three/drei"
// import { useEffect, useMemo } from "react"
// import * as THREE from "three"

// export function Room() {
//   const gltf = useGLTF(
//     "https://vibhav-room.s3.eu-north-1.amazonaws.com/GamingRoom.glb"
//   )

//   // 🔑 Clone scene to avoid mutating cached GLTF
//   const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

//   useEffect(() => {
//     scene.traverse((child) => {
//       if (child instanceof THREE.Mesh) {
//         if (child.material) {
//           child.material = child.material.clone()
//           child.material.side = THREE.FrontSide
//         }
//         child.castShadow = false
//         child.receiveShadow = true
//       }
//     })
//   }, [scene])

//   return (
//     <primitive
//       object={scene}
//       scale={1}
//       position={[0, 0, 0]}
//       rotation={[0, Math.PI, 0]}
//     />
//   )
// }

// // ✅ Preload (VERY IMPORTANT for external URLs)
// useGLTF.preload(
//   "https://vibhav-room.s3.eu-north-1.amazonaws.com/GamingRoom.glb"
// )
