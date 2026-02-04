'use client'

import { useState } from 'react'
import {
  Palette,
  Image,
  Type,
  Settings as SettingsIcon,
  X,
  Menu
} from 'lucide-react'
import { useSettings } from '@/app/context/settingContext'

type SettingTab = 'appearance' | 'wallpaper' | 'font' | 'advanced'

const SIDEBAR_ITEMS = [
  { id: 'appearance', label: 'Appearance', icon: Palette, clickId: "settings_sidebar_appearance" },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image, clickId: "settings_sidebar_wallpaper" },
  { id: 'font', label: 'Font', icon: Type, clickId: "settings_sidebar_font" },
  { id: 'advanced', label: 'Advanced', icon: SettingsIcon, clickId: "settings_sidebar_advanced" },
]

const THEME_COLORS = [
  { name: 'Slate', value: '215 20.2% 65.1%' },
  { name: 'Gray', value: '220 8.9% 46.1%' },
  { name: 'Zinc', value: '240 5.9% 10%' },
  { name: 'Neutral', value: '0 0% 45.1%' },
  { name: 'Stone', value: '25 5.3% 44.7%' },
  { name: 'Red', value: '0 72.2% 50.6%' },
  { name: 'Orange', value: '24.6 95% 53.1%' },
  { name: 'Amber', value: '37.7 92.1% 50.2%' },
  { name: 'Yellow', value: '47.9 95.8% 53.1%' },
  { name: 'Lime', value: '84.2 85.2% 60.4%' },
  { name: 'Green', value: '142.1 76.2% 36.3%' },
  { name: 'Emerald', value: '152.4 81.4% 50.8%' },
  { name: 'Teal', value: '173.4 80.4% 40%' },
  { name: 'Cyan', value: '188.7 94.5% 42.7%' },
  { name: 'Sky', value: '198.4 93.2% 59.6%' },
  { name: 'Blue', value: '217.2 91.2% 59.8%' },
]

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export default function SettingsModal() {
  const {
    settings,
    updateSettings,
    resetSettings,
    wallpapers,
    updateWallpaperQuery,
    updateGithubProfile,
    githubError,
    wallpaperError,
    isLoadingWallpapers,
  } = useSettings()

  const [activeTab, setActiveTab] = useState<SettingTab>('appearance')
  const [selectedBg, setSelectedBg] = useState(settings.backgroundImage)
  const [customColor, setCustomColor] = useState('#000000')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const onBackgroundChange = (url: string) => {
    updateSettings({ backgroundImage: url })
  }

  return (
    <div className=" inset-0 bg-black/50 flex items-center justify-center z-50 ">
      <div
        className={`shadow-2xl w-full  max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col  ${settings.darkMode ? 'bg-zinc-900' : 'bg-white'
          }`}
      >
        {/* Mobile Header */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu size={20} style={{ color: settings.textColor }} />
          </button>
          <h2 className="text-lg font-semibold" style={{ color: settings.textColor }}>
            Settings
          </h2>

        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Mobile Drawer & Desktop Fixed */}
          <div
            className={`
              fixed lg:relative inset-y-0 left-0 z-50 
              w-64 lg:w-48 
              border-r 
              ${settings.darkMode ? 'border-gray-700 bg-zinc-900' : 'border-gray-200 bg-white'}
              transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              overflow-y-auto
            `}
          >
            {/* Close button for mobile */}
            <div className="lg:hidden flex justify-end p-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X size={20} style={{ color: settings.textColor }} />
              </button>
            </div>

            {/* Search Inputs */}
            <div className={`p-3 border-b ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: settings.textColor }}>
                    Wallpaper
                  </label>
                  <input
                    type="text"
                    id="wallpaper_input"
                    placeholder="Search wallpapers..."
                    value={settings.wallpaperQuery}
                    onChange={(e) => updateWallpaperQuery(e.target.value)}
                    disabled={isLoadingWallpapers}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border ${wallpaperError
                      ? 'border-red-500'
                      : settings.darkMode
                        ? 'bg-zinc-800 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                  {wallpaperError && (
                    <p className="text-xs text-red-500 mt-1">{wallpaperError}</p>
                  )}
                  {isLoadingWallpapers && (
                    <p className="text-xs text-blue-500 mt-1">Loading...</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: settings.textColor }}>
                    GitHub Profile
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    value={settings.githubProfile}
                    onChange={(e) => updateGithubProfile(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border ${githubError
                      ? 'border-red-500'
                      : settings.darkMode
                        ? 'bg-zinc-800 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                  {githubError && (
                    <p className="text-xs text-red-500 mt-1">{githubError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    id={item.clickId}
                    key={item.id}
                    style={{ fontSize: settings.fontSize }}
                    onClick={() => {
                      setActiveTab(item.id as SettingTab)
                      setSidebarOpen(false) // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                      ? 'bg-blue-500 text-white'
                      : settings.darkMode
                        ? 'text-gray-300 hover:bg-zinc-800'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${settings.darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                    Appearance
                  </h2>
                  <p className={`text-sm sm:text-base ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Customize the look and feel of your desktop
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Dark Mode Toggle */}
                  <div
                    style={{ background: settings.darkMode ? '#1c1c1c' : '#ededed2e' }}
                    className="rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Dark Mode</h3>
                        <p className="text-xs sm:text-sm opacity-70">Use dark theme for the interface</p>
                      </div>
                      <button id="toggle_dark_mode"
                        onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                        style={{ background: settings.darkMode ? '#3b3939' : '#ededed2e' }}
                        className="relative w-12 h-6 rounded-full transition-colors"
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                      </button>
                    </div>
                  </div>

                  {/* Folder Color */}
                  <div
                    style={{ background: settings.darkMode ? '#1c1c1c' : '#ededed2e' }}
                    className="rounded-lg p-4"
                  >
                    <h3 className={`font-semibold mb-3 text-sm sm:text-base ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      Folder Color
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <input
                        type="color"
                        id="folder_color_picker"
                        value={settings.folderColor}
                        onChange={(e) => updateSettings({ folderColor: e.target.value })}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                          {settings.folderColor}
                        </p>
                        <p className="text-xs sm:text-sm opacity-70">Customize folder icons color</p>
                      </div>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div
                    style={{ background: settings.darkMode ? '#1c1c1c' : '#ededed2e' }}
                    className="rounded-lg p-4"
                  >
                    <h3 className={`font-semibold mb-3 text-sm sm:text-base ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      Text Color
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <input
                        type="color"
                        id="text_color_picker"
                        value={settings.textColor}
                        onChange={(e) => updateSettings({ textColor: e.target.value })}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                          {settings.textColor}
                        </p>
                        <p className="text-xs sm:text-sm opacity-70">Customize text color across desktop</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallpaper Tab */}
            {activeTab === 'wallpaper' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                    Desktop & Wallpaper
                  </h2>
                  <p className={`text-sm sm:text-base ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Choose a wallpaper for your desktop background
                  </p>
                </div>

                {/* Preview */}
                <div className={`rounded-lg p-3 sm:p-4 ${settings.darkMode ? 'bg-zinc-800' : 'bg-gray-100'
                  }`}>
                  <p className={`text-xs font-semibold mb-3 uppercase ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    Preview
                  </p>
                  <div className="relative h-40 sm:h-48 md:h-64 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
                    {settings.backgroundImage ? (
                      <img
                        src={settings.backgroundImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base">No wallpaper selected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallpapers Grid */}
                {wallpapers.length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold mb-3 uppercase ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      Wallpapers ({wallpapers.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                      {wallpapers.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedBg(url)
                            onBackgroundChange(url)
                          }}
                          id={`new_wallpaper_${idx}`}
                          className={`relative h-20 sm:h-24 md:h-28 rounded-lg overflow-hidden border-2 transition-all ${selectedBg === url
                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-300'
                            : settings.darkMode
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <img
                            src={url}
                            alt={`Wallpaper ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg'
                            }}
                          />
                          <div className="absolute top-1 right-1 text-xs font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </div>
                          {selectedBg === url && (
                            <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {wallpapers.length === 0 && !isLoadingWallpapers && (
                  <div className={`text-center py-8 rounded-lg ${settings.darkMode ? 'bg-zinc-800' : 'bg-gray-100'
                    }`}>
                    <p className="text-sm opacity-70">Search for wallpapers to see results</p>
                  </div>
                )}
              </div>
            )}

            {/* Font Tab */}
            {activeTab === 'font' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                    Font & Text
                  </h2>
                  <p className={`text-sm sm:text-base ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Adjust font size and text rendering
                  </p>
                </div>

                <div className="space-y-4">
                  <div className={`rounded-lg p-4 ${settings.darkMode ? 'bg-zinc-800' : 'bg-gray-50'
                    }`}>
                    <h3 className={`font-semibold mb-4 text-sm sm:text-base ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      Font Size: {settings.fontSize}px
                    </h3>
                    <input
                      type="range"
                      id="font_size_slider"
                      min="12"
                      max="20"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between mt-2 text-xs opacity-70">
                      <span>12px</span>
                      <span>20px</span>
                    </div>
                    <p className="text-xs sm:text-sm opacity-70 mt-2">Affects all text on the desktop</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                    Theme Color
                  </h2>
                  <p className={`text-sm sm:text-base ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Customize your theme color
                  </p>
                </div>

                {/* Preset Colors */}
                <div className={`rounded-lg p-4 ${settings.darkMode ? 'bg-zinc-800' : 'bg-gray-50'
                  }`}>
                  <p className={`text-sm font-semibold mb-4 ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Preset Colors
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4">
                    {THEME_COLORS.map((color,) => (
                      <button
                        key={color.name}
                        id={color.name}
                        onClick={() => updateSettings({ themeColor: color.value })}
                        className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors ${settings.darkMode ? 'hover:bg-zinc-700' : 'hover:bg-white'
                          }`}
                      >
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg border-2 shadow-md hover:shadow-lg transition-shadow ${settings.themeColor === color.value
                            ? 'border-blue-500 ring-2 ring-blue-300'
                            : 'border-gray-300'
                            }`}
                          style={{ backgroundColor: `hsl(${color.value})` }}
                        />
                        <span className="text-xs font-semibold truncate w-full text-center">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Picker */}
                <div className={`rounded-lg p-4 ${settings.darkMode ? 'bg-zinc-800' : 'bg-gray-50'
                  }`}>
                  <p className={`text-sm font-semibold mb-4 ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Custom Color
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <input
                      type="color"
                      id="custom_theme_color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value)
                        const rgb = hexToRgb(e.target.value)
                        if (rgb) {
                          updateSettings({ themeColor: `${rgb.h} ${rgb.s}% ${rgb.l}%` })
                        }
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        {customColor}
                      </p>
                      <p className="text-xs sm:text-sm opacity-70">Click to select custom color</p>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className={`rounded-lg p-4 ${settings.darkMode ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                  <button
                    onClick={() => {
                      if (confirm('Reset all settings to default?')) {
                        resetSettings()
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}