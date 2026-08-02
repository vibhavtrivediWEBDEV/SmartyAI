"use client"

import { useMemo, useState } from "react"
import { Check, ChevronRight, Search } from "lucide-react"
import { useSettings } from "@/app/context/settingContext"
import { DESKTOP_APPS, type DesktopAppCategory } from "@/lib/desktopApps"

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
    if (essential) return
    const nextPinnedApps = pinnedApps.includes(name)
      ? pinnedApps.filter((appName) => appName !== name)
      : [...pinnedApps, name]
    updateSettings({ pinnedDockApps: nextPinnedApps })
  }

  return (
    <div className="h-full min-h-[560px] w-full overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#1c1c1e] dark:text-white">
      <div className="flex h-full">
        <aside className="hidden w-56 shrink-0 border-r border-black/10 bg-white/70 p-4 backdrop-blur-3xl dark:border-white/10 dark:bg-black/20 md:block">
          <div className="mb-6 flex items-center gap-2 px-2 text-xl font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#37a9ff] to-[#0674ea] text-lg font-bold text-white shadow-sm">A</div>
            App Store
          </div>
          <nav className="space-y-1">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${category === item ? "bg-[#007aff] text-white" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              >
                {item}
                <ChevronRight size={14} className={category === item ? "opacity-80" : "opacity-30"} />
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-black/5 bg-black/[0.03] p-3 text-xs leading-relaxed text-black/55 dark:border-white/5 dark:bg-white/5 dark:text-white/55">
            <div className="mb-1 font-semibold text-black/80 dark:text-white/80">Customize your Dock</div>
            Use <strong>Add to Dock</strong> or <strong>Remove</strong> on any app. Finder and App Store always remain available.
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-black/10 bg-[#f5f5f7]/85 px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#1c1c1e]/85 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{category}</h1>
                <p className="text-sm text-black/50 dark:text-white/50">Every application available on your desktop</p>
              </div>
              <label className="flex h-9 w-full items-center gap-2 rounded-lg bg-black/[0.07] px-3 text-black/45 focus-within:ring-2 focus-within:ring-[#007aff]/40 dark:bg-white/10 dark:text-white/45 sm:w-64">
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
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-[#007aff] text-white" : "bg-black/5 dark:bg-white/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <section className="p-5 sm:p-8">
            <div className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#087df1] via-[#4a82f0] to-[#9c5ce8] p-6 text-white shadow-lg sm:p-8">
              <div className="max-w-xl">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70">Smarty essentials</div>
                <h2 className="text-2xl font-bold sm:text-3xl">Your apps. Your Dock.</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">Launch every installed desktop app here, including Excel Tables, or choose exactly which apps appear in your Dock.</p>
              </div>
            </div>

            {visibleApps.length ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
                {visibleApps.map((app) => {
                  const isPinned = pinnedApps.includes(app.name) || app.essential
                  return (
                    <article key={app.name} className="group flex items-center gap-4 border-b border-black/10 py-4 dark:border-white/10">
                      <button type="button" onClick={() => launchApp(app.name)} className="shrink-0 rounded-[22%] focus:outline-none focus:ring-2 focus:ring-[#007aff]">
                        <img
                          src={app.icon}
                          alt=""
                          className="h-16 w-16 rounded-[22%] object-contain shadow-sm transition-transform group-hover:scale-[1.04] sm:h-[72px] sm:w-[72px]"
                          onError={(event) => { event.currentTarget.src = "/app.svg" }}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => launchApp(app.name)} className="block max-w-full truncate text-left font-semibold hover:text-[#007aff]">
                          {app.displayName}
                        </button>
                        <div className="mt-0.5 text-xs text-black/45 dark:text-white/45">{app.category}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-black/60 dark:text-white/60">{app.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => launchApp(app.name)}
                          className="min-w-[76px] rounded-full bg-black/[0.07] px-4 py-1.5 text-xs font-bold text-[#007aff] transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                        >
                          OPEN
                        </button>
                        <button
                          type="button"
                          disabled={app.essential}
                          onClick={() => toggleDock(app.name, app.essential)}
                          title={app.essential ? "This app always stays in the Dock" : isPinned ? "Remove from Dock" : "Add to Dock"}
                          className={`flex min-w-[76px] items-center justify-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${app.essential
                            ? "cursor-default text-black/35 dark:text-white/35"
                            : isPinned
                              ? "bg-[#007aff]/10 text-[#007aff] hover:bg-red-500/10 hover:text-red-500"
                              : "bg-[#007aff] text-white hover:bg-[#0873dc]"
                            }`}
                        >
                          {isPinned && <Check size={11} strokeWidth={3} />}
                          {app.essential ? "IN DOCK" : isPinned ? "REMOVE" : "ADD TO DOCK"}
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
    </div>
  )
}
