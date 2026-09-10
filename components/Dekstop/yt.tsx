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
  type ReactElement,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import { useSettings } from "@/app/context/settingContext";
import { playById } from "@/lib/sound";
import { CareerTaskMeta, useCareerClock } from "../Desktop/CareerTaskMeta";
import {
  careerTaskDateKey,
  getCareerTaskTiming,
  type CareerTaskItem,
} from "../Desktop/careerTaskGroups";
import {
  buildLearningVideoQuery,
  extractLearningTopic,
} from "@/lib/youtubeLearningSearch";
import PublishArtifactButton from "../Desktop/PublishArtifactButton";

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

const searchUrl = (q: string) =>
  `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&type=video&videoEmbeddable=true&safeSearch=strict&key=${YT_API_KEY}&order=relevance&q=${encodeURIComponent(
    q
  )}`;

const detailsUrl = (ids: string[]) =>
  `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${ids.join(",")}&key=${YT_API_KEY}`;

const exploreUrl =
  `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&chart=mostPopular&maxResults=12&regionCode=IN&key=${YT_API_KEY}`;

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

type CareerPlaylistResource = {
  title: string;
  searchQuery?: string;
  url?: string;
};

type CareerPlaylist = {
  missionId: string;
  title: string;
  youtubeResources: CareerPlaylistResource[];
};

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

/* -----------------------------------------------------------------------
 * 3. Root component
 * -------------------------------------------------------------------- */
