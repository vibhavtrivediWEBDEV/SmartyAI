"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Reaction { id: string; emoji: string; label: string; color: string; }
interface Comment { id: string; text: string; emoji: string; time: string; }
interface Counts { love: number; fire: number; wow: number; clap: number; rocket: number; }
interface Floater { id: string; emoji: string; x: number; }

// ── Constants ─────────────────────────────────────────────────────────────────
const REACTIONS: Reaction[] = [
  { id: "love", emoji: "❤️", label: "Love it", color: "#ff4d6d" },
  { id: "fire", emoji: "🔥", label: "On fire!", color: "#ff6b35" },
  { id: "wow", emoji: "🤩", label: "Blown away", color: "#fbbf24" },
  { id: "clap", emoji: "👏", label: "Impressed", color: "#a78bfa" },
  { id: "rocket", emoji: "🚀", label: "To the moon", color: "#38bdf8" },
];

const EMPTY: Counts = { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0 };

// ✅ Points to your Next.js API route: app/api/reactions/route.ts
const API = "/api/reactions";

const fmt = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

// Stable user ID — survives refresh, stored in localStorage
const getUserId = (): string => {
  if (typeof window === "undefined") return "ssr";
  const k = "lc:uid";
  let v = localStorage.getItem(k);
  if (!v) {
    v = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(k, v);
  }
  return v;
};

