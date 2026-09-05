export type VoiceAppIntent = {
    action: "open";
    appName: "AI Book" | "Smarty Teacher";
};

const OPEN_INTENT = /\b(open|launch|show|start|kholo|khol|chalao|dikhao)\b/i;
const AI_BOOK = /\b(ai\s*book|science\s*book|my\s*book|lesson\s*book)\b/i;
const SMARTY_TEACHER = /\b(smarty\s*teacher|teacher|teaching|teach\s+me|tutor|lesson)\b/i;
const TEACH_ME_INTENT = /\bteach\s+me\b/i;

export function resolveVoiceAppIntent(transcript: string): VoiceAppIntent | null {
    const normalized = transcript
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!OPEN_INTENT.test(normalized) && !TEACH_ME_INTENT.test(normalized)) return null;

    if (AI_BOOK.test(normalized)) {
        return { action: "open", appName: "AI Book" };
    }

    if (SMARTY_TEACHER.test(normalized)) {
        return { action: "open", appName: "Smarty Teacher" };
    }

    return null;
}

export function getVoiceErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
        const payload = error as Record<string, unknown>;
        if (typeof payload.message === "string") return payload.message;
        if (typeof payload.error === "string") return payload.error;
        try {
            return JSON.stringify(error);
        } catch {
            return "Unknown VAPI error";
        }
    }
    return "Unknown VAPI error";
}