"use client";

import { useState } from "react";
import { ExternalLink, FileUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface ResumeProfile {
  fileName: string;
  summary: string;
  uploadedAt: string | null;
  fileUrl: string;
  profile?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    about: string;
    skills: string[];
    interests: string[];
    goals: string[];
    experience: string[];
    companies: string[];
    education: string[];
    achievements: string[];
    certifications: string[];
    languages: string[];
    projects: Array<{ name: string; description: string; technologies: string[]; links: string[] }>;
    socialLinks: Array<{ platform: string; url: string }>;
    externalLinks: Array<{ platform: string; url: string }>;
    githubUsername?: string;
  } | null;
}

interface ResumeProfilePanelProps {
  profile: ResumeProfile | null;
  loading?: boolean;
  onUploaded: (profile: ResumeProfile) => void;
}

export function ResumeProfilePanel({ profile, loading, onUploaded }: ResumeProfilePanelProps) {
  const [uploading, setUploading] = useState(false);

  const uploadResume = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await fetch("/api/profile/resume", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Resume upload failed");
      onUploaded(body.resume);
      window.dispatchEvent(new Event("finder-desktop-change"));
      toast.success("Resume and AI About section updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resume upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-300">Loading your profile...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 text-gray-200">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-2">
          <Sparkles className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h2 className="font-semibold text-white">AI About Me</h2>
          <p className="text-xs text-gray-400">
            {profile ? `Generated from ${profile.fileName}` : "Upload a resume to generate this profile"}
          </p>
        </div>
      </div>

      {profile ? (
        <div className="space-y-6">
          {profile.profile && [profile.profile.name, profile.profile.email, profile.profile.phone, profile.profile.location].some(Boolean) && (
            <section className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
              {profile.profile.name && <p className="font-medium text-white">{profile.profile.name}</p>}
              {profile.profile.email && <p>{profile.profile.email}</p>}
              {profile.profile.phone && <p>{profile.profile.phone}</p>}
              {profile.profile.location && <p>{profile.profile.location}</p>}
            </section>
          )}
          {profile.profile?.headline && <p className="text-base font-medium text-white">{profile.profile.headline}</p>}
          {profile.summary && <p className="whitespace-pre-wrap text-sm leading-7 text-gray-200">{profile.summary}</p>}

          {[...profile.profile?.socialLinks ?? [], ...profile.profile?.externalLinks ?? []].length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Links</h3>
              <div className="flex flex-wrap gap-2">
                {[...profile.profile?.socialLinks ?? [], ...profile.profile?.externalLinks ?? []].map((link, index) => (
                  <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10">
                    {link.platform}<ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {profile.profile?.projects && profile.profile.projects.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Projects</h3>
              <div className="space-y-3">
                {profile.profile.projects.map((project, index) => (
                  <div key={`${project.name}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-medium text-white">{project.name}</p>
                    {project.description && <p className="mt-1 text-xs leading-5 text-gray-300">{project.description}</p>}
                    {project.technologies.length > 0 && <p className="mt-2 text-xs text-gray-400">{project.technologies.join(" · ")}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">{project.links.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:underline">Open project ↗</a>)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(["experience", "companies", "education", "skills", "achievements", "certifications", "languages", "interests", "goals"] as const).map((section) => {
            const values = profile.profile?.[section] ?? []
            if (!values.length) return null
            return <section key={section}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{section}</h3><ul className="space-y-1 text-sm text-gray-300">{values.map((value, index) => <li key={index}>• {value}</li>)}</ul></section>
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-gray-400">
          No resume has been uploaded yet. Select a text-based PDF and AI will extract and summarize your professional details.
        </div>
      )}

      <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
        <FileUp className="h-4 w-4" />
        {uploading ? "Analyzing resume..." : profile ? "Replace resume" : "Upload resume"}
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadResume(file);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
