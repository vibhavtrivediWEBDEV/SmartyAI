"use client";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════╗
 * ║   GestureDock  ·  Native hand control  ·  MediaPipe Hands  ·  Next.js          ║
 * ╠═══════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                   ║
 * ║  DOCK SHOW / HIDE                                                                 ║
 * ║  ✋ Open palm  (all 4 fingers up, wrist y < 0.50)  → Show dock                   ║
 * ║  ✊ Fist       (0 fingers up, thumb NOT left)       → Hide dock                  ║
 * ║                                                                                   ║
 * ║  CURSOR  (only active when dock visible + hand low y > 0.47)                     ║
 * ║  Uses palm center lm[9] — stable during ALL pinch types                          ║
 * ║  ☝️  Point  (index only)  → move cursor                                           ║
 * ║  ✋ Palm low               → move cursor (broad)                                  ║
 * ║                                                                                   ║
 * ║  DOCK SCROLL                                                                      ║
 * ║  👈 Swipe: wrist Δx < -0.13 over 8 frames  → scroll left                        ║
 * ║  👉 Swipe: wrist Δx >  0.13 over 8 frames  → scroll right                       ║
 * ║                                                                                   ║
 * ║  PINCH OPERATIONS  (dock visible + app hovered OR lastHovered)                   ║
 * ║  👌 Index  + Thumb  → OPEN     → "open  [app]"                                  ║
 * ║  🤏 Middle + Thumb  → CLOSE    → "close [app]"                                  ║
 * ║  🤌 Ring   + Thumb  → MINIMIZE → "minimize [app]"                               ║
 * ║  🖐 Pinky  + Thumb  → MAXIMIZE → "maximize [app]"                               ║
 * ║  Distances are normalized to palm width with conflict/release hysteresis.         ║
 * ║                                                                                   ║
 * ║  REACTIONS  (no dock needed)                                                      ║
 * ║  👍 Thumbs up   👎 Thumbs down   ✌️ Peace   ❤️ Heart   🤙 Shaka   🤟 Rock          ║
 * ║                                                                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════════════╣
 * ║  USAGE                                                                            ║
 * ║  <GestureDock                                                                     ║
 * ║    automationAPI={automationAPI}                                                  ║
 * ║    visible={showGestureDock}                                                      ║
 * ║    onAppLaunch={(app) => console.log(app.name)}                                   ║
 * ║    accentColor="#0A84FF"                                                          ║
 * ║  />                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════╝
 */

import React, {
  useEffect, useRef, useState, useCallback,
} from "react";
import { SOUND_REACTION_EVENT, type SoundReactionDetail } from "../../lib/sound/soundReactionEvent";
import {
  AdaptiveCursorFilter,
  GestureStateMachine,
  StickyTargetSelector,
  classifyPinch,
  type GestureLandmark,
  type GesturePhase,
  type HitRect,
} from "./gestureEngine";
import { handsModeScriptUrls, releaseMediaPipeResources } from "./gestureCamera";

// ─── SSR GUARD ────────────────────────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";
const vw = () => (isBrowser ? window.innerWidth : 1440);
const vh = () => (isBrowser ? window.innerHeight : 900);
const MEDIAPIPE_HANDS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240";
const MEDIAPIPE_CAMERA_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862";

// ─── APPS ─────────────────────────────────────────────────────────────────────
export interface DockApp { id: string; name: string; iconUrl: string; color: string; glow: string; }

