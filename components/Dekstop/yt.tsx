// 'use client'

// import { useState } from 'react';

// export default function Youtube() {
//   const [isLoading, setIsLoading] = useState(true);

//   return (
//     <div className="w-full h-screen bg-white relative">
//       {isLoading && (
//         <div className="absolute inset-0 flex items-center justify-center bg-black">
//           <p className="text-white">Loading YouTube...</p>
//         </div>
//       )}
//       <iframe 
//         src="https://youtube-therohantomar.vercel.app/"
//         className="w-full h-full border-0" 
//         title="YouTube"
//         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//         allowFullScreen
//         onLoad={() => setIsLoading(false)}
//       />
//     </div>
//   );
// }


"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

/* =============================================================================
 * YouTubeApple.tsx
 * Single-file, Apple/macOS-inspired YouTube client.
 * Pure React + Tailwind. No external icon libs, no extra files.
 * ========================================================================== */

/* -----------------------------------------------------------------------
 * 0. Config
 * -------------------------------------------------------------------- */
const YT_API_KEY =
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "YOUR_YOUTUBE_API_KEY";

const HOME_URL = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&chart=mostPopular&maxResults=50&regionCode=IN&key=${YT_API_KEY}`;

const searchUrl = (q: string) =>
  `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&key=${YT_API_KEY}&order=relevance&q=${encodeURIComponent(
    q
  )}`;

/* -----------------------------------------------------------------------
 * 1. Types
 * -------------------------------------------------------------------- */
type Thumbnails = {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
  standard?: { url: string };
  maxres?: { url: string };
};

type HomeVideo = {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Thumbnails;
    channelTitle: string;
    categoryId?: string;
  };
  contentDetails: { duration: string };
  statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
};

type SearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: Thumbnails;
  };
};

type NormalizedVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  duration?: string;
  views?: string;
};

type Theme = "light" | "dark";
type NavKey =
  | "home"
  | "trending"
  | "subscriptions"
  | "library"
  | "history"
  | "watchlater"
  | "liked";

/* -----------------------------------------------------------------------
 * 2. Helpers
 * -------------------------------------------------------------------- */
function bestThumbnail(t: Thumbnails): string {
  return (
    t.maxres?.url ??
    t.standard?.url ??
    t.high?.url ??
    t.medium?.url ??
    t.default?.url ??
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23d1d1d6'/%3E%3C/svg%3E"
  );
}

function formatViews(count?: string): string {
  if (!count) return "";
  const n = Number(count);
  if (Number.isNaN(n)) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${n} views`;
}

function formatPublishedDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const now = Date.now();
  const diffMs = now - then;
  const diffSec = diffMs / 1000;
  const diffDay = diffSec / 86400;

  if (diffDay < 1) {
    const diffHr = Math.max(1, Math.floor(diffSec / 3600));
    return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  }
  if (diffDay < 30) {
    const d = Math.floor(diffDay);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  if (diffDay < 365) {
    const m = Math.floor(diffDay / 30);
    return `${m} month${m === 1 ? "" : "s"} ago`;
  }
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(iso?: string): string {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function normalizeHome(items: HomeVideo[]): NormalizedVideo[] {
  return items.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    channelTitle: v.snippet.channelTitle,
    publishedAt: v.snippet.publishedAt,
    thumbnail: bestThumbnail(v.snippet.thumbnails),
    duration: formatDuration(v.contentDetails?.duration),
    views: formatViews(v.statistics?.viewCount),
  }));
}

function normalizeSearch(items: SearchItem[]): NormalizedVideo[] {
  return items
    .filter((i) => i.id?.videoId)
    .map((v) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      thumbnail: bestThumbnail(v.snippet.thumbnails),
    }));
}

/* -----------------------------------------------------------------------
 * 3. Root component
 * -------------------------------------------------------------------- */
