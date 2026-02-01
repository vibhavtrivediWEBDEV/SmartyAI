'use client'

import { useState } from 'react'
import { X, Palette, ImageIcon, Monitor, Type, Zap } from 'lucide-react'
import { useSettings } from '@/app/context/settingContext'

interface SettingsPanelProps {
  onClose: () => void
}

type SettingTab = 'appearance' | 'wallpaper' | 'font' | 'advanced'

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1470252649378-9c29740ff023?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1501426614169-0dca89a495fe?w=1200&h=800&fit=crop',
]

const THEME_COLORS = [
  { name: 'Blue', value: '240 5.9% 10%' },
  { name: 'Purple', value: '270 70% 50%' },
  { name: 'Pink', value: '330 81% 60%' },
  { name: 'Green', value: '120 73% 75%' },
  { name: 'Orange', value: '39 89% 49%' },
  { name: 'Red', value: '0 84% 60%' },
  { name: 'Cyan', value: '180 100% 50%' },
  { name: 'Indigo', value: '220 91% 54%' },
]

const SIDEBAR_ITEMS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'wallpaper', label: 'Desktop & Wallpaper', icon: ImageIcon },
  { id: 'font', label: 'Font & Text', icon: Type },
  { id: 'advanced', label: 'Advanced', icon: Zap },
]

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState<SettingTab>('appearance')
  const [customColor, setCustomColor] = useState(settings.textColor)
  const [selectedBg, setSelectedBg] = useState<string | null>(null)

  const onBackgroundChange = (url: string) => {
    updateSettings({ backgroundImage: url })
  }

  return (
    <div className=" inset-0  bg-opacity-50 flex items-center justify-center z-50">
      <div className={` shadow-2xl w-full max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col `}>
        {/* macOS-style Window Controls */}
        {/* <div className={`flex items-center justify-between px-6 py-3 border-b ${
          settings.darkMode ? 'border-gray-700 ' : 'border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100'
        }`}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 cursor-pointer hover:bg-red-500" onClick={onClose}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <h1 className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-100' : 'text-gray-700'}`}>System Settings</h1>
          <div className="w-12"></div>
        </div> */}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-48 border-r ${settings.darkMode
            ? 'border-gray-700 '
            : 'border-gray-200 '
            } overflow-y-auto`}>
            <div className={`p-3 border-b ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <input
                type="text"
                placeholder="Search"
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 border ${settings.darkMode
                  ? ' border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
            </div>

            <nav className="p-2 space-y-1" >
              {SIDEBAR_ITEMS.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}

                    style={{ fontSize: settings.fontSize }}
                    onClick={() => setActiveTab(item.id as SettingTab)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                      ? `bg-red-400 text-white`
                      : settings.darkMode
                        ? ' hover:bg-black'
                        : ' hover:bg-grey-100'
                      }`}
                  >
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto p-8 ${settings.darkMode ? ' text-gray-100' : ' text-gray-900'}`}>
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Appearance</h2>
                  <p className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'}>Customize the look and feel of your desktop</p>
                </div>

                <div className="space-y-4">
                  {/* Dark Mode Toggle */}
                  <div
                    style={{ background: settings.darkMode ? '#1c1c1c' : '#ededed2e' }}
                    className={`rounded-lg p-4 `}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 >Dark Mode</h3>
                        <p >Use dark theme for the interface</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                        style={{ background: settings.darkMode ? '#3b3939' : '#ededed2e' }}

                        className={`w-12 h-6 rounded-full transition-colors `}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                      </button>
                    </div>
                  </div>

                  {/* Folder Color */}
                  <div
                    style={{ background: settings.darkMode ? '#1c1c1c' : '#ededed2e' }}

                    className={`rounded-lg p-4`}>
                    <h3 className={`font-semibold mb-3 ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Folder Color</h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.folderColor}
                        onChange={(e) => updateSettings({ folderColor: e.target.value })}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{settings.folderColor}</p>
                        <p >Customize folder icons color</p>
                      </div>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className={`rounded-lg p-4 ${settings.darkMode ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold mb-3 ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Text Color</h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.textColor}
                        onChange={(e) => updateSettings({ textColor: e.target.value })}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{settings.textColor}</p>
                        <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customize text color across desktop</p>
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
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Desktop & Wallpaper</h2>
                  <p className="text-gray-600">Choose a wallpaper for your desktop background</p>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Preview</p>
                  <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
                    {settings.backgroundImage ? (
                      <img src={settings.backgroundImage || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white">No wallpaper selected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallpapers Grid */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Wallpapers</p>
                  <div className="grid grid-cols-4 gap-4">
                    {BACKGROUND_IMAGES.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedBg(url)
                          onBackgroundChange(url)
                        }}
                        className={`relative h-28 rounded-lg overflow-hidden border-2 transition-all ${selectedBg === url ? 'border-blue-500 shadow-lg ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <img src={url || "/placeholder.svg"} alt={`Wallpaper ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 text-xs font-semibold text-white  bg-opacity-50 px-2 py-1 rounded">
                          {idx + 1}
                        </div>
                        {selectedBg === url && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Font Tab */}
            {activeTab === 'font' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Font & Text</h2>
                  <p className="text-gray-600">Adjust font size and text rendering</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">Font Size: {settings.fontSize}px</h3>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">Affects all text on the desktop</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Theme Color</h2>
                  <p className="text-gray-600">Customize your theme color</p>
                </div>

                {/* Preset Colors */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Preset Colors</p>
                  <div className="grid grid-cols-4 gap-4">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => updateSettings({ themeColor: color.value })}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        <div
                          className={`w-16 h-16 rounded-lg border-2 shadow-md hover:shadow-lg transition-shadow ${settings.themeColor === color.value ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                            }`}
                          style={{ backgroundColor: `hsl(${color.value})` }}
                        ></div>
                        <span className="text-xs font-semibold text-gray-700">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Picker */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Custom Color</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value)
                        const rgb = hexToRgb(e.target.value)
                        if (rgb) {
                          updateSettings({ themeColor: `${rgb.h} ${rgb.s}% ${rgb.l}%` })
                        }
                      }}
                      className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{customColor}</p>
                      <p className="text-xs text-gray-500">Click to select custom color</p>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="bg-red-50 rounded-lg p-4">
                  <button
                    onClick={resetSettings}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  let l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  h = Math.round(h * 360)
  s = Math.round(s * 100)
  l = Math.round(l * 100)

  return { h, s, l }
}
