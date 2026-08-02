"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  FolderOpen,
  GraduationCap,
  HardDrive,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

interface ProfileData {
  personal: { fullName?: string; headline?: string; summary?: string; location?: string };
  professional: { currentRole?: string; experienceYears?: number; skills: string[] };
  socialLinks: Array<{ platform: string; handle?: string; url: string }>;
}

interface StorageData {
  usage: { fileBytesUsed: number; fileBytesReserved: number; textBytesUsed: number; textBytesReserved: number };
  limitBytes: number;
}

const sidebarItems = [
  { label: "Overview", icon: UserRound },
  { label: "Experience", icon: BriefcaseBusiness },
  { label: "Education", icon: GraduationCap },
  { label: "Resumes", icon: FileText },
  { label: "ATS Reports", icon: ShieldCheck },
  { label: "Social Profiles", icon: LinkIcon },
  { label: "Storage", icon: HardDrive },
];

const formatBytes = (bytes: number) => bytes >= 1024 ** 3
  ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
  : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

export function ProfileApp({
  user,
}: {
  user: { name: string; email: string; plan: "free" | "starter" | "pro" };
}) {
  const [activeSection, setActiveSection] = useState("Overview");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [storage, setStorage] = useState<StorageData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((response) => response.json()),
      fetch("/api/storage/files").then((response) => response.json()),
    ]).then(([profileResponse, storageResponse]) => {
      setProfile(profileResponse.data ?? null);
      setStorage(storageResponse.storage ?? null);
    });
  }, []);

  const uploadResume = async (file: File) => {
    setUploadStatus("Preparing secure upload…");
    try {
      const signResponse = await fetch("/api/storage/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", bytes: file.size }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error || "Upload could not be prepared");

      setUploadStatus("Uploading resume…");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.apiKey);
      formData.append("timestamp", String(signed.timestamp));
      formData.append("signature", signed.signature);
      formData.append("folder", signed.folder);
      formData.append("public_id", signed.publicId);
      formData.append("type", signed.deliveryType);

      const cloudinaryResponse = await fetch(signed.uploadUrl, { method: "POST", body: formData });
      const asset = await cloudinaryResponse.json();
      if (!cloudinaryResponse.ok) throw new Error(asset.error?.message || "Cloud upload failed");

      setUploadStatus("Saving to Finder…");
      const completeResponse = await fetch("/api/storage/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: signed.uploadId, resourceType: asset.resource_type }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completed.error || "Upload could not be finalized");

      const storageResponse = await fetch("/api/storage/files").then((response) => response.json());
      setStorage(storageResponse.storage ?? null);
      setUploadStatus("Resume uploaded securely. Extraction is the next processing step.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Resume upload failed");
    }
  };

  const storagePercent = useMemo(() => {
    if (!storage) return 0;
    const occupied = storage.usage.fileBytesUsed + storage.usage.textBytesUsed
      + storage.usage.fileBytesReserved + storage.usage.textBytesReserved;
    return Math.min(100, (occupied / storage.limitBytes) * 100);
  }, [storage]);

  const displayName = profile?.personal.fullName || user.name;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#334155_0%,#111827_35%,#030712_100%)] p-4 text-white md:p-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col overflow-hidden rounded-[22px] border border-white/15 bg-black/55 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <header className="relative flex h-14 items-center border-b border-white/10 bg-white/[0.06] px-5">
          <div className="flex gap-2" aria-label="Window controls">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-white/75">
            Professional Profile
          </h1>
          <span className="ml-auto rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs capitalize text-white/70">
            {user.plan}
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full border-b border-white/10 bg-white/[0.035] p-3 md:w-64 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center gap-3 rounded-xl p-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 font-semibold shadow-lg shadow-blue-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-white/45">{user.email}</p>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-1 md:block" aria-label="Profile sections">
              {sidebarItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveSection(label)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeSection === label
                      ? "bg-blue-500/80 text-white shadow-sm"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 overflow-y-auto p-5 md:p-9">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-sm text-white/45">{activeSection}</p>
                <h2 className="text-3xl font-semibold tracking-tight">{displayName}</h2>
                <p className="mt-2 text-white/55">
                  {profile?.personal.headline || profile?.professional.currentRole || "Complete your profile to personalize Smarty."}
                </p>
              </div>
              <a
                href="/desktop"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center text-sm hover:bg-white/15"
              >
                Back to Desktop
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-white/55">Profile strength</span>
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="text-3xl font-semibold">{profile?.professional.skills?.length ? "40%" : "20%"}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-white/55">Latest ATS score</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                </div>
                <p className="text-3xl font-semibold">—</p>
                <p className="mt-3 text-xs text-white/40">Upload a resume to run your first analysis.</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-white/55">Finder storage</span>
                  <FolderOpen className="h-4 w-4 text-blue-300" />
                </div>
                <p className="text-3xl font-semibold">
                  {storage ? formatBytes(storage.usage.fileBytesUsed + storage.usage.textBytesUsed) : "—"}
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${storagePercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/40">
                  {storage ? `${formatBytes(storage.limitBytes)} private storage on this plan` : "Loading storage…"}
                </p>
              </article>
            </div>

            <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Build your professional identity</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">
                    Resume extraction, verified skills, GitHub, LinkedIn, ATS history and editable resume versions will appear here under your private account.
                  </p>
                </div>
                <label className="cursor-pointer rounded-xl bg-blue-500 px-4 py-2 text-center text-sm font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-400">
                  Upload Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadResume(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              {uploadStatus && <p className="mt-4 text-sm text-cyan-200/80">{uploadStatus}</p>}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
