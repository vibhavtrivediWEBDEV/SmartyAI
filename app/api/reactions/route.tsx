import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

const COL = "portfolio_reactions"
const DOC = "global"

// ── GET: fetch counts, comments, visitors ────────────────────────────────────
export async function GET() {
    try {
        const snap = await db.collection(COL).doc(DOC).get()
        if (!snap.exists) {
            return NextResponse.json({
                counts: { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0 },
                comments: [],
                visitors: 0,
            })
        }
        const d = snap.data()!
        return NextResponse.json({
            counts: d.counts ?? { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0 },
            comments: d.comments ?? [],
            visitors: d.visitors ?? 0,
        })
    } catch (e) {
        console.error("[GET /api/reactions]", e)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

// ── POST: react | unreact | comment | visit ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { action } = body
        const ref = db.collection(COL).doc(DOC)

        // ── visit ───────────────────────────────────────────────────────────────
        if (action === "visit") {
            const data = await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref)
                const current = snap.exists ? snap.data() ?? {} : {}
                const visitors = (current.visitors ?? 0) + 1
                tx.set(ref, { visitors }, { merge: true })
                return {
                    counts: current.counts ?? { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0 },
                    comments: current.comments ?? [],
                    visitors,
                }
            })
            return NextResponse.json(data)
        }

        // ── react ───────────────────────────────────────────────────────────────
        if (action === "react") {
            const { reactionId, userId, prevReactionId } = body as {
                action: string; reactionId: string; userId: string; prevReactionId?: string
            }
            if (!reactionId || !userId)
                return NextResponse.json({ error: "Missing fields" }, { status: 400 })

            const counts = await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref)
                const d = snap.exists ? snap.data()! : {}
                const c = { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0, ...(d.counts ?? {}) }
                // remove old reaction if switching
                if (prevReactionId && prevReactionId !== reactionId)
                    c[prevReactionId as keyof typeof c] = Math.max(0, c[prevReactionId as keyof typeof c] - 1)
                c[reactionId as keyof typeof c] = c[reactionId as keyof typeof c] + 1
                tx.set(ref, { counts: c }, { merge: true })
                return c
            })
            return NextResponse.json({ counts })
        }

        // ── unreact ─────────────────────────────────────────────────────────────
        if (action === "unreact") {
            const { reactionId, userId } = body as {
                action: string; reactionId: string; userId: string
            }
            if (!reactionId || !userId)
                return NextResponse.json({ error: "Missing fields" }, { status: 400 })

            const counts = await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref)
                const d = snap.exists ? snap.data()! : {}
                const c = { love: 0, fire: 0, wow: 0, clap: 0, rocket: 0, ...(d.counts ?? {}) }
                c[reactionId as keyof typeof c] = Math.max(0, c[reactionId as keyof typeof c] - 1)
                tx.set(ref, { counts: c }, { merge: true })
                return c
            })
            return NextResponse.json({ counts })
        }

        // ── comment ─────────────────────────────────────────────────────────────
        if (action === "comment") {
            const { text, emoji, userId } = body as {
                action: string; text: string; emoji: string; userId: string
            }
            if (!text?.trim() || !userId)
                return NextResponse.json({ error: "Missing fields" }, { status: 400 })
            if (text.trim().length > 200)
                return NextResponse.json({ error: "Too long" }, { status: 400 })

            const entry = {
                id: `${userId}-${Date.now()}`,
                text: text.trim(),
                emoji: emoji ?? "💬",
                time: new Date().toISOString(),
            }

            const comments = await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref)
                const d = snap.exists ? snap.data()! : {}
                const existing = d.comments ?? []
                const updated = [entry, ...existing].slice(0, 50)
                tx.set(ref, { comments: updated }, { merge: true })
                return updated
            })
            return NextResponse.json({ comments })
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    } catch (e) {
        console.error("[POST /api/reactions]", e)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}