import { beforeEach, describe, expect, it } from "vitest";

import {
  getVoiceMode,
  isCareerVoiceActive,
  isDesktopVoiceActive,
  isInterviewVoiceActive,
  isTeacherVoiceActive,
  setVoiceMode,
} from "./voiceMode";

describe("voiceMode", () => {
  beforeEach(() => setVoiceMode("inactive"));

  it("gives Teacher exclusive ownership of shared voice events", () => {
    setVoiceMode("teacher");

    expect(getVoiceMode()).toBe("teacher");
    expect(isTeacherVoiceActive()).toBe(true);
    expect(isDesktopVoiceActive()).toBe(false);
    expect(isCareerVoiceActive()).toBe(false);
    expect(isInterviewVoiceActive()).toBe(false);
  });
});