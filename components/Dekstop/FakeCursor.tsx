"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// ONE-EURO FILTER
// ══════════════════════════════════════════════════════════════════════════════
class OneEuroFilter {
    private xPrev: number | null = null;
    private dxPrev = 0;
    private tPrev: number | null = null;
    constructor(private minCutoff = 0.8, private beta = 0.004, private dCutoff = 1.0) { }
    private alpha(c: number, dt: number) { return 1 / (1 + 1 / (2 * Math.PI * c * dt)); }
    filter(x: number, t: number): number {
        if (this.tPrev === null || this.xPrev === null) { this.tPrev = t; this.xPrev = x; return x; }
        const dt = Math.max((t - this.tPrev) / 1000, 0.001);
        this.tPrev = t;
        const dx = (x - this.xPrev) / dt;
        this.dxPrev = this.alpha(this.dCutoff, dt) * dx + (1 - this.alpha(this.dCutoff, dt)) * this.dxPrev;
        const a = this.alpha(this.minCutoff + this.beta * Math.abs(this.dxPrev), dt);
        this.xPrev = a * x + (1 - a) * this.xPrev;
        return this.xPrev;
    }
    reset() { this.xPrev = null; this.tPrev = null; this.dxPrev = 0; }
}

// ══════════════════════════════════════════════════════════════════════════════
// EYE ASPECT RATIO
// ══════════════════════════════════════════════════════════════════════════════
const LEFT_EYE = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
function calcEAR(lm: any[], idx: number[]): number {
    const d = (a: number, b: number) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    return (d(idx[1], idx[5]) + d(idx[2], idx[4])) / (2 * d(idx[0], idx[3]));
}