const DOCK_APPS: DockApp[] = [
  { id: "finder", name: "Finder", iconUrl: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png", color: "#5AC8FA", glow: "rgba(90,200,250,0.5)" },
  { id: "safari", name: "Safari", iconUrl: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png", color: "#34AADC", glow: "rgba(52,170,220,0.5)" },
  { id: "mail", name: "Mail", iconUrl: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png", color: "#0A84FF", glow: "rgba(10,132,255,0.5)" },
  { id: "messages", name: "Telegram", iconUrl: "/covers/telegram.png", color: "#3390EC", glow: "rgba(51,144,236,0.5)" },
  { id: "maps", name: "Maps", iconUrl: "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png", color: "#34C759", glow: "rgba(52,199,89,0.5)" },
  { id: "photos", name: "Photos", iconUrl: "https://framerusercontent.com/images/ogWIDEJmWxA8SVRZpEe7gk35FcM.png", color: "#FF9F0A", glow: "rgba(255,159,10,0.5)" },
  { id: "chrome", name: "Chrome", iconUrl: "https://tse2.mm.bing.net/th/id/OIP.psOZ1V2b8TrCOZ-Mp42IHAHa?pid=Api&P=0&h=180", color: "#EA4335", glow: "rgba(234,67,53,0.5)" },
  { id: "calendar", name: "Calendar", iconUrl: "https://framerusercontent.com/images/VeljykK560qBRDkQkYyhx8ChI.png", color: "#FF3B30", glow: "rgba(255,59,48,0.5)" },
  { id: "youtube", name: "YouTube", iconUrl: "https://tse4.mm.bing.net/th/id/OIP.S5AlRQcHrpCLzWUdKMWS2AHaHa?pid=Api&P=0&h=180", color: "#FF0000", glow: "rgba(255,0,0,0.45)" },
  { id: "notes", name: "Notes", iconUrl: "https://framerusercontent.com/images/Z0d1XNe7wVINUiHydSL6noKho.png", color: "#FFD60A", glow: "rgba(255,214,10,0.5)" },
  { id: "terminal", name: "Terminal", iconUrl: "https://cdn2.iconfinder.com/data/icons/web-application-icons-part-i/100/Artboard_18-512.png", color: "#32D74B", glow: "rgba(50,215,75,0.5)" },
  { id: "appstore", name: "App Store", iconUrl: "https://framerusercontent.com/images/KCaz69s4OvhKMUI25E1RBeuNIyA.png", color: "#0A84FF", glow: "rgba(10,132,255,0.5)" },
  { id: "settings", name: "Settings", iconUrl: "https://framerusercontent.com/images/VbY44vBZlQp4srNQK6ohxpco.png", color: "#98989D", glow: "rgba(152,152,157,0.4)" },
  { id: "tv", name: "TV", iconUrl: "https://framerusercontent.com/images/1pORyCnfgAxpXWyCa1l7s8IJeK0.png", color: "#0A84FF", glow: "rgba(10,132,255,0.5)" },
  { id: "vscode", name: "VSCode", iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg", color: "#007ACC", glow: "rgba(0,122,204,0.5)" },
  { id: "figma", name: "Figma", iconUrl: "https://hexadecimal.work/icons/apps/figma.png", color: "#A259FF", glow: "rgba(162,89,255,0.5)" },
  { id: "spotify", name: "Spotify", iconUrl: "https://m.media-amazon.com/images/I/51rttY7a+9L.png", color: "#1DB954", glow: "rgba(29,185,84,0.5)" },
  { id: "trash", name: "Trash", iconUrl: "https://framerusercontent.com/images/XYN0Nl9HILu4c0bzhEPmjha0Cg.png", color: "#636366", glow: "rgba(99,99,102,0.35)" },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────
type LM = GestureLandmark;

type GestureName =
  | "palm_up" | "fist" | "point"
  | "pinch_open" | "pinch_close" | "pinch_minimize" | "pinch_maximize"
  | "swipe_left" | "swipe_right"
  | "thumbs_up" | "thumbs_down" | "peace" | "heart" | "shaka" | "rock"
  | "none";

type AppOperation = "open" | "close" | "minimize" | "maximize";

// ─── MATH ─────────────────────────────────────────────────────────────────────
const d2 = (a: LM, b: LM) => Math.hypot(a.x - b.x, a.y - b.y);

// Orientation-independent extension test. Comparing radial distance from the
// wrist works when a hand is tilted, unlike a screen-y-only test.
const fUp = (lm: LM[], f: 0 | 1 | 2 | 3) => {
  const tip = [8, 12, 16, 20][f];
  const pip = [6, 10, 14, 18][f];
  return d2(lm[tip], lm[0]) > d2(lm[pip], lm[0]) * 1.12;
};
const nUp = (lm: LM[]) => ([0, 1, 2, 3] as (0 | 1 | 2 | 3)[]).filter(f => fUp(lm, f)).length;
const thumbExtended = (lm: LM[]) => d2(lm[4], lm[0]) > d2(lm[3], lm[0]) * 1.12;

// ─── GESTURE REGISTRY ────────────────────────────────────────────────────────
interface GDef { name: GestureName; pri: number; ok: (lm: LM[], h: LM[][]) => boolean; }

const GDEFS = ([
  // An open-hand lateral sweep is intentionally distinct from pointing, so
  // moving the cursor quickly cannot accidentally change the selected app.
  { name: "swipe_left", pri: 100, ok: (lm, h) => nUp(lm) >= 3 && h.length >= 8 && (lm[9].x - h[h.length - 8][9].x) < -0.13 },
  { name: "swipe_right", pri: 99, ok: (lm, h) => nUp(lm) >= 3 && h.length >= 8 && (lm[9].x - h[h.length - 8][9].x) > 0.13 },
  // ── REACTIONS ──
  { name: "thumbs_up", pri: 95, ok: (lm) => thumbExtended(lm) && nUp(lm) === 0 && lm[4].y < lm[2].y - 0.04 },
  { name: "thumbs_down", pri: 94, ok: (lm) => thumbExtended(lm) && nUp(lm) === 0 && lm[4].y > lm[2].y + 0.04 },
  { name: "peace", pri: 90, ok: (lm) => fUp(lm, 0) && fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) && d2(lm[8], lm[12]) > 0.06 },
  { name: "heart", pri: 86, ok: (lm) => fUp(lm, 0) && fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) && d2(lm[8], lm[12]) < 0.06 },
  { name: "rock", pri: 84, ok: (lm) => fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) && fUp(lm, 3) },
  { name: "shaka", pri: 80, ok: (lm) => thumbExtended(lm) && fUp(lm, 3) && !fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) },
  // ── NAVIGATION ──
  { name: "point", pri: 82, ok: (lm) => fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) },
  { name: "palm_up", pri: 72, ok: (lm) => nUp(lm) >= 4 && lm[0].y < 0.58 },
  { name: "fist", pri: 65, ok: (lm) => nUp(lm) === 0 && !thumbExtended(lm) },
] satisfies GDef[]).sort((a, b) => b.pri - a.pri);