// ── Floating emoji particle ───────────────────────────────────────────────────
function Floater({ emoji, x }: { emoji: string; x: number }) {
  const size = 16 + Math.random() * 14;
  const dur = 1.2 + Math.random() * 0.6;
  const delay = Math.random() * 0.15;
  const drift = (Math.random() - 0.5) * 40;
  return (
    <span
      style={{
        position: "fixed", pointerEvents: "none", userSelect: "none",
        fontSize: size, bottom: 90, left: x, zIndex: 10000,
        animation: `lcRise ${dur}s ${delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
        "--drift": `${drift}px`,
      } as React.CSSProperties}
    >
      {emoji}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoveCounter() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ ...EMPTY });
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [visitors, setVisitors] = useState(0);
  const [btnPop, setBtnPop] = useState(false);
  const [hoverReaction, setHoverReaction] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = useRef("");

  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  const myR = REACTIONS.find(r => r.id === myReaction) ?? null;
  const btnEmoji = myR?.emoji ?? "❤️";
  const btnColor = myR?.color ?? "#ff4d6d";
  const btnColorDark = myR?.color ?? "#c2185b";
  const activeR = hoverReaction
    ? REACTIONS.find(r => r.id === hoverReaction)
    : myR;

  // ── Fetch data from Firebase via API route ───────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const data = await res.json();
      if (data.counts) setCounts(data.counts);
      if (data.comments) setComments(data.comments);
      if (data.visitors !== undefined) setVisitors(data.visitors);
    } catch { }
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    userId.current = getUserId();

    // Restore this user's saved reaction from localStorage
    const saved = localStorage.getItem("lc:myReaction");
    if (saved) setMyReaction(saved);

    const init = async () => {
      // 1. Load all data (counts, comments, visitors) from Firebase
      await fetchData();

      // 2. Increment visitor count in Firebase
      try {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "visit" }),
        });
        // Re-fetch to get updated visitor count
        await fetchData();
      } catch { }

      setLoading(false);

      // 3. Live poll every 5s — picks up other users' reactions in real time
      pollRef.current = setInterval(fetchData, 5000);
    };

    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  // ── Outside click closes panel ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [open]);

  // ── Spawn floaters from button ───────────────────────────────────────────
  const spawnFloaters = useCallback((emoji: string) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const fs: Floater[] = Array.from({ length: 8 }, (_, i) => ({
      id: `f${Date.now()}${i}`, emoji,
      x: cx - 10 + (Math.random() - 0.5) * 40,
    }));
    setFloaters(p => [...p, ...fs]);
    setTimeout(() => setFloaters(p => p.filter(x => !fs.find(f => f.id === x.id))), 2500);
  }, []);

  // ── React — saves to Firebase via API route ──────────────────────────────
  const handleReact = useCallback(async (id: string) => {
    if (posting) return;
    const r = REACTIONS.find(r => r.id === id)!;
    const removing = myReaction === id;

    // Optimistic UI update — instant feel
    setCounts(prev => {
      const n = { ...prev };
      if (removing) {
        n[id as keyof Counts] = Math.max(0, n[id as keyof Counts] - 1);
      } else {
        if (myReaction) n[myReaction as keyof Counts] = Math.max(0, n[myReaction as keyof Counts] - 1);
        n[id as keyof Counts] = n[id as keyof Counts] + 1;
      }
      return n;
    });

    const next = removing ? null : id;
    setMyReaction(next);

    // Persist user's choice in localStorage (survives page refresh)
    if (next) localStorage.setItem("lc:myReaction", next);
    else localStorage.removeItem("lc:myReaction");

    if (!removing) {
      setBtnPop(true);
      setTimeout(() => setBtnPop(false), 500);
      spawnFloaters(r.emoji);
      setTimeout(() => setShowInput(true), 600);
    } else {
      setShowInput(false);
    }

    // ✅ Save to Firebase via API route — ALL visitors will see this
    setPosting(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          removing
            ? { action: "unreact", reactionId: id, userId: userId.current }
            : { action: "react", reactionId: id, userId: userId.current, prevReactionId: myReaction }
        ),
      });
      const data = await res.json();
      // Sync counts with Firebase truth (in case of concurrent updates)
      if (data.counts) setCounts(data.counts);
    } catch { }
    setPosting(false);
  }, [myReaction, posting, spawnFloaters]);

  // ── Submit comment — saves to Firebase via API route ────────────────────
  const submitComment = useCallback(async () => {
    const text = comment.trim();
    if (!text || posting) return;

    // Optimistic: show immediately
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      text,
      emoji: myR?.emoji ?? "💬",
      time: new Date().toISOString(),
    };
    setComments(p => [optimistic, ...p].slice(0, 50));
    setComment("");
    setShowInput(false);

    // ✅ Save to Firebase — ALL visitors will see this comment
    setPosting(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          text,
          emoji: myR?.emoji ?? "💬",
          userId: userId.current,
        }),
      });
      const data = await res.json();
      // Replace optimistic with server data
      if (data.comments) setComments(data.comments);
    } catch { }
    setPosting(false);
  }, [comment, myR, posting]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .lc-root, .lc-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .lc-root {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Button ─────────────────────────────────────────────────────── */
        .lc-btn {
          width: 58px; height: 58px; border-radius: 50%; border: none;
          cursor: pointer; outline: none; position: relative;
          display: flex; align-items: center; justify-content: center;
          transition: transform .25s cubic-bezier(.34,1.56,.64,1);
        }
        .lc-btn:hover { transform: scale(1.12); }
        .lc-btn.pop   { animation: lcPop .4s cubic-bezier(.34,1.56,.64,1); }
        .lc-btn.open  { transform: scale(0.9) !important; }

        .lc-glow {
          position: absolute; inset: -4px; border-radius: 50%;
          animation: lcGlow 2s ease-in-out infinite; pointer-events: none;
        }
        .lc-ring {
          position: absolute; inset: -2px; border-radius: 50%;
          border: 2px solid transparent; opacity: 0;
          animation: lcRing 2s ease-out infinite; pointer-events: none;
        }
        .lc-ring2 { animation-delay: 0.7s; }

        .lc-btn-emoji {
          font-size: 26px; line-height: 1; position: relative; z-index: 1;
          animation: lcBreath 3s ease-in-out infinite;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        }
        .lc-btn.open .lc-btn-emoji { display: none; }
        .lc-btn-x { display: none; position: relative; z-index: 1; }
        .lc-btn.open .lc-btn-x { display: block; }

        .lc-badge {
          position: absolute; top: -4px; right: -4px;
          background: white; border-radius: 100px;
          font-size: 10px; font-weight: 700;
          padding: 2px 6px; min-width: 20px; text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.25);
          font-family: 'Plus Jakarta Sans', sans-serif;
          animation: lcBadgePop .3s ease;
        }

        /* ── Panel ──────────────────────────────────────────────────────── */
        .lc-panel {
          position: absolute; bottom: 70px; right: 0; width: 330px;
          background: #0f0f14;
          border: 1px solid rgba(255,255,255,.09); border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
          transform-origin: bottom right;
          transition: transform .4s cubic-bezier(.34,1.3,.64,1), opacity .3s ease;
        }
        .lc-panel.closed { transform: scale(0.55) translateY(24px); opacity: 0; pointer-events: none; }
        .lc-panel.opened { transform: scale(1) translateY(0); opacity: 1; }

        /* ── Header ─────────────────────────────────────────────────────── */
        .lc-hdr {
          padding: 16px 18px 12px; position: relative; overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .lc-hdr-bg {
          position: absolute; inset: 0; pointer-events: none;
          transition: background .5s ease;
        }
        .lc-hdr-inner { position: relative; z-index: 1; }
        .lc-title {
          font-size: 15px; font-weight: 700; color: #f0ece4; letter-spacing: -.3px;
        }
        .lc-sub {
          font-size: 11px; color: rgba(240,236,228,.35);
          margin-top: 3px; display: flex; align-items: center; gap: 6px;
        }
        .lc-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #4ade80;
          animation: lcLive 1.6s ease-in-out infinite; flex-shrink: 0;
        }

        /* ── Reactions ──────────────────────────────────────────────────── */
        .lc-rxns {
          display: flex; gap: 5px; padding: 14px 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          overflow-x: auto; scrollbar-width: none;
        }
        .lc-rxns::-webkit-scrollbar { display: none; }

        .lc-rxn {
          flex-shrink: 0; display: flex; flex-direction: column;
          align-items: center; gap: 3px;
          border-radius: 14px; padding: 9px 11px; cursor: pointer;
          outline: none; min-width: 56px;
          border: 1.5px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.03);
          transition: all .2s cubic-bezier(.34,1.56,.64,1);
        }
        .lc-rxn:hover     { transform: translateY(-4px) scale(1.1); }
        .lc-rxn.on        { transform: translateY(-3px) scale(1.06); }
        .lc-rxn-em        { font-size: 20px; line-height: 1; filter: drop-shadow(0 1px 3px rgba(0,0,0,.3)); }
        .lc-rxn.on .lc-rxn-em  { animation: lcJelly .4s ease; }
        .lc-rxn:hover .lc-rxn-em { animation: lcJelly .4s ease; }
        .lc-rxn-ct        { font-size: 11px; font-weight: 600; color: rgba(240,236,228,.38); transition: color .2s; }
        .lc-rxn.on .lc-rxn-ct { font-weight: 700; animation: lcCountPop .3s ease; }
        .lc-rxn-lb        { font-size: 8.5px; color: rgba(240,236,228,.25); letter-spacing: .3px; text-transform: uppercase; font-weight: 500; white-space: nowrap; }

        /* ── Input ──────────────────────────────────────────────────────── */
        .lc-inp-wrap {
          padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.05);
          animation: lcSlide .35s cubic-bezier(.34,1.3,.64,1);
        }
        .lc-inp-prompt {
          font-size: 12px; color: rgba(240,236,228,.45);
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }
        .lc-ta {
          width: 100%; background: rgba(255,255,255,.05);
          border: 1.5px solid rgba(255,255,255,.08); border-radius: 11px;
          padding: 9px 12px; color: #f0ece4;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px;
          resize: none; outline: none;
          transition: border-color .2s, box-shadow .2s; line-height: 1.5;
        }
        .lc-ta:focus       { border-color: rgba(255,255,255,.2); box-shadow: 0 0 0 3px rgba(255,255,255,.03); }
        .lc-ta::placeholder{ color: rgba(240,236,228,.22); }
        .lc-inp-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .lc-char    { font-size: 10px; color: rgba(240,236,228,.2); }
        .lc-btns    { display: flex; gap: 6px; }
        .lc-post {
          border: none; border-radius: 9px; padding: 7px 15px; color: white;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s;
        }
        .lc-post:hover    { filter: brightness(1.12); transform: scale(1.04); }
        .lc-post:disabled { opacity: .35; cursor: not-allowed; transform: none; filter: none; }
        .lc-skip {
          background: none; border: none; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11.5px; color: rgba(240,236,228,.28); cursor: pointer;
          padding: 6px 10px; border-radius: 8px; transition: color .15s;
        }
        .lc-skip:hover { color: rgba(240,236,228,.55); }

        /* ── Comments ───────────────────────────────────────────────────── */
        .lc-list {
          max-height: 200px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.07) transparent;
        }
        .lc-list::-webkit-scrollbar       { width: 3px; }
        .lc-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

        .lc-cmt {
          display: flex; gap: 9px; padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          animation: lcSlide .3s ease;
        }
        .lc-cmt:last-child { border-bottom: none; }
        .lc-cmt-em  { font-size: 15px; flex-shrink: 0; margin-top: 2px; }
        .lc-cmt-txt { font-size: 12.5px; color: rgba(240,236,228,.78); line-height: 1.5; }
        .lc-cmt-ts  { font-size: 10px; color: rgba(240,236,228,.2); margin-top: 3px; }

        .lc-empty {
          padding: 22px 16px; text-align: center;
          font-size: 12px; color: rgba(240,236,228,.2); line-height: 1.7;
        }
        .lc-addnote {
          padding: 9px 14px; text-align: right;
          border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .lc-addnote button {
          background: none; border: none; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px; color: rgba(240,236,228,.28); cursor: pointer;
          text-decoration: underline; transition: color .15s;
        }
        .lc-addnote button:hover { color: rgba(240,236,228,.55); }

        .lc-footer {
          padding: 8px 14px; text-align: center; font-size: 9.5px;
          color: rgba(240,236,228,.14);
          border-top: 1px solid rgba(255,255,255,.04); letter-spacing: .4px;
        }

        /* ── Keyframes ──────────────────────────────────────────────────── */
        @keyframes lcBreath    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes lcGlow      { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.05)} }
        @keyframes lcRing      { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.9);opacity:0} }
        @keyframes lcPop       { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 70%{transform:scale(0.92)} 100%{transform:scale(1)} }
        @keyframes lcBadgePop  { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes lcCountPop  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
        @keyframes lcJelly     { 0%{transform:scale(1)} 25%{transform:scale(1.3) rotate(-5deg)} 50%{transform:scale(.88) rotate(3deg)} 75%{transform:scale(1.1) rotate(-2deg)} 100%{transform:scale(1)} }
        @keyframes lcRise      { 0%{transform:translateY(0) translateX(0) scale(1);opacity:1} 60%{opacity:1} 100%{transform:translateY(-110px) translateX(var(--drift,0px)) scale(.3);opacity:0} }
        @keyframes lcSlide     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lcLive      { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4);box-shadow:0 0 6px #4ade80} }
      `}</style>

      {/* Floaters — fixed position, appear over everything */}
      {floaters.map(f => <Floater key={f.id} emoji={f.emoji} x={f.x} />)}

      <div className="lc-root" ref={panelRef}>

        {/* ── Panel ───────────────────────────────────────────────────── */}
        <div className={`lc-panel ${open ? "opened" : "closed"}`}>

          {/* Header */}
          <div className="lc-hdr">
            <div
              className="lc-hdr-bg"
              style={{
                background: activeR
                  ? `linear-gradient(135deg, ${activeR.color}22 0%, transparent 60%)`
                  : "linear-gradient(135deg, rgba(255,77,109,.12) 0%, transparent 60%)",
              }}
            />
            <div className="lc-hdr-inner">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="lc-title">
                    {loading ? "Loading…" : total === 0
                      ? "Be the first to react! 👋"
                      : `${fmt(total)} ${total === 1 ? "person" : "people"} reacted`}
                  </div>
                  <div className="lc-sub">
                    <div className="lc-dot" />
                    <span>
                      {loading ? "—" : `${fmt(visitors)} visitor${visitors !== 1 ? "s" : ""} · live`}
                    </span>
                  </div>
                </div>
                {/* Top 3 emoji summary */}
                {total > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                    {REACTIONS
                      .filter(r => counts[r.id as keyof Counts] > 0)
                      .sort((a, b) => counts[b.id as keyof Counts] - counts[a.id as keyof Counts])
                      .slice(0, 3)
                      .map(r => (
                        <span key={r.id} style={{ fontSize: 14 }} title={`${counts[r.id as keyof Counts]}`}>
                          {r.emoji}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reaction buttons */}
          <div className="lc-rxns">
            {REACTIONS.map(r => {
              const on = myReaction === r.id;
              const count = counts[r.id as keyof Counts];
              return (
                <button
                  key={r.id}
                  className={`lc-rxn${on ? " on" : ""}`}
                  onClick={() => handleReact(r.id)}
                  onMouseEnter={() => setHoverReaction(r.id)}
                  onMouseLeave={() => setHoverReaction(null)}
                  disabled={loading || posting}
                  title={r.label}
                  style={{
                    background: on ? `${r.color}18` : "rgba(255,255,255,.03)",
                    borderColor: on ? `${r.color}55` : "rgba(255,255,255,.07)",
                    boxShadow: on ? `0 4px 20px ${r.color}25, inset 0 0 12px ${r.color}0a` : "none",
                  }}
                >
                  <div className="lc-rxn-em">{r.emoji}</div>
                  <div className="lc-rxn-ct" style={{ color: on ? r.color : "rgba(240,236,228,.38)" }}>
                    {loading ? "·" : count > 0 ? fmt(count) : "·"}
                  </div>
                  <div className="lc-rxn-lb">{r.label}</div>
                </button>
              );
            })}
          </div>

          {/* Comment input — appears after reacting */}
          {myReaction && showInput ? (
            <div className="lc-inp-wrap">
              <div className="lc-inp-prompt">
                <span style={{ fontSize: 15 }}>{myR?.emoji}</span>
                <span>Tell visitors what you loved</span>
              </div>
              <textarea
                className="lc-ta"
                rows={2}
                maxLength={200}
                placeholder="Your thoughts make a difference…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                autoFocus
              />
              <div className="lc-inp-row">
                <span className="lc-char">{comment.length}/200</span>
                <div className="lc-btns">
                  <button className="lc-skip" onClick={() => { setShowInput(false); setComment(""); }}>
                    Maybe later
                  </button>
                  <button
                    className="lc-post"
                    onClick={submitComment}
                    disabled={!comment.trim() || posting}
                    style={{ background: `linear-gradient(135deg, ${btnColor}, ${btnColorDark})` }}
                  >
                    {posting ? "Sending…" : "Share note ✉️"}
                  </button>
                </div>
              </div>
            </div>
          ) : myReaction && !showInput ? (
            <div className="lc-addnote">
              <button onClick={() => setShowInput(true)}>✏️ Leave a note for visitors</button>
            </div>
          ) : null}

          {/* Comments — from Firebase, visible to ALL visitors */}
          {comments.length > 0 ? (
            <div className="lc-list">
              {comments.map(c => (
                <div key={c.id} className="lc-cmt">
                  <span className="lc-cmt-em">{c.emoji}</span>
                  <div>
                    <div className="lc-cmt-txt">{c.text}</div>
                    <div className="lc-cmt-ts">
                      {new Date(c.time).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !myReaction ? (
            <div className="lc-empty">
              No reactions yet —<br />yours could be first! 🌟
            </div>
          ) : null}

          <div className="lc-footer">
            🔥 FIREBASE · LIVE FOR ALL VISITORS · PERSISTS FOREVER
          </div>
        </div>

        {/* ── Floating Heart Button ────────────────────────────────────── */}
        <button
          ref={btnRef}
          className={`lc-btn${btnPop ? " pop" : ""}${open ? " open" : ""}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Reactions"
          style={{
            background: `linear-gradient(135deg, ${btnColor}, ${btnColorDark})`,
            boxShadow: `0 4px 24px ${btnColor}66, 0 2px 8px rgba(0,0,0,.35)`,
          }}
        >
          {/* Breathing glow */}
          <div
            className="lc-glow"
            style={{ background: `radial-gradient(circle, ${btnColor}40 0%, transparent 70%)` }}
          />
          {/* Always-on pulse rings */}
          <div className="lc-ring" style={{ borderColor: `${btnColor}60` }} />
          <div className="lc-ring lc-ring2" style={{ borderColor: `${btnColor}40` }} />

          {/* Emoji — changes to user's last reaction */}
          <span className="lc-btn-emoji">{btnEmoji}</span>

          {/* Close icon */}
          <svg className="lc-btn-x" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Count badge */}
          {!open && total > 0 && (
            <span className="lc-badge" style={{ color: btnColor }}>{fmt(total)}</span>
          )}
        </button>
      </div>
    </>
  );
}