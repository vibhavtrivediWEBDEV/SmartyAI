"use client"

import { useMemo, useState } from "react"
import { Check, ChevronRight, Search, ShieldCheck, Sparkles } from "lucide-react"
import { useSettings } from "@/app/context/settingContext"
import { canPinDesktopApp, DESKTOP_APPS, type DesktopAppCategory } from "@/lib/desktopApps"

const CATEGORIES: Array<"All Apps" | DesktopAppCategory> = [
  "All Apps",
  "Productivity",
  "Creativity",
  "Developer",
  "Entertainment",
  "System",
]

function launchApp(name: string) {
  window.dispatchEvent(new CustomEvent("smarty:open-app", { detail: { name } }))
}

export default function AppLaunchpad() {
  const { settings, updateSettings } = useSettings()
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All Apps")
  const [query, setQuery] = useState("")

  const pinnedApps = settings.pinnedDockApps ?? []
  const visibleApps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return DESKTOP_APPS.filter((app) => {
      const categoryMatches = category === "All Apps" || app.category === category
      const queryMatches = !normalizedQuery || `${app.displayName} ${app.description} ${app.category}`.toLowerCase().includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [category, query])

  const toggleDock = (name: string, essential?: boolean) => {
    if (essential || !canPinDesktopApp(name)) return
    const nextPinnedApps = pinnedApps.includes(name)
      ? pinnedApps.filter((appName) => appName !== name)
      : [...pinnedApps, name]
    updateSettings({ pinnedDockApps: nextPinnedApps })
  }

  return (
    <div className="h-full min-h-140 w-full overflow-hidden bg-[#f4f4f6] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display',sans-serif] text-[#1d1d1f] dark:bg-[#141416] dark:text-white">
      <div className="flex h-full">
        <aside className="hidden w-60 shrink-0 border-r border-black/8 bg-white/75 p-4 backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.035] md:block">
          <div className="mb-6 flex items-center gap-2 px-2 text-xl font-semibold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-lg font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]" style={{ background: "var(--theme-primary-color)" }}>A</div>
            App Store
          </div>
          <nav className="space-y-1">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${category === item ? "app-store-accent text-white shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              >
                {item}
                <ChevronRight size={14} className={category === item ? "opacity-80" : "opacity-30"} />
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-black/6 bg-black/2.5 p-3 text-xs leading-relaxed text-black/55 dark:border-white/7 dark:bg-white/4 dark:text-white/55">
            <div className="mb-1 font-semibold text-black/80 dark:text-white/80">Customize your Dock</div>
            Your daily Career tools stay close. Communication, Maps, and AI Search remain available here without crowding your Dock.
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-black/8 bg-[#f4f4f6]/85 px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#141416]/85 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{category}</h1>
                <p className="text-sm text-black/50 dark:text-white/50">Every application available on your desktop</p>
              </div>
              <label className="app-store-focus flex h-9 w-full items-center gap-2 rounded-lg bg-black/6 px-3 text-black/45 ring-1 ring-black/3 dark:bg-white/8 dark:text-white/45 dark:ring-white/4 sm:w-64">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/40 dark:text-white dark:placeholder:text-white/40"
                />
              </label>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? "app-store-accent text-white" : "bg-black/5 dark:bg-white/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <section className="p-5 sm:p-8">
            <div className="relative mb-7 overflow-hidden rounded-2xl border border-black/6 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/8 dark:bg-white/5.5 sm:p-8">
              <div className="app-store-soft absolute inset-y-0 left-0 w-1" />
              <div className="max-w-xl">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-black/45 dark:text-white/45"><Sparkles size={14} className="app-store-text" /> Curated workspace</div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need. Nothing in the way.</h2>
                <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55 sm:text-base">Career essentials stay in your Dock. Every other capable app is one click away in this library.</p>
              </div>
            </div>

            {visibleApps.length ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
                {visibleApps.map((app) => {
                  const isStoreOnly = !canPinDesktopApp(app.name)
                  const isPinned = pinnedApps.includes(app.name) || app.essential
                  return (
                    <article key={app.name} className="app-store-card group flex items-center gap-4 border-b border-black/8 py-4 dark:border-white/8">
                      <button type="button" onClick={() => launchApp(app.name)} className="app-store-icon-focus shrink-0 rounded-[22%] focus:outline-none focus:ring-2">
                        <img
                          src={app.icon}
                          alt=""
                          className="h-16 w-16 rounded-[22%] object-contain shadow-sm transition-transform group-hover:scale-[1.04] sm:h-18 sm:w-18"
                          onError={(event) => { event.currentTarget.src = "/app.svg" }}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => launchApp(app.name)} className="app-store-name block max-w-full truncate text-left font-semibold">
                          {app.displayName}
                        </button>
                        <div className="mt-0.5 text-xs text-black/45 dark:text-white/45">{app.category}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-black/60 dark:text-white/60">{app.description}</p>
                      </div>
                      <div className="app-store-actions flex shrink-0 flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => launchApp(app.name)}
                          className="app-store-open min-w-19 rounded-full bg-black/6 px-4 py-1.5 text-xs font-bold transition-colors hover:bg-black/10 dark:bg-white/9 dark:hover:bg-white/14"
                        >
                          OPEN
                        </button>
                        <button
                          type="button"
                          disabled={app.essential || isStoreOnly}
                          onClick={() => toggleDock(app.name, app.essential)}
                          title={app.essential ? "This app always stays in the Dock" : isStoreOnly ? "Available from the App Store" : isPinned ? "Remove from Dock" : "Add to Dock"}
                          className={`flex min-w-19 items-center justify-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${app.essential || isStoreOnly
                            ? "cursor-default text-black/35 dark:text-white/35"
                            : isPinned
                              ? "app-store-soft app-store-text hover:bg-red-500/10 hover:text-red-500"
                              : "app-store-accent text-white hover:brightness-95"
                            }`}
                        >
                          {isPinned && <Check size={11} strokeWidth={3} />}
                          {isStoreOnly && <ShieldCheck size={11} strokeWidth={2.5} />}
                          {app.essential ? "IN DOCK" : isStoreOnly ? "APP STORE" : isPinned ? "REMOVE" : "ADD TO DOCK"}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-black/45 dark:text-white/45">No apps match “{query}”.</div>
            )}
          </section>
        </main>
      </div>
      <style jsx global>{`
        .app-store-accent { background: var(--theme-primary-color); }
        .app-store-soft { background: var(--theme-primary-soft); }
        .app-store-text, .app-store-open, .app-store-name:hover { color: var(--theme-primary-color); }
        .app-store-focus:focus-within { box-shadow: 0 0 0 3px var(--theme-primary-soft); }
        .app-store-icon-focus:focus { --tw-ring-color: var(--theme-primary-color); }
        @media (max-width: 639px) {
          .app-store-card { display: grid; grid-template-columns: 64px minmax(0, 1fr); }
          .app-store-actions { grid-column-start: 2; flex-direction: row; justify-content: flex-start; }
        }
      `}</style>
    </div>
  )
}