function detectGesture(lm: GestureLandmark[], hist: GestureLandmark[][] = []): GestureName {
  // Pinch classification computes all four normalized distances once rather
  // than once per registry entry on every camera frame.
  const pinch = classifyPinch(lm);
  if (pinch !== "none") return pinch;
  for (const g of GDEFS) if (g.ok(lm, hist)) return g.name;
  return "none";
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PINCH_OP: Partial<Record<GestureName, AppOperation>> = {
  pinch_open: "open", pinch_close: "close", pinch_minimize: "minimize", pinch_maximize: "maximize",
};
const OP_COLOR: Record<AppOperation, string> = { open: "#30D158", close: "#FF453A", minimize: "#FFD60A", maximize: "#0A84FF" };
const OP_ICON: Record<AppOperation, string> = { open: "↑", close: "✕", minimize: "↓", maximize: "⤢" };
const OP_LABEL: Record<AppOperation, string> = { open: "Open", close: "Close", minimize: "Minimize", maximize: "Maximize" };

const REACTIONS: Partial<Record<GestureName, { emoji: string; label: string; color: string }>> = {
  heart: { emoji: "❤️", label: "Love", color: "#FF375F" },
  thumbs_up: { emoji: "👍", label: "Nice!", color: "#30D158" },
  thumbs_down: { emoji: "👎", label: "Nope", color: "#FF453A" },
  shaka: { emoji: "🤙", label: "Shaka!", color: "#FFD60A" },
  peace: { emoji: "✌️", label: "Peace", color: "#5AC8FA" },
  rock: { emoji: "🤟", label: "Rock!", color: "#FF9F0A" },
};

const G_LABEL: Partial<Record<GestureName, string>> = {
  palm_up: "✋ Show Dock", fist: "✊ Hide Dock", point: "☝️ Navigate",
  pinch_open: "👌 Open", pinch_close: "🤏 Close",
  pinch_minimize: "🤌 Minimize", pinch_maximize: "🖐 Maximize",
  swipe_left: "👈 Left", swipe_right: "👉 Right",
  thumbs_up: "👍 Nice", thumbs_down: "👎 Nope",
  heart: "❤️ Heart", peace: "✌️ Peace", shaka: "🤙 Shaka", rock: "🤟 Rock",
};

const REF_ROWS = [
  {
    sec: "APP OPERATIONS", rows: [
      { g: "pinch_open", icon: "👌", hand: "Index + thumb (palm-normalized)", action: "OPEN app", color: "#30D158" },
      { g: "pinch_close", icon: "🤏", hand: "Middle + thumb (palm-normalized)", action: "CLOSE app", color: "#FF453A" },
      { g: "pinch_minimize", icon: "🤌", hand: "Ring + thumb (palm-normalized)", action: "MINIMIZE app", color: "#FFD60A" },
      { g: "pinch_maximize", icon: "🖐", hand: "Pinky + thumb (palm-normalized)", action: "MAXIMIZE app", color: "#0A84FF" },
    ]
  },
  {
    sec: "DOCK CONTROL", rows: [
      { g: "palm_up", icon: "✋", hand: "All 4 fingers up, hand raised", action: "Show dock", color: "#5AC8FA" },
      { g: "fist", icon: "✊", hand: "Fist (0 fingers, thumb in)", action: "Hide dock", color: "#FF453A" },
      { g: "point", icon: "☝️", hand: "Index only extended", action: "Move cursor", color: "#0A84FF" },
      { g: "swipe_left", icon: "👈", hand: "Swipe hand rightward", action: "Scroll left", color: "#5AC8FA" },
      { g: "swipe_right", icon: "👉", hand: "Swipe hand leftward", action: "Scroll right", color: "#5AC8FA" },
    ]
  },
  {
    sec: "REACTIONS", rows: [
      { g: "thumbs_up", icon: "👍", hand: "Fist + thumb pointing up", action: "React: Nice", color: "#30D158" },
      { g: "thumbs_down", icon: "👎", hand: "Fist + thumb pointing down", action: "React: Nope", color: "#FF453A" },
      { g: "heart", icon: "❤️", hand: "Index+Middle up, tips close", action: "React: Love", color: "#FF375F" },
      { g: "peace", icon: "✌️", hand: "Index+Middle up, tips apart", action: "React: Peace", color: "#5AC8FA" },
      { g: "shaka", icon: "🤙", hand: "Thumb + Pinky only", action: "React: Shaka", color: "#FFD60A" },
      { g: "rock", icon: "🤟", hand: "Index + Pinky only", action: "React: Rock", color: "#FF9F0A" },
    ]
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (!isBrowser) return rej("SSR");
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
}
interface Particle { id: string; emoji: string; label: string; color: string; x: number; y: number; }

function ReactionParticles({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none" style={{ left: p.x, top: p.y, zIndex: 2147483624, textAlign: "center", animation: "gdReact 2.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div style={{ fontSize: 86, lineHeight: 1, filter: `drop-shadow(0 10px 50px ${p.color}88)`, animation: "gdReactW 0.6s ease-out" }}>{p.emoji}</div>
          <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: "3.5px", textTransform: "uppercase", color: "white", fontFamily: "'SF Pro Text',monospace", textShadow: `0 0 24px ${p.color}` }}>{p.label}</div>
        </div>
      ))}
      <style>{`
        @keyframes gdReact  { 0%{opacity:0;transform:translateY(50px) scale(.2) rotate(-12deg)}  12%{opacity:1;transform:translateY(-20px) scale(1.22) rotate(5deg)} 55%{opacity:1;transform:translateY(-100px) scale(1) rotate(0deg)} 100%{opacity:0;transform:translateY(-200px) scale(.8) rotate(6deg)} }
        @keyframes gdReactW { 0%{transform:scale(.35) rotate(-16deg)}                            55%{transform:scale(1.18) rotate(7deg)} 100%{transform:scale(1) rotate(0deg)} }
      `}</style>
    </>
  );
}

export interface AutomationAPI { executeTextCommand: (t: string) => Promise<boolean>; }
export interface GestureDockProps {
  visible?: boolean; onAppLaunch?: (a: DockApp) => void;
  accentColor?: string; automationAPI?: AutomationAPI;
  onAppOperation?: (app: DockApp, operation: AppOperation) => void | Promise<void>;
}