export default function YouTubeApple() {
  /* ---------- theme ---------- */
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("yta-theme") : null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (typeof window !== "undefined" && window.matchMedia) {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("yta-theme", theme);
  }, [theme]);

  /* ---------- home feed ---------- */
  const [videos, setVideos] = useState<NormalizedVideo[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    setHomeLoading(true);
    setHomeError(null);
    try {
      const res = await fetch(HOME_URL);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setVideos(normalizeHome(data.items ?? []));
    } catch (err: any) {
      setHomeError(err?.message ?? "Unable to load videos");
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  /* ---------- search ---------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<NormalizedVideo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestId = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const myId = ++requestId.current;
    setSearchMode(true);
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(searchUrl(q));
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (myId !== requestId.current) return; // stale
      setSearchResults(normalizeSearch(data.items ?? []));
    } catch (err: any) {
      if (myId !== requestId.current) return;
      setSearchError(err?.message ?? "Unable to search videos");
    } finally {
      if (myId === requestId.current) setSearchLoading(false);
    }
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(searchQuery);
  }
  function clearSearch() {
    requestId.current++;
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }

  /* ---------- nav + player ---------- */
  const [activeNav, setActiveNav] = useState<NavKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<NormalizedVideo | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedVideo(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dark = theme === "dark";

  return (
    <div
      className={
        (dark ? "dark bg-[#000000] text-white" : "bg-[#F5F5F7] text-[#1d1d1f]") +
        " min-h-screen w-full font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',Inter,sans-serif]"
      }
    >
      <Navbar
        dark={dark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
        searchMode={searchMode}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex">
        <Sidebar
          dark={dark}
          active={activeNav}
          onSelect={(k) => {
            setActiveNav(k);
            setSidebarOpen(false);
          }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          {searchMode ? (
            <SearchResultsView
              dark={dark}
              query={searchQuery}
              loading={searchLoading}
              error={searchError}
              results={searchResults}
              onRetry={() => runSearch(searchQuery)}
              onOpen={setSelectedVideo}
            />
          ) : (
            <HomeView
              dark={dark}
              loading={homeLoading}
              error={homeError}
              videos={videos}
              onRetry={loadHome}
              onOpen={setSelectedVideo}
            />
          )}
        </main>
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          dark={dark}
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 4. Navbar
 * -------------------------------------------------------------------- */
function Navbar({
  dark,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchMode,
  onOpenSidebar,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  searchMode: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <header
      className={
        "sticky top-0 z-40 h-14 flex items-center gap-3 px-4 md:px-6 backdrop-blur-xl border-b " +
        (dark
          ? "bg-black/70 border-white/10"
          : "bg-white/70 border-black/[0.06]")
      }
    >
      <button
        onClick={onOpenSidebar}
        aria-label="Open menu"
        className={
          "md:hidden w-8 h-8 grid place-items-center rounded-lg " +
          (dark ? "hover:bg-white/10" : "hover:bg-black/5")
        }
      >
        <MenuIcon />
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <PlaySquareIcon dark={dark} />
        <span className="font-semibold text-[15px] tracking-tight hidden sm:inline">
          Tube
        </span>
      </div>

      <form onSubmit={onSearchSubmit} className="flex-1 max-w-xl mx-auto">
        <div
          className={
            "flex items-center gap-2 h-9 px-3 rounded-full border transition-all focus-within:ring-2 " +
            (dark
              ? "bg-white/5 border-white/10 focus-within:ring-white/20"
              : "bg-black/[0.04] border-black/[0.06] focus-within:ring-black/10")
          }
        >
          <SearchIcon dark={dark} />
          <input
            id="youtube_search_input"
            name="youtube_search_input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            aria-label="Search videos"
            className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-inherit placeholder:opacity-40"
          />
          {searchMode && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="opacity-50 hover:opacity-100"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className={
            "w-8 h-8 grid place-items-center rounded-full transition-all active:scale-90 " +
            (dark ? "hover:bg-white/10" : "hover:bg-black/5")
          }
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          aria-label="Notifications"
          className={
            "w-8 h-8 grid place-items-center rounded-full transition-all active:scale-90 " +
            (dark ? "hover:bg-white/10" : "hover:bg-black/5")
          }
        >
          <BellIcon />
        </button>
        <button
          aria-label="Account"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] grid place-items-center text-white text-[12px] font-semibold"
        >
          V
        </button>
      </div>
    </header>
  );
}

/* -----------------------------------------------------------------------
 * 5. Sidebar
 * -------------------------------------------------------------------- */
const NAV_ITEMS: { key: NavKey; label: string; icon: (a: { dark: boolean }) => JSX.Element }[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "trending", label: "Trending", icon: TrendingIcon },
  { key: "subscriptions", label: "Subscriptions", icon: SubsIcon },
  { key: "library", label: "Library", icon: LibraryIcon },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "watchlater", label: "Watch Later", icon: ClockIcon },
  { key: "liked", label: "Liked Videos", icon: HeartIcon },
];

function Sidebar({
  dark,
  active,
  onSelect,
  open,
  onClose,
}: {
  dark: boolean;
  active: NavKey;
  onSelect: (k: NavKey) => void;
  open: boolean;
  onClose: () => void;
}) {
  const content = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={
              "flex items-center gap-3 h-9 px-3 rounded-lg text-[13.5px] font-medium transition-colors text-left " +
              (isActive
                ? dark
                  ? "bg-white/10 text-white"
                  : "bg-black/[0.06] text-black"
                : dark
                ? "text-white/60 hover:bg-white/5 hover:text-white"
                : "text-black/60 hover:bg-black/[0.04] hover:text-black")
            }
          >
            <Icon dark={dark} />
            {label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* desktop */}
      <aside
        className={
          "hidden md:block w-[230px] shrink-0 border-r sticky top-14 h-[calc(100vh-56px)] overflow-y-auto " +
          (dark ? "border-white/10 bg-black/40" : "border-black/[0.06] bg-white/40")
        }
      >
        {content}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={onClose} />
          <div
            className={
              "w-[240px] h-full overflow-y-auto " +
              (dark ? "bg-[#111113]" : "bg-white")
            }
          >
            <div className="flex justify-end p-2">
              <button
                onClick={onClose}
                className={"w-8 h-8 grid place-items-center rounded-full " + (dark ? "hover:bg-white/10" : "hover:bg-black/5")}
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

/* -----------------------------------------------------------------------
 * 6. Home view
 * -------------------------------------------------------------------- */
function HomeView({
  dark,
  loading,
  error,
  videos,
  onRetry,
  onOpen,
}: {
  dark: boolean;
  loading: boolean;
  error: string | null;
  videos: NormalizedVideo[];
  onRetry: () => void;
  onOpen: (v: NormalizedVideo) => void;
}) {
  if (error) return <ErrorState dark={dark} message={error} onRetry={onRetry} />;

  return (
    <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} dark={dark} />)
        : videos.map((v) => <VideoCard key={v.id} dark={dark} video={v} onOpen={onOpen} />)}
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 7. Search results view
 * -------------------------------------------------------------------- */
function SearchResultsView({
  dark,
  query,
  loading,
  error,
  results,
  onRetry,
  onOpen,
}: {
  dark: boolean;
  query: string;
  loading: boolean;
  error: string | null;
  results: NormalizedVideo[];
  onRetry: () => void;
  onOpen: (v: NormalizedVideo) => void;
}) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold mb-4">
        Search results for &ldquo;{query}&rdquo;
      </h2>

      {error ? (
        <ErrorState dark={dark} message={error} onRetry={onRetry} />
      ) : loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} dark={dark} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState dark={dark} />
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((v) => (
            <SearchResultRow key={v.id} dark={dark} video={v} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 8. Cards
 * -------------------------------------------------------------------- */
function VideoCard({
  dark,
  video,
  onOpen,
}: {
  dark: boolean;
  video: NormalizedVideo;
  onOpen: (v: NormalizedVideo) => void;
}) {
  return (
    <button
      onClick={() => onOpen(video)}
      className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] rounded-2xl"
      aria-label={`Play ${video.title}`}
    >
      <div className="relative aspect-video rounded-[14px] overflow-hidden mb-2.5">
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015] group-hover:brightness-[0.92]"
        />
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 text-[10.5px] font-medium text-white bg-black/75 px-1.5 py-[1px] rounded backdrop-blur-sm">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex gap-2.5">
        <div
          className={
            "w-8 h-8 rounded-full shrink-0 grid place-items-center text-[11px] font-semibold text-white " +
            "bg-gradient-to-br from-[#5E5CE6] to-[#0A84FF]"
          }
        >
          {video.channelTitle?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium leading-snug line-clamp-2">{video.title}</p>
          <p className={"text-[12px] mt-0.5 " + (dark ? "text-white/50" : "text-black/50")}>
            {video.channelTitle}
          </p>
          <p className={"text-[12px] " + (dark ? "text-white/40" : "text-black/40")}>
            {[video.views, formatPublishedDate(video.publishedAt)].filter(Boolean).join(" \u2022 ")}
          </p>
        </div>
      </div>
    </button>
  );
}

function SearchResultRow({
  dark,
  video,
  onOpen,
}: {
  dark: boolean;
  video: NormalizedVideo;
  onOpen: (v: NormalizedVideo) => void;
}) {
  return (
    <button
      onClick={() => onOpen(video)}
      className={
        "w-full text-left flex flex-col sm:flex-row gap-3 p-2 rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] " +
        (dark ? "hover:bg-white/5" : "hover:bg-black/[0.03]")
      }
      aria-label={`Play ${video.title}`}
    >
      <div className="sm:w-[280px] shrink-0 aspect-video rounded-[14px] overflow-hidden">
        <img src={video.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 py-1">
        <p className="text-[14.5px] font-semibold leading-snug line-clamp-2">{video.title}</p>
        <p className={"text-[12px] mt-1 " + (dark ? "text-white/40" : "text-black/40")}>
          {video.channelTitle} &middot; {formatPublishedDate(video.publishedAt)}
        </p>
        <p className={"text-[12.5px] mt-2 line-clamp-2 " + (dark ? "text-white/50" : "text-black/55")}>
          {video.description}
        </p>
      </div>
    </button>
  );
}

/* -----------------------------------------------------------------------
 * 9. Skeletons / empty / error
 * -------------------------------------------------------------------- */
function shimmer(dark: boolean) {
  return dark ? "bg-white/[0.06]" : "bg-black/[0.06]";
}

function SkeletonCard({ dark }: { dark: boolean }) {
  return (
    <div>
      <div className={"aspect-video rounded-[14px] mb-2.5 animate-pulse " + shimmer(dark)} />
      <div className="flex gap-2.5">
        <div className={"w-8 h-8 rounded-full shrink-0 animate-pulse " + shimmer(dark)} />
        <div className="flex-1 flex flex-col gap-2 pt-0.5">
          <div className={"h-3 rounded animate-pulse w-11/12 " + shimmer(dark)} />
          <div className={"h-3 rounded animate-pulse w-2/3 " + shimmer(dark)} />
          <div className={"h-2.5 rounded animate-pulse w-1/2 " + shimmer(dark)} />
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ dark }: { dark: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className={"sm:w-[280px] aspect-video rounded-[14px] shrink-0 animate-pulse " + shimmer(dark)} />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className={"h-3.5 rounded animate-pulse w-3/4 " + shimmer(dark)} />
        <div className={"h-3 rounded animate-pulse w-1/3 " + shimmer(dark)} />
        <div className={"h-3 rounded animate-pulse w-full " + shimmer(dark)} />
        <div className={"h-3 rounded animate-pulse w-5/6 " + shimmer(dark)} />
      </div>
    </div>
  );
}

function EmptyState({ dark }: { dark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-2">
      <div className={"w-14 h-14 rounded-full grid place-items-center mb-2 " + (dark ? "bg-white/5" : "bg-black/5")}>
        <SearchIcon dark={dark} />
      </div>
      <p className="text-[15px] font-semibold">No results found</p>
      <p className={"text-[13px] " + (dark ? "text-white/45" : "text-black/45")}>
        Try different keywords or check your spelling.
      </p>
    </div>
  );
}

function ErrorState({
  dark,
  message,
  onRetry,
}: {
  dark: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-2">
      <div className={"w-14 h-14 rounded-full grid place-items-center mb-2 " + (dark ? "bg-white/5" : "bg-black/5")}>
        <WarningIcon />
      </div>
      <p className="text-[15px] font-semibold">Unable to load videos</p>
      <p className={"text-[13px] max-w-xs " + (dark ? "text-white/45" : "text-black/45")}>{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 text-[13px] font-medium px-4 h-8 rounded-full text-white bg-[#0A84FF] hover:brightness-110 active:scale-95 transition-all"
      >
        Retry
      </button>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 10. Video player modal
 * -------------------------------------------------------------------- */
function VideoPlayerModal({
  dark,
  video,
  onClose,
}: {
  dark: boolean;
  video: NormalizedVideo;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          "w-full max-w-3xl rounded-2xl overflow-hidden border shadow-2xl " +
          (dark ? "bg-[#111113] border-white/10" : "bg-white border-black/10")
        }
      >
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-snug line-clamp-2">{video.title}</h3>
            <p className={"text-[12.5px] mt-1 " + (dark ? "text-white/50" : "text-black/50")}>
              {video.channelTitle}
              {video.publishedAt ? ` \u2022 ${formatPublishedDate(video.publishedAt)}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close player"
            className={
              "w-8 h-8 shrink-0 grid place-items-center rounded-full transition-colors " +
              (dark ? "hover:bg-white/10" : "hover:bg-black/5")
            }
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 11. Inline icon set
 * -------------------------------------------------------------------- */
function iconColor(dark?: boolean) {
  return dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: iconColor(dark) }}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlaySquareIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4" width="19" height="16" rx="4" stroke={iconColor(dark)} strokeWidth="1.6" />
      <path d="M10 9.5l5 2.5-5 2.5v-5z" fill="#0A84FF" />
    </svg>
  );
}
function HomeIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrendingIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SubsIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 6l8 5 8-5M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LibraryIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 4v16M9 4v16M14 5l6 2-4 15-6-2M4 4h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HistoryIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4M3 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20s-7-4.35-9.5-8.5C.87 8.1 2.6 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.4 0 5.13 3.1 3.5 6.5C19 15.65 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}