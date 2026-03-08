"use client";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════╗
 * ║   GestureDock  ·  Vision Pro × Jarvis  ·  MediaPipe Hands + Face  ·  Next.js   ║
 * ╠═══════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                   ║
 * ║  EYE BLINK CONTROLS  (MediaPipe FaceMesh — works always, no hand needed)         ║
 * ║  😉 Left  eye blink  → LEFT CLICK  → open  hovered app                           ║
 * ║  😉 Right eye blink  → RIGHT CLICK → close hovered app                           ║
 * ║  Blink detection: EAR < 0.22 for 2-12 frames = intentional blink                 ║
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
 * ║  👌 Index  + Thumb  dist < 0.07  → OPEN     → "open  [app]"                     ║
 * ║  🤏 Middle + Thumb  dist < 0.07  → CLOSE    → "close [app]"                     ║
 * ║  🤌 Ring   + Thumb  dist < 0.08  → MINIMIZE → "minimize [app]"                  ║
 * ║  🖐 Pinky  + Thumb  dist < 0.08  → MAXIMIZE → "maximize [app]"                  ║
 * ║  Conflict guard: other pairs must be > 0.09 apart                                ║
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
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";

// ─── SSR GUARD ────────────────────────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";
const vw = () => (isBrowser ? window.innerWidth : 1440);
const vh = () => (isBrowser ? window.innerHeight : 900);

// ─── APPS ─────────────────────────────────────────────────────────────────────
export interface DockApp { id: string; name: string; iconUrl: string; color: string; glow: string; }