export default function YouTubeApple({
  initialCareerTask,
  initialSearchQuery,
  autoplayFirst = false,
}: {
  initialCareerTask?: CareerTaskItem;
  initialSearchQuery?: string;
  autoplayFirst?: boolean;
} = {}) {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const now = useCareerClock();

  /* ---------- search ---------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<NormalizedVideo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [exploreVideos, setExploreVideos] = useState<NormalizedVideo[]>([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<CareerTaskItem | null>(null);
  const [lockedTopic, setLockedTopic] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<NormalizedVideo | null>(null);
  const [careerPlaylists, setCareerPlaylists] = useState<CareerPlaylist[]>([]);
  const [activeMissionId, setActiveMissionId] = useState(initialCareerTask?.missionId ?? "");
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const requestId = useRef(0);
  const initializedTopic = useRef(false);
  const shouldAutoplay = useRef(autoplayFirst);

  const runSearch = useCallback(async (q: string, careerFocused = false) => {
    const topic = careerFocused ? extractLearningTopic(q) : q.trim();
    if (!topic) return;
    const myId = ++requestId.current;
    setSearchQuery(topic);
    setSearchMode(true);
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(searchUrl(careerFocused ? buildLearningVideoQuery(topic) : topic));
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (myId !== requestId.current) return; // stale
      const ids: string[] = (data.items ?? [])
        .map((item: SearchItem) => item.id?.videoId)
        .filter((id: string | undefined): id is string => Boolean(id));
      if (!ids.length) {
        setSearchResults([]);
        return;
      }
      const detailsResponse = await fetch(detailsUrl(ids));
      if (!detailsResponse.ok) {
        throw new Error(`Unable to load video details (${detailsResponse.status})`);
      }
      const details = await detailsResponse.json();
      if (myId !== requestId.current) return;
      const videosById = new Map<string, HomeVideo>(
        (details.items ?? []).map((video: HomeVideo) => [video.id, video])
      );
      const videos = ids
        .map((id) => videosById.get(id))
        .filter((video): video is HomeVideo => Boolean(video));
      const normalizedVideos = normalizeHome(videos);
      setSearchResults(normalizedVideos);
      if (shouldAutoplay.current && normalizedVideos[0]) {
        shouldAutoplay.current = false;
        setSelectedVideo(normalizedVideos[0]);
      }
    } catch (err: any) {
      if (myId !== requestId.current) return;
      setSearchError(err?.message ?? "Unable to search videos");
    } finally {
      if (myId === requestId.current) setSearchLoading(false);
    }
  }, []);

  const loadExploreVideos = useCallback(async () => {
    setExploreLoading(true);
    setExploreError(null);
    try {
      const response = await fetch(exploreUrl);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
      }
      const data = await response.json();
      setExploreVideos(normalizeHome(Array.isArray(data.items) ? data.items : []));
    } catch (error) {
      setExploreError(error instanceof Error ? error.message : "Unable to load Explore videos");
    } finally {
      setExploreLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExploreVideos();
  }, [loadExploreVideos]);

  useEffect(() => {
    if (initializedTopic.current) return;
    const topic = initialSearchQuery || initialCareerTask?.title;
    if (!topic) {
      initializedTopic.current = true;
      return;
    }
    initializedTopic.current = true;
    setSelectedTask(initialCareerTask ?? null);
    setLockedTopic(initialCareerTask ? extractLearningTopic(topic) : "");
    void runSearch(topic, Boolean(initialCareerTask));
  }, [initialCareerTask, initialSearchQuery, runSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const endpoint = initialCareerTask?.missionId
      ? `/api/career/resources?missionId=${encodeURIComponent(initialCareerTask.missionId)}`
      : "/api/career/resources";
    void fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Unable to load Career playlists (${response.status})`);
        const result = await response.json();
        const playlists: CareerPlaylist[] = initialCareerTask?.missionId
          ? [{
              missionId: result.missionId,
              title: initialCareerTask.title,
              youtubeResources: Array.isArray(result.youtubeResources) ? result.youtubeResources : [],
            }]
          : Array.isArray(result.playlists) ? result.playlists : [];
        const available = playlists.filter((playlist) => playlist.youtubeResources.length > 0);
        setCareerPlaylists(available);
        const active = available.find((playlist) => playlist.missionId === initialCareerTask?.missionId) || available[0];
        if (!active) return;
        setActiveMissionId(active.missionId);
        const resource = active.youtubeResources.find((item) => item.searchQuery === initialSearchQuery) || active.youtubeResources[0];
        if (resource) void runSearch(resource.title, true);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load Career playlists", error);
      })
      .finally(() => setPlaylistsLoading(false));
    return () => controller.abort();
  }, [initialCareerTask?.missionId, initialCareerTask?.title, initialSearchQuery, runSearch]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSelectedTask(null);
    setLockedTopic("");
    void runSearch(searchQuery);
  }
  function clearSearch() {
    requestId.current++;
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSelectedTask(null);
    setLockedTopic("");
  }

  const selectedTiming = selectedTask ? getCareerTaskTiming(selectedTask, now) : null;
  const canWatch = !selectedTask || selectedTiming?.state === 'active';
  const activePlaylist = careerPlaylists.find((playlist) => playlist.missionId === activeMissionId) || careerPlaylists[0];
  const playedLockedTaskSoundRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedTask || canWatch || careerTaskDateKey(selectedTask.scheduledDate) !== careerTaskDateKey(now)) return;
    if (playedLockedTaskSoundRef.current === selectedTask.id) return;
    playedLockedTaskSoundRef.current = selectedTask.id;
    void playById('shocked-sound-effect').catch(() => {});
  }, [canWatch, now, selectedTask]);

  return (
    <div
      className={
        (dark ? "dark bg-[#000000] text-white" : "bg-[#F5F5F7] text-[#1d1d1f]") +
        " min-h-screen w-full font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',Inter,sans-serif]"
      }
    >
      <Navbar
        dark={dark}
        searchQuery={searchQuery}
        lockedTopic={lockedTopic}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
        searchMode={searchMode}
      />

      {(activePlaylist || selectedTask) && (
        <div className={"flex items-center justify-between gap-3 border-b px-4 py-2.5 md:px-6 " + (dark ? "border-white/8 bg-white/3" : "border-black/8 bg-white")}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500">Career playlist</p>
            <p className={"truncate text-xs " + (dark ? "text-white/55" : "text-black/55")}>{activePlaylist?.title || lockedTopic || selectedTask?.title}</p>
          </div>
          <PublishArtifactButton kind="youtube" sourceId={activePlaylist?.missionId || selectedTask!.id} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {(playlistsLoading || careerPlaylists.length > 0) && (
          <aside className={"shrink-0 border-b p-4 lg:w-64 lg:border-b-0 lg:border-r " + (dark ? "border-white/8 bg-white/2" : "border-black/8 bg-white/70")}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500">Career playlists</p>
            {playlistsLoading ? (
              <p className={"text-xs " + (dark ? "text-white/45" : "text-black/45")}>Loading playlists...</p>
            ) : (
              <div className="space-y-2">
                {careerPlaylists.map((playlist) => (
                  <div key={playlist.missionId}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMissionId(playlist.missionId);
                        const first = playlist.youtubeResources[0];
                        if (first) void runSearch(first.title, true);
                      }}
                      className={"w-full rounded-md px-2.5 py-2 text-left text-xs font-semibold " + (playlist.missionId === activePlaylist?.missionId ? "youtube-theme-soft" : dark ? "text-white/65 hover:bg-white/5" : "text-black/65 hover:bg-black/4")}
                    >
                      <span className="block truncate">{playlist.title}</span>
                      <span className="mt-0.5 block text-[10px] font-normal opacity-55">{playlist.youtubeResources.length} topics</span>
                    </button>
                    {playlist.missionId === activePlaylist?.missionId && (
                      <div className="mt-1 space-y-0.5 pl-2">
                        {playlist.youtubeResources.map((resource, index) => (
                          <button
                            key={`${resource.searchQuery || resource.title}-${index}`}
                            type="button"
                            onClick={() => void runSearch(resource.title, true)}
                            className={"flex w-full gap-2 rounded-md px-2 py-1.5 text-left text-[11px] leading-4 " + (dark ? "text-white/45 hover:bg-white/5 hover:text-white/75" : "text-black/45 hover:bg-black/4 hover:text-black/75")}
                          >
                            <span className="shrink-0 tabular-nums opacity-45">{String(index + 1).padStart(2, "0")}</span>
                            <span className="line-clamp-2">{resource.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          {searchMode ? (
            <SearchResultsView
              dark={dark}
              query={searchQuery}
              loading={searchLoading}
              error={searchError}
              results={searchResults}
              onRetry={() => runSearch(searchQuery, Boolean(selectedTask))}
              onOpen={canWatch ? setSelectedVideo : undefined}
              task={selectedTask}
              now={now}
            />
          ) : (
            <HomeView
              dark={dark}
              loading={exploreLoading}
              error={exploreError}
              videos={exploreVideos}
              onRetry={loadExploreVideos}
              onOpen={setSelectedVideo}
            />
          )}
        </main>
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          dark={dark}
          video={selectedVideo}
          task={selectedTask}
          onClose={() => {
            setSelectedVideo(null);
          }}
        />
      )}
      <style jsx global>{`
        .youtube-theme-fill {
          background: var(--theme-primary-color);
        }
        .youtube-theme-text {
          color: var(--theme-primary-color);
        }
        .youtube-theme-soft {
          color: var(--theme-primary-color);
          background: var(--theme-primary-soft);
        }
        .youtube-theme-panel {
          border-color: color-mix(in srgb, var(--theme-primary-color) 28%, transparent);
          background: var(--theme-primary-soft);
        }
      `}</style>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * 4. Navbar
 * -------------------------------------------------------------------- */
function Navbar({
  dark,
  searchQuery,
  lockedTopic,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchMode,
}: {
  dark: boolean;
  searchQuery: string;
  lockedTopic: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  searchMode: boolean;
}) {
  return (
    <header
      className={
        "sticky top-0 z-40 h-14 flex items-center gap-3 px-4 md:px-6 backdrop-blur-xl border-b " +
        (dark
          ? "bg-black/70 border-white/10"
          : "bg-white/70 border-black/6")
      }
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {searchMode && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label="Back to today's schedule"
            className={
              "mr-1 grid h-8 w-8 place-items-center rounded-full transition-colors " +
              (dark ? "hover:bg-white/10" : "hover:bg-black/5")
            }
          >
            <ArrowLeft size={17} />
          </button>
        )}
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
              : "bg-black/4 border-black/6 focus-within:ring-black/10")
          }
        >
          <SearchIcon dark={dark} />
          <input
            id="youtube_search_input"
            name="youtube_search_input"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search YouTube"
            aria-label="Search YouTube"
            title={lockedTopic ? `Career topic: ${lockedTopic}` : undefined}
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
          className="youtube-theme-fill grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold text-white"
        >
          V
        </button>
      </div>
    </header>
  );
}

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
  task,
  now,
}: {
  dark: boolean;
  query: string;
  loading: boolean;
  error: string | null;
  results: NormalizedVideo[];
  onRetry: () => void;
  onOpen?: (v: NormalizedVideo) => void;
  task: CareerTaskItem | null;
  now: Date;
}) {
  const timing = task ? getCareerTaskTiming(task, now) : null;

  return (
    <div>
      {task && timing && (
        <div className="youtube-theme-panel mb-5 flex flex-wrap items-center gap-4 rounded-lg border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase opacity-55">Today&apos;s allotted topic</p>
            <h2 className="mt-1 truncate text-[15px] font-semibold">{task.title}</h2>
            <p className="mt-1 text-[12px] opacity-55">
              {timing.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {timing.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {task.duration ?? 60} minutes
            </p>
          </div>
          <CareerTaskMeta task={task} now={now} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Popular videos for &ldquo;{query}&rdquo;</h2>
        {timing && timing.state !== 'active' && (
          <span className="flex shrink-0 items-center gap-1 text-[11px] opacity-50">
            <LockKeyhole size={12} />
            Opens at allotted time
          </span>
        )}
      </div>

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
          {results.map((v, index) => (
            <SearchResultRow key={v.id} dark={dark} video={v} onOpen={onOpen} isFirst={index === 0} />
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
          <span className="absolute bottom-1.5 right-1.5 text-[10.5px] font-medium text-white bg-black/75 px-1.5 py-px rounded backdrop-blur-sm">
            {video.duration}
          </span>
        )}
      </div>
      <div className="flex gap-2.5">
        <div
          className={
            "w-8 h-8 rounded-full shrink-0 grid place-items-center text-[11px] font-semibold text-white " +
            "bg-linear-to-br from-[#5E5CE6] to-[#0A84FF]"
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
  isFirst = false,
}: {
  dark: boolean;
  video: NormalizedVideo;
  onOpen?: (v: NormalizedVideo) => void;
  isFirst?: boolean;
}) {
  return (
    <button
      id={isFirst ? 'youtube_first_video' : undefined}
      name={isFirst ? 'youtube_first_video' : undefined}
      onClick={() => onOpen?.(video)}
      disabled={!onOpen}
      className={
        "w-full text-left flex flex-col sm:flex-row gap-3 p-2 rounded-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] " +
        (dark ? "hover:bg-white/5" : "hover:bg-black/3") +
        (!onOpen ? " cursor-not-allowed opacity-60" : "")
      }
      aria-label={`Play ${video.title}`}
    >
      <div className="sm:w-70 shrink-0 aspect-video rounded-[14px] overflow-hidden">
        <img src={video.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 py-1">
        <p className="text-[14.5px] font-semibold leading-snug line-clamp-2">{video.title}</p>
        <p className={"text-[12px] mt-1 " + (dark ? "text-white/40" : "text-black/40")}>
          {video.channelTitle} &middot; {[video.views, formatPublishedDate(video.publishedAt)].filter(Boolean).join(" · ")}
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
      <div className={"sm:w-70 aspect-video rounded-[14px] shrink-0 animate-pulse " + shimmer(dark)} />
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
  task,
  onClose,
}: {
  dark: boolean;
  video: NormalizedVideo;
  task: CareerTaskItem | null;
  onClose: () => void;
}) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playStartedAt = useRef<number | null>(null);
  const watchedSeconds = useRef(0);
  const durationSeconds = useRef(0);
  const watchAccepted = useRef(false);
  const [phase, setPhase] = useState<'video' | 'loading-quiz' | 'quiz' | 'passed'>('video');
  const [questions, setQuestions] = useState<Array<{ id: string; prompt: string; options: string[] }>>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Array<{ questionId: string; correct: boolean; explanation: string }>>([]);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const flushPlayTime = useCallback(() => {
    if (playStartedAt.current !== null) {
      watchedSeconds.current += Math.max(0, (Date.now() - playStartedAt.current) / 1000);
      playStartedAt.current = null;
    }
    return watchedSeconds.current;
  }, []);

  const callAgent = useCallback(async (body: Record<string, unknown>) => {
    if (!task) return null;
    const response = await fetch('/api/career/youtube-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: task.missionId, taskId: task.id, ...body }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'YouTube Agent could not continue');
    return data;
  }, [task]);

  const handleReady = useCallback((event: YouTubeEvent) => {
    playerRef.current = event.target;
    durationSeconds.current = Number(event.target.getDuration?.() || 0);
  }, []);

  const handlePlay = useCallback(() => {
    if (playStartedAt.current === null) playStartedAt.current = Date.now();
    if (task && watchedSeconds.current === 0) {
      void callAgent({
        action: 'record',
        event: 'started',
        video: { id: video.id, title: video.title, channelTitle: video.channelTitle },
        durationSeconds: durationSeconds.current,
      }).catch((error: Error) => setAgentError(error.message));
    }
  }, [callAgent, task, video]);

  const handlePause = useCallback(() => {
    flushPlayTime();
  }, [flushPlayTime]);

  const handleEnd = useCallback(async () => {
    if (!task) return;
    setAgentError(null);
    setPhase('loading-quiz');
    const watched = flushPlayTime();
    try {
      const recorded = await callAgent({
        action: 'record',
        event: 'ended',
        video: { id: video.id, title: video.title, channelTitle: video.channelTitle },
        watchedSeconds: watched,
        durationSeconds: durationSeconds.current || Number(playerRef.current?.getDuration?.() || 0),
      });
      if (recorded?.evidence?.status !== 'watched') {
        throw new Error('Watch at least 80% of this related video before the knowledge check.');
      }
      watchAccepted.current = true;
      const quiz = await callAgent({ action: 'questions' });
      setQuestions(quiz.questions);
      setAnswers(Array(quiz.questions.length).fill(-1));
      setPhase('quiz');
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : 'YouTube Agent could not prepare the check-in');
      setPhase('video');
    }
  }, [callAgent, flushPlayTime, task, video]);

  const closePlayer = useCallback(() => {
    const watched = flushPlayTime();
    if (task && !watchAccepted.current && phase !== 'passed') {
      void callAgent({
        action: 'record',
        event: 'skipped',
        video: { id: video.id, title: video.title, channelTitle: video.channelTitle },
        watchedSeconds: watched,
        durationSeconds: durationSeconds.current || Number(playerRef.current?.getDuration?.() || 0),
      }).finally(onClose);
      return;
    }
    onClose();
  }, [callAgent, flushPlayTime, onClose, phase, task, video]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closePlayer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePlayer]);

  const submitAnswers = useCallback(async () => {
    if (answers.some((answer) => answer < 0)) {
      setAgentError('Answer every question before submitting.');
      return;
    }
    setSubmitting(true);
    setAgentError(null);
    try {
      const result = await callAgent({ action: 'submit', answers });
      setFeedback(result.feedback || []);
      if (result.passed) {
        setPhase('passed');
        window.dispatchEvent(new CustomEvent('career-progress', {
          detail: { missionId: task?.missionId, reason: 'task', progress: result.progress },
        }));
      } else {
        setAgentError(`Score: ${result.score}%. Review the feedback and try again.`);
      }
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : 'Could not submit answers');
    } finally {
      setSubmitting(false);
    }
  }, [answers, callAgent, task]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={closePlayer}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          "w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl " +
          (dark ? "bg-[#111113] border-white/10" : "bg-white border-black/10")
        }
      >
        {phase === 'video' || !task ? (
          <div className="aspect-video bg-black">
            <YouTube
              videoId={video.id}
              id="youtube_video_player"
              className="w-full h-full"
              iframeClassName="w-full h-full"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: { autoplay: 1, rel: 0 },
              }}
              onReady={handleReady}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnd={handleEnd}
            />
          </div>
        ) : (
          <div className="p-6 md:p-8">
            {phase === 'loading-quiz' ? (
              <div className="min-h-64 grid place-items-center text-sm">YouTube Agent is preparing your check-in...</div>
            ) : phase === 'passed' ? (
              <div className="min-h-64 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-12 h-12 rounded-full grid place-items-center bg-green-500 text-white text-xl">✓</div>
                <div>
                  <h3 className="text-lg font-semibold">Knowledge check passed</h3>
                  <p className={"mt-1 text-sm " + (dark ? "text-white/55" : "text-black/55")}>Your watched video, answers, score, and feedback are saved.</p>
                </div>
                <button onClick={closePlayer} className="h-9 px-5 rounded-lg bg-green-600 text-white text-sm font-medium">Done</button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase text-red-500">YouTube Agent</p>
                <h3 className="mt-1 text-lg font-semibold">Answer every question to complete this task</h3>
                <div className="mt-5 space-y-5">
                  {questions.map((question, questionIndex) => (
                    <fieldset key={question.id}>
                      <legend className="text-sm font-medium">{questionIndex + 1}. {question.prompt}</legend>
                      <div className="mt-2 grid gap-2">
                        {question.options.map((option, optionIndex) => {
                          return (
                            <label key={option} className={"flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm " + (dark ? "border-white/10" : "border-black/10")}>
                              <input
                                type="radio"
                                name={question.id}
                                checked={answers[questionIndex] === optionIndex}
                                onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer))}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                        {feedback.find((item) => item.questionId === question.id) && (
                          <p className={"text-xs " + (feedback.find((item) => item.questionId === question.id)?.correct ? "text-green-600" : "text-red-500")}>
                            {feedback.find((item) => item.questionId === question.id)?.explanation}
                          </p>
                        )}
                      </div>
                    </fieldset>
                  ))}
                </div>
                {agentError && <p role="alert" className="mt-4 text-sm text-red-500">{agentError}</p>}
                <button
                  onClick={submitAnswers}
                  disabled={submitting}
                  className="mt-5 h-10 px-5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Checking...' : feedback.length ? 'Try again' : 'Submit answers'}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-snug line-clamp-2">{video.title}</h3>
            <p className={"text-[12.5px] mt-1 " + (dark ? "text-white/50" : "text-black/50")}>
              {video.channelTitle}
              {video.publishedAt ? ` \u2022 ${formatPublishedDate(video.publishedAt)}` : ""}
            </p>
          </div>
          <button
            onClick={closePlayer}
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