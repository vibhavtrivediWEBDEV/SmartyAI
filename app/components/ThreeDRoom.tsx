"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function CubePortfolio() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.Fog(0x0a0a0a, 200, 500)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000)
    camera.position.set(0, 15, 30)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    // renderer.shadowMap.type = THREE?.PCFShadowShadowMap
    containerRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(50, 100, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -200
    directionalLight.shadow.camera.right = 200
    directionalLight.shadow.camera.top = 200
    directionalLight.shadow.camera.bottom = -200
    scene.add(directionalLight)

    const roomSize = 150
    const roomHeight = 100
    const roomDepth = 300

    const greyWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.2,
      roughness: 0.8,
      side: THREE.BackSide,
    })

    const darkWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.1,
      roughness: 0.9,
      side: THREE.BackSide,
    })

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(roomSize, roomHeight)
    const backWall = new THREE.Mesh(backWallGeometry, darkWallMaterial)
    backWall.position.z = -roomDepth / 2
    backWall.receiveShadow = true
    scene.add(backWall)

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight)
    const leftWall = new THREE.Mesh(leftWallGeometry, greyWallMaterial)
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.x = -roomSize / 2
    leftWall.receiveShadow = true
    scene.add(leftWall)

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight)
    const rightWall = new THREE.Mesh(rightWallGeometry, greyWallMaterial)
    rightWall.rotation.y = Math.PI / 2
    rightWall.position.x = roomSize / 2
    rightWall.receiveShadow = true
    scene.add(rightWall)

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomDepth)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f0f,
      metalness: 0.1,
      roughness: 0.9,
    })
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = roomHeight / 2
    ceiling.receiveShadow = true
    scene.add(ceiling)

    // Ceiling light panel
    const lightPanelGeometry = new THREE.PlaneGeometry(40, 15)
    const lightPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
    })
    const lightPanel = new THREE.Mesh(lightPanelGeometry, lightPanelMaterial)
    lightPanel.position.set(0, roomHeight / 2 - 0.5, 0)
    lightPanel.rotation.x = Math.PI / 2
    scene.add(lightPanel)

    const pointLight = new THREE.PointLight(0xffffff, 2, 300)
    pointLight.position.set(0, roomHeight / 2 - 1, 0)
    pointLight.castShadow = true
    scene.add(pointLight)

    const leftAccentLight = new THREE.PointLight(0x6699ff, 1.5, 150)
    leftAccentLight.position.set(-roomSize / 2 + 10, 40, 0)
    scene.add(leftAccentLight)

    const rightAccentLight = new THREE.PointLight(0x6699ff, 1.5, 150)
    rightAccentLight.position.set(roomSize / 2 - 10, 40, 0)
    scene.add(rightAccentLight)

    // Floor with grid pattern
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomDepth)
    const floorCanvas = document.createElement("canvas")
    floorCanvas.width = 512
    floorCanvas.height = 512
    const floorCtx = floorCanvas.getContext("2d")!
    floorCtx.fillStyle = "#1a1a1a"
    floorCtx.fillRect(0, 0, 512, 512)

    floorCtx.strokeStyle = "rgba(0, 150, 255, 0.4)"
    floorCtx.lineWidth = 2
    for (let i = 0; i <= 512; i += 32) {
      floorCtx.beginPath()
      floorCtx.moveTo(i, 0)
      floorCtx.lineTo(i, 512)
      floorCtx.stroke()

      floorCtx.beginPath()
      floorCtx.moveTo(0, i)
      floorCtx.lineTo(512, i)
      floorCtx.stroke()
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas)
    floorTexture.repeat.set(6, 12)
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      metalness: 0.1,
      roughness: 0.9,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -roomHeight / 2
    floor.receiveShadow = true
    scene.add(floor)

    const objects = [
      { letter: "A", distance: 20, color: 0xff6b6b },
      { letter: "B", distance: 60, color: 0x4ecdc4 },
      { letter: "C", distance: 100, color: 0xffe66d },
      { letter: "D", distance: 140, color: 0x95e1d3 },
      { letter: "E", distance: 180, color: 0xc7ceea },
    ]

    const objectMeshes: THREE.Mesh[] = []

    objects.forEach((obj) => {
      // Create a glowing sphere for each object
      const geometry = new THREE.SphereGeometry(3, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: obj.color,
        emissive: obj.color,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.4,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(0, 2, -obj.distance)
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
      objectMeshes.push(mesh)

      // Add text label
      const canvas = document.createElement("canvas")
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "white"
      ctx.font = "bold 120px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(obj.letter, 128, 128)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteGeometry = new THREE.PlaneGeometry(8, 8)
      const spriteMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      })
      const sprite = new THREE.Mesh(spriteGeometry, spriteMaterial)
      sprite.position.set(0, 7, -obj.distance)
      scene.add(sprite)
    })

    const handleScroll = (event: WheelEvent) => {
      event.preventDefault()
      scrollProgress.current += event.deltaY * 0.001
      scrollProgress.current = Math.max(0, Math.min(1, scrollProgress.current))
    }

    window.addEventListener("wheel", handleScroll, { passive: false })

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      objectMeshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.005
        mesh.rotation.y += 0.008
        const pulse = Math.sin(Date.now() * 0.003 + index) * 0.5 + 1
        mesh.scale.set(pulse, pulse, pulse)
      })

      const targetZ = -20 - scrollProgress.current * 160
      const targetY = 15

      camera.position.x = 0
      camera.position.z += (targetZ - camera.position.z) * 0.08
      camera.position.y += (targetY - camera.position.y) * 0.08

      // Pulsing light
      const pulse = Math.sin(Date.now() * 0.001) * 0.3 + 1
      pointLight.intensity = 2 * pulse

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("wheel", handleScroll)
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center pointer-events-none">
        <p className="text-sm opacity-70">Scroll to explore</p>
      </div>
    </div>
  )
}