const DOCK_APPS: DockApp[] = [
  { id: "finder", name: "Finder", iconUrl: "https://framerusercontent.com/images/wtQkw1jK0MlEDOrW0Q1kE5PBqc.png", color: "#5AC8FA", glow: "rgba(90,200,250,0.5)" },
  { id: "safari", name: "Safari", iconUrl: "https://framerusercontent.com/images/qQISGOSSnz748TdrZn91l44R5u0.png", color: "#34AADC", glow: "rgba(52,170,220,0.5)" },
  { id: "mail", name: "Mail", iconUrl: "https://framerusercontent.com/images/fm90fwzWoBMCvK5C0MOyKdo94.png", color: "#0A84FF", glow: "rgba(10,132,255,0.5)" },
  { id: "messages", name: "Messages", iconUrl: "https://framerusercontent.com/images/CwKoPLck9kD8CifRkrpug3socM.png", color: "#30D158", glow: "rgba(48,209,88,0.5)" },
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
interface LM { x: number; y: number; z: number; }

type GestureName =
  | "palm_up" | "fist" | "point"
  | "pinch_open" | "pinch_close" | "pinch_minimize" | "pinch_maximize"
  | "swipe_left" | "swipe_right"
  | "thumbs_up" | "thumbs_down" | "peace" | "heart" | "shaka" | "rock"
  | "none";

type AppOperation = "open" | "close" | "minimize" | "maximize";

// ─── MATH ─────────────────────────────────────────────────────────────────────
const d2 = (a: LM, b: LM) => Math.hypot(a.x - b.x, a.y - b.y);

// fingertip clearly above MCP knuckle = extended
const ext = (lm: LM[], tip: number, mcp: number) => lm[tip].y < lm[mcp].y - 0.015;
const fUp = (lm: LM[], f: 0 | 1 | 2 | 3) => ext(lm, [8, 12, 16, 20][f], [5, 9, 13, 17][f]);
const nUp = (lm: LM[]) => ([0, 1, 2, 3] as (0 | 1 | 2 | 3)[]).filter(f => fUp(lm, f)).length;
const thumbL = (lm: LM[]) => lm[4].x < lm[3].x;

// ─── EYE ASPECT RATIO (blink detection) ──────────────────────────────────────
// EAR = vertical_dist / horizontal_dist. Closed eye → EAR < threshold.
const earFor = (lm: any[], u: number, lo: number, ci: number, co: number) => {
  const v = d2(lm[u], lm[lo]);
  const h = d2(lm[ci], lm[co]);
  return h > 0 ? v / h : 1;
};
// Left eye:  upper=159, lower=145, inner=33, outer=133
// Right eye: upper=386, lower=374, inner=362, outer=263
const EAR_CLOSED = 0.21;   // below this = eye shut
const BLINK_MIN = 2;       // min frames closed = real blink
const BLINK_MAX = 14;      // max frames closed (beyond = wink/hold, ignore)
const BLINK_COOLMS = 380;    // ms between blink fires

// ─── GESTURE REGISTRY ────────────────────────────────────────────────────────
interface GDef { name: GestureName; pri: number; ok: (lm: LM[], h: LM[][]) => boolean; }

const GDEFS: GDef[] = [
  // ── PINCHES: only distance of the relevant pair + other pairs NOT also close ──
  { name: "pinch_open", pri: 110, ok: (lm) => d2(lm[4], lm[8]) < 0.07 && d2(lm[4], lm[12]) > 0.09 },
  { name: "pinch_close", pri: 109, ok: (lm) => d2(lm[4], lm[12]) < 0.07 && d2(lm[4], lm[8]) > 0.09 && d2(lm[4], lm[16]) > 0.09 },
  { name: "pinch_minimize", pri: 108, ok: (lm) => d2(lm[4], lm[16]) < 0.08 && d2(lm[4], lm[8]) > 0.09 && d2(lm[4], lm[12]) > 0.09 && d2(lm[4], lm[20]) > 0.09 },
  { name: "pinch_maximize", pri: 107, ok: (lm) => d2(lm[4], lm[20]) < 0.08 && d2(lm[4], lm[8]) > 0.09 && d2(lm[4], lm[12]) > 0.09 && d2(lm[4], lm[16]) > 0.09 },
  // ── REACTIONS ──
  { name: "thumbs_up", pri: 95, ok: (lm) => thumbL(lm) && nUp(lm) === 0 && lm[4].y < lm[9].y },
  { name: "thumbs_down", pri: 94, ok: (lm) => thumbL(lm) && nUp(lm) === 0 && lm[4].y > lm[9].y },
  { name: "peace", pri: 90, ok: (lm) => fUp(lm, 0) && fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) && d2(lm[8], lm[12]) > 0.06 },
  { name: "heart", pri: 86, ok: (lm) => fUp(lm, 0) && fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) && d2(lm[8], lm[12]) < 0.06 },
  { name: "rock", pri: 84, ok: (lm) => fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) && fUp(lm, 3) },
  { name: "shaka", pri: 80, ok: (lm) => thumbL(lm) && fUp(lm, 3) && !fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) },
  // ── NAVIGATION ──
  { name: "point", pri: 82, ok: (lm) => fUp(lm, 0) && !fUp(lm, 1) && !fUp(lm, 2) && !fUp(lm, 3) },
  { name: "palm_up", pri: 72, ok: (lm) => nUp(lm) >= 4 && lm[0].y < 0.50 },
  { name: "fist", pri: 65, ok: (lm) => nUp(lm) === 0 && !thumbL(lm) },
  { name: "swipe_left", pri: 55, ok: (lm, h) => h.length >= 8 && (lm[9].x - h[h.length - 8][9].x) < -0.13 },
  { name: "swipe_right", pri: 55, ok: (lm, h) => h.length >= 8 && (lm[9].x - h[h.length - 8][9].x) > 0.13 },
].sort((a, b) => b.pri - a.pri);

