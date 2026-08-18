'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Accessibility, Battery, Bell, Bluetooth, ChevronRight, CircleUserRound, Cloud,
  Gamepad2, Globe2, Hand, Info, Keyboard, Laptop, LockKeyhole, Menu, Monitor,
  Moon, MousePointer2, Network, Palette, PanelRight, Printer, RotateCcw, Search,
  ShieldCheck, SlidersHorizontal, Speaker, Sun, UserRound, Wifi, X, MessageCircle,
} from 'lucide-react'
import { useSettings, type DesktopSettings } from '@/app/context/settingContext'
import SoundSettings from './SoundSettings'
import { DESKTOP_APPS } from '@/lib/desktopApps'

type SettingTab = 'account' | 'network' | 'notifications' | 'sound' | 'focus' | 'general' | 'appearance' | 'accessibility' | 'control' | 'desktop' | 'display' | 'wallpaper' | 'battery' | 'privacy' | 'keyboard' | 'trackpad' | 'extras' | 'telegram'
type Item = { id: SettingTab; label: string; icon: typeof Palette; color: string; clickId?: string }
type BluetoothNavigator = Navigator & { bluetooth?: { requestDevice: (options: { acceptAllDevices: boolean }) => Promise<{ name?: string }> } }

const groups: Item[][] = [
  [
    { id: 'account', label: 'Apple Account', icon: CircleUserRound, color: '#8e8e93' },
  ],
  [
    { id: 'network', label: 'Network', icon: Wifi, color: '#007aff', clickId: 'settings_sidebar_network' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: '#ff3b30', clickId: 'settings_sidebar_notifications' },
    { id: 'sound', label: 'Sound', icon: Speaker, color: '#ff375f', clickId: 'settings_sidebar_sound' },
    { id: 'focus', label: 'Focus', icon: Moon, color: '#5856d6', clickId: 'settings_sidebar_focus' },
  ],
  [
    { id: 'general', label: 'General', icon: SlidersHorizontal, color: '#8e8e93', clickId: 'settings_sidebar_general' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: '#007aff', clickId: 'settings_sidebar_appearance' },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility, color: '#007aff', clickId: 'settings_sidebar_accessibility' },
    { id: 'control', label: 'Control Center', icon: SlidersHorizontal, color: '#8e8e93', clickId: 'settings_sidebar_control' },
  ],
  [
    { id: 'telegram', label: 'Telegram', icon: MessageCircle, color: '#0088cc', clickId: 'settings_sidebar_telegram' },
    { id: 'desktop', label: 'Desktop & Dock', icon: PanelRight, color: '#007aff', clickId: 'settings_sidebar_desktop' },
    { id: 'display', label: 'Displays', icon: Monitor, color: '#5856d6', clickId: 'settings_sidebar_display' },
    { id: 'wallpaper', label: 'Wallpaper', icon: Sun, color: '#32ade6', clickId: 'settings_sidebar_wallpaper' },
    { id: 'battery', label: 'Battery', icon: Battery, color: '#34c759', clickId: 'settings_sidebar_battery' },
  ],
  [
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck, color: '#007aff', clickId: 'settings_sidebar_privacy' },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard, color: '#8e8e93', clickId: 'settings_sidebar_keyboard' },
    { id: 'trackpad', label: 'Trackpad & Gestures', icon: Hand, color: '#8e8e93', clickId: 'settings_sidebar_trackpad' },
    { id: 'extras', label: 'More Settings', icon: Gamepad2, color: '#ff9500', clickId: 'settings_sidebar_extras' },
  ],
]

const accents = [
  { name: 'Graphite', value: '240 3% 52%' }, { name: 'Red', value: '3 100% 59%' },
  { name: 'Orange', value: '35 100% 50%' }, { name: 'Yellow', value: '48 100% 50%' },
  { name: 'Green', value: '135 59% 49%' }, { name: 'Blue', value: '211 100% 50%' },
  { name: 'Purple', value: '248 53% 58%' }, { name: 'Pink', value: '340 100% 59%' },
]

function Toggle({ value, onChange, id, label }: { value: boolean; onChange: (value: boolean) => void; id?: string; label: string }) {
  return <button id={id} type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors" style={{ background: value ? 'var(--theme-primary-color)' : 'var(--macos-secondary)' }}><span className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} /></button>
}

function SettingRow({ title, description, children, last = false }: { title: string; description?: string; children: React.ReactNode; last?: boolean }) {
  return <div className={`flex min-h-[54px] items-center gap-4 px-4 py-2.5 ${last ? '' : 'border-b'}`} style={{ borderColor: 'var(--macos-border)' }}><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{title}</p>{description && <p className="mt-0.5 text-[11px] leading-4" style={{ color: 'var(--macos-secondary)' }}>{description}</p>}</div>{children}</div>
}

