// Lights.tsx
export function Lights() {
  return (
    <>
      {/* Soft global light */}
      <ambientLight intensity={0.7} />

      {/* Sky + ground bounce */}
      <hemisphereLight
        intensity={0.5}
        skyColor={"#ffffff"}
        groundColor={"#ffffff"}
      />

      {/* Main sunlight with shadows */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
    </>
  )
}