function AppIcon({ app, size = 60 }: { app: DockApp; size?: number }) {
  const [err, setErr] = useState(false);
  return err
    ? <div style={{ width: size * 0.72, height: size * 0.72, borderRadius: size * 0.15, background: `linear-gradient(135deg,${app.color}40,${app.color}18)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, color: app.color, fontWeight: 700 }}>{app.name[0]}</div>
    : <img src={app.iconUrl} alt={app.name} onError={() => setErr(true)} style={{ width: size * 0.72, height: size * 0.72, objectFit: "contain", borderRadius: size * 0.15, pointerEvents: "none", userSelect: "none" }} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function GestureDock({ visible = true, onAppLaunch, accentColor = "#0A84FF", automationAPI, onAppOperation }: GestureDockProps) {

  // ── State ───────────────────────────────────────────────────────────────────
  const [dockVisible, setDockVisible] = useState(false);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [opApp, setOpApp] = useState<{ app: DockApp; op: AppOperation } | null>(null);
  const [gesture, setGesture] = useState<GestureName>("none");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "active" | "error">("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePinch, setActivePinch] = useState<GestureName>("none");
  const [pendingOp, setPendingOp] = useState<AppOperation | null>(null);
  const [controlPhase, setControlPhase] = useState<GesturePhase>("IDLE");
  const [ringActive, setRingActive] = useState(false);
  const [ringColor, setRingColor] = useState(accentColor);
  const [handVis, setHandVis] = useState(false);

  // ── Refs (zero re-render latency) ──────────────────────────────────────────
  const handsRef = useRef<any>(null);
  const camRef = useRef<any>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const cursorElementRef = useRef<HTMLDivElement | null>(null);
  const histRef = useRef<LM[][]>([]);
  const lastGRef = useRef<GestureName>("none");
  const gestureCandidateRef = useRef<{ gesture: GestureName; since: number }>({ gesture: "none", since: 0 });
  const phaseRef = useRef<GesturePhase>("IDLE");
  const pendingOpRef = useRef<AppOperation | null>(null);
  const coolRef = useRef(0);
  const pIdRef = useRef(0);
  const dockVRef = useRef(false);
  const hovRef = useRef<number | null>(null);
  const lastHovRef = useRef<number | null>(null); // survives cursor disappearing during pinch
  const visRef = useRef(visible);
  const winRef = useRef({ w: vw(), h: vh() });
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const handVisRef = useRef(false);
  const processingRef = useRef(false);
  const cursorFilterRef = useRef(new AdaptiveCursorFilter());
  const targetSelectorRef = useRef(new StickyTargetSelector(16));
  const machineRef = useRef(new GestureStateMachine(180, 110, 180));
  const dockRectRef = useRef<DOMRect | null>(null);
  const iconRectsRef = useRef<HitRect[]>([]);
  const iconIndicesRef = useRef<number[]>([]);
  const cursorFrameRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);
  const operationRef = useRef(onAppOperation);
  const launchRef = useRef(onAppLaunch);
  const dockShownAtRef = useRef(0);

  useEffect(() => { dockVRef.current = dockVisible; }, [dockVisible]);
  useEffect(() => { visRef.current = visible; }, [visible]);
  useEffect(() => { operationRef.current = onAppOperation; }, [onAppOperation]);
  useEffect(() => { launchRef.current = onAppLaunch; }, [onAppLaunch]);
  useEffect(() => {
    localStorage.setItem("smarty-gesture-tracking-mode", "hands");
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("smarty:dock-visibility", { detail: { visible: dockVisible } }));
    const frame = requestAnimationFrame(refreshDockGeometry);
    return () => cancelAnimationFrame(frame);
  }, [dockVisible]);

  useEffect(() => {
    const dock = document.querySelector<HTMLElement>("[data-smarty-dock='desktop']");
    if (!dock) return;
    refreshDockGeometry();
    const observer = new ResizeObserver(refreshDockGeometry);
    observer.observe(dock);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!isBrowser) return;
    const fn = () => {
      winRef.current = { w: window.innerWidth, h: window.innerHeight };
      refreshDockGeometry();
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function refreshDockGeometry() {
    const dock = document.querySelector<HTMLElement>("[data-smarty-dock='desktop']");
    dockRectRef.current = dock?.getBoundingClientRect() ?? null;
    const items = dock ? Array.from(dock.querySelectorAll<HTMLElement>("[data-smarty-app]")) : [];
    iconRectsRef.current = items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    iconIndicesRef.current = items.map((item) => (
      DOCK_APPS.findIndex(app => app.name.toLowerCase() === item.dataset.smartyApp?.toLowerCase())
    ));
  }

  const flashRing = useCallback((color: string, ms = 600) => {
    setRingColor(color); setRingActive(true);
    setTimeout(() => setRingActive(false), ms);
  }, []);

  const updateHoverTarget = useCallback((index: number | null) => {
    if (hovRef.current === index) return;
    hovRef.current = index;
    if (index !== null) lastHovRef.current = index;
    setHovIdx(index);
    window.dispatchEvent(new CustomEvent("smarty:dock-hover", {
      detail: { appName: index === null ? null : DOCK_APPS[index].name },
    }));
  }, []);

  const updateCursor = useCallback((next: { x: number; y: number } | null, timestamp = performance.now()) => {
    if (!next) {
      cursorRef.current = null;
      pendingCursorRef.current = null;
      cursorFilterRef.current.reset();
      targetSelectorRef.current.reset();
      if (cursorElementRef.current) cursorElementRef.current.style.opacity = "0";
      updateHoverTarget(null);
      return;
    }
    pendingCursorRef.current = next;
    if (cursorFrameRef.current !== null) return;
    cursorFrameRef.current = requestAnimationFrame(() => {
      cursorFrameRef.current = null;
      const pending = pendingCursorRef.current;
      const dockRect = dockRectRef.current;
      if (!pending || !dockRect) return;
      const normalized = cursorFilterRef.current.filter(pending, timestamp);
      const isVertical = dockRect.height > dockRect.width;
      const screenPoint = isVertical
        ? { x: dockRect.left + dockRect.width * 0.5, y: dockRect.top + normalized.y * dockRect.height }
        : { x: dockRect.left + normalized.x * dockRect.width, y: dockRect.top + dockRect.height * 0.5 };
      cursorRef.current = screenPoint;
      const element = cursorElementRef.current;
      if (element) {
        element.style.opacity = "1";
        element.style.transform = `translate3d(${screenPoint.x}px,${screenPoint.y}px,0) translate(-50%,-50%)`;
      }
      const localIndex = targetSelectorRef.current.update(screenPoint, iconRectsRef.current);
      const appIndex = localIndex === null ? null : iconIndicesRef.current[localIndex];
      updateHoverTarget(typeof appIndex === "number" && appIndex >= 0 ? appIndex : null);
    });
  }, [updateHoverTarget]);

  const spawnParticle = useCallback((reaction: { emoji: string; label: string; color: string }) => {
    const id = String(++pIdRef.current);
    const x = 80 + Math.random() * (winRef.current.w - 220);
    const y = winRef.current.h * 0.12 + Math.random() * (winRef.current.h * 0.35);
    setParticles(p => [...p, { id, ...reaction, x, y }]);
    setTimeout(() => setParticles(p => p.filter(q => q.id !== id)), 2600);
    flashRing(reaction.color, 800);
  }, [flashRing]);

  const spawnReaction = useCallback((g: GestureName) => {
    const reaction = REACTIONS[g];
    if (reaction) spawnParticle(reaction);
  }, [spawnParticle]);

  useEffect(() => {
    const handleSoundReaction = (event: Event) => {
      spawnParticle((event as CustomEvent<SoundReactionDetail>).detail);
    };
    window.addEventListener(SOUND_REACTION_EVENT, handleSoundReaction);
    return () => window.removeEventListener(SOUND_REACTION_EVENT, handleSoundReaction);
  }, [spawnParticle]);

  const triggerOp = useCallback((idx: number, op: AppOperation) => {
    const app = DOCK_APPS[idx]; if (!app) return;
    setOpApp({ app, op });
    flashRing(OP_COLOR[op], 650);
    // Use exactly one execution path. Calling both callbacks and text
    // automation was the source of duplicate app windows.
    if (operationRef.current) void operationRef.current(app, op);
    else if (op === "open" && launchRef.current) launchRef.current(app);
    setTimeout(() => setOpApp(null), 700);
  }, [flashRing]);

  const shiftTarget = useCallback((dir: "left" | "right") => {
    const visibleIndices = Array.from(document.querySelectorAll<HTMLElement>("[data-smarty-dock='desktop'] [data-smarty-app]"))
      .map((item) => DOCK_APPS.findIndex((app) => app.name.toLowerCase() === item.dataset.smartyApp?.toLowerCase()))
      .filter((index) => index >= 0);
    if (!visibleIndices.length) return;
    const current = lastHovRef.current;
    const currentPosition = current === null ? -1 : visibleIndices.indexOf(current);
    const nextPosition = Math.max(0, Math.min(visibleIndices.length - 1, currentPosition + (dir === "right" ? 1 : -1)));
    const next = visibleIndices[nextPosition];
    updateHoverTarget(next);
  }, [updateHoverTarget]);

  // ─────────────────────────────────────────────────────────────────────────
  // HAND PROCESSOR
  // ─────────────────────────────────────────────────────────────────────────
  const processHand = useCallback((lm: LM[]) => {
    if (!visRef.current) return;
    const now = performance.now();

    histRef.current.push(lm);
    if (histRef.current.length > 32) histRef.current.shift();

    const rawGesture = detectGesture(lm, histRef.current);
    if (dockVRef.current && dockRectRef.current && (rawGesture === "point" || rawGesture in PINCH_OP)) {
      updateCursor({
        x: Math.max(0, Math.min(1, (1 - lm[9].x - 0.08) / 0.84)),
        y: Math.max(0, Math.min(1, (lm[9].y - 0.12) / 0.76)),
      }, now);
    } else {
      updateCursor(null);
    }

    const dockIsSettled = Date.now() - dockShownAtRef.current >= 300;
    const machine = machineRef.current.update(now, true, dockIsSettled ? hovRef.current : null, lm);
    if (machine.phase !== phaseRef.current) {
      phaseRef.current = machine.phase;
      setControlPhase(machine.phase);
    }
    if (machine.operation !== pendingOpRef.current) {
      pendingOpRef.current = machine.operation;
      setPendingOp(machine.operation);
      setActivePinch(machine.operation ? rawGesture : "none");
    }
    if (machine.lockedTarget !== null && machine.lockedTarget !== hovRef.current) {
      updateHoverTarget(machine.lockedTarget);
    }
    if (machine.commit) triggerOp(machine.commit.target, machine.commit.operation);

    if (gestureCandidateRef.current.gesture !== rawGesture) {
      gestureCandidateRef.current = { gesture: rawGesture, since: now };
      return;
    }
    const stabilityMs = rawGesture === "palm_up" || rawGesture === "fist" ? 150
      : rawGesture.startsWith("swipe_") ? 70 : 100;
    if (now - gestureCandidateRef.current.since < stabilityMs || rawGesture === lastGRef.current) return;
    const g = rawGesture;
    lastGRef.current = g;
    setGesture(g);

    switch (g) {
      case "palm_up":
        if (!dockVRef.current) dockShownAtRef.current = Date.now();
        setDockVisible(true); flashRing(accentColor, 500);
        coolRef.current = now + 450; break;

      case "fist":
        setDockVisible(false); updateCursor(null);
        coolRef.current = now + 450; break;

      case "swipe_left":
        if (dockVRef.current) shiftTarget("left");
        coolRef.current = now + 480; break;

      case "swipe_right":
        if (dockVRef.current) shiftTarget("right");
        coolRef.current = now + 480; break;

      default:
        if (REACTIONS[g]) { spawnReaction(g); coolRef.current = now + 1100; }
    }
  }, [accentColor, shiftTarget, triggerOp, spawnReaction, flashRing, updateCursor, updateHoverTarget]);

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIAPIPE INIT — Hands only. FaceMesh is deliberately absent.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBrowser || !visible) return;
    let dead = false;

    const stopTracking = () => {
      releaseMediaPipeResources(camRef.current, handsRef.current, vidRef.current);
      camRef.current = null;
      handsRef.current = null;
      processingRef.current = false;
      vidRef.current = null;
      handVisRef.current = false;
      machineRef.current.reset();
      cursorFilterRef.current.reset();
      targetSelectorRef.current.reset();
      if (cursorFrameRef.current !== null) cancelAnimationFrame(cursorFrameRef.current);
      cursorFrameRef.current = null;
      pendingCursorRef.current = null;
    };

    const init = async () => {
      try {
        setStatus("loading");
        for (const script of handsModeScriptUrls(MEDIAPIPE_HANDS_URL, MEDIAPIPE_CAMERA_URL)) {
          await loadScript(script);
        }
        if (dead) return;

        const vid = document.createElement("video");
        vid.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;z-index:-9999;";
        vid.autoplay = true; vid.playsInline = true; vid.muted = true;
        document.body.appendChild(vid);
        vidRef.current = vid;

        // Hands
        const hands = new (window as any).Hands({
          locateFile: (f: string) => `${MEDIAPIPE_HANDS_URL}/${f}`,
        });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.65, minTrackingConfidence: 0.65 });
        hands.onResults((r: any) => {
          if (dead) return;
          if (r.multiHandLandmarks?.length) {
            if (!handVisRef.current) {
              handVisRef.current = true;
              setHandVis(true);
            }
            processHand(r.multiHandLandmarks[0]);
          } else {
            if (handVisRef.current) {
              handVisRef.current = false;
              setHandVis(false);
              setGesture("none");
              setActivePinch("none");
              setPendingOp(null);
              setControlPhase("IDLE");
            }
            machineRef.current.reset();
            phaseRef.current = "IDLE";
            pendingOpRef.current = null;
            updateCursor(null);
          }
        });
        handsRef.current = hands;

        // Never queue stale frames: a camera callback is dropped while the
        // previous Hands inference is still running.
        const cam = new (window as any).Camera(vid, {
          onFrame: async () => {
            if (dead || processingRef.current) return;
            processingRef.current = true;
            try {
              await handsRef.current?.send({ image: vid });
            } catch (error) {
              console.error("[GestureDock inference]", error);
              dead = true;
              stopTracking();
              setStatus("error");
            } finally {
              processingRef.current = false;
            }
          },
          width: 480, height: 360, fps: 30,
        });
        // Store the camera before start resolves. If gesture mode is closed
        // during the permission prompt/startup, cleanup can still stop it.
        camRef.current = cam;
        await cam.start();
        if (dead) {
          stopTracking();
          return;
        }
        if (!dead) setStatus("active");

      } catch (e) {
        console.error("[GestureDock init]", e);
        stopTracking();
        if (!dead) setStatus("error");
      }
    };

    init();
    return () => {
      dead = true;
      stopTracking();
      window.dispatchEvent(new CustomEvent("smarty:dock-hover", { detail: { appName: null } }));
    };
  }, [visible, processHand, updateCursor]);

  if (!visible) return <ReactionParticles particles={particles} />;

  const hovApp = hovIdx !== null ? DOCK_APPS[hovIdx] : null;
  const cursorColor = hovApp?.color ?? accentColor;
  const isPinching = activePinch !== "none";
  const pColor = pendingOp ? OP_COLOR[pendingOp] : cursorColor;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── JARVIS RING ───────────────────────────────────────────────────── */}
      <div className="fixed pointer-events-none" style={{
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 2147483630,
        opacity: ringActive ? 1 : 0,
        transition: "opacity 0.32s ease",
      }}>
        <div style={{ width: 240, height: 240, borderRadius: "50%", border: `1px solid ${ringColor}44`, position: "relative", animation: "gdRot 2.4s linear infinite", boxShadow: `0 0 60px ${ringColor}18,inset 0 0 60px ${ringColor}08` }}>
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: i % 8 === 0 ? 2 : 1, height: i % 8 === 0 ? 18 : i % 4 === 0 ? 11 : 5, background: i % 8 === 0 ? ringColor : i % 4 === 0 ? `${ringColor}88` : `${ringColor}44`, transformOrigin: "0 -119px", transform: `translate(-50%,-119px) rotate(${i * 11.25}deg)`, borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 178, height: 178, borderRadius: "50%", border: `1.5px solid ${ringColor}66`, boxShadow: `0 0 50px ${ringColor}44,inset 0 0 50px ${ringColor}11`, animation: "gdPulse 1.1s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 110, height: 110, borderRadius: "50%", border: `1px solid ${ringColor}44`, borderTopColor: ringColor, animation: "gdCCW 1.6s linear infinite" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: ringColor, boxShadow: `0 0 24px ${ringColor},0 0 50px ${ringColor}88,0 0 100px ${ringColor}44`, animation: "gdDotP 0.8s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 240, height: 1, background: `linear-gradient(90deg,transparent,${ringColor}44 25%,${ringColor}cc 50%,${ringColor}44 75%,transparent)` }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 1, height: 240, background: `linear-gradient(180deg,transparent,${ringColor}44 25%,${ringColor}cc 50%,${ringColor}44 75%,transparent)` }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(45deg)", width: 170, height: 1, background: `linear-gradient(90deg,transparent,${ringColor}22 40%,${ringColor}55 50%,${ringColor}22 60%,transparent)` }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-45deg)", width: 170, height: 1, background: `linear-gradient(90deg,transparent,${ringColor}22 40%,${ringColor}55 50%,${ringColor}22 60%,transparent)` }} />
        </div>
        {gesture !== "none" && G_LABEL[gesture] && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,90px)", whiteSpace: "nowrap", fontSize: 10, fontWeight: 800, letterSpacing: "3.5px", textTransform: "uppercase", color: `${ringColor}dd`, fontFamily: "'SF Pro Text',monospace,sans-serif", textShadow: `0 0 20px ${ringColor},0 0 40px ${ringColor}66` }}>
            {G_LABEL[gesture]}
          </div>
        )}
      </div>

      {/* ── DOCK CURSOR ──────────────────────────────────────────────────── */}
      {dockVisible && (
        <div ref={cursorElementRef} className="fixed pointer-events-none" style={{ left: 0, top: 0, zIndex: 2147483628, opacity: 0, transform: "translate3d(0,0,0) translate(-50%,-50%)", willChange: "transform", transition: "opacity 100ms ease" }}>
          {pendingOp && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 70, height: 70, borderRadius: "50%", border: `1.5px solid ${pColor}55`, boxShadow: `0 0 24px ${pColor}33`, animation: "gdOpH 0.9s ease-in-out infinite alternate" }} />}
          <div style={{
            width: isPinching ? 18 : 46, height: isPinching ? 18 : 46,
            borderRadius: "50%",
            border: `2px solid ${isPinching ? pColor : cursorColor}`,
            boxShadow: `0 0 0 3px ${isPinching ? pColor : cursorColor}18,0 0 28px ${isPinching ? pColor : cursorColor}88`,
            transition: "width 0.11s cubic-bezier(0.34,1.56,0.64,1),height 0.11s cubic-bezier(0.34,1.56,0.64,1),border-color 0.13s",
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          }}>
            <div style={{ width: isPinching ? 12 : 6, height: isPinching ? 12 : 6, borderRadius: "50%", background: isPinching ? pColor : cursorColor, boxShadow: `0 0 14px ${isPinching ? pColor : cursorColor}`, transition: "width 0.11s,height 0.11s,background 0.13s" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${cursorColor}55`, borderTopColor: cursorColor, animation: "gdSpin 1.2s linear infinite" }} />
          </div>
          {isPinching && <>
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `2px solid ${pColor}`, animation: "gdBurst 0.5s ease-out forwards" }} />
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `1px solid ${pColor}88`, animation: "gdBurst 0.5s 0.14s ease-out forwards" }} />
          </>}
          {pendingOp && hovApp && controlPhase === "GESTURE_ARMED" && (
            <div style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", background: `${OP_COLOR[pendingOp]}22`, border: `1px solid ${OP_COLOR[pendingOp]}66`, borderRadius: 100, padding: "3px 10px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", color: OP_COLOR[pendingOp], whiteSpace: "nowrap", fontFamily: "'SF Pro Text',monospace", textTransform: "uppercase" }}>
              {OP_ICON[pendingOp]} {OP_LABEL[pendingOp]}
            </div>
          )}
        </div>
      )}

      {/* ── OPERATION OVERLAY ─────────────────────────────────────────────── */}
      {opApp && (
        <div className="fixed pointer-events-none" style={{ zIndex: 2147483626, top: 72, left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(28,28,30,.88)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 16, padding: "9px 14px", boxShadow: "0 12px 36px rgba(0,0,0,.35)", animation: "gdCommit 650ms ease forwards" }}>
            <AppIcon app={opApp.app} size={36} />
            <div style={{ font: "600 12px 'SF Pro Text',-apple-system,sans-serif", color: "rgba(255,255,255,.92)" }}>
              {OP_LABEL[opApp.op]} · {opApp.app.name}
            </div>
          </div>
        </div>
      )}

      {/* ── REACTION PARTICLES ────────────────────────────────────────────── */}
      <ReactionParticles particles={particles} />

      {/* ── GESTURE BADGE top-right ───────────────────────────────────────── */}
      {status === "active" && gesture !== "none" && G_LABEL[gesture] && (
        <div className="fixed pointer-events-none" style={{ top: 22, right: 22, zIndex: 2147483623, background: "rgba(6,6,10,0.94)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "10px 22px", fontSize: 11, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.82)", fontFamily: "'SF Pro Text',-apple-system,sans-serif", boxShadow: "0 4px 32px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)", animation: "gdSlide 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}>
          {G_LABEL[gesture]}
        </div>
      )}

      {/* ── STATUS BAR top-left  (mode + tracking indicators) ────────────── */}
      {status === "active" && (
        <div className="fixed" style={{ top: 22, left: 22, zIndex: 2147483620, display: "flex", alignItems: "center", gap: 8, background: "rgba(6,6,10,0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 100, padding: "6px 8px 6px 12px" }}>
          {/* Hand dot */}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: handVis ? "#30D158" : "rgba(255,255,255,0.18)", boxShadow: handVis ? "0 0 10px #30D158,0 0 20px #30D15888" : "none", transition: "background 0.18s,box-shadow 0.18s" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: handVis ? "rgba(48,209,88,0.9)" : "rgba(255,255,255,0.25)", fontFamily: "monospace", transition: "color 0.18s" }}>{handVis ? "Hand" : "–"}</span>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.10)" }} />
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".7px", color: controlPhase === "TARGET_LOCKED" ? "#5AC8FA" : "rgba(255,255,255,.45)" }}>{controlPhase.replace("_", " ")}</span>
        </div>
      )}

      {/* ── GESTURE REFERENCE SHEET bottom-left ──────────────────────────── */}
      {status === "active" && (
        <div className="fixed" style={{ bottom: 26, left: 26, zIndex: 2147483622 }}>
          <button onClick={() => setSheetOpen(o => !o)} style={{ background: "rgba(12,12,18,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: sheetOpen ? "16px 16px 0 0" : 100, padding: "9px 18px", fontSize: 10, fontWeight: 800, letterSpacing: "2px", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: "'SF Pro Text',-apple-system,sans-serif", display: "flex", alignItems: "center", gap: 8, transition: "border-radius 0.16s" }}>
            <span style={{ fontSize: 15 }}>👋</span> GESTURES
          </button>
          {sheetOpen && (
            <div style={{ background: "rgba(6,6,10,0.98)", backdropFilter: "blur(60px)", WebkitBackdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", borderRadius: "0 16px 16px 16px", padding: "10px 12px 14px", minWidth: 288, boxShadow: "0 24px 80px rgba(0,0,0,0.75)", maxHeight: "72vh", overflowY: "auto" }}>
              {REF_ROWS.map(sec => (
                <div key={sec.sec}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "2.5px", color: "rgba(255,255,255,0.22)", padding: "8px 8px 6px", textTransform: "uppercase", fontFamily: "monospace" }}>{sec.sec}</div>
                  {sec.rows.map(row => {
                    const active = gesture === row.g;
                    return (
                      <div key={row.g} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", borderRadius: 11, marginBottom: 2, background: active ? `${row.color}1a` : "transparent", transition: "background 0.10s" }}>
                        <span style={{ fontSize: 17, minWidth: 24 }}>{row.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: active ? row.color : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 400, fontFamily: "'SF Pro Text',sans-serif" }}>{row.action}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>{row.hand}</div>
                        </div>
                        {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: row.color, boxShadow: `0 0 8px ${row.color}` }} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STATUS PILLS ─────────────────────────────────────────────────── */}
      {status === "loading" && (
        <div className="fixed pointer-events-none" style={{ bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 2147483645, background: "rgba(8,8,12,0.98)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 100, padding: "13px 30px", fontFamily: "'SF Pro Text',-apple-system,sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 12px 48px rgba(0,0,0,0.65)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, boxShadow: `0 0 14px ${accentColor}`, animation: "gdDB 0.9s ease-in-out infinite alternate" }} />
          Initialising Hand Tracking
        </div>
      )}
      {status === "error" && (
        <div className="fixed pointer-events-none" style={{ bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 2147483645, background: "rgba(255,59,48,0.12)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,59,48,0.28)", borderRadius: 100, padding: "13px 30px", fontFamily: "'SF Pro Text',-apple-system,sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: "#FF453A" }}>
          ⚠️  Camera permission required
        </div>
      )}

      {/* ── KEYFRAMES ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes gdRot    { from{transform:rotate(0deg)}                                       to{transform:rotate(360deg)} }
        @keyframes gdCCW    { from{transform:translate(-50%,-50%) rotate(0deg)}                  to{transform:translate(-50%,-50%) rotate(-360deg)} }
        @keyframes gdPulse  { from{opacity:.28;transform:translate(-50%,-50%) scale(.95)}        to{opacity:.88;transform:translate(-50%,-50%) scale(1.05)} }
        @keyframes gdDotP   { from{transform:translate(-50%,-50%) scale(.75);opacity:.6}         to{transform:translate(-50%,-50%) scale(1.3);opacity:1} }
        @keyframes gdSpin   { from{transform:rotate(0deg)}                                       to{transform:rotate(360deg)} }
        @keyframes gdBurst  { from{transform:translate(-50%,-50%) scale(.5);opacity:1}           to{transform:translate(-50%,-50%) scale(3.2);opacity:0} }
        @keyframes gdArr    { 0%,100%{opacity:.18;transform:translateY(-50%) scale(1)}           50%{opacity:.6;transform:translateY(-50%) scale(1.3)} }
        @keyframes gdCard   { 0%{opacity:0;transform:scale(.75) translateY(30px)}                10%{opacity:1;transform:scale(1.03) translateY(-2px)} 72%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.92) translateY(-14px)} }
        @keyframes gdIconB  { 0%{transform:scale(.38);opacity:0}                                 62%{transform:scale(1.16);opacity:1} 100%{transform:scale(1)} }
        @keyframes gdDB     { from{transform:translateY(0);opacity:.4}                           to{transform:translateY(-9px);opacity:1} }
        @keyframes gdFadeIn { from{opacity:0}                                                    to{opacity:1} }
        @keyframes gdSlide  { from{opacity:0;transform:translateY(-12px) scale(.86)}             to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gdOpH    { from{opacity:.28;transform:translate(-50%,-50%) scale(.9)}         to{opacity:.7;transform:translate(-50%,-50%) scale(1.07)} }
        @keyframes gdCommit { 0%{opacity:0;transform:translateY(-8px) scale(.96)} 20%,75%{opacity:1;transform:none} 100%{opacity:0;transform:translateY(-4px)} }
        @media (prefers-reduced-motion: reduce) { [class*="fixed"] { animation-duration: 1ms !important; transition-duration: 1ms !important; } }
      `}</style>
    </>
  );
}

export default GestureDock;