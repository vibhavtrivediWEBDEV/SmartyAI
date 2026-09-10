"use client";

import { Code2, FileCode2, FileText, FolderOpen, Globe2, Play, Search, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Kind = "note" | "workspace" | "youtube";
type Publication = {
  kind: Kind;
  title: string;
  publishedAt: string;
  payload: Record<string, unknown>;
};

let publicationsRequest: Promise<Partial<Record<Kind, Publication>>> | null = null;

function loadPublications() {
  if (!publicationsRequest) {
    publicationsRequest = fetch("/api/publications/latest", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Published work unavailable");
        return data?.publications || {};
      })
      .catch((error) => {
        publicationsRequest = null;
        throw error;
      });
  }
  return publicationsRequest;
}

function EmptyArtifact({ kind }: { kind: Kind }) {
  const label = kind === "workspace" ? "workspace" : kind === "youtube" ? "playlist" : "note";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#101216] px-8 text-center">
      <Globe2 className="h-8 w-8 text-white/18" />
      <p className="text-xs text-white/38">The latest published Career {label} will appear here.</p>
    </div>
  );
}

function NotePreview({ publication }: { publication: Publication }) {
  const content = String(publication.payload.content || "");
  const paragraphs = content.replace(/^\s*#\s+[^\n]+\n+/, "").split(/\n{2,}/).filter(Boolean).slice(0, 8);
  return (
    <div className="grid h-full grid-cols-[31%_69%] overflow-hidden bg-[#171719] text-white">
      <aside className="border-r border-white/8 bg-[#111113] p-3 sm:p-4">
        <div className="mb-4 flex items-center gap-2 text-[9px] font-semibold uppercase text-white/35"><FileText className="h-3.5 w-3.5 text-amber-300" /> Notes</div>
        <div className="rounded-md border border-amber-300/18 bg-amber-300/8 p-2.5 sm:p-3">
          <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-white/85 sm:text-xs">{publication.title}</p>
          <p className="mt-2 text-[8px] text-white/35">Latest published</p>
        </div>
      </aside>
      <article className="min-w-0 overflow-hidden bg-[#1c1c1e]">
        <div className="border-b border-white/7 px-4 py-3 sm:px-6 sm:py-5">
          <p className="text-[8px] font-semibold uppercase text-amber-300">AI-prepared note</p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-tight sm:text-xl">{publication.title}</h3>
        </div>
        <div className="space-y-3 p-4 text-[10px] leading-4 text-white/62 sm:p-6 sm:text-xs sm:leading-5">
          {paragraphs.map((paragraph, index) => <p key={index} className="line-clamp-3">{paragraph.replace(/^#{1,6}\s+/, "")}</p>)}
        </div>
      </article>
    </div>
  );
}

type PublicFile = { path?: string; language?: string; content?: string };

function WorkspacePreview({ publication }: { publication: Publication }) {
  const files = Array.isArray(publication.payload.files) ? publication.payload.files as PublicFile[] : [];
  const entryPoint = String(publication.payload.entryPoint || "");
  const activeFile = files.find((file) => file.path === entryPoint) || files[0];
  const code = String(activeFile?.content || "").split("\n").slice(0, 18);
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] text-white">
      <div className="flex h-10 items-center gap-2 border-b border-white/8 bg-[#181818] px-3">
        <Code2 className="h-4 w-4 text-cyan-300" /><span className="truncate text-[10px] font-semibold sm:text-xs">{publication.title}</span>
        <span className="ml-auto text-[8px] uppercase text-emerald-300">Read only</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[30%_70%]">
        <aside className="overflow-hidden border-r border-white/8 bg-[#181818] px-2 py-3">
          <p className="mb-3 flex items-center gap-1.5 px-1 text-[8px] font-semibold uppercase text-white/35"><FolderOpen className="h-3 w-3" /> Explorer</p>
          {files.slice(0, 8).map((file) => (
            <div key={file.path} className={`flex items-center gap-1.5 truncate px-1.5 py-1 text-[9px] sm:text-[10px] ${file.path === activeFile?.path ? "bg-white/8 text-white" : "text-white/52"}`}>
              <FileCode2 className="h-3 w-3 shrink-0 text-cyan-300/70" />{file.path}
            </div>
          ))}
        </aside>
        <div className="min-w-0 overflow-hidden">
          <div className="h-8 truncate border-b border-white/7 bg-[#242424] px-3 py-2 text-[9px] text-white/65">{activeFile?.path || "No public file"}</div>
          <pre className="h-full overflow-hidden p-3 font-mono text-[8px] leading-4 text-white/72 sm:p-4 sm:text-[10px] sm:leading-5">
            {code.map((line, index) => <div key={index}><span className="mr-3 inline-block w-4 text-right text-white/20">{index + 1}</span>{line}</div>)}
          </pre>
        </div>
      </div>
    </div>
  );
}

type PlaylistItem = { title?: string; searchQuery?: string; resourceUrl?: string };

function YoutubePreview({ publication }: { publication: Publication }) {
  const items = Array.isArray(publication.payload.items) ? publication.payload.items as PlaylistItem[] : [];
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0f0f0f] text-white">
      <div className="flex h-11 items-center gap-2 border-b border-white/8 px-3 sm:px-4">
        <Youtube className="h-5 w-5 fill-red-600 text-red-600" />
        <span className="text-xs font-semibold">Career Playlist</span>
        <div className="ml-auto hidden items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[9px] text-white/35 sm:flex"><Search className="h-3 w-3" /> Search learning videos</div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-5">
        <p className="mb-3 text-[9px] font-semibold uppercase text-red-400">Latest published playlist</p>
        <h3 className="mb-4 line-clamp-1 text-base font-semibold sm:text-xl">{publication.title}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {items.slice(0, 6).map((item, index) => (
            <div key={`${item.title}-${index}`} className="min-w-0">
              <div className="relative aspect-video overflow-hidden rounded bg-[linear-gradient(135deg,#242424,#141414)]">
                <div className="absolute inset-0 grid place-items-center"><span className="grid h-7 w-7 place-items-center rounded-full bg-red-600"><Play className="ml-0.5 h-3.5 w-3.5 fill-white" /></span></div>
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[7px]">Career</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-3 sm:text-[10px] sm:leading-4">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LatestPublicArtifact({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLDivElement>(null);
  const [publication, setPublication] = useState<Publication | null | undefined>(undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      void loadPublications().then((items) => setPublication(items[kind] || null)).catch(() => setPublication(null));
    }, { rootMargin: "240px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [kind]);

  return (
    <div ref={ref} className="h-full">
      {publication === undefined ? <div className="grid h-full place-items-center bg-[#101216] text-xs text-white/35">Loading latest published work...</div>
        : publication === null ? <EmptyArtifact kind={kind} />
          : kind === "note" ? <NotePreview publication={publication} />
            : kind === "workspace" ? <WorkspacePreview publication={publication} />
              : <YoutubePreview publication={publication} />}
    </div>
  );
}