function detect(lm: LM[], hist: LM[][]): GestureName {
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
    sec: "EYE CONTROLS", rows: [
      { g: "eye_left", icon: "😉", hand: "Left eye blink", action: "Open app  (left click)", color: "#30D158" },
      { g: "eye_right", icon: "😉", hand: "Right eye blink", action: "Close app (right click)", color: "#FF453A" },
    ]
  },
  {
    sec: "APP OPERATIONS", rows: [
      { g: "pinch_open", icon: "👌", hand: "Index+Thumb  close (< 0.07)", action: "OPEN app", color: "#30D158" },
      { g: "pinch_close", icon: "🤏", hand: "Middle+Thumb close (< 0.07)", action: "CLOSE app", color: "#FF453A" },
      { g: "pinch_minimize", icon: "🤌", hand: "Ring+Thumb   close (< 0.08)", action: "MINIMIZE app", color: "#FFD60A" },
      { g: "pinch_maximize", icon: "🖐", hand: "Pinky+Thumb  close (< 0.08)", action: "MAXIMIZE app", color: "#0A84FF" },
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

export interface AutomationAPI { executeTextCommand: (t: string) => Promise<boolean>; }
export interface GestureDockProps {
  visible?: boolean; onAppLaunch?: (a: DockApp) => void;
  accentColor?: string; automationAPI?: AutomationAPI;
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
export function GestureDock({ visible = true, onAppLaunch, accentColor = "#0A84FF", automationAPI }: GestureDockProps) {

  // ── State ───────────────────────────────────────────────────────────────────
  const [dockVisible, setDockVisible] = useState(false);
  const [scrollOff, setScrollOff] = useState(0);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [opApp, setOpApp] = useState<{ app: DockApp; op: AppOperation } | null>(null);
  const [gesture, setGesture] = useState<GestureName>("none");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "active" | "error">("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [winSize, setWinSize] = useState({ w: vw(), h: vh() });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [activePinch, setActivePinch] = useState<GestureName>("none");
  const [pendingOp, setPendingOp] = useState<AppOperation | null>(null);
  const [ringActive, setRingActive] = useState(false);
  const [ringColor, setRingColor] = useState(accentColor);
  const [handVis, setHandVis] = useState(false);
  const [blinkL, setBlinkL] = useState(false);  // visual flash only
  const [blinkR, setBlinkR] = useState(false);

  // ── Refs (zero re-render latency) ──────────────────────────────────────────
  const handsRef = useRef<any>(null);
  const faceRef = useRef<any>(null);
  const camRef = useRef<any>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const histRef = useRef<LM[][]>([]);
  const lastGRef = useRef<GestureName>("none");
  const coolRef = useRef(0);
  const swipeCool = useRef(0);
  const pIdRef = useRef(0);
  const dockVRef = useRef(false);
  const hovRef = useRef<number | null>(null);
  const lastHovRef = useRef<number | null>(null); // survives cursor disappearing during pinch
  const visRef = useRef(visible);
  const winRef = useRef({ w: vw(), h: vh() });

  // blink counters — raw ref, no setState = frame-accurate zero latency
  const lClosed = useRef(0);
  const rClosed = useRef(0);
  const lWasOpen = useRef(true);
  const rWasOpen = useRef(true);
  const blinkCool = useRef(0);

  useEffect(() => { dockVRef.current = dockVisible; }, [dockVisible]);
  useEffect(() => {
    hovRef.current = hovIdx;
    if (hovIdx !== null) lastHovRef.current = hovIdx;
  }, [hovIdx]);
  useEffect(() => { visRef.current = visible; }, [visible]);

  useEffect(() => {
    if (!isBrowser) return;
    const fn = () => { const s = { w: window.innerWidth, h: window.innerHeight }; setWinSize(s); winRef.current = s; };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const ITEM_W = 88;
  const DOCK_ZONE = 240; // bottom px where cursor lives
  const VISIBLE_N = useMemo(() => Math.max(5, Math.floor((winSize.w * 0.90) / ITEM_W)), [winSize.w]);
  const maxScroll = Math.max(0, DOCK_APPS.length - VISIBLE_N);
  const visApps = useMemo(() => DOCK_APPS.slice(scrollOff, scrollOff + VISIBLE_N), [scrollOff, VISIBLE_N]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const flashRing = useCallback((color: string, ms = 600) => {
    setRingColor(color); setRingActive(true);
    setTimeout(() => setRingActive(false), ms);
  }, []);

  const execCmd = useCallback(async (cmd: string) => {
    if (!automationAPI) return;
    try { await automationAPI.executeTextCommand(cmd); }
    catch (e) { console.error("[GestureDock]", e); }
  }, [automationAPI]);

  const spawnReaction = useCallback((g: GestureName) => {
    const r = REACTIONS[g]; if (!r) return;
    const id = String(++pIdRef.current);
    const x = 80 + Math.random() * (winRef.current.w - 220);
    const y = winRef.current.h * 0.12 + Math.random() * (winRef.current.h * 0.35);
    setParticles(p => [...p, { id, ...r, x, y }]);
    setTimeout(() => setParticles(p => p.filter(q => q.id !== id)), 2600);
    flashRing(r.color, 800);
  }, [flashRing]);

  const triggerOp = useCallback((idx: number, op: AppOperation) => {
    const app = DOCK_APPS[idx]; if (!app) return;
    setOpApp({ app, op });
    onAppLaunch?.(app);
    flashRing(OP_COLOR[op], 2200);
    execCmd(`${op} ${app.name}`);
    setTimeout(() => setOpApp(null), 2200);
  }, [onAppLaunch, flashRing, execCmd]);

  const scrollDock = useCallback((dir: "left" | "right") => {
    const now = Date.now();
    if (now - swipeCool.current < 500) return;
    swipeCool.current = now;
    setScrollOff(p => Math.max(0, Math.min(maxScroll, p + (dir === "right" ? 2 : -2))));
  }, [maxScroll]);

  // ─────────────────────────────────────────────────────────────────────────
  // BLINK PROCESSOR — runs every face frame (~30fps on alternating toggle)
  // All counters are refs → zero setState latency during counting
  // setState only fires on confirmed blink completion (eye re-opens)
  // ─────────────────────────────────────────────────────────────────────────
  const processBlinks = useCallback((fm: any[]) => {
    if (!fm || fm.length < 468) return;
    const now = Date.now();

    const lEAR = earFor(fm, 159, 145, 33, 133);
    const rEAR = earFor(fm, 386, 374, 362, 263);
    const lCLOSED = lEAR < EAR_CLOSED;
    const rCLOSED = rEAR < EAR_CLOSED;

    // ── LEFT EYE ──
    if (lCLOSED) {
      lClosed.current++;
    } else {
      if (
        lClosed.current >= BLINK_MIN &&
        lClosed.current <= BLINK_MAX &&
        lWasOpen.current &&
        now - blinkCool.current > BLINK_COOLMS
      ) {
        blinkCool.current = now;
        setBlinkL(true); setTimeout(() => setBlinkL(false), 180);
        flashRing("#30D158", 450);
        const idx = lastHovRef.current;
        if (dockVRef.current && idx !== null) triggerOp(idx, "open");
      }
      lClosed.current = 0;
      lWasOpen.current = true;
    }

    // ── RIGHT EYE ──
    if (rCLOSED) {
      rClosed.current++;
    } else {
      if (
        rClosed.current >= BLINK_MIN &&
        rClosed.current <= BLINK_MAX &&
        rWasOpen.current &&
        now - blinkCool.current > BLINK_COOLMS
      ) {
        blinkCool.current = now;
        setBlinkR(true); setTimeout(() => setBlinkR(false), 180);
        flashRing("#FF453A", 450);
        const idx = lastHovRef.current;
        if (dockVRef.current && idx !== null) triggerOp(idx, "close");
      }
      rClosed.current = 0;
      rWasOpen.current = true;
    }
  }, [flashRing, triggerOp]);

  // ─────────────────────────────────────────────────────────────────────────
  // HAND PROCESSOR
  // ─────────────────────────────────────────────────────────────────────────
  const processHand = useCallback((lm: LM[]) => {
    if (!visRef.current) return;
    const w = winRef.current;

    histRef.current.push(lm);
    if (histRef.current.length > 32) histRef.current.shift();

    // ── Cursor from palm center lm[9] — NOT finger tip, so never shifts during pinch ──
    const wy = lm[0].y;
    if (wy > 0.47 && dockVRef.current) {
      const cx = (1 - lm[9].x) * w.w;
      const ny = Math.max(0, Math.min(1, (wy - 0.47) / 0.53));
      const cy = w.h - DOCK_ZONE + ny * DOCK_ZONE * 0.88;
      setCursor({ x: Math.max(4, Math.min(w.w - 4, cx)), y: cy });
    } else {
      setCursor(null);
    }

    const g = detect(lm, histRef.current);
    setGesture(g);

    if (g in PINCH_OP) { setActivePinch(g); setPendingOp(PINCH_OP[g] ?? null); }
    else { setActivePinch("none"); setPendingOp(null); }

    const now = Date.now();
    if (now < coolRef.current) return;

    const isSw = g === "swipe_left" || g === "swipe_right";
    const isPi = g in PINCH_OP;
    if (!isPi && !isSw && g === lastGRef.current) return;
    lastGRef.current = g;

    switch (g) {
      case "palm_up":
        setDockVisible(true); flashRing(accentColor, 500);
        coolRef.current = now + 300; break;

      case "fist":
        setDockVisible(false); setCursor(null);
        coolRef.current = now + 300; break;

      case "swipe_left":
        if (dockVRef.current) scrollDock("left");
        coolRef.current = now + 480; break;

      case "swipe_right":
        if (dockVRef.current) scrollDock("right");
        coolRef.current = now + 480; break;

      case "pinch_open":
      case "pinch_close":
      case "pinch_minimize":
      case "pinch_maximize": {
        if (dockVRef.current) {
          const idx = hovRef.current ?? lastHovRef.current;
          const op = PINCH_OP[g];
          if (op && idx !== null) { triggerOp(idx, op); coolRef.current = now + 850; }
        }
        break;
      }

      default:
        if (REACTIONS[g]) { spawnReaction(g); coolRef.current = now + 1100; }
    }
  }, [accentColor, scrollDock, triggerOp, spawnReaction, flashRing]);

  // ─────────────────────────────────────────────────────────────────────────
  // HOVER UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cursor || !dockVisible || !dockRef.current) { setHovIdx(null); return; }
    const r = dockRef.current.getBoundingClientRect();
    const inX = cursor.x >= r.left - 14 && cursor.x <= r.right + 14;
    const inY = cursor.y >= r.top - 72 && cursor.y <= r.bottom + 26;
    if (!inX || !inY) { setHovIdx(null); return; }
    const raw = Math.floor((cursor.x - r.left) / ITEM_W) + scrollOff;
    setHovIdx(Math.max(0, Math.min(DOCK_APPS.length - 1, raw)));
  }, [cursor, dockVisible, scrollOff]);

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIAPIPE INIT
  // Hands + FaceMesh share one camera, alternate frames (60fps cam → ~30fps each)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBrowser || !visible) return;
    let dead = false;

    const init = async () => {
      try {
        setStatus("loading");
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
        ]);
        if (dead) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 60, min: 30 } },
        });
        if (dead) { stream.getTracks().forEach(t => t.stop()); return; }

        const vid = document.createElement("video");
        vid.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;z-index:-9999;";
        vid.autoplay = true; vid.playsInline = true; vid.muted = true;
        vid.srcObject = stream;
        document.body.appendChild(vid);
        vidRef.current = vid;

        // Hands
        const hands = new (window as any).Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.65, minTrackingConfidence: 0.65 });
        hands.onResults((r: any) => {
          if (dead) return;
          if (r.multiHandLandmarks?.length) {
            setHandVis(true);
            processHand(r.multiHandLandmarks[0]);
          } else {
            setHandVis(false);
            setGesture("none"); setCursor(null);
            setActivePinch("none"); setPendingOp(null);
          }
        });
        handsRef.current = hands;

        // FaceMesh (refineLandmarks=true gives us accurate eye landmarks)
        const face = new (window as any).FaceMesh({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        face.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
        face.onResults((r: any) => {
          if (dead) return;
          if (r.multiFaceLandmarks?.length) processBlinks(r.multiFaceLandmarks[0]);
        });
        faceRef.current = face;

        // Alternating frame dispatch: hands on odd frames, face on even
        let toggle = false;
        const cam = new (window as any).Camera(vid, {
          onFrame: async () => {
            if (dead) return;
            toggle = !toggle;
            if (toggle) { if (handsRef.current) await handsRef.current.send({ image: vid }); }
            else { if (faceRef.current) await faceRef.current.send({ image: vid }); }
          },
          width: 640, height: 480,
        });
        await cam.start();
        camRef.current = cam;
        if (!dead) setStatus("active");

      } catch (e) {
        console.error("[GestureDock init]", e);
        if (!dead) setStatus("error");
      }
    };

    init();
    return () => {
      dead = true;
      camRef.current?.stop();
      if (vidRef.current) {
        (vidRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
        vidRef.current.remove(); vidRef.current = null;
      }
      handsRef.current = null; faceRef.current = null; camRef.current = null;
    };
  }, [visible, processHand, processBlinks]);

  if (!visible) return null;

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
      {cursor && dockVisible && (
        <div className="fixed pointer-events-none" style={{ left: cursor.x, top: cursor.y, zIndex: 2147483628, transform: "translate(-50%,-50%)", willChange: "left,top" }}>
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
          {pendingOp && hovApp && (
            <div style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", background: `${OP_COLOR[pendingOp]}22`, border: `1px solid ${OP_COLOR[pendingOp]}66`, borderRadius: 100, padding: "3px 10px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", color: OP_COLOR[pendingOp], whiteSpace: "nowrap", fontFamily: "'SF Pro Text',monospace", textTransform: "uppercase" }}>
              {OP_ICON[pendingOp]} {OP_LABEL[pendingOp]}
            </div>
          )}
        </div>
      )}

      {/* ── DOCK ────────────────────────────────────────────────────────── */}
      <div className="fixed pointer-events-none" style={{
        bottom: dockVisible ? 22 : -280, left: "50%", transform: "translateX(-50%)",
        zIndex: 2147483625,
        transition: "bottom 0.62s cubic-bezier(0.34,1.56,0.64,1)",
        willChange: "bottom",
      }}>
        {scrollOff > 0 && <div style={{ position: "absolute", left: -54, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.38)", fontSize: 22, animation: "gdArr 1.6s ease-in-out infinite" }}>◂</div>}
        {scrollOff < maxScroll && <div style={{ position: "absolute", right: -54, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.38)", fontSize: 22, animation: "gdArr 1.6s ease-in-out infinite" }}>▸</div>}

        <div ref={dockRef} style={{
          display: "flex", alignItems: "flex-end", gap: 4,
          background: "rgba(12,12,18,0.80)",
          backdropFilter: "blur(90px) saturate(260%)",
          WebkitBackdropFilter: "blur(90px) saturate(260%)",
          borderRadius: 30, padding: "14px 16px 12px",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: ["0 0 0 0.5px rgba(255,255,255,0.04)", "inset 0 1px 0 rgba(255,255,255,0.08)", "0 32px 100px rgba(0,0,0,0.84)", hovApp ? `0 0 90px ${hovApp.glow}` : ""].filter(Boolean).join(","),
          transition: "box-shadow 0.32s ease",
        }}>
          {visApps.map((app, i) => {
            const ai = scrollOff + i;
            const hot = hovIdx === ai;
            const dd = hovIdx !== null ? Math.abs(hovIdx - ai) : 99;
            const sc = hot ? 1.68 : dd === 1 ? 1.28 : dd === 2 ? 1.1 : 1;
            const ty = hot ? -20 : dd === 1 ? -8 : dd === 2 ? -3 : 0;
            return (
              <div key={app.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transform: `scale(${sc}) translateY(${ty}px)`, transformOrigin: "bottom center", transition: "transform 0.20s cubic-bezier(0.34,1.56,0.64,1)", width: ITEM_W - 4 }}>
                {/* Tooltip */}
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3px", color: "rgba(255,255,255,0.95)", fontFamily: "'SF Pro Text',-apple-system,sans-serif", background: "rgba(0,0,0,0.90)", borderRadius: 9, padding: "5px 10px", opacity: hot ? 1 : 0, transform: hot ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.13s,transform 0.13s", whiteSpace: "nowrap", boxShadow: "0 4px 18px rgba(0,0,0,0.65)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span>{app.name}</span>
                  {pendingOp && <span style={{ fontSize: 8, color: OP_COLOR[pendingOp], letterSpacing: "1.5px", textTransform: "uppercase" }}>{OP_ICON[pendingOp]} {OP_LABEL[pendingOp]}</span>}
                </div>
                {/* Icon */}
                <div style={{ width: 62, height: 62, borderRadius: 16, background: hot ? `radial-gradient(circle at 38% 30%,${app.color}28,rgba(18,18,26,0.96))` : "rgba(26,26,34,0.86)", border: hot ? `1px solid ${app.color}88` : "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: hot ? `0 0 0 3px ${app.color}1e,0 14px 44px ${app.glow},inset 0 1px 0 rgba(255,255,255,0.09)` : "0 6px 24px rgba(0,0,0,0.52),inset 0 1px 0 rgba(255,255,255,0.04)", transition: "all 0.20s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", overflow: "hidden" }}>
                  {hot && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${app.color}18 0%,transparent 55%)`, borderRadius: "inherit" }} />}
                  <AppIcon app={app} size={62} />
                </div>
                {/* Dot */}
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: hot ? app.color : "rgba(255,255,255,0.15)", boxShadow: hot ? `0 0 8px ${app.color},0 0 22px ${app.color}66` : "none", transition: "background 0.18s,box-shadow 0.18s" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OPERATION OVERLAY ─────────────────────────────────────────────── */}
      {opApp && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 2147483626 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", animation: "gdFadeIn 0.18s ease" }} />
          <div style={{ position: "relative", background: "rgba(8,8,14,0.98)", backdropFilter: "blur(80px) saturate(220%)", WebkitBackdropFilter: "blur(80px) saturate(220%)", border: `1px solid ${OP_COLOR[opApp.op]}28`, borderRadius: 48, padding: "48px 80px 44px", textAlign: "center", boxShadow: ["0 0 0 1px rgba(255,255,255,0.04)", `0 0 140px ${opApp.app.glow}`, "0 60px 120px rgba(0,0,0,0.85)"].join(","), animation: "gdCard 2.2s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 180, height: 180, transform: "translate(-50%,-74%)", borderRadius: "50%", border: `1px solid ${opApp.app.color}44`, animation: "gdRot 2.2s linear infinite" }} />
            <div style={{ position: "absolute", top: 22, right: 28, background: `${OP_COLOR[opApp.op]}22`, border: `1px solid ${OP_COLOR[opApp.op]}66`, borderRadius: 100, padding: "4px 12px", fontSize: 9, fontWeight: 800, letterSpacing: "2px", color: OP_COLOR[opApp.op], textTransform: "uppercase", fontFamily: "'SF Pro Text',monospace" }}>{OP_ICON[opApp.op]} {OP_LABEL[opApp.op]}</div>
            <div style={{ width: 104, height: 104, borderRadius: 28, background: `radial-gradient(circle at 38% 30%,${opApp.app.color}28,rgba(8,8,14,0.95))`, border: `1px solid ${opApp.app.color}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: `0 0 70px ${opApp.app.glow},inset 0 1px 0 rgba(255,255,255,0.07)`, animation: "gdIconB 0.7s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", zIndex: 1 }}>
              <AppIcon app={opApp.app} size={104} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: "rgba(255,255,255,0.95)", fontFamily: "'SF Pro Display',-apple-system,sans-serif", position: "relative", zIndex: 1 }}>{opApp.app.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: OP_COLOR[opApp.op], marginTop: 8, position: "relative", zIndex: 1, letterSpacing: "0.5px" }}>{OP_LABEL[opApp.op]}ing…</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, position: "relative", zIndex: 1 }}>
              {[0, 0.22, 0.44].map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: OP_COLOR[opApp.op], boxShadow: `0 0 12px ${OP_COLOR[opApp.op]}`, animation: `gdDB 0.9s ${d}s ease-in-out infinite alternate` }} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── REACTION PARTICLES ────────────────────────────────────────────── */}
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none" style={{ left: p.x, top: p.y, zIndex: 2147483624, textAlign: "center", animation: "gdReact 2.6s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div style={{ fontSize: 86, lineHeight: 1, filter: `drop-shadow(0 10px 50px ${p.color}88)`, animation: "gdReactW 0.6s ease-out" }}>{p.emoji}</div>
          <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: "3.5px", textTransform: "uppercase", color: "white", fontFamily: "'SF Pro Text',monospace", textShadow: `0 0 24px ${p.color}` }}>{p.label}</div>
        </div>
      ))}

      {/* ── GESTURE BADGE top-right ───────────────────────────────────────── */}
      {status === "active" && gesture !== "none" && G_LABEL[gesture] && (
        <div className="fixed pointer-events-none" style={{ top: 22, right: 22, zIndex: 2147483623, background: "rgba(6,6,10,0.94)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "10px 22px", fontSize: 11, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.82)", fontFamily: "'SF Pro Text',-apple-system,sans-serif", boxShadow: "0 4px 32px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)", animation: "gdSlide 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}>
          {G_LABEL[gesture]}
        </div>
      )}

      {/* ── STATUS BAR top-left  (hand + blink indicators) ───────────────── */}
      {status === "active" && (
        <div className="fixed pointer-events-none" style={{ top: 22, left: 22, zIndex: 2147483620, display: "flex", alignItems: "center", gap: 8, background: "rgba(6,6,10,0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 100, padding: "7px 14px" }}>
          {/* Hand dot */}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: handVis ? "#30D158" : "rgba(255,255,255,0.18)", boxShadow: handVis ? "0 0 10px #30D158,0 0 20px #30D15888" : "none", transition: "background 0.18s,box-shadow 0.18s" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: handVis ? "rgba(48,209,88,0.9)" : "rgba(255,255,255,0.25)", fontFamily: "monospace", transition: "color 0.18s" }}>{handVis ? "Hand" : "–"}</span>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.10)" }} />
          {/* Left eye */}
          <div style={{ width: 30, height: 18, borderRadius: 9, border: `1.5px solid ${blinkL ? "#30D158" : "rgba(255,255,255,0.12)"}`, background: blinkL ? "#30D15822" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.07s ease", boxShadow: blinkL ? "0 0 12px #30D15888" : "none", fontSize: 9, fontWeight: 800, color: blinkL ? "#30D158" : "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>L</div>
          {/* Right eye */}
          <div style={{ width: 30, height: 18, borderRadius: 9, border: `1.5px solid ${blinkR ? "#FF453A" : "rgba(255,255,255,0.12)"}`, background: blinkR ? "#FF453A22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.07s ease", boxShadow: blinkR ? "0 0 12px #FF453A88" : "none", fontSize: 9, fontWeight: 800, color: blinkR ? "#FF453A" : "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>R</div>
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
                    const active = row.g === "eye_left" ? blinkL : row.g === "eye_right" ? blinkR : gesture === row.g;
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
          Initialising Hand + Eye Tracking
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
        @keyframes gdReact  { 0%{opacity:0;transform:translateY(50px) scale(.2) rotate(-12deg)}  12%{opacity:1;transform:translateY(-20px) scale(1.22) rotate(5deg)} 55%{opacity:1;transform:translateY(-100px) scale(1) rotate(0deg)} 100%{opacity:0;transform:translateY(-200px) scale(.8) rotate(6deg)} }
        @keyframes gdReactW { 0%{transform:scale(.35) rotate(-16deg)}                            55%{transform:scale(1.18) rotate(7deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes gdCard   { 0%{opacity:0;transform:scale(.75) translateY(30px)}                10%{opacity:1;transform:scale(1.03) translateY(-2px)} 72%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.92) translateY(-14px)} }
        @keyframes gdIconB  { 0%{transform:scale(.38);opacity:0}                                 62%{transform:scale(1.16);opacity:1} 100%{transform:scale(1)} }
        @keyframes gdDB     { from{transform:translateY(0);opacity:.4}                           to{transform:translateY(-9px);opacity:1} }
        @keyframes gdFadeIn { from{opacity:0}                                                    to{opacity:1} }
        @keyframes gdSlide  { from{opacity:0;transform:translateY(-12px) scale(.86)}             to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gdOpH    { from{opacity:.28;transform:translate(-50%,-50%) scale(.9)}         to{opacity:.7;transform:translate(-50%,-50%) scale(1.07)} }
      `}</style>
    </>
  );
}

export default GestureDock;