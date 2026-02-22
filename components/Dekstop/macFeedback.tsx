"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Reaction {
  id:    string;
  emoji: string;
  label: string;
  color: string;
}

interface Comment {
  id:    number;
  text:  string;
  emoji: string;
  time:  string;
}

interface Counts {
  love:   number;
  fire:   number;
  wow:    number;
  clap:   number;
  rocket: number;
}

interface ParticleItem {
  id:    string;
  emoji: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REACTIONS: Reaction[] = [
  { id: "love",   emoji: "❤️",  label: "Love",   color: "#ff4d6d" },
  { id: "fire",   emoji: "🔥",  label: "Fire",   color: "#ff6b2b" },
  { id: "wow",    emoji: "🤩",  label: "Wow",    color: "#f7c948" },
  { id: "clap",   emoji: "👏",  label: "Clap",   color: "#a78bfa" },
  { id: "rocket", emoji: "🚀",  label: "Rocket", color: "#38bdf8" },
];

const EMPTY_COUNTS: Counts = { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0 };
const SHARED = true;

const fmt = (n: number): string =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

// ── Storage helpers (typed) ───────────────────────────────────────────────────

declare global {
  interface Window {
    storage: {
      get:    (key: string, shared?: boolean) => Promise<{ value: string } | null>;
      set:    (key: string, value: string, shared?: boolean) => Promise<unknown>;
      delete: (key: string, shared?: boolean) => Promise<unknown>;
    };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Particle({ emoji }: { emoji: string }) {
  const left  = 20 + Math.random() * 60;
  const dur   = 1.0 + Math.random() * 0.8;
  const delay = Math.random() * 0.2;
  const size  = 13 + Math.random() * 14;
  return (
    <span style={{
      position: "absolute", pointerEvents: "none", userSelect: "none", zIndex: 999,
      fontSize: size, left: `${left}%`, bottom: 60,
      animation: `lcFloat ${dur}s ${delay}s ease-out forwards`,
    }}>
      {emoji}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoveCounter() {
  const [open, setOpen]             = useState(false);
  const [counts, setCounts]         = useState<Counts>({ ...EMPTY_COUNTS });
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [comment, setComment]       = useState("");
  const [showInput, setShowInput]   = useState(false);
  const [particles, setParticles]   = useState<ParticleItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visitors, setVisitors]     = useState(0);
  const [heartAnim, setHeartAnim]   = useState(false);
  const [mounted, setMounted]       = useState(false);

  const sid      = useRef(`s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  const myR   = REACTIONS.find(r => r.id === myReaction) ?? null;

  // ── Load shared data ────────────────────────────────────────────────────────
  const loadShared = useCallback(async () => {
    try {
      const [cRes, cmRes, vRes] = await Promise.all([
        window.storage.get("lc:counts",   SHARED).catch(() => null),
        window.storage.get("lc:comments", SHARED).catch(() => null),
        window.storage.get("lc:visitors", SHARED).catch(() => null),
      ]);
      if (cRes)  setCounts(JSON.parse(cRes.value) as Counts);
      if (cmRes) setComments(JSON.parse(cmRes.value) as Comment[]);
      if (vRes)  setVisitors(parseInt(vRes.value) || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    setMounted(true);
    const init = async () => {
      // Increment shared visitor count
      try {
        const vRes = await window.storage.get("lc:visitors", SHARED).catch(() => null);
        const next = (vRes ? parseInt(vRes.value) || 0 : 0) + 1;
        await window.storage.set("lc:visitors", String(next), SHARED).catch(() => {});
        setVisitors(next);
      } catch (_) {}
      // Restore this session's reaction (private)
      try {
        const me = await window.storage.get(`lc:me:${sid.current}`).catch(() => null);
        if (me) setMyReaction(me.value);
      } catch (_) {}
      await loadShared();
      setLoading(false);
      pollRef.current = setInterval(loadShared, 4000);
    };
    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadShared]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [open]);

  // ── Handle reaction ─────────────────────────────────────────────────────────
  const handleReact = useCallback(async (id: string) => {
    const r       = REACTIONS.find(r => r.id === id)!;
    const removing = myReaction === id;

    // Optimistic update
    setCounts(prev => {
      const n = { ...prev } as Counts;
      if (removing) {
        (n as any)[id] = Math.max(0, (n as any)[id] - 1);
      } else {
        if (myReaction) (n as any)[myReaction] = Math.max(0, (n as any)[myReaction] - 1);
        (n as any)[id] = (n as any)[id] + 1;
      }
      return n;
    });
    setMyReaction(removing ? null : id);

    if (!removing) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      const ps: ParticleItem[] = Array.from({ length: 6 }, (_, i) => ({
        id: `p${Date.now()}${i}`, emoji: r.emoji,
      }));
      setParticles(p => [...p, ...ps]);
      setTimeout(() => setParticles(p => p.filter(x => !ps.find(n => n.id === x.id))), 2000);
      setTimeout(() => setShowInput(true), 400);
    } else {
      setShowInput(false);
    }

    // Persist to shared storage
    try {
      const latest = await window.storage.get("lc:counts", SHARED).catch(() => null);
      const sc: Counts = latest ? JSON.parse(latest.value) : { ...EMPTY_COUNTS };
      if (!removing) {
        if (myReaction) (sc as any)[myReaction] = Math.max(0, (sc as any)[myReaction] - 1);
        (sc as any)[id] = (sc as any)[id] + 1;
        await window.storage.set(`lc:me:${sid.current}`, id).catch(() => {});
      } else {
        (sc as any)[id] = Math.max(0, (sc as any)[id] - 1);
        await window.storage.delete(`lc:me:${sid.current}`).catch(() => {});
      }
      await window.storage.set("lc:counts", JSON.stringify(sc), SHARED).catch(() => {});
      setCounts(sc);
    } catch (_) {}
  }, [myReaction]);

  // ── Submit comment ──────────────────────────────────────────────────────────
  const submitComment = useCallback(async () => {
    const text = comment.trim();
    if (!text || text.length > 200) return;
    const entry: Comment = {
      id:    Date.now(),
      text,
      emoji: myR?.emoji ?? "💬",
      time:  new Date().toISOString(),
    };
    const updated = [entry, ...comments].slice(0, 50);
    setComments(updated);
    setComment("");
    setShowInput(false);
    await window.storage.set("lc:comments", JSON.stringify(updated), SHARED).catch(() => {});
  }, [comment, comments, myR]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600&display=swap');

        .lc-wrap, .lc-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
        .lc-wrap {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          font-family: 'Sora', sans-serif;
        }

        /* Trigger */
        .lc-trigger {
          width: 56px; height: 56px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, #ff4d6d, #c2185b);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 24px rgba(255,77,109,.45), 0 2px 8px rgba(0,0,0,.3);
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          position: relative; z-index: 2; outline: none;
        }
        .lc-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 32px rgba(255,77,109,.6), 0 2px 8px rgba(0,0,0,.3);
        }
        .lc-trigger.beat  { animation: lcBeat .5s ease; }
        .lc-trigger.open  { transform: scale(0.92); }
        .lc-trigger.idle  { animation: lcPulse 2.5s ease-in-out infinite; }

        /* Badge */
        .lc-badge {
          position: absolute; top: -6px; left: -6px;
          background: #fff; color: #ff4d6d;
          font-size: 10px; font-weight: 600; border-radius: 100px;
          padding: 2px 6px; min-width: 20px; text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
          animation: lcPop .3s ease;
          font-family: 'Sora', sans-serif;
        }

        /* Panel */
        .lc-panel {
          position: absolute; bottom: 68px; right: 0; width: 340px;
          background: rgba(13,13,18,.97);
          border: 1px solid rgba(255,255,255,.08); border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
          transform-origin: bottom right;
          transition: transform .35s cubic-bezier(.34,1.4,.64,1), opacity .25s ease;
        }
        .lc-panel.closed  { transform: scale(0.6) translateY(20px); opacity: 0; pointer-events: none; }
        .lc-panel.opened  { transform: scale(1) translateY(0); opacity: 1; }

        /* Header */
        .lc-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          background: linear-gradient(180deg, rgba(255,77,109,.08) 0%, transparent 100%);
        }
        .lc-title { font-size: 15px; font-weight: 600; color: #eae6df; letter-spacing: -.2px; }
        .lc-sub   { font-size: 11px; color: rgba(234,230,223,.38); margin-top: 3px; letter-spacing: .2px; }

        /* Reactions row */
        .lc-reactions {
          display: flex; gap: 6px; padding: 16px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          overflow-x: auto; scrollbar-width: none;
        }
        .lc-reactions::-webkit-scrollbar { display: none; }

        .lc-rb {
          flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px; padding: 10px 12px; cursor: pointer;
          transition: all .2s cubic-bezier(.34,1.56,.64,1);
          min-width: 60px; outline: none;
        }
        .lc-rb:hover { transform: translateY(-3px) scale(1.08); }
        .lc-rb.on    { transform: translateY(-2px) scale(1.05); }
        .lc-rb .em   { font-size: 22px; line-height: 1; }
        .lc-rb.on .em{ animation: lcBeat .4s ease; }
        .lc-rb .ct   { font-size: 11px; font-weight: 600; color: rgba(234,230,223,.4); }
        .lc-rb.on .ct{ animation: lcPop .3s ease; }
        .lc-rb .lb   { font-size: 9px; color: rgba(234,230,223,.3); letter-spacing: .3px; }

        /* Comments */
        .lc-comments {
          max-height: 190px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.08) transparent;
        }
        .lc-comments::-webkit-scrollbar       { width: 3px; }
        .lc-comments::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

        .lc-comment {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 16px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          animation: lcSlide .3s ease;
        }
        .lc-comment:last-child { border-bottom: none; }
        .lc-comment .em2 { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .lc-comment .txt { font-size: 12px; color: rgba(234,230,223,.8); line-height: 1.5; }
        .lc-comment .ts  { font-size: 10px; color: rgba(234,230,223,.25); margin-top: 3px; }

        /* Input */
        .lc-input-wrap {
          padding: 12px 16px 14px;
          border-top: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.02);
          animation: lcSlide .3s ease;
        }
        .lc-ta {
          width: 100%; background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.09); border-radius: 12px;
          padding: 9px 12px; color: #eae6df;
          font-family: 'Sora', sans-serif; font-size: 12px;
          resize: none; outline: none; transition: border-color .2s; line-height: 1.5;
        }
        .lc-ta:focus       { border-color: rgba(255,77,109,.4); }
        .lc-ta::placeholder{ color: rgba(234,230,223,.28); }

        .lc-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .lc-send {
          background: linear-gradient(135deg, #ff4d6d, #c2185b); color: #fff;
          border: none; border-radius: 10px; padding: 7px 16px;
          font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s;
        }
        .lc-send:hover     { filter: brightness(1.1); transform: scale(1.04); }
        .lc-send:disabled  { opacity: .4; cursor: not-allowed; transform: none; }
        .lc-skip {
          background: none; border: none; color: rgba(234,230,223,.28);
          font-family: 'Sora', sans-serif; font-size: 11px;
          cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color .15s;
        }
        .lc-skip:hover { color: rgba(234,230,223,.55); }

        .lc-empty {
          padding: 24px 16px; text-align: center;
          color: rgba(234,230,223,.2); font-size: 12px; line-height: 1.6;
        }
        .lc-footer {
          padding: 8px 16px; text-align: center;
          font-size: 10px; color: rgba(234,230,223,.16);
          border-top: 1px solid rgba(255,255,255,.04); letter-spacing: .3px;
        }

        /* Keyframes */
        @keyframes lcBeat  {
          0%,100%{ transform: scale(1); }
          30%    { transform: scale(1.3); }
          65%    { transform: scale(1.1); }
        }
        @keyframes lcPop   {
          0%,100%{ transform: scale(1); }
          50%    { transform: scale(1.45); }
        }
        @keyframes lcSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lcFloat {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          80%  { opacity: .8; }
          100% { transform: translateY(-90px) scale(.4); opacity: 0; }
        }
        @keyframes lcPulse {
          0%,100%{ box-shadow: 0 4px 24px rgba(255,77,109,.45), 0 2px 8px rgba(0,0,0,.3); }
          50%    { box-shadow: 0 4px 32px rgba(255,77,109,.7),  0 2px 8px rgba(0,0,0,.3); }
        }
        @keyframes lcLive  {
          0%,100%{ opacity: .4; transform: scale(1); }
          50%    { opacity: 1;  transform: scale(1.5); }
        }
      `}</style>

      <div className="lc-wrap" ref={panelRef}>

        {/* Floating particles */}
        {particles.map(p => <Particle key={p.id} emoji={p.emoji} />)}

        {/* ── Slide-up panel ──────────────────────────────────────────── */}
        <div className={`lc-panel ${open ? "opened" : "closed"}`}>

          {/* Header */}
          <div className="lc-header">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div className="lc-title">
                  {loading ? "Loading…" : `${fmt(total)} reaction${total !== 1 ? "s" : ""}`}
                  {myR && <span style={{ marginLeft: 6 }}>{myR.emoji}</span>}
                </div>
                <div className="lc-sub">
                  {loading ? "—" : `${fmt(visitors)} visitor${visitors !== 1 ? "s" : ""} · live`}
                </div>
              </div>
              {/* Live indicator */}
              <div style={{ display:"flex", alignItems:"center", gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#30D158",
                  boxShadow: "0 0 6px #30D158",
                  animation: "lcLive 1.8s ease-in-out infinite",
                }}/>
                <span style={{ fontSize: 10, color:"rgba(234,230,223,.3)", letterSpacing: 1.5 }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Reaction buttons */}
          <div className="lc-reactions">
            {REACTIONS.map(r => {
              const on = myReaction === r.id;
              return (
                <button
                  key={r.id}
                  className={`lc-rb${on ? " on" : ""}`}
                  onClick={() => handleReact(r.id)}
                  disabled={loading}
                  title={r.label}
                  style={{
                    background:   on ? `linear-gradient(135deg,${r.color}28,${r.color}0a)` : "rgba(255,255,255,.04)",
                    borderColor:  on ? `${r.color}60` : "rgba(255,255,255,.07)",
                    boxShadow:    on ? `0 0 18px ${r.color}20` : "none",
                  }}
                >
                  <span className="em">{r.emoji}</span>
                  <span className="ct" style={{ color: on ? r.color : "rgba(234,230,223,.4)" }}>
                    {loading ? "·" : fmt(counts[r.id as keyof Counts])}
                  </span>
                  <span className="lb">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Comment input */}
          {showInput && myReaction && (
            <div className="lc-input-wrap">
              <textarea
                className="lc-ta"
                rows={2}
                maxLength={200}
                placeholder={`Leave a note for visitors… ${myR?.emoji ?? ""}`}
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                autoFocus
              />
              <div className="lc-actions">
                <span style={{ fontSize: 10, color: "rgba(234,230,223,.25)" }}>{comment.length}/200</span>
                <div style={{ display:"flex", gap: 6 }}>
                  <button className="lc-skip" onClick={() => { setShowInput(false); setComment(""); }}>Skip</button>
                  <button className="lc-send" onClick={submitComment} disabled={!comment.trim()}>
                    Post ✉️
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My reaction — add note link */}
          {myReaction && !showInput && (
            <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,.05)", textAlign:"right" }}>
              <button
                onClick={() => setShowInput(true)}
                style={{ background:"none", border:"none", color:"rgba(234,230,223,.3)", fontSize:11, cursor:"pointer", textDecoration:"underline" }}
              >
                + add a note
              </button>
            </div>
          )}

          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="lc-comments">
              {comments.map(c => (
                <div key={c.id} className="lc-comment">
                  <span className="em2">{c.emoji}</span>
                  <div>
                    <div className="txt">{c.text}</div>
                    <div className="ts">
                      {new Date(c.time).toLocaleDateString("en-US", {
                        month:"short", day:"numeric", hour:"2-digit", minute:"2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !showInput && (
            <div className="lc-empty">
              No notes yet.<br />Be the first to leave one 💌
            </div>
          )}

          <div className="lc-footer">Reactions &amp; notes shared across all visitors</div>
        </div>

        {/* ── Heart trigger button ─────────────────────────────────────── */}
        <button
          className={`lc-trigger ${heartAnim ? "beat" : ""} ${open ? "open" : "idle"}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Reactions"
          title="Leave a reaction"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <span style={{ fontSize: 24, display:"block", lineHeight: 1 }}>❤️</span>
          )}

          {/* Count badge */}
          {!open && total > 0 && (
            <span className="lc-badge">{fmt(total)}</span>
          )}
        </button>
      </div>
    </>
  );
}