'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { soundSettingsData, type SoundSetting, type SoundCategory } from '@/lib/sound/soundSettingsSchema'

interface SoundSettingsProps {
  soundVolume: number
  muted: boolean
  interfaceSounds: boolean
  onVolumeChange: (volume: number) => void
  onMuteChange: (muted: boolean) => void
  onInterfaceSoundsChange: (enabled: boolean) => void
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

function Toggle({ value, onChange, id, label }: { value: boolean; onChange: (value: boolean) => void; id?: string; label: string }) {
  return <button id={id} type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors" style={{ background: value ? 'var(--theme-primary-color)' : 'var(--macos-secondary)' }}><span className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} /></button>
}

function SoundPlayButton({ sound }: { sound: SoundSetting }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = async () => {
    try {
      if (playing && audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setPlaying(false)
        return
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // Create new audio instance
      const audio = new Audio(`/sounds/${sound.id}.mp3`)
      audioRef.current = audio
      audio.volume = sound.volume

      audio.onended = () => {
        setPlaying(false)
      }

      audio.onerror = () => {
        console.error(`Failed to load sound: ${sound.id}`)
        setPlaying(false)
      }

      await audio.play()
      setPlaying(true)
    } catch (error) {
      console.error('Error playing sound:', error)
      setPlaying(false)
    }
  }

  return (
    <button
      onClick={handlePlay}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
        playing 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
      }`}
      title={playing ? 'Stop' : 'Play'}
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </button>
  )
}

export default function SoundSettings({
  soundVolume,
  muted,
  interfaceSounds,
  onVolumeChange,
  onMuteChange,
  onInterfaceSoundsChange
}: SoundSettingsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('terminal')

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  return (
    <div className="space-y-4">
      {/* Basic Sound Controls */}
      <Group>
        <SettingRow title="Output volume">
          <Slider value={soundVolume} onChange={onVolumeChange} />
        </SettingRow>
        <SettingRow title="Mute">
          <Toggle label="Mute" value={muted} onChange={onMuteChange} />
        </SettingRow>
        <SettingRow title="Play interface sound effects" last>
          <Toggle label="Interface sounds" value={interfaceSounds} onChange={onInterfaceSoundsChange} />
        </SettingRow>
      </Group>

      {/* Sound Categories */}
      <div className="space-y-3">
        <h3 className="px-1 text-sm font-semibold" style={{ color: 'var(--macos-text)' }}>
          Reaction Sounds
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--macos-secondary)' }}>
          Click to expand and test each sound category
        </p>

        {soundSettingsData.map((category: SoundCategory) => (
          <Group key={category.id}>
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.emoji}</span>
                <div className="text-left">
                  <p className="text-[13px] font-medium">{category.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--macos-secondary)' }}>
                    {category.description}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--theme-primary-color)' }}>
                {expandedCategory === category.id ? '▲' : '▼'}
              </span>
            </button>

            {expandedCategory === category.id && (
              <div className="border-t" style={{ borderColor: 'var(--macos-border)' }}>
                {category.sounds.map((sound: SoundSetting) => (
                  <div
                    key={sound.id}
                    className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                    style={{ borderColor: 'var(--macos-border)' }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="text-xl">{sound.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{sound.name}</p>
                        <p className="truncate text-[10px]" style={{ color: 'var(--macos-secondary)' }}>
                          {sound.description}
                        </p>
                        <p className="text-[10px] italic" style={{ color: 'var(--macos-secondary)' }}>
                          🎯 {sound.playsOn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--macos-secondary)' }}>
                        {Math.round(sound.volume * 100)}%
                      </span>
                      <SoundPlayButton sound={sound} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Group>
        ))}
      </div>

      {/* Sound Library Stats */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--macos-surface)', borderColor: 'var(--macos-border)' }}>
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" style={{ color: 'var(--theme-primary-color)' }} />
          <div>
            <p className="text-[12px] font-medium">
              {soundSettingsData.reduce((total, cat) => total + cat.sounds.length, 0)} sounds loaded
            </p>
            <p className="text-[10px]" style={{ color: 'var(--macos-secondary)' }}>
              {soundSettingsData.length} categories · All sounds from /public/sounds/
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
