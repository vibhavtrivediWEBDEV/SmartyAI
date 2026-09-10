"use client";

import { Check, Globe2, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  kind: "note" | "workspace" | "youtube";
  sourceId: string;
  compact?: boolean;
};

export default function PublishArtifactButton({ kind, sourceId, compact = false }: Props) {
  const [state, setState] = useState<"idle" | "publishing" | "published" | "error">("idle");

  async function publish() {
    if (state === "publishing" || state === "published") return;
    setState("publishing");
    try {
      const response = await fetch("/api/publications/latest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, sourceId, published: true }),
      });
      if (!response.ok) throw new Error("Publish failed");
      setState("published");
    } catch {
      setState("error");
    }
  }

  const label = state === "published"
    ? "Published"
    : state === "publishing"
      ? "Publishing..."
      : state === "error"
        ? "Try publish again"
        : compact
          ? "Publish"
          : "Publish to homepage";

  return (
    <button
      type="button"
      onClick={() => void publish()}
      disabled={state === "publishing" || state === "published"}
      title="Publish a read-only snapshot on the public homepage"
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/16 disabled:cursor-default disabled:opacity-70"
    >
      {state === "publishing" ? <Loader2 size={13} className="animate-spin" /> : state === "published" ? <Check size={13} /> : <Globe2 size={13} />}
      {label}
    </button>
  );
}