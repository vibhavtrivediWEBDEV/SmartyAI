import { describe, expect, it } from "vitest";

import { getVoiceErrorMessage, resolveVoiceAppIntent } from "./voiceAppIntent";

describe("resolveVoiceAppIntent", () => {
    it.each([
        ["open AI book", "AI Book"],
        ["show my science book", "AI Book"],
        ["AI book kholo", "AI Book"],
        ["launch the lesson book", "AI Book"],
        ["open Smarty Teacher", "Smarty Teacher"],
        ["start teaching", "Smarty Teacher"],
        ["teacher kholo", "Smarty Teacher"],
        ["teach me physics", "Smarty Teacher"],
    ])("resolves %s", (transcript, appName) => {
        expect(resolveVoiceAppIntent(transcript)).toEqual({ action: "open", appName });
    });

    it.each([
        "my teacher explained gravity",
        "summarize this book",
        "close AI book",
        "open calendar",
        "start the timer",
    ])("does not hijack unrelated command: %s", (transcript) => {
        expect(resolveVoiceAppIntent(transcript)).toBeNull();
    });
});

describe("getVoiceErrorMessage", () => {
    it("normalizes Error, string, and SDK object payloads", () => {
        expect(getVoiceErrorMessage(new Error("microphone denied"))).toBe("microphone denied");
        expect(getVoiceErrorMessage("connection closed")).toBe("connection closed");
        expect(getVoiceErrorMessage({ message: "assistant unavailable" })).toBe("assistant unavailable");
        expect(getVoiceErrorMessage({ error: "network timeout" })).toBe("network timeout");
    });
});