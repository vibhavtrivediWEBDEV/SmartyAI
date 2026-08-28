"use client"

import React, { useState, useEffect } from "react"
import { Search, Download, Star, ChevronRight, Sparkles } from "lucide-react"
import { useSettings } from "@/app/context/settingContext"

interface AppData {
  id: string
  name: string
  developer: string
  category: string
  rating: number
  reviews: number
  price: string | "Free"
  icon: string
  screenshots?: string[]
  description: string
  size: string
  ageRating: string
  downloaded?: boolean
  featured?: boolean
}

interface AppStoreProps {
  windowId?: string
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  maximized?: boolean
  openApplication?: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void
}

const TrafficLights = ({ onClose, onMinimize, onMaximize, maximized = false }: {
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  maximized?: boolean
}) => {
  return (
    <div className="flex items-center gap-2 group shrink-0">
      <div className="w-3 h-3 bg-[#ff5f57] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff4136] transition-all duration-150 shadow-sm"
        onClick={onClose} title="Close">
        <svg className="w-1.5 h-1.5 text-[#820005] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="w-3 h-3 bg-[#febc2e] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#ff9500] transition-all duration-150 shadow-sm"
        onClick={onMinimize} title="Minimize">
        <svg className="w-1.5 h-1.5 text-[#9a6400] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          <path d="M1 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="w-3 h-3 bg-[#28c840] rounded-full cursor-pointer flex items-center justify-center hover:bg-[#1aab29] transition-all duration-150 shadow-sm"
        onClick={onMaximize} title={maximized ? "Restore" : "Maximize"}>
        <svg className="w-1.5 h-1.5 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 10 10">
          {maximized ? (
            <>
              <rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </>
          ) : (
            <>
              <path d="M1 1L4 4M1 1V3.5M1 1H3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M9 9L6 6M9 9V6.5M9 9H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  )
}

export default function AppStoreApp({ onClose, onMinimize, onMaximize, maximized = false, openApplication }: AppStoreProps) {
  const { settings } = useSettings()
  const isDarkMode = settings.darkMode
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null)
  const [downloadedApps, setDownloadedApps] = useState<Set<string>>(new Set())

  const categories = [
    { id: "all", name: "All" },
    { id: "productivity", name: "Productivity" },
    { id: "social", name: "Social" },
    { id: "games", name: "Games" },
    { id: "education", name: "Education" },
    { id: "entertainment", name: "Entertainment" },
  ]

  const apps: AppData[] = [
    {
      id: "1",
      name: "Notion",
      developer: "Notion Labs",
      category: "productivity",
      rating: 5,
      reviews: 12500,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
      description: "All-in-one workspace for notes, docs, projects, and collaboration.",
      size: "85.2 MB",
      ageRating: "4+",
      featured: true,
    },
    {
      id: "2",
      name: "Figma",
      developer: "Figma, Inc.",
      category: "productivity",
      rating: 5,
      reviews: 8900,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
      description: "Professional design tool for teams. Create, prototype, and collaborate.",
      size: "142.3 MB",
      ageRating: "4+",
      featured: true,
    },
    {
      id: "3",
      name: "Slack",
      developer: "Salesforce",
      category: "productivity",
      rating: 4,
      reviews: 15600,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
      description: "Team communication platform for work. Connect and collaborate seamlessly.",
      size: "78.5 MB",
      ageRating: "4+",
    },
    {
      id: "4",
      name: "Discord",
      developer: "Discord Inc.",
      category: "social",
      rating: 4,
      reviews: 45000,
      price: "Free",
      icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
      description: "Voice, video, and text chat for communities and friends.",
      size: "195.7 MB",
      ageRating: "12+",
      featured: true,
    },
    {
      id: "5",
      name: "Spotify",
      developer: "Spotify AB",
      category: "entertainment",
      rating: 5,
      reviews: 89000,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
      description: "Music for everyone. Stream millions of songs and podcasts.",
      size: "124.6 MB",
      ageRating: "12+",
      downloaded: true,
    },
    {
      id: "6",
      name: "Zoom",
      developer: "Zoom Video Communications",
      category: "productivity",
      rating: 4,
      reviews: 23500,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
      description: "Video conferencing and online meetings. Connect from anywhere.",
      size: "112.4 MB",
      ageRating: "4+",
    },
    {
      id: "7",
      name: "Trello",
      developer: "Atlassian",
      category: "productivity",
      rating: 4,
      reviews: 9800,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/35/Trello_logo.svg",
      description: "Visual project management. Organize anything, together.",
      size: "45.8 MB",
      ageRating: "4+",
    },
    {
      id: "8",
      name: "VS Code",
      developer: "Microsoft",
      category: "productivity",
      rating: 5,
      reviews: 67000,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg",
      description: "Code editor with debugging, Git, and extensions.",
      size: "256.3 MB",
      ageRating: "4+",
      downloaded: true,
    },
    {
      id: "9",
      name: "Duolingo",
      developer: "Duolingo, Inc.",
      category: "education",
      rating: 5,
      reviews: 125000,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Duolingo_logo.svg",
      description: "Learn languages for free. Fun, effective, and bite-sized lessons.",
      size: "67.9 MB",
      ageRating: "4+",
      featured: true,
    },
    {
      id: "10",
      name: "Netflix",
      developer: "Netflix, Inc.",
      category: "entertainment",
      rating: 4,
      reviews: 450000,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Netflix_icon.svg",
      description: "Watch TV shows and movies. Stream unlimited content.",
      size: "98.2 MB",
      ageRating: "12+",
      downloaded: true,
    },
    {
      id: "11",
      name: "Among Us",
      developer: "InnerSloth",
      category: "games",
      rating: 4,
      reviews: 234000,
      price: "Free",
      icon: "https://upload.wikimedia.org/wikipedia/en/9/9a/Among_Us_cover_art.jpg",
      description: "Multiplayer game of teamwork and betrayal. Find the impostor!",
      size: "156.8 MB",
      ageRating: "9+",
    },
    {
      id: "12",
      name: "Minecraft",
      developer: "Mojang",
      category: "games",
      rating: 5,
      reviews: 567000,
      price: "$6.99",
      icon: "https://upload.wikimedia.org/wikipedia/en/5/50/Minecraft_2017_icon.svg",
      description: "Create, explore, survive. Build anything you can imagine.",
      size: "324.5 MB",
      ageRating: "9+",
      featured: true,
    },
    {
      id: "13",
      name: "Career Agent",
      developer: "SmartyAI",
      category: "productivity",
      rating: 5,
      reviews: 1500,
      price: "Free",
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310B981'/%3E%3Cstop offset='100%25' style='stop-color:%23059669'/%3E%3C/linearGradient%3E%3Crect width='96' height='96' rx='20' fill='url(%23grad1)'/%3E%3Cpath d='M48 20c-8.8 0-16 7.2-16 16v8c0 2.2 1.8 4 4 4h4c0 4.4 3.6 8 8 8s8-3.6 8-8h4c2.2 0 4-1.8 4-4v-8c0-8.8-7.2-16-16-16z' fill='white'/%3E%3Ccircle cx='48' cy='36' r='12' fill='white'/%3E%3Cpath d='M36 52v8c0 2.2 1.8 4 4 4h16c2.2 0 4-1.8 4-4v-8' stroke='white' stroke-width='3' fill='none'/%3E%3Cpath d='M32 68h32M40 68v8M56 68v8' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
      description: "AI-powered interview preparation assistant. Manage your career missions with step-by-step guidance.",
      size: "12.4 MB",
      ageRating: "4+",
      featured: true,
      downloaded: false,
    },
  ]

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.developer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredApps = apps.filter((app) => app.featured)

  const handleDownload = (appId: string, appName?: string) => {
    setDownloadedApps((prev) => new Set(prev).add(appId))
    
    // Handle special apps
    if (appName === "Career Agent" && openApplication) {
      // Open the Career app
      openApplication('Career')
    }
  }

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${
      isDarkMode ? "bg-[#1c1c1e] text-white" : "bg-[#f5f5f7] text-gray-900"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 shrink-0 ${
        isDarkMode ? "bg-[#2c2c2e]" : "bg-white border-b border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <TrafficLights onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} maximized={maximized} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-semibold text-lg">App Store</span>
          </div>
        </div>

        {/* Search */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isDarkMode ? "bg-[#3a3a3c]" : "bg-gray-100"
        }`}>
          <Search size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
          <input
            type="text"
            placeholder="Search apps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent outline-none text-sm w-64 ${
              isDarkMode ? "placeholder-gray-500" : "placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* Categories */}
      <div className={`flex gap-2 px-6 py-3 overflow-x-auto shrink-0 ${
        isDarkMode ? "bg-[#1c1c1e]" : "bg-[#f5f5f7]"
      }`}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-blue-500 text-white"
                : isDarkMode
                  ? "bg-[#2c2c2e] text-gray-300 hover:bg-[#3a3a3c]"
                  : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* Featured Section */}
        {!selectedApp && !searchQuery && selectedCategory === "all" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Featured</h2>
              <Sparkles size={20} className={isDarkMode ? "text-yellow-400" : "text-yellow-500"} />
            </div>
            <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl ${
              isDarkMode ? "bg-gradient-to-br from-purple-900/30 to-blue-900/30" : "bg-gradient-to-br from-purple-100 to-blue-100"
            }`}>
              {featuredApps.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                    isDarkMode ? "bg-white/10 hover:bg-white/15" : "bg-white hover:shadow-lg"
                  }`}
                >
                  <img src={app.icon} alt={app.name} className="w-20 h-20 rounded-2xl mx-auto mb-3 shadow-lg" />
                  <h3 className="font-semibold text-center truncate">{app.name}</h3>
                  <p className={`text-xs text-center truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {app.developer}
                  </p>
                  <div className="flex justify-center mt-2">
                    <StarRating rating={app.rating} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* App List */}
        {!selectedApp && (
          <>
            <h2 className="text-xl font-bold mb-3">
              {searchQuery ? `Results for "${searchQuery}"` : "Top Apps"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isDarkMode
                      ? "bg-[#2c2c2e] hover:bg-[#3a3a3c]"
                      : "bg-white hover:shadow-md border border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3" onClick={() => setSelectedApp(app)}>
                    <img src={app.icon} alt={app.name} className="w-16 h-16 rounded-xl shadow-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{app.name}</h3>
                      <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {app.developer}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={app.rating} />
                        <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          ({(app.reviews / 1000).toFixed(1)}k)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-sm font-semibold ${
                      app.price === "Free" ? "text-blue-500" : isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {app.price}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!downloadedApps.has(app.id) && !app.downloaded) {
                          handleDownload(app.id, app.name)
                        } else if (openApplication && app.name === "Career Agent") {
                          openApplication('Career')
                        }
                      }}
                      className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                        downloadedApps.has(app.id) || app.downloaded
                          ? isDarkMode
                            ? "bg-blue-600/30 text-blue-400"
                            : "bg-blue-100 text-blue-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {downloadedApps.has(app.id) || app.downloaded ? "Open" : "Get"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* App Detail View */}
        {selectedApp && (
          <div>
            <button
              onClick={() => setSelectedApp(null)}
              className={`flex items-center gap-1 mb-4 text-sm ${
                isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600"
              }`}
            >
              <ChevronRight size={16} className="rotate-180" />
              Back
            </button>

            <div className="flex gap-6 mb-6">
              <img src={selectedApp.icon} alt={selectedApp.name} className="w-32 h-32 rounded-2xl shadow-xl" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{selectedApp.name}</h1>
                <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {selectedApp.developer}
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={selectedApp.rating} />
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    ({(selectedApp.reviews / 1000).toFixed(1)}k ratings)
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Size: {selectedApp.size} • Age: {selectedApp.ageRating}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!downloadedApps.has(selectedApp.id) && !selectedApp.downloaded) {
                  handleDownload(selectedApp.id, selectedApp.name)
                } else if (openApplication && selectedApp.name === "Career Agent") {
                  openApplication('Career')
                }
              }}
              className={`w-full py-2 rounded-lg font-semibold text-lg mb-6 transition ${
                downloadedApps.has(selectedApp.id) || selectedApp.downloaded
                  ? isDarkMode
                    ? "bg-blue-600/30 text-blue-400"
                    : "bg-blue-100 text-blue-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {downloadedApps.has(selectedApp.id) || selectedApp.downloaded ? "Open" : 
               selectedApp.price === "Free" ? "Get" : `Buy ${selectedApp.price}`}
            </button>

            <div className="mb-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                {selectedApp.description}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {["Screenshots", "Reviews", "Related", "More by Developer"].map((section) => (
                <div
                  key={section}
                  className={`p-4 rounded-xl text-center ${
                    isDarkMode ? "bg-[#2c2c2e]" : "bg-gray-100"
                  }`}
                >
                  <p className="text-sm font-medium">{section}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
