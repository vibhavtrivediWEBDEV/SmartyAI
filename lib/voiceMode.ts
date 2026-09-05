// Global voice mode flag to prevent conflicts between CareerAgent and useDekstopAgent
// This ensures only ONE voice system can be active at a time

type VoiceMode = 'desktop' | 'career' | 'interview' | 'teacher' | 'inactive';

let currentMode: VoiceMode = 'inactive';

export function getVoiceMode(): VoiceMode {
  return currentMode;
}

export function setVoiceMode(mode: VoiceMode): void {
  console.log(`[VoiceMode] Switching from ${currentMode} to ${mode}`);
  currentMode = mode;
}

export function isDesktopVoiceActive(): boolean {
  return currentMode === 'desktop';
}

export function isCareerVoiceActive(): boolean {
  return currentMode === 'career';
}

export function isInterviewVoiceActive(): boolean {
  return currentMode === 'interview';
}

export function isTeacherVoiceActive(): boolean {
  return currentMode === 'teacher';
}
