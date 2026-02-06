// lib/helper/commandExtractor.ts

import { getCommandByIndex } from './commandRegistry';

interface ExtractedCommand {
    commandKey: string | null;
    variables: Record<string, any>;
    isValid: boolean;
    error?: string;
}

export function extractCommandFromResponse(
    aiResponse: string,
    userTranscript: string = ''
): ExtractedCommand {

    // 🔥 NORMALIZE AI RESPONSE
    let normalized = aiResponse
        // Fix hex first: "#f f 0 0 0 0" → "#ff0000"
        .replace(/#\s*([a-f0-9])\s+([a-f0-9])\s+([a-f0-9])\s+([a-f0-9])\s+([a-f0-9])\s+([a-f0-9])/gi, '#$1$2$3$4$5$6')
        // Fix text replacements
        .replace(/vertical bar/gi, '|')
        .replace(/\bpipe\b/gi, '|')
        .replace(/hash\s*/gi, '#')
        .replace(/hex color/gi, 'hexColor')
        .replace(/font size/gi, 'fontSize')
        // Clean trailing punctuation
        .replace(/[,\.]+$/g, '')
        .trim();

    const result: ExtractedCommand = {
        commandKey: null,
        variables: {},
        isValid: false
    };

    console.log("=== EXTRACTION START ===");
    console.log("Original:", aiResponse);
    console.log("Normalized:", normalized);
    console.log("User:", userTranscript);

    // 🔥 FIX: Case insensitive check
    if (!/command/i.test(normalized)) {
        console.log("❌ No 'command' found");
        return result;
    }

    try {
        // 🔥 FIX: Match "Command 2" OR "COMMAND: 2" OR "command:2"
        const commandMatch = normalized.match(/command[:\s]*(\d+)/i);

        if (!commandMatch) {
            result.error = 'No command index found';
            console.error("❌", result.error);
            return result;
        }

        const commandIndex = commandMatch[1];
        console.log("✅ Index:", commandIndex);

        const command = getCommandByIndex(commandIndex);

        if (!command) {
            result.error = `Invalid command index: ${commandIndex}`;
            console.error("❌", result.error);
            return result;
        }

        result.commandKey = command.key;
        console.log("✅ Key:", result.commandKey);

        // Extract variables from pipe-separated parts
        const parts = normalized.split('|').slice(1);
        console.log("Parts:", parts);

        parts.forEach(part => {
            const match = part.match(/([a-zA-Z]+)\s*:\s*(.+)/);
            if (!match) return;

            const key = match[1].trim();
            const value = match[2].trim();

            console.log(`Found: ${key} = ${value}`);

            if (command.variables.includes(key)) {
                if (key === 'fontSize') {
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                        result.variables[key] = num;
                        console.log(`✅ fontSize = ${num}`);
                    }
                } else if (key === 'hexColor') {
                    result.variables[key] = convertColorToHex(value);
                    console.log(`✅ hexColor = ${result.variables[key]}`);
                } else {
                    result.variables[key] = value;
                    console.log(`✅ ${key} = ${value}`);
                }
            }
        });

        // 🔥 FALLBACK: User transcript
        if (command.variables.length > 0) {
            command.variables.forEach(varName => {
                if (!result.variables[varName]) {
                    console.log(`⚠️ Missing ${varName}, checking user transcript...`);
                    const extracted = extractFromUserTranscript(varName, userTranscript, command.key);
                    if (extracted !== null) {
                        result.variables[varName] = extracted;
                        console.log(`✅ Fallback ${varName} = ${extracted}`);
                    }
                }
            });
        }

        // Auto-generate IDs
        if (command.key.includes('wallpaper')) {
            result.variables.wallpaperResultId = `new_wallpaper_${Math.floor(Math.random() * 10)}`;
        }

        // Final validation
        const missingVars = command.variables.filter(v =>
            result.variables[v] === undefined || result.variables[v] === null
        );

        if (missingVars.length > 0) {
            result.error = `Missing: ${missingVars.join(', ')}`;
            console.error("❌", result.error);
            console.log("Got:", result.variables);
            console.log("Need:", command.variables);
            return result;
        }

        result.isValid = true;
        console.log("🎉 SUCCESS!", result);
        return result;

    } catch (error) {
        result.error = `Error: ${error}`;
        console.error("❌ Exception:", error);
        return result;
    }
}

// Convert color to hex
function convertColorToHex(color: string): string {
    const colorMap: Record<string, string> = {
        red: '#FF0000', blue: '#0000FF', green: '#00FF00',
        yellow: '#FFFF00', purple: '#800080', orange: '#FFA500',
        pink: '#FFC0CB', black: '#000000', white: '#FFFFFF',
        gray: '#808080', grey: '#808080'
    };

    let clean = color.toLowerCase().replace(/\s+/g, '').trim();

    console.log(`Color: "${color}" → "${clean}"`);

    // Hex with #
    if (clean.startsWith('#')) {
        const hex = clean.substring(1);
        if (/^[a-f0-9]{6}$/i.test(hex)) {
            return '#' + hex.toUpperCase();
        }
        return '#644AFB';
    }

    // Hex without #
    if (/^[a-f0-9]{6}$/i.test(clean)) {
        return '#' + clean.toUpperCase();
    }

    // Color name
    return colorMap[clean] || '#644AFB';
}

// Extract from user transcript
function extractFromUserTranscript(varName: string, transcript: string, commandKey: string): any {
    if (!transcript) return null;
    const lower = transcript.toLowerCase();

    if (varName === 'prompt') {
        const patterns = [
            /(?:to|with|for|about)\s+(.+)/i,
            /(?:wallpaper|background|terminal)\s+(.+)/i,
        ];
        for (const p of patterns) {
            const m = lower.match(p);
            if (m) return m[1].trim();
        }
        const keywords = ['change', 'set', 'make', 'open', 'launch', 'badlo', 'lagao'];
        for (const kw of keywords) {
            const idx = lower.indexOf(kw);
            if (idx !== -1) {
                const after = transcript.substring(idx + kw.length).trim();
                if (after) return after;
            }
        }
    }

    if (varName === 'hexColor') {
        const m = lower.match(/(?:red|blue|green|yellow|purple|orange|pink|black|white|gray|grey)/i);
        if (m) return convertColorToHex(m[0]);
    }

    if (varName === 'fontSize') {
        const m = transcript.match(/\d+/);
        if (m) return parseInt(m[0]);
    }

    if (varName === 'themeId') {
        const m = lower.match(/(?:theme|to)\s+(\w+)/i);
        if (m) return m[1];
    }

    return null;
}