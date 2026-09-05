import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, Dumbbell, Sparkles, Target } from "lucide-react";
import { CareerTaskMeta, useCareerClock } from "../Desktop/CareerTaskMeta";
import { groupCareerTasks, type CareerTaskItem } from "../Desktop/careerTaskGroups";

interface PreparationBrief {
    summary: string;
    objective: string;
    agenda: Array<{ title: string; detail: string; minutes: number }>;
    keyConcepts: Array<{ name: string; explanation: string }>;
    practice: Array<{ task: string; expectedOutcome: string }>;
    completionCriteria: string[];
    encouragement: string;
}

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

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "premium_notes_v1";
const loadNotes = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; } catch { return []; } };
const saveNotes = (n) => localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateKey = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDateGroup = (iso) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return formatDate(iso);
};

const stripLeadingMarkdownTitle = (content) => content.replace(/^\s*#\s+[^\n]+\n+/, "").trim();

function AiNoteArtifact({ note }) {
    const content = stripLeadingMarkdownTitle(note.message);
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <>
            <div style={{ padding: "20px 32px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(180deg, color-mix(in srgb, var(--theme-primary-color) 9%, transparent), transparent)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, color: "var(--theme-primary-color)", fontSize: 10, fontWeight: 750, textTransform: "uppercase" }}>
                    <Sparkles size={13} /> AI-prepared note
                </div>
                <h2 style={{ margin: 0, maxWidth: 860, color: "#fff", fontSize: 24, fontWeight: 720, lineHeight: 1.25 }}>{note.subject}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 9, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    <span>{formatDate(note.createdAt)}</span>
                    <span>{readingMinutes} min read</span>
                    <span>{wordCount} words</span>
                </div>
            </div>
            <article className="ai-note-artifact">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => <h2>{children}</h2>,
                        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
                        input: ({ checked }) => <input type="checkbox" checked={checked} readOnly />,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </article>
        </>
    );
}

function PreparationBriefView({ task, brief, loading, error, onRetry }) {
    const scheduledDate = new Date(task.scheduledDate);

    return (
        <>
            <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ marginBottom: 8, color: "var(--theme-primary-color)", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Preparation brief</div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>{task.title}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, color: "rgba(255,255,255,0.42)", fontSize: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock3 size={13} />{scheduledDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    <span>{task.duration || 60} minutes</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
                {loading && (
                    <div style={{ minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
                        <div style={{ width: 28, height: 28, border: "2px solid rgba(255,255,255,0.12)", borderTopColor: "var(--theme-primary-color)", borderRadius: "50%", animation: "notesBriefSpin 0.8s linear infinite" }} />
                        <div style={{ marginTop: 14, fontSize: 13 }}>Building your preparation brief...</div>
                    </div>
                )}

                {!loading && error && (
                    <div style={{ padding: 18, background: "rgba(255,95,87,0.08)", border: "1px solid rgba(255,95,87,0.22)", borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.76)" }}>{error}</div>
                        <button onClick={onRetry} style={{ marginTop: 12, padding: "7px 12px", border: "none", borderRadius: 7, background: "var(--theme-primary-color)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Try again</button>
                    </div>
                )}

                {!loading && brief && (
                    <div style={{ maxWidth: 820, margin: "0 auto" }}>
                        <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.68)", fontSize: 15, lineHeight: 1.75 }}>{brief.summary}</p>

                        <section style={{ marginBottom: 28, padding: 18, background: "var(--theme-primary-soft)", border: "1px solid color-mix(in srgb, var(--theme-primary-color) 30%, transparent)", borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, color: "var(--theme-primary-color)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}><Target size={15} /> Objective</div>
                            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 1.65 }}>{brief.objective}</div>
                        </section>

                        <BriefSection icon={<Clock3 size={16} />} title="Session plan">
                            {brief.agenda.map((item, index) => (
                                <div key={`${item.title}-${index}`} style={{ display: "grid", gridTemplateColumns: "42px minmax(0, 1fr)", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ color: "var(--theme-primary-color)", fontSize: 11, fontWeight: 700 }}>{item.minutes}m</div>
                                    <div><div style={{ marginBottom: 4, color: "#fff", fontSize: 14, fontWeight: 650 }}>{item.title}</div><div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6 }}>{item.detail}</div></div>
                                </div>
                            ))}
                        </BriefSection>

                        <BriefSection icon={<BookOpen size={16} />} title="Key concepts">
                            {brief.keyConcepts.map((concept) => (
                                <div key={concept.name} style={{ padding: "11px 0" }}><div style={{ color: "#fff", fontSize: 14, fontWeight: 650 }}>{concept.name}</div><div style={{ marginTop: 5, color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.65 }}>{concept.explanation}</div></div>
                            ))}
                        </BriefSection>

                        <BriefSection icon={<Dumbbell size={16} />} title="Practice">
                            {brief.practice.map((item, index) => (
                                <div key={index} style={{ marginBottom: 10, padding: 14, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}><div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.55 }}>{item.task}</div><div style={{ marginTop: 7, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Result: {item.expectedOutcome}</div></div>
                            ))}
                        </BriefSection>

                        <BriefSection icon={<CheckCircle2 size={16} />} title="Done when">
                            {brief.completionCriteria.map((criterion) => (
                                <div key={criterion} style={{ display: "flex", gap: 9, padding: "6px 0", color: "rgba(255,255,255,0.68)", fontSize: 13, lineHeight: 1.55 }}><CheckCircle2 size={15} style={{ marginTop: 2, color: "var(--theme-primary-color)", flexShrink: 0 }} />{criterion}</div>
                            ))}
                        </BriefSection>

                        <div style={{ marginTop: 30, color: "rgba(255,255,255,0.42)", fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>{brief.encouragement}</div>
                    </div>
                )}
            </div>
        </>
    );
}

function BriefSection({ icon, title, children }) {
    return <section style={{ marginBottom: 28 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700 }}>{icon}{title}</div>{children}</section>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
interface PremiumNotesProps {
    initialCareerTask?: CareerTaskItem;
    initialCareerTaskId?: string;
}

export default function PremiumNotes({ initialCareerTask, initialCareerTaskId }: PremiumNotesProps = {}) {
    const [notes, setNotes] = useState(loadNotes);
    const [activeId, setActiveId] = useState(null);
    const [search, setSearch] = useState("");
    const [showVoicePanel, setShowVoicePanel] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingBody, setEditingBody] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => initialCareerTask ? dateKey(initialCareerTask.scheduledDate) : dateKey(new Date()));
    const [roadmapOpen, setRoadmapOpen] = useState(true);
    const [careerTasks, setCareerTasks] = useState<CareerTaskItem[]>([]);
    const [selectedCareerTask, setSelectedCareerTask] = useState<CareerTaskItem | null>(initialCareerTask ?? null);
    const [preparationBriefs, setPreparationBriefs] = useState<Record<string, PreparationBrief>>({});
    const [briefLoading, setBriefLoading] = useState(false);
    const [briefError, setBriefError] = useState("");
    const now = useCareerClock();
    const todayCareerTasks = useMemo(
        () => groupCareerTasks(careerTasks.filter((task) => task.status !== "completed"), now)
            .find((group) => group.state === "current")?.tasks ?? [],
        [careerTasks, now]
    );
    const themeAccent = "var(--theme-primary-color)";
    const themeGlow = "color-mix(in srgb, var(--theme-primary-color) 35%, transparent)";

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
    const briefRequestRef = useRef(0);
    const openedInitialTaskRef = useRef<string | null>(null);

    const activeNote = notes.find((n) => n.id === activeId);
    const filtered = useMemo(() => notes
        .filter((note) => dateKey(note.createdAt) === selectedDate)
        .filter((note) => note.subject.toLowerCase().includes(search.toLowerCase()) || note.message.toLowerCase().includes(search.toLowerCase()))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()), [notes, search, selectedDate]);
    const notesByDate = useMemo(() => filtered.reduce((groups, note) => {
            const date = formatDateGroup(note.createdAt);
            (groups[date] ||= []).push(note);
            return groups;
        }, {}), [filtered]);

    // ── Persist
    useEffect(() => saveNotes(notes), [notes]);

    // ── Load Career Agent notes persisted in MongoDB
    useEffect(() => {
        let cancelled = false;

        fetch('/api/career/notes')
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load career notes')))
            .then(({ notes: careerNotes }) => {
                if (cancelled || !Array.isArray(careerNotes)) return;
                setNotes((current) => {
                    const existingIds = new Set(current.map((note) => String(note.id)));
                    return [...careerNotes.filter((note) => !existingIds.has(String(note.id))), ...current];
                });
            })
            .catch(() => undefined);

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (selectedCareerTask || filtered.some((note) => note.id === activeId)) return;
        setActiveId(filtered[0]?.id ?? null);
    }, [activeId, filtered, selectedCareerTask]);

    useEffect(() => {
        const loadCareerTasks = async () => {
            const response = await fetch('/api/career/tasks');
            if (!response.ok) return;
            const result = await response.json();
            setCareerTasks(Array.isArray(result.tasks) ? result.tasks : []);
        };
        void loadCareerTasks();
        const handleProgress = () => void loadCareerTasks();
        window.addEventListener('career-progress', handleProgress);
        return () => window.removeEventListener('career-progress', handleProgress);
    }, []);

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
        const note = { id: Date.now(), subject: subject.trim(), message: message.trim(), createdAt: new Date().toISOString(), color: themeAccent };
        setNotes((p) => [note, ...p]);
        setSelectedDate(dateKey(note.createdAt));
        setSelectedCareerTask(null);
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

    const openCareerTask = async (task: CareerTaskItem, force = false) => {
        const requestId = ++briefRequestRef.current;
        setSelectedCareerTask(task);
        setActiveId(null);
        setBriefError("");
        if (!force && preparationBriefs[task.id]) {
            setBriefLoading(false);
            return;
        }

        setBriefLoading(true);
        try {
            const response = await fetch(`/api/career/tasks/${encodeURIComponent(task.id)}/detail`, { method: "POST" });
            const result = await response.json();
            if (!response.ok || !result.success || !result.brief) throw new Error(result.error || "Unable to prepare this task.");
            setPreparationBriefs((current) => ({ ...current, [task.id]: result.brief }));
        } catch (error) {
            if (briefRequestRef.current === requestId) setBriefError(error instanceof Error ? error.message : "Unable to prepare this task.");
        } finally {
            if (briefRequestRef.current === requestId) setBriefLoading(false);
        }
    };

    useEffect(() => {
        const taskId = initialCareerTaskId ?? initialCareerTask?.id;
        if (!taskId || openedInitialTaskRef.current === taskId) return;
        const requestedTask = careerTasks.find((task) => task.id === taskId) ?? (initialCareerTask?.id === taskId ? initialCareerTask : undefined);
        if (!requestedTask) return;
        openedInitialTaskRef.current = taskId;
        setSelectedDate(dateKey(requestedTask.scheduledDate));
        setRoadmapOpen(true);
        void openCareerTask(requestedTask);
    }, [careerTasks, initialCareerTask, initialCareerTaskId]);

    useEffect(() => {
        const handleCareerTaskOpen = (event: Event) => {
            const detail = (event as CustomEvent<{ taskId?: string; task?: CareerTaskItem }>).detail;
            const taskId = detail?.taskId;
            if (!taskId) return;
            const requestedTask = careerTasks.find((task) => task.id === taskId)
                ?? (detail.task?.id === taskId ? detail.task : undefined);
            if (!requestedTask) return;
            openedInitialTaskRef.current = taskId;
            setSelectedDate(dateKey(requestedTask.scheduledDate));
            setRoadmapOpen(true);
            void openCareerTask(requestedTask);
        };

        window.addEventListener('career-notes:open', handleCareerTaskOpen);
        return () => window.removeEventListener('career-notes:open', handleCareerTaskOpen);
    }, [careerTasks]);

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

    // ─── STYLES
    const css = {
        root: {
            width: "100%",
            height: "100%",
            minHeight: 0,
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
        body: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" },
        sidebar: {
            width: "280px",
            flexShrink: 0,
            minHeight: 0,
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(30px)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        },
        editor: {
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.018)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            position: "relative",
        },
        noteCard: (isActive) => ({
            padding: "12px 14px",
            cursor: "pointer",
            borderRadius: "12px",
            margin: "4px 8px",
            background: isActive ? "var(--theme-primary-soft)" : "transparent",
            border: isActive ? `1px solid ${themeGlow}` : "1px solid transparent",
            transition: "background 0.2s, border 0.2s",
            position: "relative",
            overflow: "hidden",
        }),
        colorDot: (color) => ({
            width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
        }),
        btn: (primary) => ({
            padding: "8px 16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            background: primary ? themeAccent : "rgba(255,255,255,0.1)",
            color: "#fff",
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
            <style>{`@keyframes notesBriefSpin { to { transform: rotate(360deg); } }`}</style>
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
                    {/* Voice btn */}
                    <button onClick={toggleVoice} style={{ ...css.iconBtn, background: showVoicePanel ? "var(--theme-primary-soft)" : "rgba(255,255,255,0.08)", border: `1px solid ${showVoicePanel ? themeAccent : "rgba(255,255,255,0.1)"}` }}
                        onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.08, duration: 0.15 })}
                        onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15 })}>
                        🎙
                    </button>

                    {/* New note */}
                    <button onClick={openModal} style={{ ...css.btn(true), boxShadow: `0 4px 20px ${themeGlow}` }}
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

                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 7, padding: "7px 12px 5px" }}>
                        <label style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <CalendarDays size={13} style={{ position: "absolute", left: 10, color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
                            <input
                                aria-label="Filter notes by date"
                                type="date"
                                value={selectedDate}
                                onChange={(event) => { setSelectedDate(event.target.value); setSelectedCareerTask(null); }}
                                style={{ width: "100%", height: 34, padding: "0 8px 0 31px", colorScheme: "dark", color: "rgba(255,255,255,0.78)", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, fontSize: 11, fontFamily: "inherit", outline: "none" }}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => { setSelectedDate(dateKey(new Date())); setSelectedCareerTask(null); }}
                            disabled={selectedDate === dateKey(new Date())}
                            style={{ height: 34, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.09)", background: selectedDate === dateKey(new Date()) ? "var(--theme-primary-soft)" : "rgba(255,255,255,0.055)", color: selectedDate === dateKey(new Date()) ? themeAccent : "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, cursor: selectedDate === dateKey(new Date()) ? "default" : "pointer" }}
                        >Today</button>
                    </div>

                    {selectedDate === dateKey(new Date()) && todayCareerTasks.length > 0 && (
                        <div style={{ margin: "8px 10px 4px", padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <button type="button" aria-expanded={roadmapOpen} onClick={() => setRoadmapOpen((open) => !open)} style={{ width: "100%", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", border: 0, background: "transparent", color: themeAccent, cursor: "pointer", fontFamily: "inherit" }}>
                                <span style={{ fontSize: 10, fontWeight: 750, textTransform: "uppercase" }}>Today · Career roadmap</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                                    {todayCareerTasks.length} task{todayCareerTasks.length === 1 ? "" : "s"}
                                    <ChevronDown size={14} style={{ transform: roadmapOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                                </span>
                            </button>
                            {roadmapOpen && (
                                <div style={{ paddingTop: 7, marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    {todayCareerTasks.map((task) => (
                                        <button key={task.id} type="button" onClick={() => void openCareerTask(task)} style={{ width: "100%", padding: "7px 8px", margin: "2px 0", background: selectedCareerTask?.id === task.id ? "var(--theme-primary-soft)" : "transparent", border: selectedCareerTask?.id === task.id ? "1px solid color-mix(in srgb, var(--theme-primary-color) 28%, transparent)" : "1px solid transparent", borderRadius: 7, color: "inherit", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                                            <div style={{ marginBottom: 5, color: "rgba(255,255,255,0.82)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                                            <CareerTaskMeta task={task} now={now} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ padding: "8px 14px 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                        {selectedDate === dateKey(new Date()) ? "Today" : formatDate(`${selectedDate}T12:00:00`)} · {filtered.length} Note{filtered.length !== 1 ? "s" : ""}
                    </div>

                    {/* Note list */}
                    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
                        {filtered.length === 0 && (
                            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 40, lineHeight: 1.8 }}>
                                No notes for this date.<br />
                                <span style={{ fontSize: 24 }}>✦</span>
                            </div>
                        )}
                        {Object.entries(notesByDate).map(([date, dateNotes]) => (
                            <div key={date}>
                                <div style={{ padding: "10px 14px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                                    {date}
                                </div>
                                {dateNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        data-note-id={note.id}
                                        onClick={() => { setSelectedCareerTask(null); setActiveId(note.id); }}
                                        style={css.noteCard(activeId === note.id)}
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
                        ))}
                    </div>
                </aside>

                {/* ── EDITOR */}
                <main ref={editorRef} style={css.editor}>
                    {selectedCareerTask ? (
                        <PreparationBriefView
                            task={selectedCareerTask}
                            brief={preparationBriefs[selectedCareerTask.id]}
                            loading={briefLoading}
                            error={briefError}
                            onRetry={() => void openCareerTask(selectedCareerTask, true)}
                        />
                    ) : activeNote?.source === "career-agent" ? (
                        <AiNoteArtifact note={activeNote} />
                    ) : activeNote ? (
                        <>
                            {/* Editor header */}
                            <div style={{ padding: "20px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>{activeNote.subject}</h2>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{formatDate(activeNote.createdAt)}</div>
                                    </div>
                                    <button className="save-btn" onClick={saveBody} style={{ ...css.btn(true), boxShadow: `0 4px 16px ${themeGlow}` }}>
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
                            <div style={{ fontSize: 64, marginBottom: 16, filter: `drop-shadow(0 0 20px ${themeGlow})` }}>✦</div>
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
                                <VoiceBar key={i} index={i} active={voice.isSpeaking} color={themeAccent} />
                            ))}
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {voice.callStatus === CallStatus.IDLE || voice.callStatus === CallStatus.ENDING ? (
                            <button onClick={voice.startCall} style={{ ...css.btn(true), flex: 1, boxShadow: `0 4px 16px ${themeGlow}` }}>Start</button>
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
                    <div ref={modalRef} style={{ width: 480, ...css.glassCard, padding: "28px 28px 24px", boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px ${themeGlow}` }}>
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
                                style={{ ...css.btn(true), opacity: noteForm.isValid ? 1 : 0.4, boxShadow: noteForm.isValid ? `0 4px 20px ${themeGlow}` : "none" }}
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
        .ai-note-artifact { flex: 1; overflow-y: auto; padding: 28px 32px 56px; color: rgba(255,255,255,0.72); font-size: 14px; line-height: 1.75; }
        .ai-note-artifact > * { max-width: 860px; margin-left: auto; margin-right: auto; }
        .ai-note-artifact h2 { margin-top: 32px; margin-bottom: 12px; padding-bottom: 9px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 18px; line-height: 1.35; }
        .ai-note-artifact h3 { margin-top: 24px; margin-bottom: 8px; color: rgba(255,255,255,0.92); font-size: 15px; line-height: 1.4; }
        .ai-note-artifact p { margin-top: 0; margin-bottom: 14px; }
        .ai-note-artifact ul, .ai-note-artifact ol { margin-top: 8px; margin-bottom: 18px; padding-left: 22px; }
        .ai-note-artifact li { margin: 6px 0; padding-left: 4px; }
        .ai-note-artifact li::marker { color: var(--theme-primary-color); }
        .ai-note-artifact strong { color: rgba(255,255,255,0.94); font-weight: 700; }
        .ai-note-artifact blockquote { margin: 20px auto; padding: 14px 16px; border-left: 3px solid var(--theme-primary-color); background: var(--theme-primary-soft); color: rgba(255,255,255,0.8); }
        .ai-note-artifact code { padding: 2px 5px; border: 1px solid rgba(255,255,255,0.09); border-radius: 4px; background: rgba(0,0,0,0.28); color: #f5c66a; font-size: 0.9em; }
        .ai-note-artifact pre { overflow-x: auto; margin: 18px auto; padding: 16px; border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; background: rgba(0,0,0,0.3); }
        .ai-note-artifact pre code { padding: 0; border: 0; background: transparent; }
        .ai-note-artifact table { width: 100%; margin: 18px auto; border-collapse: collapse; font-size: 13px; }
        .ai-note-artifact th, .ai-note-artifact td { padding: 9px 11px; border: 1px solid rgba(255,255,255,0.09); text-align: left; }
        .ai-note-artifact th { color: #fff; background: rgba(255,255,255,0.05); }
        .ai-note-artifact a { color: var(--theme-primary-color); text-decoration: none; }
        .ai-note-artifact input[type="checkbox"] { margin-right: 7px; accent-color: var(--theme-primary-color); }
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