function Group({ children }: { children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border shadow-sm" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}>{children}</section>
}

function Slider({ value, onChange, min = 0, max = 100, id }: { value: number; onChange: (value: number) => void; min?: number; max?: number; id?: string }) {
  return <div className="flex w-52 items-center gap-2"><span className="text-[11px]" style={{ color: 'var(--macos-secondary)' }}>{min}</span><input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--theme-primary-color)]" /><span className="w-7 text-right text-[11px] tabular-nums" style={{ color: 'var(--macos-secondary)' }}>{value}</span></div>
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border px-2 py-1 text-xs outline-none" style={{ background: 'var(--macos-surface-raised)', borderColor: 'var(--macos-border)' }}>{options.map((option) => <option key={option}>{option}</option>)}</select>
}

interface SettingsModalProps {
  isSocketConnected?: boolean
  onReconnect?: () => void
}

export default function SettingsModal({ isSocketConnected = false, onReconnect }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, wallpapers, loadWallpapers, updateWallpaperQuery } = useSettings()
  const [activeTab, setActiveTab] = useState<SettingTab>('appearance')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchingWallpapers, setSearchingWallpapers] = useState(false)
  const [appLockPassword, setAppLockPassword] = useState('')
  const [appLockStatus, setAppLockStatus] = useState('')
  const [networkOnline, setNetworkOnline] = useState(true)
  const [bluetoothDevice, setBluetoothDevice] = useState('')
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLinking, setTelegramLinking] = useState(false)
  const [telegramLinkUrl, setTelegramLinkUrl] = useState('')
  const [telegramStatus, setTelegramStatus] = useState('')

  useEffect(() => {
    const updateOnlineStatus = () => setNetworkOnline(navigator.onLine)
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Check Telegram connection status
  useEffect(() => {
    if (activeTab === 'telegram') {
      checkTelegramStatus()
    }
  }, [activeTab])

  // Poll for connection status while linking
  useEffect(() => {
    if (telegramLinking) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/telegram/link')
          if (response.ok) {
            const data = await response.json()
            if (data.connected) {
              setTelegramConnected(true)
              setTelegramLinking(false)
              setTelegramLinkUrl('')
              setTelegramStatus('✅ Successfully connected! Redirecting...')
              // Redirect to desktop after 2 seconds
              setTimeout(() => {
                window.location.href = '/desktop'
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Failed to check Telegram status:', error)
        }
      }, 3000) // Check every 3 seconds

      return () => clearInterval(interval)
    }
  }, [telegramLinking])

  const checkTelegramStatus = async () => {
    try {
      const response = await fetch('/api/telegram/link')
      if (response.ok) {
        const data = await response.json()
        setTelegramConnected(data.connected || false)
      }
    } catch (error) {
      console.error('Failed to check Telegram status:', error)
    }
  }

  const connectTelegram = async () => {
    setTelegramLinking(true)
    setTelegramStatus('')
    try {
      const response = await fetch('/api/telegram/link', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to generate link')
      }
      const data = await response.json()
      setTelegramLinkUrl(data.telegramUrl || '')
      setTelegramStatus('Click the button below to open Telegram and connect. This page will automatically update when connected.')
    } catch (error) {
      setTelegramStatus('Failed to generate connection link. Please try again.')
      console.error('Telegram link error:', error)
    } finally {
      setTelegramLinking(false)
    }
  }

  const disconnectTelegram = async () => {
    if (!confirm('Disconnect Telegram? You will need to reconnect to use Telegram features.')) {
      return
    }
    setTelegramStatus('Disconnecting...')
    // TODO: Implement disconnect API
    setTelegramConnected(false)
    setTelegramStatus('Telegram disconnected')
  }

  const allItems = useMemo(() => groups.flat(), [])
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return groups
    const matched = allItems.filter((item) => item.label.toLowerCase().includes(needle))
    return matched.length ? [matched] : []
  }, [allItems, query])
  const title = activeTab === 'account' ? 'Apple Account' : allItems.find((item) => item.id === activeTab)?.label || 'Settings'
  const patch = <K extends keyof DesktopSettings>(key: K, value: DesktopSettings[K]) => updateSettings({ [key]: value } as Pick<DesktopSettings, K>)

  const chooseTab = (tab: SettingTab) => { setActiveTab(tab); setSidebarOpen(false) }
  const searchWallpapers = async () => {
    setSearchingWallpapers(true)
    await loadWallpapers(settings.wallpaperQuery || 'macOS wallpaper')
    setSearchingWallpapers(false)
  }

  const updateNotifications = async (enabled: boolean) => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }
    patch('notificationsEnabled', enabled)
  }

  const saveAppLockPassword = async () => {
    setAppLockStatus('Saving…')
    const response = await fetch('/api/settings/app-lock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: appLockPassword }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setAppLockStatus(body.error || 'Could not save password')
      return
    }
    setAppLockPassword('')
    updateSettings({ appLockEnabled: true, hasAppLockPassword: true })
    setAppLockStatus('Password saved securely')
  }

  const toggleLockedApp = (appName: string) => {
    const lockedApps = settings.lockedApps.includes(appName)
      ? settings.lockedApps.filter((name) => name !== appName)
      : [...settings.lockedApps, appName]
    patch('lockedApps', lockedApps)
  }

  const connectBluetoothDevice = async () => {
    const bluetooth = (navigator as BluetoothNavigator).bluetooth
    if (!bluetooth) {
      setBluetoothDevice('Web Bluetooth is unavailable in this browser')
      return
    }
    try {
      const device = await bluetooth.requestDevice({ acceptAllDevices: true })
      setBluetoothDevice(device.name || 'Bluetooth device authorized')
      patch('bluetoothEnabled', true)
    } catch (error) {
      if ((error as DOMException).name !== 'NotFoundError') setBluetoothDevice('Bluetooth access failed')
    }
  }

  return <div className="flex h-full min-h-[560px] overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]" style={{ background: 'var(--macos-bg)', color: 'var(--macos-text)' }}>
    <aside className={`${sidebarOpen ? 'absolute inset-y-0 left-0 z-40 flex' : 'hidden'} w-[248px] shrink-0 flex-col border-r p-2.5 backdrop-blur-2xl md:flex`} style={{ background: settings.reduceTransparency ? 'var(--macos-surface)' : 'color-mix(in srgb, var(--macos-surface) 78%, transparent)', borderColor: 'var(--macos-border)' }}>
      <div className="mb-2 flex items-center gap-2 px-1.5 pt-1"><div className="relative flex-1"><Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--macos-secondary)' }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-7 w-full rounded-lg border pl-7 pr-2 text-xs outline-none focus:ring-2" style={{ background: 'var(--macos-surface-raised)', borderColor: 'var(--macos-border)', '--tw-ring-color': 'var(--theme-primary-soft)' } as React.CSSProperties} /></div><button onClick={() => setSidebarOpen(false)} className="md:hidden"><X className="h-4 w-4" /></button></div>
      <div className="mb-2 flex items-center gap-3 rounded-lg p-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white"><CircleUserRound className="h-6 w-6" /></div><div className="min-w-0"><p className="truncate text-[13px] font-semibold">Desktop Settings</p><p className="truncate text-[10px]" style={{ color: 'var(--macos-secondary)' }}>Synced to your account</p></div></div>
      <div className="overflow-y-auto pb-4">{visibleGroups.map((group, index) => <div key={index} className="mb-2 border-b pb-2" style={{ borderColor: 'var(--macos-border)' }}>{group.map((item) => { const Icon = item.icon; const selected = activeTab === item.id; return <button id={item.clickId} key={item.id} onClick={() => chooseTab(item.id)} className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] font-medium ${selected ? 'text-white' : ''}`} style={{ background: selected ? 'var(--theme-primary-color)' : 'transparent' }}><span className="grid h-[20px] w-[20px] place-items-center rounded-[5px] text-white shadow-sm" style={{ background: item.color }}><Icon className="h-3.5 w-3.5" /></span><span className="truncate">{item.label}</span></button>})}</div>)}</div>
    </aside>

    <main className="min-w-0 flex-1 overflow-y-auto">
      <header className="sticky top-0 z-20 flex h-12 items-center border-b px-4 backdrop-blur-2xl md:px-7" style={{ background: settings.reduceTransparency ? 'var(--macos-bg)' : 'color-mix(in srgb, var(--macos-bg) 84%, transparent)', borderColor: 'var(--macos-border)' }}><button onClick={() => setSidebarOpen(true)} className="mr-3 md:hidden"><Menu className="h-4 w-4" /></button><h1 className="text-[15px] font-semibold">{title}</h1></header>
      <div className="mx-auto max-w-[760px] space-y-5 p-4 pb-14 md:p-7">
        {activeTab === 'account' && <><div className="flex items-center gap-5 py-3"><div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-500 text-white shadow-lg"><UserRound className="h-12 w-12" /></div><div><h2 className="text-2xl font-semibold">Vibhav Trivedi</h2><p className="text-sm" style={{ color: 'var(--macos-secondary)' }}>Personal profile for this Mac</p></div></div><Group><SettingRow title="iCloud" description="Photos, Drive, passwords, and app data"><Cloud className="h-5 w-5 text-sky-500" /></SettingRow><SettingRow title="Media & Purchases"><ChevronRight className="h-4 w-4 opacity-40" /></SettingRow><SettingRow title="Sign-In & Security" last><ChevronRight className="h-4 w-4 opacity-40" /></SettingRow></Group></>}

        {activeTab === 'network' && <><Group><SettingRow title="Wi-Fi" description={!settings.wifiEnabled ? 'Wi-Fi is off for SmartyAI' : networkOnline ? 'Browser is online' : 'Browser is offline'}><Toggle label="Wi-Fi" value={settings.wifiEnabled} onChange={(value) => patch('wifiEnabled', value)} /></SettingRow><SettingRow title="Bluetooth" description={bluetoothDevice || (settings.bluetoothEnabled ? 'On · authorize a nearby device' : 'Bluetooth is off')}><div className="flex items-center gap-2">{settings.bluetoothEnabled && <button type="button" onClick={() => void connectBluetoothDevice()} className="rounded-md border px-2 py-1 text-[11px]" style={{ borderColor: 'var(--macos-border)' }}>Connect…</button>}<Toggle label="Bluetooth" value={settings.bluetoothEnabled} onChange={(value) => patch('bluetoothEnabled', value)} /></div></SettingRow><SettingRow title="Internet search engine" description="Used by the desktop browser"><Select value={settings.preferredSearchEngine} onChange={(value) => patch('preferredSearchEngine', value as DesktopSettings['preferredSearchEngine'])} options={['Google', 'Bing', 'DuckDuckGo']} /></SettingRow><SettingRow title="Network" description="Browser connectivity and connection details" last><Network className="h-5 w-5" style={{ color: 'var(--theme-primary-color)' }} /></SettingRow></Group></>}

        {activeTab === 'notifications' && <Group><SettingRow title="Allow Notifications" description="Show alerts from desktop applications"><Toggle label="Allow notifications" value={settings.notificationsEnabled} onChange={(value) => void updateNotifications(value)} /></SettingRow><SettingRow title="Show previews" description={settings.notificationPreview} last><Select value={settings.notificationPreview} onChange={(value) => patch('notificationPreview', value as DesktopSettings['notificationPreview'])} options={['Always', 'When Unlocked', 'Never']} /></SettingRow></Group>}

        {activeTab === 'sound' && (
          <SoundSettings
            soundVolume={settings.soundVolume}
            muted={settings.muted}
            interfaceSounds={settings.interfaceSounds}
            onVolumeChange={(value) => patch('soundVolume', value)}
            onMuteChange={(value) => patch('muted', value)}
            onInterfaceSoundsChange={(value) => patch('interfaceSounds', value)}
          />
        )}

        {activeTab === 'focus' && <Group><SettingRow title="Focus" description="Silence notifications and reduce interruptions"><Toggle label="Focus mode" value={settings.focusMode} onChange={(value) => patch('focusMode', value)} /></SettingRow><SettingRow title="Share across devices" last><Toggle label="Share focus" value={settings.focusMode} onChange={(value) => patch('focusMode', value)} /></SettingRow></Group>}

        {activeTab === 'appearance' && <><div><h2 className="text-lg font-semibold">Appearance</h2><p className="text-xs" style={{ color: 'var(--macos-secondary)' }}>Every option here updates the desktop immediately and syncs to your account.</p></div><Group><SettingRow title="Appearance"><div className="flex gap-2">{[{ label: 'Light', dark: false }, { label: 'Dark', dark: true }].map((option) => <button id={option.dark ? 'toggle_dark_mode' : undefined} key={option.label} onClick={() => patch('darkMode', option.dark)} className="w-20 rounded-lg border p-1.5 text-[10px]" style={{ borderColor: settings.darkMode === option.dark ? 'var(--theme-primary-color)' : 'var(--macos-border)', background: option.dark ? '#252527' : '#f5f5f7', color: option.dark ? 'white' : '#1d1d1f' }}><div className="mb-1 h-7 rounded bg-current opacity-10" />{option.label}</button>)}</div></SettingRow><SettingRow title="Accent color" description="Buttons, selections, links, and active controls"><div className="flex flex-wrap justify-end gap-1.5">{accents.map((accent) => <button key={accent.name} title={accent.name} onClick={() => patch('themeColor', accent.value)} className="h-5 w-5 rounded-full border-2" style={{ background: `hsl(${accent.value})`, borderColor: settings.themeColor === accent.value ? 'var(--macos-text)' : 'transparent', outline: settings.themeColor === accent.value ? `2px solid hsl(${accent.value})` : 'none' }} />)}</div></SettingRow><SettingRow title="Folder color"><input type="color" aria-label="Folder color" value={settings.folderColor} onChange={(event) => patch('folderColor', event.target.value)} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" /></SettingRow><SettingRow title="Text size"><Slider id="font_size_slider" min={11} max={20} value={settings.fontSize} onChange={(value) => patch('fontSize', value)} /></SettingRow><SettingRow title="Reset desktop settings" last><button onClick={() => confirm('Reset every desktop setting?') && resetSettings()} className="flex items-center gap-1.5 text-xs font-medium text-red-500"><RotateCcw className="h-3.5 w-3.5" />Reset</button></SettingRow></Group></>}

        {activeTab === 'accessibility' && <><Group><SettingRow title="Reduce motion" description="Minimize interface animation"><Toggle label="Reduce motion" value={settings.reduceMotion} onChange={(value) => patch('reduceMotion', value)} /></SettingRow><SettingRow title="Reduce transparency" description="Use opaque window and menu backgrounds"><Toggle label="Reduce transparency" value={settings.reduceTransparency} onChange={(value) => patch('reduceTransparency', value)} /></SettingRow><SettingRow title="Increase contrast" description="Strengthen borders and controls" last><Toggle label="Increase contrast" value={settings.increaseContrast} onChange={(value) => patch('increaseContrast', value)} /></SettingRow></Group></>}

        {activeTab === 'control' && <Group><SettingRow title="Wi-Fi in Menu Bar"><Toggle label="Wi-Fi menu" value={settings.wifiEnabled} onChange={(value) => patch('wifiEnabled', value)} /></SettingRow><SettingRow title="Bluetooth in Menu Bar"><Toggle label="Bluetooth menu" value={settings.bluetoothEnabled} onChange={(value) => patch('bluetoothEnabled', value)} /></SettingRow><SettingRow title="Battery percentage" last><Toggle label="Battery percentage" value={settings.showBatteryPercentage} onChange={(value) => patch('showBatteryPercentage', value)} /></SettingRow></Group>}

        {activeTab === 'desktop' && <><Group><SettingRow title="Position on screen"><div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--macos-border)' }}>{(['bottom', 'right'] as const).map((position) => <button id={`dock_position_${position}`} key={position} onClick={() => patch('dockPosition', position)} className="rounded-md px-3 py-1 text-[11px] capitalize" style={{ background: settings.dockPosition === position ? 'var(--theme-primary-color)' : 'transparent', color: settings.dockPosition === position ? 'white' : 'inherit' }}>{position}</button>)}</div></SettingRow><SettingRow title="Dock size"><Slider id="dock_size_slider" min={36} max={72} value={settings.dockSize} onChange={(value) => patch('dockSize', value)} /></SettingRow><SettingRow title="Magnification"><Toggle id="toggle_dock_magnification" label="Dock magnification" value={settings.dockMagnification} onChange={(value) => patch('dockMagnification', value)} /></SettingRow><SettingRow title="Automatically hide and show the Dock" last><Toggle id="toggle_auto_hide_dock" label="Auto-hide Dock" value={settings.autoHideDock} onChange={(value) => patch('autoHideDock', value)} /></SettingRow></Group></>}

        {activeTab === 'display' && <Group><SettingRow title="Brightness"><div className="flex items-center gap-2"><Sun className="h-4 w-4 opacity-60" /><Slider value={settings.screenBrightness} onChange={(value) => patch('screenBrightness', value)} /></div></SettingRow><SettingRow title="Automatically adjust brightness" description="Use the current time to soften the display at night" last><Toggle label="Automatic brightness" value={settings.automaticBrightness} onChange={(value) => patch('automaticBrightness', value)} /></SettingRow></Group>}

        {activeTab === 'wallpaper' && <><div><h2 className="text-lg font-semibold"> HD Wallpapers</h2><p className="text-xs" style={{ color: 'var(--macos-secondary)' }}>Searches are optimized for landscape Mac displays and use original-resolution images.</p></div><div className="flex gap-2"><input id="wallpaper_input" value={settings.wallpaperQuery} onChange={(event) => updateWallpaperQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void searchWallpapers()} placeholder="Mountains, abstract, space…" className="h-8 min-w-0 flex-1 rounded-lg border px-3 text-xs outline-none" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }} /><button id='wallpaper_search_button' disabled={searchingWallpapers} onClick={() => void searchWallpapers()} className="rounded-lg wallpaper_search_button px-3 text-xs font-medium text-white disabled:opacity-60" style={{ background: 'var(--theme-primary-color)' }}>{searchingWallpapers ? 'Searching…' : 'Search 4K'}</button></div>{settings.backgroundImage && <div className="relative aspect-video max-h-64 overflow-hidden rounded-xl border shadow-md" style={{ borderColor: 'var(--theme-primary-color)' }}><img src={settings.backgroundImage} alt="Current desktop wallpaper" className="h-full w-full object-cover" /><span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">Current · Original HD</span></div>}<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{wallpapers.map((url, index) => <button id={`new_wallpaper_${index}`} key={url} onClick={() => patch('backgroundImage', url)} className="group relative aspect-video overflow-hidden rounded-xl border-2 shadow-sm" style={{ borderColor: settings.backgroundImage === url ? 'var(--theme-primary-color)' : 'var(--macos-border)' }}><img src={url} alt={`HD Mac wallpaper ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /><span className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">HD</span></button>)}</div>{wallpapers.length === 0 && <div className="grid h-52 place-items-center rounded-xl border" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}><div className="text-center"><Sun className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--theme-primary-color)' }} /><p className="text-sm font-medium">Choose your desktop picture</p><p className="text-xs" style={{ color: 'var(--macos-secondary)' }}>Search Pinterest for original HD and 4K wallpapers.</p></div></div>}</>}

        {activeTab === 'battery' && <Group><SettingRow title="Show percentage"><Toggle label="Show battery percentage" value={settings.showBatteryPercentage} onChange={(value) => patch('showBatteryPercentage', value)} /></SettingRow><SettingRow title="Low Power Mode" description="Reduce energy use and background activity" last><Toggle label="Low Power Mode" value={settings.lowPowerMode} onChange={(value) => patch('lowPowerMode', value)} /></SettingRow></Group>}

        {activeTab === 'privacy' && <><Group><SettingRow title="Location Services"><Toggle label="Location services" value={settings.locationServices} onChange={(value) => patch('locationServices', value)} /></SettingRow><SettingRow title="Analytics & Improvements" description="Share diagnostics to improve SmartyAI" last><Toggle label="Analytics sharing" value={settings.analyticsSharing} onChange={(value) => patch('analyticsSharing', value)} /></SettingRow></Group><Group><SettingRow title="App Lock" description={settings.hasAppLockPassword ? `${settings.lockedApps.length} protected apps` : 'Set a password to protect selected apps'}><Toggle label="App lock" value={settings.appLockEnabled} onChange={(value) => patch('appLockEnabled', value)} /></SettingRow><div className="space-y-3 p-4"><div className="flex gap-2"><input type="password" minLength={4} maxLength={72} value={appLockPassword} onChange={(event) => setAppLockPassword(event.target.value)} placeholder={settings.hasAppLockPassword ? 'Change app-lock password' : 'New password (4+ characters)'} className="h-8 min-w-0 flex-1 rounded-lg border px-3 text-xs outline-none" style={{ background: 'var(--macos-surface-raised)', borderColor: 'var(--macos-border)' }} /><button type="button" disabled={appLockPassword.length < 4} onClick={() => void saveAppLockPassword()} className="rounded-lg px-3 text-xs font-medium text-white disabled:opacity-40" style={{ background: 'var(--theme-primary-color)' }}>Save</button></div>{appLockStatus && <p className="text-[11px]" style={{ color: 'var(--macos-secondary)' }}>{appLockStatus}</p>}<div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{DESKTOP_APPS.filter((app) => app.name !== 'Settings').map((app) => <button type="button" key={app.name} onClick={() => toggleLockedApp(app.name)} className="truncate rounded-md border px-2 py-1.5 text-left text-[11px]" style={{ borderColor: settings.lockedApps.includes(app.name) ? 'var(--theme-primary-color)' : 'var(--macos-border)', background: settings.lockedApps.includes(app.name) ? 'var(--theme-primary-soft)' : 'transparent' }}>{settings.lockedApps.includes(app.name) ? '🔒 ' : ''}{app.displayName}</button>)}</div></div></Group><Group><SettingRow title="FileVault" description="Your project data remains protected"><LockKeyhole className="h-5 w-5 text-green-500" /></SettingRow><SettingRow title="App permissions" description="Camera, microphone, automation, and files" last><ChevronRight className="h-4 w-4 opacity-40" /></SettingRow></Group></>}

        {activeTab === 'keyboard' && <Group><SettingRow title="Keyboard brightness"><Slider value={settings.keyboardBrightness} onChange={(value) => patch('keyboardBrightness', value)} /></SettingRow><SettingRow title="Key repeat rate"><Slider value={settings.keyRepeat} onChange={(value) => patch('keyRepeat', value)} /></SettingRow><SettingRow title="Keyboard Shortcuts…" last><ChevronRight className="h-4 w-4 opacity-40" /></SettingRow></Group>}

        {activeTab === 'trackpad' && <><div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}><Hand className="mx-auto h-14 w-14" style={{ color: 'var(--theme-primary-color)' }} /><h2 className="mt-2 font-semibold">Gesture Mode</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5" style={{ color: 'var(--macos-secondary)' }}>Use hand gestures and the gesture dock to control apps. This setting is connected directly to the desktop.</p></div><Group><SettingRow title="Gesture control" description="Control apps with hand and eye gestures"><Toggle label="Gesture control" value={settings.gestureControl} onChange={(value) => patch('gestureControl', value)} /></SettingRow><SettingRow title="Tap to click"><Toggle label="Tap to click" value={settings.tapToClick} onChange={(value) => patch('tapToClick', value)} /></SettingRow><SettingRow title="Natural scrolling" description="Move content in the direction of finger movement"><Toggle label="Natural scrolling" value={settings.naturalScrolling} onChange={(value) => patch('naturalScrolling', value)} /></SettingRow><SettingRow title="Three-finger drag" last><Toggle label="Three-finger drag" value={settings.threeFingerDrag} onChange={(value) => patch('threeFingerDrag', value)} /></SettingRow></Group></>}

        {activeTab === 'general' && <><Group><SettingRow title="Language"><Select value={settings.language} onChange={(value) => patch('language', value)} options={['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese']} /></SettingRow><SettingRow title="Region"><Select value={settings.region} onChange={(value) => patch('region', value)} options={['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Japan']} /></SettingRow><SettingRow title="24-hour time" last><Toggle label="24-hour time" value={settings.use24HourTime} onChange={(value) => patch('use24HourTime', value)} /></SettingRow></Group><Group><SettingRow title="Software Update" description="SmartyAI is up to date"><Info className="h-5 w-5" style={{ color: 'var(--theme-primary-color)' }} /></SettingRow><SettingRow title="Transfer or Reset" last><button onClick={() => confirm('Reset every desktop setting?') && resetSettings()} className="flex items-center gap-1.5 text-xs font-medium text-red-500"><RotateCcw className="h-3.5 w-3.5" />Reset All Settings</button></SettingRow></Group></>}

        {activeTab === 'telegram' && <>
          {/* WebSocket Connection Status */}
          <div className="rounded-2xl border p-5" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <h3 className="text-sm font-semibold">WebSocket Connection</h3>
                  <p className="text-[10px]" style={{ color: 'var(--macos-secondary)' }}>
                    {isSocketConnected ? '✅ Connected to server' : '❌ Disconnected - Automation disabled'}
                  </p>
                </div>
              </div>
              {!isSocketConnected && (
                <button
                  onClick={() => {
                    if (onReconnect) {
                      onReconnect()
                    } else {
                      window.location.reload()
                    }
                  }}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                  style={{ background: 'var(--theme-primary-color)', borderColor: 'var(--theme-primary-color)', color: 'white' }}
                >
                  🔄 Reconnect
                </button>
              )}
            </div>
            
            {/* Quick Test */}
            {telegramConnected && isSocketConnected && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--macos-border)' }}>
                <p className="mb-2 text-xs font-medium">Quick Test Automation:</p>
                <div className="flex flex-wrap gap-2">
                  {['Open settings', 'Open terminal', 'Open chrome'].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/telegram/webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              update_id: Date.now(),
                              message: {
                                message_id: 1,
                                from: { id: 1520574544, first_name: 'Test' },
                                chat: { id: 1520574544, type: 'private' },
                                text: cmd,
                                date: Math.floor(Date.now() / 1000)
                              }
                            })
                          })
                          if (response.ok) {
                            setTelegramStatus(`✅ Test sent: "${cmd}" - Check your desktop!`)
                          }
                        } catch (error) {
                          setTelegramStatus('❌ Test failed - Check console')
                        }
                      }}
                      className="rounded-md border px-2 py-1 text-[10px] font-medium"
                      style={{ borderColor: 'var(--macos-border)', background: 'var(--macos-surface-raised)' }}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
                
                {/* Custom Message Input */}
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-medium" style={{ color: 'var(--macos-secondary)' }}>
                    Send custom message:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Open youtube, Open spotify..."
                      className="h-8 flex-1 rounded-lg border px-3 text-xs outline-none"
                      style={{ background: 'var(--macos-surface-raised)', borderColor: 'var(--macos-border)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget
                          const text = input.value.trim()
                          if (text) {
                            fetch('/api/telegram/webhook', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                update_id: Date.now(),
                                message: {
                                  message_id: 1,
                                  from: { id: 1520574544, first_name: 'Test' },
                                  chat: { id: 1520574544, type: 'private' },
                                  text: text,
                                  date: Math.floor(Date.now() / 1000)
                                }
                              })
                            }).then(res => {
                              if (res.ok) {
                                setTelegramStatus(`✅ Sent: "${text}"`)
                                input.value = ''
                              }
                            })
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="Open youtube"]') as HTMLInputElement
                        const text = input?.value.trim()
                        if (text) {
                          fetch('/api/telegram/webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              update_id: Date.now(),
                              message: {
                                message_id: 1,
                                from: { id: 1520574544, first_name: 'Test' },
                                chat: { id: 1520574544, type: 'private' },
                                text: text,
                                date: Math.floor(Date.now() / 1000)
                              }
                            })
                          }).then(res => {
                            if (res.ok) {
                              setTelegramStatus(`✅ Sent: "${text}"`)
                              input.value = ''
                            }
                          })
                        }
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: '#0088cc' }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Telegram Integration Header */}
          <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}>
            <MessageCircle className="mx-auto h-14 w-14" style={{ color: '#0088cc' }} />
            <h2 className="mt-2 font-semibold">Telegram Integration</h2>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5" style={{ color: 'var(--macos-secondary)' }}>
              Connect your Telegram to interact with SmartyAI from anywhere. Send files, check ATS scores, and use AI commands directly from Telegram.
            </p>
          </div>
          
          <Group>
            <SettingRow 
              title="Telegram Connection" 
              description={telegramConnected ? 'Your Telegram is connected' : 'Connect to use Telegram features'}
            >
              <Toggle 
                label="Telegram" 
                value={telegramConnected} 
                onChange={(value) => {
                  if (value) {
                    connectTelegram()
                  } else {
                    disconnectTelegram()
                  }
                }} 
              />
            </SettingRow>
            
            {telegramStatus && (
              <div className="px-4 py-3">
                <p className="text-xs" style={{ color: 'var(--macos-secondary)' }}>{telegramStatus}</p>
              </div>
            )}
            
            {telegramLinkUrl && (
              <div className="px-4 py-3">
                <a
                  href={telegramLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white"
                  style={{ background: '#0088cc' }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Open Telegram to Connect
                </a>
                <p className="mt-2 text-[10px]" style={{ color: 'var(--macos-secondary)' }}>
                  Click the button above to open Telegram and complete the connection.
                </p>
              </div>
            )}
          </Group>
          
          {telegramConnected && (
            <Group>
              <SettingRow title="Features" description="What you can do with Telegram" last>
                <div className="flex flex-wrap gap-1.5">
                  {['AI Chat', 'File Upload', 'ATS Check', 'Mac Automation'].map((feature) => (
                    <span 
                      key={feature}
                      className="rounded-md px-2 py-1 text-[10px]"
                      style={{ background: 'var(--macos-surface-raised)', color: 'var(--macos-secondary)' }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </SettingRow>
            </Group>
          )}
          
          <Group>
            <SettingRow 
              title="Bot Commands" 
              description="Available Telegram commands"
              last
            >
              <div className="space-y-1 text-right">
                {['/start - Connect Telegram', '/help - Show help', '/status - Check status', '/tasks - View tasks'].map((cmd) => (
                  <div key={cmd} className="text-[10px] font-mono" style={{ color: 'var(--macos-secondary)' }}>
                    {cmd}
                  </div>
                ))}
              </div>
            </SettingRow>
          </Group>
        </>}

        {activeTab === 'extras' && <div className="grid gap-3 sm:grid-cols-2">{[{ icon: MousePointer2, name: 'Mouse', text: 'Tracking, scrolling, and secondary click' }, { icon: Printer, name: 'Printers & Scanners', text: 'Add and manage printers' }, { icon: Gamepad2, name: 'Game Center', text: 'Controller and game preferences' }, { icon: Globe2, name: 'Internet Accounts', text: 'Mail, contacts, and calendars' }, { icon: Laptop, name: 'Users & Groups', text: 'Login and account options' }, { icon: LockKeyhole, name: 'Lock Screen', text: 'Password and display timing' }].map(({ icon: Icon, name, text }) => <button key={name} className="flex items-center gap-3 rounded-xl border p-4 text-left" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}><span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: 'var(--theme-primary-color)' }}><Icon className="h-5 w-5" /></span><span><span className="block text-sm font-medium">{name}</span><span className="block text-[10px]" style={{ color: 'var(--macos-secondary)' }}>{text}</span></span><ChevronRight className="ml-auto h-4 w-4 opacity-30" /></button>)}</div>}
      </div>
    </main>
  </div>
}
