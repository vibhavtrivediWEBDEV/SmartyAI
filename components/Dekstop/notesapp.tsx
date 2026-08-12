import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

// ─── VAPI CONFIG ────────────────────────────────────────────────────────────
const VAPI_PUBLIC_KEY = "YOUR_VAPI_PUBLIC_KEY"; // Replace with your key

const CallStatus = {
    IDLE: "IDLE",
    CONNECTING: "CONNECTING",
    ACTIVE: "ACTIVE",
    ENDING: "ENDING",
};

// ─── REUSABLE HOOK: useFormFields ────────────────────────────────────────────
// Pass an array of field configs → returns values, handlers, reset, and rendered fields
function useFormFields(fieldConfigs) {
    const initial = Object.fromEntries(fieldConfigs.map((f) => [f.key, f.default ?? ""]));
    const [values, setValues] = useState(initial);

    const handleChange = useCallback((key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const reset = useCallback(() => setValues(initial), []);

    const isValid = fieldConfigs
        .filter((f) => f.required)
        .every((f) => values[f.key]?.trim());

    // Rendered field components
    const renderFields = (theme = "dark") =>
        fieldConfigs.map((field) => {
            const base = {
                width: "100%",
                background: "rgba(255,255,255,0.07)",
                border: `1px solid rgba(255,255,255,${theme === "dark" ? "0.12" : "0.25"})`,
                borderRadius: "10px",
                padding: field.type === "textarea" ? "10px 14px" : "10px 14px",
                color: "#fff",
                fontSize: field.type === "textarea" ? "14px" : "15px",
                fontFamily: "inherit",
                outline: "none",
                resize: "none",
                transition: "border-color 0.2s, background 0.2s",
                boxSizing: "border-box",
            };

            return (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {field.label && (
                        <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                            {field.label}
                        </label>
                    )}
                    {field.type === "textarea" ? (
                        <textarea
                            rows={field.rows ?? 5}
                            placeholder={field.placeholder ?? ""}
                            value={values[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            style={base}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.35)")}
                            onBlur={(e) => (e.target.style.borderColor = `rgba(255,255,255,${theme === "dark" ? "0.12" : "0.25"})`)}
                        />
                    ) : (
                        <input
                            type={field.type ?? "text"}
                            placeholder={field.placeholder ?? ""}
                            value={values[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            style={base}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.35)")}
                            onBlur={(e) => (e.target.style.borderColor = `rgba(255,255,255,${theme === "dark" ? "0.12" : "0.25"})`)}
                        />
                    )}
                </div>
            );
        });

    return { values, handleChange, reset, isValid, renderFields };
}

// ─── HOOK: useVoice ──────────────────────────────────────────────────────────
// function useVoice({ onNoteCreate }) {
//     const vapiRef = useRef(null);
//     const [callStatus, setCallStatus] = useState(CallStatus.IDLE);
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [log, setLog] = useState([]);

//     const addLog = (msg) => setLog((p) => [...p.slice(-19), `${new Date().toLocaleTimeString()} ${msg}`]);

//     useEffect(() => {
//         let vapi;
//         (async () => {
//             try {
//                 const { default: Vapi } = await import("https://cdn.jsdelivr.net/npm/@vapi-ai/web/dist/vapi.js");
//                 vapi = new Vapi(VAPI_PUBLIC_KEY);
//                 vapi.on("call-start", () => { setCallStatus(CallStatus.ACTIVE); addLog("✅ Call started"); });
//                 vapi.on("call-end", () => { setCallStatus(CallStatus.IDLE); setIsSpeaking(false); addLog("📴 Call ended"); });
//                 vapi.on("speech-start", () => setIsSpeaking(true));
//                 vapi.on("speech-end", () => setIsSpeaking(false));
//                 vapi.on("message", (msg) => {
//                     if (msg.type === "function-call" && msg.functionCall?.name === "createNote") {
//                         const { subject, message } = msg.functionCall.parameters ?? {};
//                         if (subject && message) onNoteCreate({ subject, message });
//                         addLog(`📝 Note created: "${subject}"`);
//                     }
//                 });
//                 vapi.on("error", (e) => addLog(`❌ ${e?.message ?? e}`));
//                 vapiRef.current = vapi;
//             } catch (e) {
//                 addLog("⚠️ Vapi not loaded – check key");
//             }
//         })();
//         return () => vapiRef.current?.stop();
//     }, []);

//     const startCall = async () => {
//         if (!vapiRef.current) return addLog("⚠️ Vapi not initialized");
//         setCallStatus(CallStatus.CONNECTING);
//         addLog("📞 Connecting...");
//         try {
//             await vapiRef.current.start({
//                 transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
//                 model: {
//                     provider: "openai", model: "gpt-4o",
//                     systemPrompt: `You are a voice assistant for a Notes app. When the user wants to create a note, call the createNote function with subject and message. Be concise.`,
//                     functions: [{
//                         name: "createNote",
//                         description: "Create a new note",
//                         parameters: {
//                             type: "object",
//                             properties: {
//                                 subject: { type: "string", description: "Note title/subject" },
//                                 message: { type: "string", description: "Note body content" },
//                             },
//                             required: ["subject", "message"],
//                         },
//                     }],
//                 },
//                 voice: { provider: "11labs", voiceId: "rachel" },
//                 name: "Notes Assistant",
//             });
//         } catch (e) {
//             setCallStatus(CallStatus.IDLE);
//             addLog(`❌ ${e?.message ?? e}`);
//         }
//     };

//     const endCall = () => {
//         addLog("📞 Ending...");
//         setCallStatus(CallStatus.ENDING);
//         vapiRef.current?.stop();
//     };

//     return { callStatus, isSpeaking, log, startCall, endCall, isActive: callStatus === CallStatus.ACTIVE };
// }

// ─── COLORS ──────────────────────────────────────────────────────────────────
const ACCENT_COLORS = [
    { name: "Gold", hex: "#F5A623", glow: "rgba(245,166,35,0.35)" },
    { name: "Rose", hex: "#FF6B8A", glow: "rgba(255,107,138,0.35)" },
    { name: "Mint", hex: "#34D399", glow: "rgba(52,211,153,0.35)" },
    { name: "Sky", hex: "#38BDF8", glow: "rgba(56,189,248,0.35)" },
    { name: "Violet", hex: "#A78BFA", glow: "rgba(167,139,250,0.35)" },
];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "premium_notes_v1";
const loadNotes = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; } catch { return []; } };
const saveNotes = (n) => localStorage.setItem(STORAGE_KEY, JSON.stringify(n));

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PremiumNotes() {
    const [notes, setNotes] = useState(loadNotes);
    const [activeId, setActiveId] = useState(null);
    const [search, setSearch] = useState("");
    const [accent, setAccent] = useState(ACCENT_COLORS[0]);
    const [showVoicePanel, setShowVoicePanel] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingBody, setEditingBody] = useState("");

    // ── Reusable form fields hook for new-note modal (subject + message)
    const noteForm = useFormFields([
        { key: "subject", label: "Subject", placeholder: "Note title…", required: true },
        { key: "message", label: "Message", placeholder: "Write something beautiful…", type: "textarea", rows: 6, required: true },
    ]);

    // refs for GSAP
    const sidebarRef = useRef();
    const editorRef = useRef();
    const modalRef = useRef();
    const modalOverlayRef = useRef();
    const headerRef = useRef();
    const voicePanelRef = useRef();

    const activeNote = notes.find((n) => n.id === activeId);
    const filtered = notes.filter(
        (n) => n.subject.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
    );

    // ── Persist
    useEffect(() => saveNotes(notes), [notes]);

    // ── Mount animation
    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(headerRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
            .fromTo(sidebarRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.4")
            .fromTo(editorRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.5");
    }, []);

    // ── When active note changes – animate editor
    useEffect(() => {
        if (!editorRef.current) return;
        gsap.fromTo(editorRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
        setEditingBody(activeNote?.message ?? "");
    }, [activeId]);

    // ── Modal open/close
    const openModal = () => {
        setShowNewModal(true);
        noteForm.reset();
        requestAnimationFrame(() => {
            gsap.fromTo(modalOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
            gsap.fromTo(modalRef.current, { scale: 0.88, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" });
        });
    };

    const closeModal = () => {
        const tl = gsap.timeline({ onComplete: () => setShowNewModal(false) });
        tl.to(modalRef.current, { scale: 0.9, opacity: 0, y: 20, duration: 0.25, ease: "power2.in" })
            .to(modalOverlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
    };

    // ── Create note
    const createNote = ({ subject, message }) => {
        const note = { id: Date.now(), subject: subject.trim(), message: message.trim(), createdAt: new Date().toISOString(), color: accent.hex };
        setNotes((p) => [note, ...p]);
        setActiveId(note.id);
        // animate new sidebar item after render
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-note-id="${note.id}"]`);
            if (el) gsap.fromTo(el, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
        });
    };

    const handleFormSubmit = () => {
        if (!noteForm.isValid) return;
        createNote(noteForm.values);
        closeModal();
    };

    const deleteNote = (id, e) => {
        e.stopPropagation();
        const el = document.querySelector(`[data-note-id="${id}"]`);
        const finish = () => {
            setNotes((p) => p.filter((n) => n.id !== id));
            if (activeId === id) setActiveId(null);
        };
        if (el) gsap.to(el, { x: -40, opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.3, ease: "power2.in", onComplete: finish });
        else finish();
    };

    const saveBody = () => {
        if (!activeNote) return;
        setNotes((p) => p.map((n) => (n.id === activeId ? { ...n, message: editingBody } : n)));
        // flash saved
        const el = editorRef.current?.querySelector(".save-btn");
        if (el) gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "elastic.out(1.4,0.5)" });
    };

    // ── Voice
    // const voice = useVoice({ onNoteCreate: createNote });

    const toggleVoice = () => {
        const next = !showVoicePanel;
        setShowVoicePanel(next);
        requestAnimationFrame(() => {
            if (next && voicePanelRef.current) {
                gsap.fromTo(voicePanelRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
            }
        });
    };

    // ── Accent color switch animation
    const changeAccent = (a) => {
        gsap.to("body", { duration: 0 }); // no-op trigger
        setAccent(a);
    };

    const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // ─── STYLES
    const css = {
        root: {
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0d0d14 100%)",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            color: "#fff",
            overflow: "hidden",
        },
        header: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            zIndex: 10,
        },
        body: { display: "flex", flex: 1, overflow: "hidden" },
        sidebar: {
            width: "280px",
            flexShrink: 0,
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(30px)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        },
        editor: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.018)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            position: "relative",
        },
        noteCard: (isActive, color) => ({
            padding: "12px 14px",
            cursor: "pointer",
            borderRadius: "12px",
            margin: "4px 8px",
            background: isActive ? `rgba(${hexToRgb(color)},0.18)` : "transparent",
            border: isActive ? `1px solid rgba(${hexToRgb(color)},0.35)` : "1px solid transparent",
            transition: "background 0.2s, border 0.2s",
            position: "relative",
            overflow: "hidden",
        }),
        colorDot: (color) => ({
            width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
        }),
        accentBtn: (a) => ({
            width: 20, height: 20, borderRadius: "50%",
            background: a.hex,
            border: accent.name === a.name ? `2px solid #fff` : "2px solid transparent",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: accent.name === a.name ? `0 0 10px ${a.glow}` : "none",
        }),
        btn: (primary) => ({
            padding: "8px 16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            background: primary ? accent.hex : "rgba(255,255,255,0.1)",
            color: primary ? "#000" : "#fff",
            transition: "opacity 0.2s, transform 0.15s",
            letterSpacing: "0.02em",
        }),
        iconBtn: {
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            borderRadius: "10px",
            width: 36, height: 36,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
            transition: "background 0.2s",
        },
        textarea: {
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "rgba(255,255,255,0.88)",
            fontSize: "15px",
            lineHeight: "1.75",
            padding: "20px 28px",
            fontFamily: "inherit",
            resize: "none",
        },
        glassCard: {
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
        },
    };

    return (
        <div style={css.root}>
            {/* ── HEADER */}
            <header ref={headerRef} style={css.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Traffic lights */}
                    {/* <div style={{ display: "flex", gap: 7 }}>
                        {["#FF5F57", "#FFBD2E", "#28CA41"].map((c) => (
                            <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}80` }} />
                        ))}
                    </div> */}
                    <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em", marginLeft: 8 }}>
                        ✦ Notes
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Color picker */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "30px", padding: "5px 10px" }}>
                        {ACCENT_COLORS.map((a) => (
                            <button key={a.name} onClick={() => changeAccent(a)} style={css.accentBtn(a)}
                                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.25, duration: 0.2 })}
                                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                            />
                        ))}
                    </div>

                    {/* Voice btn */}
                    <button onClick={toggleVoice} style={{ ...css.iconBtn, background: showVoicePanel ? `rgba(${hexToRgb(accent.hex)},0.3)` : "rgba(255,255,255,0.08)", border: `1px solid ${showVoicePanel ? accent.hex : "rgba(255,255,255,0.1)"}` }}
                        onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.08, duration: 0.15 })}
                        onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15 })}>
                        🎙
                    </button>

                    {/* New note */}
                    <button onClick={openModal} style={{ ...css.btn(true), boxShadow: `0 4px 20px ${accent.glow}` }}
                        onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.04, duration: 0.15 })}
                        onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15 })}>
                        + New Note
                    </button>
                </div>
            </header>

            {/* ── BODY */}
            <div style={css.body}>
                {/* ── SIDEBAR */}
                <aside ref={sidebarRef} style={css.sidebar}>
                    {/* Search */}
                    <div style={{ padding: "12px 12px 4px" }}>
                        <input
                            placeholder="🔍  Search notes…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 12px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ padding: "8px 14px 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                        {filtered.length} Note{filtered.length !== 1 ? "s" : ""}
                    </div>

                    {/* Note list */}
                    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
                        {filtered.length === 0 && (
                            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 40, lineHeight: 1.8 }}>
                                No notes yet.<br />
                                <span style={{ fontSize: 24 }}>✦</span>
                            </div>
                        )}
                        {filtered.map((note) => (
                            <div
                                key={note.id}
                                data-note-id={note.id}
                                onClick={() => setActiveId(note.id)}
                                style={css.noteCard(activeId === note.id, note.color)}
                                onMouseEnter={(e) => { if (activeId !== note.id) gsap.to(e.currentTarget, { background: "rgba(255,255,255,0.06)", duration: 0.15 }); }}
                                onMouseLeave={(e) => { if (activeId !== note.id) gsap.to(e.currentTarget, { background: "transparent", duration: 0.15 }); }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    <div style={{ ...css.colorDot(note.color), marginTop: 5 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: activeId === note.id ? "#fff" : "rgba(255,255,255,0.85)" }}>
                                            {note.subject}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {note.message.slice(0, 50)}{note.message.length > 50 ? "…" : ""}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{formatDate(note.createdAt)}</div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteNote(note.id, e)}
                                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5F57")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ── EDITOR */}
                <main ref={editorRef} style={css.editor}>
                    {activeNote ? (
                        <>
                            {/* Editor header */}
                            <div style={{ padding: "20px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>{activeNote.subject}</h2>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{formatDate(activeNote.createdAt)}</div>
                                    </div>
                                    <button className="save-btn" onClick={saveBody} style={{ ...css.btn(true), boxShadow: `0 4px 16px ${accent.glow}` }}>
                                        Save
                                    </button>
                                </div>
                            </div>
                            <textarea
                                style={css.textarea}
                                value={editingBody}
                                onChange={(e) => setEditingBody(e.target.value)}
                                placeholder="Start writing…"
                            />
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.18)", userSelect: "none" }}>
                            <div style={{ fontSize: 64, marginBottom: 16, filter: `drop-shadow(0 0 20px ${accent.glow})` }}>✦</div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>Select a note or create one</div>
                            <div style={{ fontSize: 13, marginTop: 6 }}>Your thoughts, beautifully organized</div>
                        </div>
                    )}
                </main>
            </div>

            {/* ── VOICE PANEL */}
            {showVoicePanel && (
                <div ref={voicePanelRef} style={{ position: "fixed", bottom: 24, right: 24, width: 320, ...css.glassCard, padding: 20, zIndex: 100, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>🎙 Voice Assistant</span>
                        <button onClick={() => setShowVoicePanel(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18 }}>×</button>
                    </div>

                    {/* Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: voice.callStatus === CallStatus.ACTIVE ? "#28CA41" : voice.callStatus === CallStatus.CONNECTING ? "#FFBD2E" : "rgba(255,255,255,0.2)", boxShadow: voice.callStatus === CallStatus.ACTIVE ? "0 0 10px #28CA41" : "none", transition: "all 0.3s" }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                            {voice.callStatus === CallStatus.ACTIVE ? (voice.isSpeaking ? "Speaking…" : "Listening…") : voice.callStatus === CallStatus.CONNECTING ? "Connecting…" : "Ready"}
                        </span>
                    </div>

                    {/* Wave animation when active */}
                    {voice.callStatus === CallStatus.ACTIVE && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 30, marginBottom: 14 }}>
                            {[...Array(12)].map((_, i) => (
                                <VoiceBar key={i} index={i} active={voice.isSpeaking} color={accent.hex} />
                            ))}
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {voice.callStatus === CallStatus.IDLE || voice.callStatus === CallStatus.ENDING ? (
                            <button onClick={voice.startCall} style={{ ...css.btn(true), flex: 1, boxShadow: `0 4px 16px ${accent.glow}` }}>Start</button>
                        ) : (
                            <button onClick={voice.endCall} style={{ ...css.btn(false), flex: 1, background: "rgba(255,95,87,0.3)", border: "1px solid rgba(255,95,87,0.5)" }}>End Call</button>
                        )}
                    </div>

                    {/* Log */}
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px", maxHeight: 100, overflowY: "auto", fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                        {voice.log.length === 0 ? "No activity yet…" : voice.log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </div>
            )}

            {/* ── NEW NOTE MODAL - z-index below cursor (2147483647) */}
            {showNewModal && (
                <div ref={modalOverlayRef} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2147483630 }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div ref={modalRef} style={{ width: 480, ...css.glassCard, padding: "28px 28px 24px", boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px ${accent.glow}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em" }}>New Note</h3>
                            <button onClick={closeModal} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
                        </div>

                        {/* Rendered fields from hook */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {noteForm.renderFields("dark")}
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
                            <button onClick={closeModal} style={css.btn(false)}>Cancel</button>
                            <button
                                onClick={handleFormSubmit}
                                disabled={!noteForm.isValid}
                                style={{ ...css.btn(true), opacity: noteForm.isValid ? 1 : 0.4, boxShadow: noteForm.isValid ? `0 4px 20px ${accent.glow}` : "none" }}
                                onMouseEnter={(e) => noteForm.isValid && gsap.to(e.currentTarget, { scale: 1.04, duration: 0.15 })}
                                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15 })}
                            >
                                Create Note ✦
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes voicePulse { 0%,100% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } }
      `}</style>
        </div>
    );
}

// ─── VOICE BAR COMPONENT ─────────────────────────────────────────────────────
function VoiceBar({ index, active, color }) {
    const ref = useRef();
    useEffect(() => {
        if (!ref.current) return;
        if (active) {
            gsap.to(ref.current, {
                scaleY: gsap.utils.random(0.3, 1),
                duration: gsap.utils.random(0.3, 0.6),
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: index * 0.06,
            });
        } else {
            gsap.to(ref.current, { scaleY: 0.2, duration: 0.4, ease: "power2.out" });
        }
        return () => gsap.killTweensOf(ref.current);
    }, [active]);

    return (
        <div ref={ref} style={{ width: 3, height: "100%", borderRadius: 3, background: color, transformOrigin: "center", transform: "scaleY(0.2)", opacity: 0.8 }} />
    );
}

// ─── UTIL ─────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}