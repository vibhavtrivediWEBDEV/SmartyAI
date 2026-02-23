import { useEffect, useRef, useState, ReactNode } from "react";

interface LiquidGlassVideoProps {
    src: string;
    children?: ReactNode;
}

export default function LiquidGlassVideo({
    src,
    children,
}: LiquidGlassVideoProps) {
    const [cursor, setCursor] = useState({ x: -999, y: -999 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setCursor({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        };

        const el = containerRef.current;
        el?.addEventListener("mousemove", handleMouseMove);
        return () => el?.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden">

            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            >
                <source src={src} type="video/mp4" />
            </video>



            {/* Content Layer */}
            <div className="relative z-10">{children}</div>

        </div>
    );
}