import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import {
  DESKTOP_APPS,
  getDesktopAppSlug,
  type DesktopAppCategory,
} from "@/lib/desktopApps";

export const metadata: Metadata = {
  title: "AI Apps Directory",
  description:
    "Search and explore every SmartyAI application for coding, teaching, studying, research, productivity, and creativity.",
  alternates: { canonical: "/apps" },
};

const categories: Array<"All" | DesktopAppCategory> = [
  "All",
  "Developer",
  "Productivity",
  "Creativity",
  "System",
  "Entertainment",
];

type AppsPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function AppsPage({ searchParams }: AppsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() || "";
  const selectedCategory = categories.includes(params.category as (typeof categories)[number])
    ? params.category || "All"
    : "All";

  const apps = DESKTOP_APPS.filter((app) => {
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    const searchable = `${app.displayName} ${app.name} ${app.description} ${app.category}`.toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });

  return (
    <main className="min-h-screen bg-[#050506] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-[-20rem] h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-[-20rem] right-[-10rem] h-[35rem] w-[35rem] rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      <header className="relative border-b border-white/10 bg-black/45 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>SmartyAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm text-white/65 transition hover:text-white sm:block">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-12 pt-20 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_16px_#4ade80]" />
            {DESKTOP_APPS.length} apps. One intelligent workspace.
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
            Find the right app for your next idea.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            Search developer tools, AI teaching experiences, student resources, creative apps, and everyday productivity tools.
          </p>
        </div>

        <form action="/apps" className="mx-auto mt-12 flex max-w-3xl items-center rounded-2xl border border-white/15 bg-white/[0.07] p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <Search className="ml-4 h-5 w-5 shrink-0 text-white/40" />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search AI Teacher, VS Code, Excel, Notes…"
            aria-label="Search applications"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
          />
          {selectedCategory !== "All" && <input type="hidden" name="category" value={selectedCategory} />}
          <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-blue-100">
            Search
          </button>
        </form>

        <nav aria-label="App categories" className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => {
            const href = `/apps?${new URLSearchParams({
              ...(params.q ? { q: params.q } : {}),
              ...(category !== "All" ? { category } : {}),
            })}`;
            return (
              <Link
                key={category}
                href={href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedCategory === category
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
                }`}
              >
                {category}
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-28" aria-live="polite">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            {query ? `Results for “${params.q}”` : selectedCategory === "All" ? "All applications" : selectedCategory}
          </h2>
          <span className="text-sm text-white/40">{apps.length} found</span>
        </div>

        {apps.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <Link
                key={app.name}
                href={`/apps/${getDesktopAppSlug(app)}`}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.11]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[18px] border border-white/10 bg-white/10 shadow-xl">
                    <img src={app.icon} alt="" className="h-11 w-11 object-contain" loading="lazy" />
                  </div>
                  <ArrowRight className="h-5 w-5 -translate-x-2 text-white/25 opacity-0 transition group-hover:translate-x-0 group-hover:text-white group-hover:opacity-100" />
                </div>
                <div className="mt-8">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-blue-300/70">{app.category}</span>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{app.displayName}</h3>
                  <p className="mt-3 line-clamp-3 leading-7 text-white/50">{app.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-20 text-center">
            <Search className="mx-auto h-8 w-8 text-white/25" />
            <h2 className="mt-5 text-2xl font-semibold">No apps found</h2>
            <p className="mt-2 text-white/45">Try a broader search or view all applications.</p>
            <Link href="/apps" className="mt-7 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
              Clear search
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
