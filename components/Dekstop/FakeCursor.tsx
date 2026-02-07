"use client"

import React, { useEffect, useRef, useState } from 'react';

interface FakeCursorProps {
    visible?: boolean;
    color?: string;
    handControl?: boolean; // Enable hand gesture control
}

export function FakeCursor({ visible = true, color = '#FF0080', handControl = false }: FakeCursorProps) {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const [handControlActive, setHandControlActive] = useState(false);
    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const smoothPositionRef = useRef({ x: 0, y: 0 });
    const lastScrollTimeRef = useRef(0);
    const clickCooldownRef = useRef(false);
    const animationFrameRef = useRef<number>();

    // Smooth interpolation for hand movement
    const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
    };

    // Initialize hand tracking
    useEffect(() => {
        if (!handControl) return;

        const initializeHandTracking = async () => {
            try {
                // Dynamically load MediaPipe scripts
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils');

                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });

                // Create hidden video element
                const video = document.createElement('video');
                video.style.display = 'none';
                video.autoplay = true;
                video.playsInline = true;
                video.srcObject = stream;
                document.body.appendChild(video);
                videoRef.current = video;

                // Initialize MediaPipe Hands
                const Hands = (window as any).Hands;
                const Camera = (window as any).Camera;

                const hands = new Hands({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.7
                });

                hands.onResults(onHandResults);
                handsRef.current = hands;

                const camera = new Camera(video, {
                    onFrame: async () => {
                        if (handsRef.current) {
                            await handsRef.current.send({ image: video });
                        }
                    },
                    width: 640,
                    height: 480
                });

                await camera.start();
                cameraRef.current = camera;
                setHandControlActive(true);

            } catch (error) {
                console.error('Hand tracking initialization failed:', error);
                setHandControlActive(false);
            }
        };

        initializeHandTracking();

        return () => {
            // Cleanup
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.remove();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handControl]);

    // Load external scripts dynamically
    const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Calculate distance between two points
    const distance = (point1: any, point2: any) => {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2)
        );
    };

    // Detect hand gestures
    const detectGesture = (landmarks: any[]) => {
        const thumb = landmarks[4];
        const indexFinger = landmarks[8];
        const middleFinger = landmarks[12];
        const ringFinger = landmarks[16];
        const pinky = landmarks[20];

        const thumbIndex = distance(thumb, indexFinger);
        const thumbMiddle = distance(thumb, middleFinger);

        // Check if fingers are extended
        const indexExtended = landmarks[8].y < landmarks[6].y;
        const middleExtended = landmarks[12].y < landmarks[10].y;
        const ringExtended = landmarks[16].y < landmarks[14].y;
        const pinkyExtended = landmarks[20].y < landmarks[18].y;

        const fingersExtended = [
            indexExtended,
            middleExtended,
            ringExtended,
            pinkyExtended
        ].filter(Boolean).length;

        // Pinch detection (Click) - thumb and index finger close
        if (thumbIndex < 0.05) {
            return 'click';
        }

        // Thumb + Middle finger pinch (Right click)
        if (thumbMiddle < 0.05) {
            return 'rightclick';
        }

        // Open palm (Scroll up)
        if (fingersExtended === 4) {
            return 'scrollup';
        }

        // Fist (Scroll down)
        if (fingersExtended === 0) {
            return 'scrolldown';
        }

        // Index finger pointing (Move cursor)
        if (indexExtended && fingersExtended === 1) {
            return 'move';
        }

        return 'none';
    };

    // Handle hand tracking results
    const onHandResults = (results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Get index finger tip position (landmark 8)
            const indexTip = landmarks[8];

            // Convert to screen coordinates (flip X for mirror effect)
            const targetX = (1 - indexTip.x) * window.innerWidth;
            const targetY = indexTip.y * window.innerHeight;

            // Smooth the movement using lerp
            const smoothFactor = 0.2; // Lower = smoother but slower, Higher = faster but jittery
            smoothPositionRef.current.x = lerp(smoothPositionRef.current.x, targetX, smoothFactor);
            smoothPositionRef.current.y = lerp(smoothPositionRef.current.y, targetY, smoothFactor);

            // Update cursor position with smooth values
            setPosition({
                x: smoothPositionRef.current.x,
                y: smoothPositionRef.current.y
            });

            // Detect and handle gestures
            const gesture = detectGesture(landmarks);
            handleGesture(gesture, smoothPositionRef.current.x, smoothPositionRef.current.y);
        }
    };

    // Handle gesture actions
    const handleGesture = (gesture: string, cursorX: number, cursorY: number) => {
        const now = Date.now();

        if (gesture === 'click' && !clickCooldownRef.current) {
            setIsClicking(true);
            clickCooldownRef.current = true;

            // Simulate click at cursor position
            const elementAtPoint = document.elementFromPoint(cursorX, cursorY);
            if (elementAtPoint) {
                elementAtPoint.click();
            }

            setTimeout(() => {
                setIsClicking(false);
                clickCooldownRef.current = false;
            }, 300);
        }

        if (gesture === 'rightclick' && !clickCooldownRef.current) {
            clickCooldownRef.current = true;

            // Simulate right click
            const elementAtPoint = document.elementFromPoint(cursorX, cursorY);
            if (elementAtPoint) {
                const event = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: cursorX,
                    clientY: cursorY
                });
                elementAtPoint.dispatchEvent(event);
            }

            setTimeout(() => {
                clickCooldownRef.current = false;
            }, 300);
        }

        // Smooth scrolling with cooldown
        if (gesture === 'scrollup' && now - lastScrollTimeRef.current > 50) {
            window.scrollBy({ top: -10, behavior: 'smooth' });
            lastScrollTimeRef.current = now;
        } else if (gesture === 'scrolldown' && now - lastScrollTimeRef.current > 50) {
            window.scrollBy({ top: 10, behavior: 'smooth' });
            lastScrollTimeRef.current = now;
        }
    };

    // Track native mouse movement
    useEffect(() => {
        if (handControlActive) return; // Don't track mouse if hand control is active

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseDown = () => {
            setIsClicking(true);
        };

        const handleMouseUp = () => {
            setIsClicking(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handControlActive]);

    // Listen for cursor automation events (existing functionality)
    useEffect(() => {
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
            className="fixed pointer-events-none z-[10000] transition-all duration-75 ease-out"
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

            {/* Hand control indicator (optional) */}
            {handControl && handControlActive && (
                <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap px-2 py-1 rounded"
                    style={{
                        backgroundColor: color,
                        color: 'white',
                        fontSize: '10px',
                    }}
                >
                    🖐️ Hand Control
                </div>
            )}
        </div>
    );
}