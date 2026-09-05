export type LearningNote = {
  id: string
  subject: string
  message: string
  createdAt: string
}

export type TodayLearningContext = {
  dateKey: string
  topic: string
  sourceMaterial: string
  noteIds: string[]
}

const STORAGE_KEY = "premium_notes_v1"

function localDateKey(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function normalizeNote(value: unknown): LearningNote | null {
  if (!value || typeof value !== "object") return null
  const note = value as Partial<LearningNote> & { _id?: string }
  if (!note.subject?.trim() || !note.message?.trim() || !note.createdAt) return null
  return {
    id: String(note.id || note._id || `${note.subject}:${note.createdAt}`),
    subject: note.subject.trim(),
    message: note.message.trim(),
    createdAt: note.createdAt,
  }
}

export async function loadTodayLearningContext(): Promise<TodayLearningContext | null> {
  const today = localDateKey(new Date())
  let localNotes: unknown[] = []
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
    if (Array.isArray(stored)) localNotes = stored
  } catch {
    localNotes = []
  }

  let careerNotes: unknown[] = []
  try {
    const response = await fetch("/api/career/notes", { cache: "no-store" })
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.notes)) careerNotes = data.notes
    }
  } catch {
    careerNotes = []
  }

  const unique = new Map<string, LearningNote>()
  for (const value of [...careerNotes, ...localNotes]) {
    const note = normalizeNote(value)
    if (note && localDateKey(note.createdAt) === today) unique.set(note.id, note)
  }
  const notes = [...unique.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  if (!notes.length) return null

  return {
    dateKey: today,
    topic: notes.map((note) => note.subject).slice(0, 6).join(" · "),
    sourceMaterial: notes.map((note, index) => `Note ${index + 1}: ${note.subject}\n${note.message}`).join("\n\n").slice(0, 24000),
    noteIds: notes.map((note) => note.id),
  }
}