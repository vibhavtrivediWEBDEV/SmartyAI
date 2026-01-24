import { Html } from "@react-three/drei"
import { useThree, useFrame  } from "@react-three/fiber"
import { useState } from "react"

export function CameraDebugger() {
  const { camera } = useThree()   // 👈 now we get the camera
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 })

  useFrame(() => {
    setPos({
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
    })
  })

  return (
    <Html
      style={{
        position: "relative",
        right: 0,
        top: -600,
        color: "white",
        background: "rgba(0,0,0,0.6)",
        padding: "4px 8px",
        fontSize: "12px",
        borderRadius: "4px",
        width:"100px"
      }}
    >
      <div>X: {pos.x}</div>
      <div>Y: {pos.y}</div>
      <div>Z: {pos.z}</div>
    </Html>
  )
}
