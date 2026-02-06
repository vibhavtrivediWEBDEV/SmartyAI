// lib/commandRegistry.ts

export const COMMAND_REGISTRY = {
    "0": {
        key: "settings.wallpaper.change",
        description: "Change desktop wallpaper",
        variables: ["prompt"],
        examples: [
            "change wallpaper to mountains",
            "wallpaper badlo ocean ka",
            "background sunset lagao"
        ]
    },
    "1": {
        key: "settings.appearance.toggleDarkMode",
        description: "Toggle dark/light mode",
        variables: [],
        examples: [
            "turn on dark mode",
            "dark mode on karo",
            "light theme lagao"
        ]
    },
    "2": {
        key: "settings.appearance.folderColor",
        description: "Change folder color",
        variables: ["hexColor"],
        examples: [
            "make folders red",
            "folder ka rang blue karo",
            "folders purple banao"
        ]
    },
    "3": {
        key: "settings.font.changeSize",
        description: "Change system font size",
        variables: ["fontSize"],
        examples: [
            "set font size to 16",
            "font size 18 karo",
            "text size badao 20"
        ]
    },
    "4": {
        key: "settings.appearance.changeTheme",
        description: "Change system theme",
        variables: ["themeId"],
        examples: [
            "change theme to ocean",
            "theme blue lagao"
        ]
    },
    "5": {
        key: "openTerminal",
        description: "Open terminal",
        variables: ["prompt"],
        examples: [
            "open terminal",
            "terminal kholo"
        ]
    },

    "6": {
        key: "openSettings",
        description: "Open settings ",
        variables: [],
        examples: ["setting open", "setting kholo", "settings "]
    }
};

// Helper: Generate formatted commands for VAPI
export function getFormattedCommands() {
    return Object.entries(COMMAND_REGISTRY)
        .map(([index, cmd]) => {
            const vars = cmd.variables.length > 0
                ? ` (needs: ${cmd.variables.join(', ')})`
                : '';
            return `${index}: ${cmd.description}${vars}`;
        })
        .join('\n');
}




export function getFormattedCommandsWithExamples(): string {
    return Object.entries(COMMAND_REGISTRY)
        .map(([index, cmd]) => {
            const varsInfo = cmd.variables.length > 0
                ? ` [MUST PROVIDE: ${cmd.variables.join(', ')}]`
                : ' [NO VARIABLES]';

            const examplesStr = cmd.examples
                .map(ex => `   "${ex}"`)
                .join(', ');

            return `${index}: ${cmd.description}${varsInfo}\n   User examples: ${examplesStr}`;
        })
        .join('\n\n');
}

// Helper: Get command key by index
export function getCommandByIndex(index: string) {
    return COMMAND_REGISTRY[index as keyof typeof COMMAND_REGISTRY];
}