import { Desktop } from "@/components/Dekstop/deskstop";
import { Html } from "@react-three/drei"
import { useState } from "react";

export function LaptopScreen({ showDesktop,setdekstopView,onclick }: { showDesktop: boolean;setdekstopView:any;onclick:any }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <group  position={[5.2, 3.8, -3.5]} rotation={[0, -Math.PI / 2, 0]}>
      {showDesktop &&
        <>
          <mesh>
            <boxGeometry args={[2.6, 1.6, 0.12]} />
            <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.6} />
          </mesh>

          <mesh position={[0, 0, -0.06]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#000000" />
          </mesh>

          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#000000" emissive="#001122" emissiveIntensity={0.12} />
          </mesh>

          <Html
            transform
            occlude={false}
            position={[0, 0, 0.065]}
            scale={1.05}
            distanceFactor={1.0}
            rotation={[0, 0, 0]}
            zIndexRange={[100, 0]}
            style={{ pointerEvents: isFullscreen ? "auto" : "none" }} // Optimize pointer events
          >
            <div
              style={{
                width: isFullscreen ? "100vw" : "1044px",
                height: isFullscreen ? "100vh" : "710px",
                background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                display: "flex",
                flexDirection: "column",
                color: "white",
                border: isFullscreen ? "none" : "1px solid #444",
                borderRadius: isFullscreen ? "0" : "8px",
                boxShadow: isFullscreen ? "none" : "0 0 20px rgba(0,100,255,0.3)",
                position: isFullscreen ? "fixed" : "relative",
                top: isFullscreen ? "0" : "auto",
                left: isFullscreen ? "0" : "auto",
                zIndex: isFullscreen ? 9999 : "auto",
                willChange: isFullscreen ? "transform" : "auto",
                backfaceVisibility: "hidden",
              }}
            >
         

              <div style={{height:"300px", flex: 1, padding: isFullscreen ? "60px 20px 20px" : "20px" }}
              >
                <Desktop />
              </div>
            </div>
          </Html>
        </>}

    </group>
  )
}