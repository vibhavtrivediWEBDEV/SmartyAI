// import { useGLTF } from "@react-three/drei"
// import { useEffect } from "react"
// import * as THREE from "three"


// export function Room() {
//   const { scene } = useGLTF("/assets/gaming_room.glb")

//   useEffect(() => {
//     scene.traverse((child) => {
//       if (child instanceof THREE.Mesh) {
//         // Reduce material complexity
//         if (child.material) {
//           child.material.shadowSide = THREE.FrontSide
//           child.castShadow = false // Disable shadows for room to improve performance
//           child.receiveShadow = true
//         }
//       }
//     })
//   }, [scene])

//   return <primitive object={scene} scale={1} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />
// }



import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export function Room() {
  console.log("🚀 Room component rendering...");

  const { scene } = useGLTF(
    "https://vibhav-room.s3.eu-north-1.amazonaws.com/GamingRoom.glb"
  );

  console.log("✅ Scene loaded:", scene);
  console.log("📦 Scene children:", scene.children.length);
  console.log("📍 Scene position:", scene.position);
  console.log("📏 Scene scale:", scene.scale);

  useEffect(() => {
    let meshCount = 0;
    scene.traverse((child) => {
      console.log("Child:", child.type, child.name);
      
      if (child instanceof THREE.Mesh) {
        meshCount++;
        console.log(`  Mesh ${meshCount}:`, child.name);
        console.log("  Material:", child.material);
        console.log("  Visible:", child.visible);
        console.log("  Geometry vertices:", child.geometry.attributes.position.count);
        
        child.material.side = THREE.DoubleSide;
        child.castShadow = false;
        child.receiveShadow = true;
        child.visible = true; // Force visible
      }
    });
    console.log(`✅ Total meshes found: ${meshCount}`);
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

useGLTF.preload(
  "https://vibhav-room.s3.eu-north-1.amazonaws.com/GamingRoom.glb"
);