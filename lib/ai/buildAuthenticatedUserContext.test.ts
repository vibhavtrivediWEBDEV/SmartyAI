import { describe, expect, it } from "vitest";

import { buildAuthenticatedUserContext } from "./buildAuthenticatedUserContext";
import { generateDesktopAssistantPrompt } from "./userAIContext";

describe("buildAuthenticatedUserContext", () => {
  it("prefers the current account resume over stale signup profile data", () => {
    const context = buildAuthenticatedUserContext(
      {
        id: "user-1",
        name: "Fresh Plan Tester",
        email: "account@example.com",
        plan: "free",
        subscriptionStatus: "active",
      },
      {
        resumeProfile: {
          name: "Vibhav Trivedi",
          email: "resume@example.com",
          phone: "",
          location: "",
          headline: "Senior Developer",
          about: "Current resume summary",
          skills: ["Next.js"],
          interests: [],
          goals: [],
          experience: ["Current role"],
          companies: [],
          education: [],
          achievements: [],
          certifications: [],
          languages: [],
          projects: [],
          socialLinks: [],
          externalLinks: [],
        },
      },
      {
        personal: { fullName: "Fresh Plan Tester" },
        resume: {
          extracted: {
            name: "Old Resume Name",
            email: "old@example.com",
            phone: "",
            location: "",
            headline: "Old Role",
            about: "Old summary",
            skills: ["Old skill"],
            interests: [],
            goals: [],
            experience: [],
            companies: [],
            education: [],
            achievements: [],
            certifications: [],
            languages: [],
            projects: [],
            socialLinks: [],
            externalLinks: [],
          },
        },
      },
    );

    expect(context.displayName).toBe("Vibhav");
    expect(context.skills).toEqual(["Next.js"]);
    expect(context.profileContext).toContain("Resume contact email: resume@example.com");
    expect(context.profileContext).not.toContain("Old Resume Name");
    const prompt = generateDesktopAssistantPrompt(context);
    expect(prompt).toContain("Account email: account@example.com");
    expect(prompt).toContain("Resume contact email: resume@example.com");
    expect(prompt).toContain("return their Resume contact email");
  });
});