// ══════════════════════════════════════════════════════════════════════════════
// FIND SCROLLABLE PARENT
// ══════════════════════════════════════════════════════════════════════════════
function findScrollable(el: Element | null, vertical: boolean): Element {
    while (el && el !== document.documentElement) {
        const s = window.getComputedStyle(el);
        const o = vertical ? s.overflowY : s.overflowX;
        if (o === "auto" || o === "scroll" || o === "overlay") {
            const can = vertical
                ? (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight
                : (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth;
            if (can) return el;
        }
        el = el.parentElement;
    }
    return document.scrollingElement ?? document.documentElement;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROPS
// ══════════════════════════════════════════════════════════════════════════════
interface FakeCursorProps {
    visible?: boolean;
    color?: string;
    handControl?: boolean;
    sensitivity?: number;    // 1–10, default 6
    blinkThreshold?: number; // 0.15–0.35, default 0.23
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMPLIFIED GESTURE MAP
// ──────────────────────────────────────────────────────────────────────────────
//  Wink LEFT eye              → Left click
//  Wink RIGHT eye             → Right click
//  BOTH eyes close (instant)  → Double click
//  BOTH eyes HOLD + head UP   → Continuous scroll UP   (while eyes stay closed)
//  BOTH eyes HOLD + head DOWN → Continuous scroll DOWN (while eyes stay closed)
//  BOTH eyes HOLD + head LEFT → Continuous scroll LEFT
//  BOTH eyes HOLD + head RIGHT→ Continuous scroll RIGHT
// ══════════════════════════════════════════════════════════════════════════════
export function FakeCursor({
    visible = true,
    color = "#FF0080",
    handControl = false,
    sensitivity = 2,
    blinkThreshold = 0.23,
}: FakeCursorProps) {

    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [clicking, setClicking] = useState(false);
    const [clickType, setClickType] = useState<"left" | "right" | "double" | null>(null);
    const [handControlActive, setHandControlActive] = useState(false);
    const [scrolling, setScrolling] = useState<"up" | "down" | "left" | "right" | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "calibrating" | "active" | "no_face" | "error">("idle");
    const [calibPct, setCalibPct] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const faceMeshRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

    // ── Filters ───────────────────────────────────────────────────────────────
    const emaX = useRef(0.5);
    const emaY = useRef(0.5);
    const oefX = useRef(new OneEuroFilter(0.8, 0.004));
    const oefY = useRef(new OneEuroFilter(0.8, 0.004));

    // ── State refs ────────────────────────────────────────────────────────────
    const frozenPos = useRef({ x: 0, y: 0 });
    const currentDY = useRef(0); // live head tilt (for scroll direction)
    const currentDX = useRef(0);
    const lastHoverEl = useRef<Element | null>(null);

    // ── Blink refs ────────────────────────────────────────────────────────────
    const lActive = useRef(false);   // left eye currently closed
    const rActive = useRef(false);   // right eye currently closed
    const bothClosed = useRef(false);   // both eyes currently closed
    const bothCloseTime = useRef(0);       // when both eyes closed (ms)
    const lClickCooldown = useRef(0);
    const rClickCooldown = useRef(0);
    const bothClickFired = useRef(false);  // double-click already fired this close
    const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollDirRef = useRef<"up" | "down" | "left" | "right" | null>(null);

    const earBufL = useRef<number[]>([]);
    const earBufR = useRef<number[]>([]);

    // ── Calibration ───────────────────────────────────────────────────────────
    const calibN = useRef(0);
    const calibSumX = useRef(0);
    const calibSumY = useRef(0);
    const baseX = useRef(0.5);
    const baseY = useRef(0.5);
    const calibrated = useRef(false);
    const CALIB_N = 90;
    const EMA_A = 0.12;

    // ── Script loader ─────────────────────────────────────────────────────────
    const loadScript = (src: string) => new Promise<void>((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) return res();
        const s = document.createElement("script");
        s.src = src; s.onload = () => res(); s.onerror = rej;
        document.head.appendChild(s);
    });

    // ── Hover ─────────────────────────────────────────────────────────────────
    const dispatchHover = useCallback((cx: number, cy: number) => {
        const el = document.elementFromPoint(cx, cy);
        if (!el || el === lastHoverEl.current) return;
        lastHoverEl.current?.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true, clientX: cx, clientY: cy }));
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX: cx, clientY: cy }));
        el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: cx, clientY: cy }));
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: cx, clientY: cy }));
        lastHoverEl.current = el;
    }, []);

    // ── Click ─────────────────────────────────────────────────────────────────
    const fireClick = useCallback((cx: number, cy: number, type: "left" | "right" | "double") => {
        const el = document.elementFromPoint(cx, cy);
        if (!el) return;
        setClicking(true); setClickType(type);
        const o: MouseEventInit = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy };
        if (type === "double") {
            el.dispatchEvent(new MouseEvent("mousedown", o));
            el.dispatchEvent(new MouseEvent("mouseup", o));
            el.dispatchEvent(new MouseEvent("click", { ...o, detail: 1 }));
            setTimeout(() => {
                el.dispatchEvent(new MouseEvent("mousedown", o));
                el.dispatchEvent(new MouseEvent("mouseup", o));
                el.dispatchEvent(new MouseEvent("click", { ...o, detail: 2 }));
                el.dispatchEvent(new MouseEvent("dblclick", { ...o, detail: 2 }));
            }, 60);
        } else {
            el.dispatchEvent(new MouseEvent("mousedown", o));
            setTimeout(() => {
                el.dispatchEvent(new MouseEvent("mouseup", o));
                el.dispatchEvent(new MouseEvent(type === "right" ? "contextmenu" : "click", o));
            }, 40);
        }
        setTimeout(() => { setClicking(false); setClickType(null); }, 350);
    }, []);

    // ── Start continuous scroll ───────────────────────────────────────────────
    const startScroll = useCallback((dir: "up" | "down" | "left" | "right") => {
        if (scrollDirRef.current === dir) return; // already scrolling this dir
        stopScroll();
        scrollDirRef.current = dir;
        setScrolling(dir);

        const STEP = 18;  // pixels per tick
        const INTERVAL = 30;  // ms per tick → smooth ~60fps-ish scroll

        scrollInterval.current = setInterval(() => {
            const cx = frozenPos.current.x;
            const cy = frozenPos.current.y;
            const el = document.elementFromPoint(cx, cy);
            const vert = dir === "up" || dir === "down";
            const target = findScrollable(el, vert);
            const amount = (dir === "up" || dir === "left") ? -STEP : STEP;
            if (vert) target.scrollBy({ top: amount });
            else target.scrollBy({ left: amount });
        }, INTERVAL);
    }, []);

    // ── Stop continuous scroll ────────────────────────────────────────────────
    const stopScroll = useCallback(() => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
        scrollDirRef.current = null;
        setScrolling(null);
    }, []);

    const recalibrate = useCallback(() => {
        calibN.current = 0; calibSumX.current = 0; calibSumY.current = 0;
        calibrated.current = false; emaX.current = 0.5; emaY.current = 0.5;
        oefX.current.reset(); oefY.current.reset();
        earBufL.current = []; earBufR.current = [];
        lActive.current = false; rActive.current = false;
        bothClosed.current = false; bothClickFired.current = false;
        stopScroll();
        setCalibPct(0); setStatus("calibrating");
    }, [stopScroll]);

    // ══════════════════════════════════════════════════════════════════════════
    // FACE MESH HANDLER
    // ══════════════════════════════════════════════════════════════════════════
    const onResults = useCallback((results: any) => {
        if (!results.multiFaceLandmarks?.length) { setStatus("no_face"); return; }
        setStatus("active");

        const lm = results.multiFaceLandmarks[0];
        const now = performance.now();
        const nowMs = Date.now();
        const W = window.innerWidth;
        const H = window.innerHeight;

        // ── HEAD TRACKING ──────────────────────────────────────────────────────
        const nose = lm[4];
        emaX.current = EMA_A * nose.x + (1 - EMA_A) * emaX.current;
        emaY.current = EMA_A * nose.y + (1 - EMA_A) * emaY.current;

        if (!calibrated.current) {
            if (calibN.current < CALIB_N) {
                calibSumX.current += emaX.current;
                calibSumY.current += emaY.current;
                calibN.current++;
                setCalibPct(calibN.current / CALIB_N);
                setStatus("calibrating");
            } else {
                baseX.current = calibSumX.current / CALIB_N;
                baseY.current = calibSumY.current / CALIB_N;
                calibrated.current = true;
                frozenPos.current = { x: W / 2, y: H / 2 };
                setPos({ x: W / 2, y: H / 2 });
                setStatus("active");
            }
        }

        if (calibrated.current) {
            const rawDX = emaX.current - baseX.current;
            const rawDY = emaY.current - baseY.current;
            const dx = -rawDX; // invert X (mirror camera)
            const dy = rawDY;

            currentDX.current = dx;
            currentDY.current = dy;

            const magX = Math.abs(dx);
            const magY = Math.abs(dy);

            // ── SENSITIVITY TUNING ───────────────────────────────────────────────
            // Dead zone: 0.025 — stable at 20-40cm, covers natural micro-sway
            // Smooth zone: 0.055 — gradual acceleration out of dead zone
            // RANGE: 0.035 — small tilt → large cursor travel (higher sensitivity)
            //   sensitivity=6 → RANGE=0.035/1.2=0.029 (very responsive)
            //   At 20cm distance, nose movement is amplified in frame → even better
            const DEAD = 0.025;
            const SMOOTH = 0.055;
            const RANGE = 0.035 / (sensitivity / 5);

            const gX = Math.min(1, Math.max(0, (magX - DEAD) / (SMOOTH - DEAD)));
            const gY = Math.min(1, Math.max(0, (magY - DEAD) / (SMOOTH - DEAD)));
            // Cubic: near-zero near dead zone edge, ramps fast beyond smooth zone
            const gatedDX = Math.sign(dx) * magX * (gX * gX * gX);
            const gatedDY = Math.sign(dy) * magY * (gY * gY * gY);

            const inDead = magX <= DEAD && magY <= DEAD;

            let tX = frozenPos.current.x;
            let tY = frozenPos.current.y;
            if (!inDead) {
                tX = Math.max(4, Math.min(W - 4, W / 2 + (gatedDX / RANGE) * (W / 2)));
                tY = Math.max(4, Math.min(H - 4, H / 2 + (gatedDY / RANGE) * (H / 2)));
                frozenPos.current = { x: tX, y: tY };
            }

            const fx = oefX.current.filter(tX, now);
            const fy = oefY.current.filter(tY, now);
            setPos({ x: fx, y: fy });
            dispatchHover(fx, fy);
        }

        // ── BLINK DETECTION ────────────────────────────────────────────────────
        const earL = calcEAR(lm, LEFT_EYE);
        const earR = calcEAR(lm, RIGHT_EYE);

        earBufL.current.push(earL); if (earBufL.current.length > 3) earBufL.current.shift();
        earBufR.current.push(earR); if (earBufR.current.length > 3) earBufR.current.shift();
        const avgL = earBufL.current.reduce((a, b) => a + b, 0) / earBufL.current.length;
        const avgR = earBufR.current.reduce((a, b) => a + b, 0) / earBufR.current.length;

        const lClosed = avgL < blinkThreshold;
        const rClosed = avgR < blinkThreshold;
        const bClosed = lClosed && rClosed; // BOTH eyes closed

        const cx = frozenPos.current.x;
        const cy = frozenPos.current.y;

        // ══════════════════════════════════════════════════════════════════════
        // GESTURE LOGIC
        // ══════════════════════════════════════════════════════════════════════

        if (bClosed) {
            // ── BOTH EYES CLOSED ────────────────────────────────────────────────
            if (!bothClosed.current) {
                // Leading edge: both just closed
                bothClosed.current = true;
                bothCloseTime.current = nowMs;
                bothClickFired.current = false;
            }

            const heldMs = nowMs - bothCloseTime.current;

            // After 300ms hold, check head direction and start continuous scroll
            if (heldMs > 300) {
                const dx = currentDX.current;
                const dy = currentDY.current;
                const MIN = 0.018; // min tilt to trigger scroll direction

                let dir: "up" | "down" | "left" | "right" | null = null;
                if (Math.abs(dy) >= Math.abs(dx)) {
                    if (dy < -MIN) dir = "up";
                    else if (dy > MIN) dir = "down";
                } else {
                    if (dx < -MIN) dir = "left";
                    else if (dx > MIN) dir = "right";
                }

                if (dir) {
                    startScroll(dir);
                }
            }

        } else {
            // ── BOTH EYES JUST OPENED ────────────────────────────────────────────
            if (bothClosed.current) {
                bothClosed.current = false;
                stopScroll();

                const heldMs = nowMs - bothCloseTime.current;

                // Quick blink (< 300ms) with both eyes = DOUBLE CLICK
                if (heldMs < 300 && !bothClickFired.current) {
                    bothClickFired.current = true;
                    fireClick(cx, cy, "double");
                }
                // If held longer → was scrolling, no click
            }

            // ── INDIVIDUAL EYE WINKS (only when not both closed) ─────────────────
            // Left wink → left click
            if (lClosed && !rClosed && !lActive.current) {
                lActive.current = true;
                if (nowMs - lClickCooldown.current > 650) {
                    lClickCooldown.current = nowMs;
                    fireClick(cx, cy, "left");
                }
            } else if (!lClosed) {
                lActive.current = false;
            }

            // Right wink → right click
            if (rClosed && !lClosed && !rActive.current) {
                rActive.current = true;
                if (nowMs - rClickCooldown.current > 650) {
                    rClickCooldown.current = nowMs;
                    fireClick(cx, cy, "right");
                }
            } else if (!rClosed) {
                rActive.current = false;
            }
        }

    }, [sensitivity, blinkThreshold, dispatchHover, fireClick, startScroll, stopScroll]);

    // ── Init MediaPipe ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!handControl || !visible) return;
        if (typeof window !== "undefined") {
            frozenPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            setPos(frozenPos.current);
        }
        const init = async () => {
            try {
                setStatus("loading");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: { ideal: 60 } } });
                const video = document.createElement("video");
                video.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;";
                video.autoplay = true; video.playsInline = true; video.srcObject = stream;
                document.body.appendChild(video); videoRef.current = video;
                const faceMesh = new (window as any).FaceMesh({
                    locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
                });
                faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
                faceMesh.onResults(onResults); faceMeshRef.current = faceMesh;
                const cam = new (window as any).Camera(video, {
                    onFrame: async () => { if (faceMeshRef.current) await faceMeshRef.current.send({ image: video }); },
                    width: 640, height: 480,
                });
                await cam.start(); cameraRef.current = cam;
                setHandControlActive(true); setStatus("calibrating");
            } catch (err) { console.error(err); setStatus("error"); setHandControlActive(false); }
        };
        init();
        return () => {
            stopScroll();
            cameraRef.current?.stop();
            if (videoRef.current) {
                (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
                videoRef.current.remove();
            }
        };
    }, [handControl, visible, onResults, stopScroll]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.code === "Space" && e.shiftKey) recalibrate(); };
        window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
    }, [recalibrate]);

    useEffect(() => {
        if (handControl) return;
        const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        const down = () => setClicking(true);
        const up = () => setClicking(false);
        window.addEventListener("mousemove", move); window.addEventListener("mousedown", down); window.addEventListener("mouseup", up);
        return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); };
    }, [handControl]);

    useEffect(() => {
        const move = (e: any) => setPos({ x: e.detail.x, y: e.detail.y });
        const click = () => { setClicking(true); setTimeout(() => setClicking(false), 150); };
        window.addEventListener("cursor-automation-move" as any, move);
        window.addEventListener("cursor-automation-click" as any, click);
        return () => { window.removeEventListener("cursor-automation-move" as any, move); window.removeEventListener("cursor-automation-click" as any, click); };
    }, []);

    if (!visible) return null;

    const isCalibrating = status === "calibrating" || status === "loading";
    const dotColor = status === "active" ? "#30D158" : status === "no_face" ? "#FF453A" : "#FF9F0A";
    const clickColor = clickType === "right" ? "#FF453A" : clickType === "double" ? "#FFD60A" : color;
    const scrollArrow = { up: "↑", down: "↓", left: "←", right: "→" };

    return (
        <>
            {/* ── Cursor ──────────────────────────────────────────────────────── */}
            <div className="fixed pointer-events-none" style={{
                left: pos.x, top: pos.y, zIndex: 2147483647,
                transform: `translate(-2px,-2px) scale(${clicking ? 0.65 : scrolling ? 0.9 : 1})`,
                transition: "transform 0.08s cubic-bezier(0.34,1.56,0.64,1)",
                willChange: "transform",
            }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
                    style={{ filter: `drop-shadow(0 1px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${scrolling ? "#FF9F0A" : color}88)` }}>
                    <path d="M4 2L4 23L9.5 17.5L13 27L17 25.5L13.5 16L23 16L4 2Z"
                        fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M4 2L4 23L9.5 17.5L13 27L17 25.5L13.5 16L23 16L4 2Z"
                        fill={scrolling ? "#FF9F0A" : color} stroke="white" strokeWidth="0.5" strokeLinejoin="round"
                        style={{ opacity: 0.93 }} />
                </svg>

                {/* Double click ripple × 2 */}
                {clickType === "double" && (<>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 54, height: 54, borderRadius: "50%", border: `2px solid ${clickColor}`, animation: "fcRipple 0.35s ease-out forwards", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 30, height: 30, borderRadius: "50%", border: `2px solid ${clickColor}`, animation: "fcRipple 0.35s 0.1s ease-out forwards", pointerEvents: "none" }} />
                </>)}
                {clicking && clickType !== "double" && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${clickColor}`, animation: "fcRipple 0.3s ease-out forwards", pointerEvents: "none" }} />
                )}

                {/* Scroll pulse ring */}
                {scrolling && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", border: `2px solid #FF9F0A`, animation: "fcPulse 0.6s ease-in-out infinite", pointerEvents: "none" }} />
                )}

                {/* Ambient glow */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 16, height: 16, borderRadius: "50%", background: scrolling ? "#FF9F0A" : color, opacity: 0.22, filter: "blur(6px)", pointerEvents: "none" }} />

                {/* Mode badge */}
                {handControl && handControlActive && !isCalibrating && (
                    <div style={{
                        position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
                        background: scrolling ? "#FF9F0A" : color,
                        color: "white", fontSize: 10, fontWeight: 700,
                        padding: "3px 9px", borderRadius: 100, whiteSpace: "nowrap",
                        fontFamily: "-apple-system,sans-serif", boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                    }}>
                        {scrolling ? `${scrollArrow[scrolling]} SCROLL ${scrolling.toUpperCase()}` : "👁 FACE"}
                    </div>
                )}
            </div>

            {/* ── Scroll direction overlay ─────────────────────────────────────── */}
            {scrolling && (
                <div className="fixed pointer-events-none" style={{
                    top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                    zIndex: 2147483644,
                    background: "rgba(14,14,16,0.92)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 20, padding: "16px 28px",
                    fontFamily: "-apple-system,sans-serif", color: "#FF9F0A",
                    fontSize: 36, textAlign: "center", fontWeight: 700,
                    border: "1px solid rgba(255,159,10,0.3)",
                    boxShadow: "0 0 40px rgba(255,159,10,0.25)",
                    animation: "fcFadeIn 0.12s ease-out",
                }}>
                    {scrollArrow[scrolling]}
                </div>
            )}

            {/* ── HUD bar ──────────────────────────────────────────────────────── */}
            {handControl && handControlActive && !isCalibrating && (
                <div className="fixed pointer-events-none" style={{
                    bottom: 20, left: "50%", transform: "translateX(-50%)",
                    zIndex: 2147483646,
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(14,14,16,0.95)",
                    backdropFilter: "blur(28px) saturate(200%)",
                    WebkitBackdropFilter: "blur(28px) saturate(200%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 100, padding: "10px 22px",
                    fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                    fontSize: 11, color: "white", whiteSpace: "nowrap",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, boxShadow: `0 0 8px ${dotColor}`, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 12 }}>👁 Face Control</span>
                    <span style={{ opacity: 0.15 }}>│</span>
                    {[
                        { g: "😉 Left wink", a: "Click" },
                        { g: "😏 Right wink", a: "Right-click" },
                        { g: "😑 Both blink", a: "Double-click" },
                        { g: "😑 Hold + tilt head", a: "Scroll" },
                    ].map((item, i, arr) => (
                        <React.Fragment key={i}>
                            <span style={{ opacity: 0.55 }}>{item.g} <span style={{ color, fontWeight: 600 }}>→ {item.a}</span></span>
                            {i < arr.length - 1 && <span style={{ opacity: 0.15 }}>•</span>}
                        </React.Fragment>
                    ))}
                    <span style={{ opacity: 0.15 }}>│</span>
                    <button className="pointer-events-auto" onClick={recalibrate} style={{
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.65)", borderRadius: 100, padding: "4px 14px",
                        fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>↺ Recalibrate</button>
                </div>
            )}

            {/* ── Calibration overlay ───────────────────────────────────────────── */}
            {handControl && isCalibrating && (
                <div className="fixed inset-0 pointer-events-none" style={{
                    zIndex: 2147483645, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                }}>
                    <div style={{
                        background: "rgba(14,14,16,0.98)", backdropFilter: "blur(30px)",
                        WebkitBackdropFilter: "blur(30px)", borderRadius: 26, padding: "48px 60px",
                        textAlign: "center", fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                        color: "white", border: "1px solid rgba(255,255,255,0.06)",
                        minWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    }}>
                        <div style={{ fontSize: 56, marginBottom: 22 }}>👃</div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.5px" }}>
                            {status === "loading" ? "Loading model…" : "Hold still — look forward"}
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.38, marginBottom: 30, lineHeight: 1.7 }}>
                            {status === "loading" ? "Initializing MediaPipe FaceMesh…"
                                : "Sit 30–60cm from screen.\nLook straight at camera. Don't move."}
                        </div>
                        <div style={{ height: 5, width: 300, margin: "0 auto", background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${calibPct * 100}%`, background: `linear-gradient(90deg,${color}cc,${color})`, borderRadius: 3, transition: "width 0.08s linear" }} />
                        </div>
                        {/* Gesture guide */}
                        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "left" }}>
                            {[
                                { g: "😉 Wink Left", a: "Left Click" },
                                { g: "😏 Wink Right", a: "Right Click" },
                                { g: "😑 Both blink (quick)", a: "Double Click" },
                                { g: "😑 Hold + head down", a: "Scroll Down" },
                                { g: "😑 Hold + head up", a: "Scroll Up" },
                                { g: "😑 Hold + head left/right", a: "Scroll Left/Right" },
                            ].map(({ g, a }) => (
                                <div key={g} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
                                    <div style={{ fontSize: 11, opacity: 0.85 }}>{g}</div>
                                    <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 600 }}>{a}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.18, marginTop: 20, letterSpacing: "0.4px" }}>
                            NOSE TIP  •  468 LANDMARKS  •  60 FPS
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fcRipple {
          from { transform:translate(-50%,-50%) scale(0.1); opacity:1; }
          to   { transform:translate(-50%,-50%) scale(3.2); opacity:0; }
        }
        @keyframes fcPulse {
          0%,100% { transform:translate(-50%,-50%) scale(1);   opacity:0.8; }
          50%     { transform:translate(-50%,-50%) scale(1.5); opacity:0.3; }
        }
        @keyframes fcFadeIn {
          from { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>
        </>
    );
}