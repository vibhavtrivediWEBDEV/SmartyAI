"use client";

import { cn } from "@/lib/utils";

type CanvasRevealEffectProps = {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
};

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize = 3,
  showGradient = true,
}: CanvasRevealEffectProps) => {
  const [red = 0, green = 255, blue = 255] = colors[0] ?? [];
  const gridSize = Math.max(dotSize + 4, 6);
  const duration = Math.max(1.5, 8 / animationSpeed);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-white",
        containerClassName
      )}
    >
      <div
        className="canvas-reveal-dots absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(${red}, ${green}, ${blue}, 0.9) ${dotSize}px, transparent ${
            dotSize + 0.5
          }px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          animationDuration: `${duration}s`,
        }}
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
      <style jsx>{`
        .canvas-reveal-dots {
          animation-name: reveal-dots;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          mask-image: radial-gradient(circle at center, black 0%, transparent 72%);
          opacity: 0.9;
        }

        @keyframes reveal-dots {
          0% {
            background-position: 0 0;
            opacity: 0.35;
          }
          50% {
            opacity: 1;
          }
          100% {
            background-position: ${gridSize * 4}px ${gridSize * 4}px;
            opacity: 0.35;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .canvas-reveal-dots {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

