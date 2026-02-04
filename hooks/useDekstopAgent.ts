/**
 * useVoiceAutomation Hook
 * Simple voice control for desktop automation using VAPI
 */

import { useState, useEffect, useRef } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { desktopAssistant } from "@/constants";
import { useCursorAutomation } from "./useCursorAutomation";

// JSON mapping for sequences
import { resolveSequence } from "@/lib/helper/helper";

export enum CallStatus {
    INACTIVE = "INACTIVE",
    ACTIVE = "ACTIVE",
}

interface Message {
    type: string;
    transcriptType: string;
    role: "user" | "assistant";
    transcript: string;
}

interface UseVoiceAutomationProps {
    openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
    openWindows: any[];
    setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useVoiceAutomation({
    openApplication,
    openWindows,
    setOpenWindows
}: UseVoiceAutomationProps) {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [lastTranscript, setLastTranscript] = useState<string>("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        setExecutionLog(prev => [...prev.slice(-9), logMessage]);
        console.log(logMessage);
    };

    const automation = useCursorAutomation(openApplication, openWindows, setOpenWindows, (text) => addLog(`🔊 ${text}`));
    const isProcessing = useRef(false);
    const lastUserText = useRef<string>("");

    // Extract sequence key and variables from Assistant's response
    const extractCommandAndVariables = (text: string): { key: string | null, variables: Record<string, any> } => {
        // Normalize: "dot" -> ".", remove extra spaces, case insensitive for specific keywords
        let normalized = text
            .replace(/\s+dot\s+/gi, '.')
            .replace(/\s+vertical bar\s+/gi, '|')
            .replace(/\s+pipe\s+/gi, '|')
            .replace(/\s+dash\s+/gi, '-')
            .trim();

        // 1. Extract Key
        // Matches: AUTOMATE: key | ... or just key | ...
        const keyMatch = normalized.match(/(?:AUTOMATE:?\s*)?([a-z0-9]+\.[a-zA-Z0-9.]+)/i);
        if (!keyMatch) return { key: null, variables: {} };

        let key = keyMatch[1];

        // 🚨 Key Alias/Correction Map
        const KEY_ALIASES: Record<string, string> = {
            'settings.appearance.folder': 'settings.appearance.folderColor',
            'settings.appearance.foldercolor': 'settings.appearance.folderColor',
            'settings.wallpaper': 'settings.wallpaper.change',
            'settings.theme': 'settings.appearance.changeTheme'
        };

        if (KEY_ALIASES[key]) {
            key = KEY_ALIASES[key];
        }

        const variables: Record<string, any> = {};

        // 2. Extract Variables
        // Look for content after the key, possibly separated by | or just spaces
        // Example: "... change | prompt: nature"
        const variableSection = normalized.substring(normalized.indexOf(key) + key.length);

        // Strategy: Key-Value pairs like "prompt: nature" or "hexColor: red"
        // Also handle "prompt nature" (loose)
        const kvMatches = variableSection.matchAll(/([a-zA-Z]+)\s*[:=]\s*([^|]+)/g);
        for (const match of kvMatches) {
            const varKey = match[1].trim();
            const varValue = match[2].trim();
            variables[varKey] = varValue;
        }

        return { key, variables };
    };

    // 3️⃣ Execute voice command
    const executeVoiceCommand = async (userTranscript: string, assistantResponse: string) => {
        if (isProcessing.current) {
            // addLog("⏳ Already processing a command...");
            return;
        }

        isProcessing.current = true;

        try {
            // addLog(`🤖 Processing: "${assistantResponse}"`);

            // Extract from ASSISTANT response now
            const { key: sequenceKey, variables } = extractCommandAndVariables(assistantResponse);

            if (!sequenceKey) {
                isProcessing.current = false;
                return;
            }

            addLog(`🤖 automating: ${sequenceKey}`);

            // --- Client-side Enhancement / Fallback Logic ---

            // 1. Wallpaper: If prompt not found in assistant response, check user transcript
            if (sequenceKey.includes('wallpaper')) {
                if (!variables.prompt) {
                    // Try to find "change to X" or "wallpaper X" in USER text
                    const userMatch = userTranscript.match(/(?:to|wallpaper|background)\s+(.+)/i);
                    if (userMatch) {
                        variables.prompt = userMatch[1].trim();
                    } else if (userTranscript) {
                        // Desperate fallback: take the last word(s)
                        variables.prompt = userTranscript;
                    }
                }
                // Generate random ID
                variables.wallpaperResultId = `new_wallpaper_${Math.floor(Math.random() * 10)}`;
            }

            // 2. Folder Color: Hex conversion
            if (sequenceKey.includes('folderColor')) {
                // Try assistant extracted value first, then user's
                const colorSource = variables.hexColor || userTranscript;

                const colorMatch = colorSource.match(/#[0-9a-f]{6}|(?:red|blue|green|purple|orange|pink)/i);
                if (colorMatch) {
                    const colorMap: Record<string, string> = {
                        red: '#FF0000', blue: '#0000FF', green: '#00FF00',
                        purple: '#800080', orange: '#FFA500', pink: '#FFC0CB'
                    };
                    variables.hexColor = colorMatch[0].startsWith('#')
                        ? colorMatch[0]
                        : colorMap[colorMatch[0].toLowerCase()] || '#644AFB';
                }
            }

            // 3. Font Size: Parse number
            if (sequenceKey.includes('fontSize')) {
                const sizeSource = variables.fontSize || userTranscript;
                const numMatch = String(sizeSource).match(/\d+/);
                if (numMatch) variables.fontSize = parseInt(numMatch[0]);
            }


            addLog(`🎯 Matched sequence: ${sequenceKey}`);
            addLog(`📝 Variables: ${JSON.stringify(variables)}`);

            // 🔹 Resolve sequence
            const actions = resolveSequence(sequenceKey, variables);
            console.log("🔹 EXECUTING ACTIONS:", actions);
            addLog(`⚡ Executing ${actions.length} actions...`);

            // 🔥 ACTUALLY EXECUTE NOW
            await automation.executeSequence(actions);

            addLog(`✅ Sequence completed`);

        } catch (error) {
            addLog(`❌ Error: ${error}`);
            console.error(error);
        } finally {
            isProcessing.current = false;
        }
    };


    useEffect(() => {
        const onCallStart = () => { setCallStatus(CallStatus.ACTIVE); addLog("📞 Voice assistant connected"); };
        const onCallEnd = () => { setCallStatus(CallStatus.INACTIVE); addLog("📞 Voice assistant disconnected"); lastUserText.current = ""; };
        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                setLastTranscript(message.transcript);

                if (message.role === "user") {
                    lastUserText.current = message.transcript;
                    addLog(`🎤 "${message.transcript}"`);
                } else if (message.role === "assistant") {
                    const fullAssistantText = message.transcript.trim();
                    addLog(`🤖 "${fullAssistantText}"`);

                    if (lastUserText.current) {
                        executeVoiceCommand(lastUserText.current, fullAssistantText);
                        // Do NOT clear user text here, as assistant might send multiple segments
                    }
                }
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => { addLog(`❌ Error: ${error.message}`); console.error(error); };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, [automation]);

    const startCall = async () => {
        try { addLog("📞 Connecting to voice assistant..."); await vapi.start(desktopAssistant); }
        catch (error) { addLog(`❌ Failed to start call: ${error}`); console.error(error); }
    };

    const endCall = () => { addLog("📞 Ending call..."); vapi.stop(); };

    return { callStatus, lastTranscript, isSpeaking, executionLog, startCall, endCall, isActive: callStatus === CallStatus.ACTIVE };
}
