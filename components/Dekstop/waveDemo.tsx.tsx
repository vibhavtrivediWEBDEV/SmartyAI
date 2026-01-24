"use client"
import { useTheme } from "next-themes"
import { Waves } from "./wavebackground"

export function WavesDemo() {
  const { theme } = useTheme()

  return (
    <div className="relative w-full h-full bg-background/80 rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <Waves
          lineColor={theme === "dark" ? "rgba(252, 252, 252, 0.3)" : "rgb(228, 223, 223)"}
          backgroundColor="white"
          waveSpeedX={0.03}
          waveSpeedY={0.02}
          waveAmpX={40}
          waveAmpY={13}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={16}
          yGap={26}
        />
      </div>
     
    </div>
  )
}
