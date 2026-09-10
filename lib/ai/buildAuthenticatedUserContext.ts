import type { UserAIContext } from "./userAIContext";
import { generateProfileContext } from "./userAIContext";
import type { ResumeProfileData } from "@/modules/users/user.repository";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: UserAIContext["plan"];
  subscriptionStatus: UserAIContext["subscriptionStatus"];
}

interface AccountUser {
  resumeProfile?: ResumeProfileData;
}

interface LegacyUserProfile {
  terminalUsername?: string;
  personal?: {
    fullName?: string;
    headline?: string;
    summary?: string;
    about?: string;
    website?: string;
  };
  professional?: {
    headline?: string;
    currentRole?: string;
    skills?: string[];
    experience?: Array<{ title?: string; company?: string }>;
    projects?: ResumeProfileData["projects"];
  };
  socialLinks?: Array<{ platform?: string; url?: string }>;
  resume?: { extracted?: ResumeProfileData };
}

const DEFAULT_APPS = [
  "Finder", "About", "Projects", "Resume", "Terminal", "Settings", "chrome", "Mail",
  "Excel Editor", "AI Search", "vscode", "Spotify", "Calendar", "Maps", "Youtube",
  "Photos", "App Store",
];

export function buildAuthenticatedUserContext(
  sessionUser: SessionUser,
  accountUser?: AccountUser | null,
  userProfile?: LegacyUserProfile | null,
): UserAIContext {
  const resume = accountUser?.resumeProfile ?? userProfile?.resume?.extracted;
  const fullName = resume?.name || userProfile?.personal?.fullName || sessionUser.name;
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || sessionUser.name;
  const skills = resume?.skills?.length ? resume.skills : userProfile?.professional?.skills ?? [];
  const experience = resume?.experience?.length
    ? resume.experience
    : userProfile?.professional?.experience
      ?.map(({ title, company }) => [title, company && `at ${company}`].filter(Boolean).join(" "))
      .filter(Boolean) ?? [];
  const projects = resume?.projects?.length ? resume.projects : userProfile?.professional?.projects ?? [];
  const links = [...(resume?.socialLinks ?? []), ...(resume?.externalLinks ?? []), ...(userProfile?.socialLinks ?? [])];
  const linkFor = (platform: string) => links.find((link) => link.platform?.toLowerCase() === platform)?.url;
  const role = resume?.headline || userProfile?.personal?.headline || userProfile?.professional?.headline || userProfile?.professional?.currentRole || "Developer";
  const bio = resume?.about || userProfile?.personal?.summary || userProfile?.personal?.about || "";
  const resumeEmail = resume?.email?.trim();
  const profileContext = [
    generateProfileContext({
      displayName: firstName,
      role,
      bio,
      skills,
      experience,
      projects,
      github: linkFor("github"),
      linkedin: linkFor("linkedin"),
      website: linkFor("website") || userProfile?.personal?.website,
    }),
    resumeEmail ? `Resume contact email: ${resumeEmail}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    userId: sessionUser.id,
    username: userProfile?.terminalUsername || firstName.toLowerCase().replace(/[^a-z0-9]/g, ""),
    displayName: firstName,
    firstName,
    lastName: nameParts.slice(1).join(" "),
    email: sessionUser.email,
    aiName: `${firstName} AI`,
    macName: `${firstName}'s Mac`,
    role,
    bio,
    skills,
    experience,
    projects: projects.map((project) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies ?? [],
      links: project.links ?? [],
    })),
    github: linkFor("github"),
    linkedin: linkFor("linkedin"),
    website: linkFor("website") || userProfile?.personal?.website,
    plan: sessionUser.plan,
    subscriptionStatus: sessionUser.subscriptionStatus,
    isOwner: true,
    isPublicView: false,
    visibility: "private",
    availableApps: DEFAULT_APPS,
    desktopTheme: "dark",
    profileContext,
  };
}