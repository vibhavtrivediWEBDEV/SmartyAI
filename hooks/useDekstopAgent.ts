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

    const automation = useCursorAutomation(openApplication, openWindows, setOpenWindows);
    const isProcessing = useRef(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        setExecutionLog(prev => [...prev.slice(-9), logMessage]);
        console.log(logMessage);
    };

    // Extract sequence key
    const   extractAutomationCommand = (text: string): string | null => {
        const normalizedText = text.replace(/\s+dot\s+/gi, '.').trim();
        const match = normalizedText.match(/(?:AUTOMATE:\s*)?([a-z]+\.[a-zA-Z0-9.]+)/i);
        if (match) return match[1];
        return null;
    };

    // Extract variables
    const extractVariables = (userText: string, sequenceKey: string): Record<string, any> => {
        const lower = userText.toLowerCase();
        const variables: Record<string, any> = {};

        if (sequenceKey.includes('wallpaper')) {
            const match = lower.match(/(?:wallpaper|background)(?:\s+to\s+|\s+)(.+)/);
            if (match) {
                variables.prompt = match[1].trim();
                variables.wallpaperResultId = `new_wallpaper_${Math.floor(Math.random() * 10)}`;
            }
        } else if (sequenceKey.includes('folderColor')) {
            const colorMatch = lower.match(/#[0-9a-f]{6}|(?:red|blue|green|purple|orange|pink)/i);
            if (colorMatch) {
                const colorMap: Record<string, string> = {
                    red: '#FF0000', blue: '#0000FF', green: '#00FF00',
                    purple: '#800080', orange: '#FFA500', pink: '#FFC0CB'
                };
                variables.hexColor = colorMatch[0].startsWith('#')
                    ? colorMatch[0]
                    : colorMap[colorMatch[0].toLowerCase()] || '#644AFB';
            }
        } else if (sequenceKey.includes('fontSize')) {
            const numMatch = lower.match(/\d+/);
            if (numMatch) variables.fontSize = parseInt(numMatch[0]);
        }

        return variables;
    };

    // 3️⃣ Execute voice command
    const executeVoiceCommand = async (userTranscript: string, assistantResponse: string) => {
        if (isProcessing.current) {
            addLog("⏳ Already processing a command...");
            return;
        }

        isProcessing.current = true;

        try {
            addLog(`🎤 User: "${userTranscript}"`);
            addLog(`🤖 Assistant: "${assistantResponse}"`);

            console.log("assitantRES:", assistantResponse)

            // Extract automation command
            const sequenceKey = extractAutomationCommand(assistantResponse);

            console.log("sequence", sequenceKey)

            if (!sequenceKey) {
                addLog("ℹ️ No automation command detected");
                isProcessing.current = false;
                return;
            }

            // Extract variables
            const variables = extractVariables(userTranscript, sequenceKey);

            addLog(`🎯 Matched sequence: ${sequenceKey}`);
            addLog(`📝 Variables: ${JSON.stringify(variables)}`);

            // 🔹 Resolve sequence (keep the function call, but do not execute, just log)
            const actions = resolveSequence(sequenceKey, variables);
            console.log("🔹 RESOLVED ACTIONS (check here, not executed yet):", actions);

            addLog(`⚡ Actions ready (not executed)`);

        } catch (error) {
            addLog(`❌ Error: ${error}`);
            console.error(error);
        } finally {
            isProcessing.current = false;
        }
    };


    useEffect(() => {
        let userTranscript = "";

        const onCallStart = () => { setCallStatus(CallStatus.ACTIVE); addLog("📞 Voice assistant connected"); };
        const onCallEnd = () => { setCallStatus(CallStatus.INACTIVE); addLog("📞 Voice assistant disconnected"); userTranscript = ""; };
        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                setLastTranscript(message.transcript);

                if (message.role === "user") {
                    userTranscript = message.transcript;
                    addLog(`🎤 "${message.transcript}"`);
                } else if (message.role === "assistant") {
                    const fullAssistantText = message.transcript.trim();
                    addLog(`🤖 "${fullAssistantText}"`);

                    if (userTranscript) {
                        executeVoiceCommand(userTranscript, fullAssistantText);
                        userTranscript = "";
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
