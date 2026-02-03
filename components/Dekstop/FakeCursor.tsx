"use client"

import React, { useEffect, useRef, useState } from 'react';

interface FakeCursorProps {
    visible?: boolean;
    color?: string;
}

export function FakeCursor({ visible = true, color = '#FF0080' }: FakeCursorProps) {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        // Initialize at center
        setPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        // Listen for cursor automation events
        const handleCursorMove = (e: CustomEvent) => {
            setPosition({ x: e.detail.x, y: e.detail.y });
        };

        const handleCursorClick = () => {
            setIsClicking(true);
            setTimeout(() => setIsClicking(false), 150);
        };

        window.addEventListener('cursor-automation-move' as any, handleCursorMove);
        window.addEventListener('cursor-automation-click' as any, handleCursorClick);

        return () => {
            window.removeEventListener('cursor-automation-move' as any, handleCursorMove);
            window.removeEventListener('cursor-automation-click' as any, handleCursorClick);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            ref={cursorRef}
            className="fixed pointer-events-none z-[10000] transition-all duration-300 ease-out"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
            }}
        >
            {/* Cursor pointer */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                }}
            >
                <path
                    d="M3 3L3 21L9 15L12 24L15 23L12 14L20 14L3 3Z"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                />
            </svg>

            {/* Click ripple effect */}
            {isClicking && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: color,
                        opacity: 0.3,
                    }}
                />
            )}

            {/* Glow effect */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
                style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: color,
                    opacity: 0.5,
                }}
            />
        </div>
    );
}

