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
    const lastClickTimeRef = useRef(0);
    const lastGestureRef = useRef('');
    const lastHoverElementRef = useRef<Element | null>(null);
    const velocityRef = useRef({ x: 0, y: 0 });
    const rawPositionRef = useRef({ x: 0, y: 0 });
    const fingerBasePositionRef = useRef({ x: 0.5, y: 0.5 }); // Track finger base position
    const fingerTipDeltaRef = useRef({ x: 0, y: 0 }); // Track finger tip delta from base

    // Ultra smooth interpolation with easing
    const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
    };

    // Smooth easing function
    const easeOutQuad = (t: number) => {
        return t * (2 - t);
    };

    // Initialize hand tracking
    useEffect(() => {
        if (!handControl) return;

        // Initialize cursor at center (safe for SSR)
        if (typeof window !== 'undefined') {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            smoothPositionRef.current = { x: centerX, y: centerY };
            setPosition({ x: centerX, y: centerY });
        }

        const initializeHandTracking = async () => {
            try {
                // Dynamically load MediaPipe scripts
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils');

                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720,
                        frameRate: { ideal: 30, max: 60 }
                    }
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
                    minTrackingConfidence: 0.8
                });

                hands.onResults(onHandResults);
                handsRef.current = hands;

                const camera = new Camera(video, {
                    onFrame: async () => {
                        if (handsRef.current) {
                            await handsRef.current.send({ image: video });
                        }
                    },
                    width: 1280,
                    height: 720
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

    // Map finger tip movement to screen cursor (joystick-style control)
    const mapFingerTipToScreen = (landmarks: any[], currentScreenPos: { x: number, y: number }) => {
        // Get index finger points
        const indexKnuckle = landmarks[5]; // Index finger base (MCP joint)
        const indexTip = landmarks[8]; // Index finger tip

        // Calculate finger tip position relative to knuckle
        // FIXED X-AXIS: Negative delta for proper left-right control with mirror camera
        const deltaX = -(indexTip.x - indexKnuckle.x);
        const deltaY = indexTip.y - indexKnuckle.y;

        // Sensitivity: REDUCED for slower, controlled movement
        const sensitivityX = 800; // Lower = slower
        const sensitivityY = 800;

        // Calculate cursor movement (velocity-based)
        const velocityX = deltaX * sensitivityX;
        const velocityY = deltaY * sensitivityY;

        // Apply velocity to current position
        let newX = currentScreenPos.x + velocityX;
        let newY = currentScreenPos.y + velocityY;

        // Get screen dimensions safely
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

        // Clamp to screen bounds
        newX = Math.max(20, Math.min(screenWidth - 20, newX));
        newY = Math.max(20, Math.min(screenHeight - 20, newY));

        return { x: newX, y: newY };
    };

    // Detect hand gestures with improved accuracy
    const detectGesture = (landmarks: any[]) => {
        const thumb = landmarks[4];
        const indexFinger = landmarks[8];
        const middleFinger = landmarks[12];
        const ringFinger = landmarks[16];
        const pinky = landmarks[20];

        const thumbIndex = distance(thumb, indexFinger);
        const thumbMiddle = distance(thumb, middleFinger);

        // Check if fingers are extended (more lenient detection)
        const indexExtended = landmarks[8].y < landmarks[6].y;
        const middleExtended = landmarks[12].y < landmarks[10].y;
        const ringExtended = landmarks[16].y < landmarks[14].y;
        const pinkyExtended = landmarks[20].y < landmarks[18].y;
        const thumbExtended = landmarks[4].x < landmarks[3].x || landmarks[4].x > landmarks[3].x; // Check thumb extension

        const fingersExtended = [
            indexExtended,
            middleExtended,
            ringExtended,
            pinkyExtended
        ].filter(Boolean).length;

        // Pinch detection (Click) - thumb and index finger close
        if (thumbIndex < 0.06) {
            return 'click';
        }

        // Thumb + Middle finger pinch (Right click)
        if (thumbMiddle < 0.06 && !indexExtended) {
            return 'rightclick';
        }

        // Two fingers up (peace sign) - Scroll up
        if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
            return 'scrollup';
        }

        // Three fingers up - Scroll down
        if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
            return 'scrolldown';
        }

        // Index finger pointing (Move cursor)
        if (indexExtended) {
            return 'move';
        }

        return 'none';
    };

    // Handle hand tracking results with finger tip velocity control
    const onHandResults = (results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Get new cursor position based on finger tip movement
            const newPosition = mapFingerTipToScreen(landmarks, smoothPositionRef.current);

            // Apply smooth interpolation - HIGHER value for more responsive control
            const smoothFactor = 0.35; // Increased from 0.25 for better responsiveness

            smoothPositionRef.current.x = lerp(smoothPositionRef.current.x, newPosition.x, smoothFactor);
            smoothPositionRef.current.y = lerp(smoothPositionRef.current.y, newPosition.y, smoothFactor);

            // Update cursor position
            setPosition({
                x: Math.round(smoothPositionRef.current.x),
                y: Math.round(smoothPositionRef.current.y)
            });

            // Detect and handle gestures
            const gesture = detectGesture(landmarks);
            handleGesture(gesture, smoothPositionRef.current.x, smoothPositionRef.current.y);
        }
    };

    // Handle gesture actions with all features
    const handleGesture = (gesture: string, cursorX: number, cursorY: number) => {
        const now = Date.now();

        // Update hover state
        const elementAtPoint = document.elementFromPoint(cursorX, cursorY);

        if (elementAtPoint && elementAtPoint !== lastHoverElementRef.current) {
            // Trigger hover events
            if (lastHoverElementRef.current) {
                const leaveEvent = new MouseEvent('mouseleave', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: cursorX,
                    clientY: cursorY
                });
                lastHoverElementRef.current.dispatchEvent(leaveEvent);
            }

            if (elementAtPoint) {
                const enterEvent = new MouseEvent('mouseenter', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: cursorX,
                    clientY: cursorY
                });
                elementAtPoint.dispatchEvent(enterEvent);

                // Also dispatch mouseover for better compatibility
                const overEvent = new MouseEvent('mouseover', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: cursorX,
                    clientY: cursorY
                });
                elementAtPoint.dispatchEvent(overEvent);
            }

            lastHoverElementRef.current = elementAtPoint;
        }

        // Handle click gesture - improved double-click detection
        if (gesture === 'click' && lastGestureRef.current !== 'click') {
            // Only trigger on gesture START (transition from non-click to click)
            if (!clickCooldownRef.current) {
                setIsClicking(true);
                clickCooldownRef.current = true;

                const timeSinceLastClick = now - lastClickTimeRef.current;
                const isDoubleClick = timeSinceLastClick < 500; // 500ms window for double-click

                if (elementAtPoint) {
                    // Simulate mousedown
                    const mouseDownEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: cursorX,
                        clientY: cursorY,
                        detail: isDoubleClick ? 2 : 1
                    });
                    elementAtPoint.dispatchEvent(mouseDownEvent);

                    // Simulate mouseup and click
                    setTimeout(() => {
                        const mouseUpEvent = new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: cursorX,
                            clientY: cursorY,
                            detail: isDoubleClick ? 2 : 1
                        });
                        elementAtPoint.dispatchEvent(mouseUpEvent);

                        // Single click
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: cursorX,
                            clientY: cursorY,
                            detail: isDoubleClick ? 2 : 1
                        });
                        elementAtPoint.dispatchEvent(clickEvent);

                        // Double-click if within time window
                        if (isDoubleClick) {
                            const dblClickEvent = new MouseEvent('dblclick', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                clientX: cursorX,
                                clientY: cursorY,
                                detail: 2
                            });
                            elementAtPoint.dispatchEvent(dblClickEvent);
                            lastClickTimeRef.current = 0; // Reset to prevent triple-click
                        } else {
                            lastClickTimeRef.current = now;
                        }
                    }, 50);
                }

                setTimeout(() => {
                    setIsClicking(false);
                    clickCooldownRef.current = false;
                }, 300);
            }
        }

        // Handle right-click gesture
        if (gesture === 'rightclick' && lastGestureRef.current !== 'rightclick') {
            if (!clickCooldownRef.current) {
                clickCooldownRef.current = true;

                if (elementAtPoint) {
                    const contextMenuEvent = new MouseEvent('contextmenu', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: cursorX,
                        clientY: cursorY
                    });
                    elementAtPoint.dispatchEvent(contextMenuEvent);
                }

                setTimeout(() => {
                    clickCooldownRef.current = false;
                }, 400);
            }
        }

        // Smooth continuous scrolling
        if (gesture === 'scrollup' && now - lastScrollTimeRef.current > 30) {
            window.scrollBy({
                top: -8,
                behavior: 'auto'
            });
            lastScrollTimeRef.current = now;
        } else if (gesture === 'scrolldown' && now - lastScrollTimeRef.current > 30) {
            window.scrollBy({
                top: 8,
                behavior: 'auto'
            });
            lastScrollTimeRef.current = now;
        }

        lastGestureRef.current = gesture;
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
            className="fixed pointer-events-none z-[10000] transition-transform duration-75 ease-out"
            style={{
                left: `${position.x + 10}px`,
                top: `${position.y + 10}px`,
                transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
                willChange: 'transform, left, top',
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