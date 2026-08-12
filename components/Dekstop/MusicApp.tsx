"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music, Search, Home, Radio, Clock, Mic, Tv, User, ListMusic } from 'lucide-react'
import Image from 'next/image'

// Sample songs data (in production, this would come from an API)
const songs = [
  { 
    id: 1,
    title: "Nasheya Gungale", 
    artist: "Nasheya Gungale", 
    src: "https://pagalworld.is/wp-content/uploads/2026/05/Nasheya%20Gungale%20-%20Nasheya%20Gungale%20(128%20kbps).mp3", 
    img: "https://pagalworld.is/wp-content/uploads/2026/05/Nasheya-Gungale-Kannada-2026-20260514123923-500x500.jpg",
    duration: "4:32"
  },
  { 
    id: 2,
    title: "Wanna Be Yours", 
    artist: "Arctic Monkeys", 
    src: "https://pagallworlds.com/wp-content/uploads/2023/06/I-Wanna-Be-Yours-Slowed-Reverb.mp3", 
    img: "https://cdn-images.dzcdn.net/images/cover/64e54e307bd5e2bdb27ffeb662fd910d/1900x1900-000000-80-0-0.jpg",
    duration: "3:45"
  },
  { 
    id: 3,
    title: "False God", 
    artist: "Taylor Swift", 
    src: "https://pagalworld4u.com/wp-content/uploads/2026/02/False God - Lover (128 kbps).mp3", 
    img: "https://www.pagalworld4u.com/wp-content/uploads/2026/02/Lover-English-2019-20250731010741-500x500.jpg",
    duration: "3:21"
  },
  { 
    id: 4,
    title: "Blinding Lights", 
    artist: "The Weeknd", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/14/e3/9214e352-3322-3708-4903-cf5059c4985f/21UM1IM58861.rgb.jpg/500x500bb.jpg",
    duration: "3:20"
  },
  { 
    id: 5,
    title: "Levitating", 
    artist: "Dua Lipa", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9e/26/86/9e268670-6f4c-c2f3-794a-7a3775c81749/190296421112.jpg/500x500bb.jpg",
    duration: "3:23"
  },
  { 
    id: 6,
    title: "Stay", 
    artist: "Justin Bieber & Kid Laroi", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/500x500bb.jpg",
    duration: "2:21"
  },
  { 
    id: 7,
    title: "Shape of You", 
    artist: "Ed Sheeran", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/500x500bb.jpg",
    duration: "3:53"
  },
  { 
    id: 8,
    title: "Dance Monkey", 
    artist: "Tones and I", 
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", 
    img: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/92/14/e3/9214e352-3322-3708-4903-cf5059c4985f/21UM1IM58861.rgb.jpg/500x500bb.jpg",
    duration: "3:29"
  },
]

export default function MusicApp() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [searchQuery, setSearchQuery] = useState('')
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const currentSong = songs[currentSongIndex]

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(err => console.error('Audio play failed:', err))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSongIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
  }, [volume])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const playSong = (index: number) => {
    setCurrentSongIndex(index)
    setIsPlaying(true)
    setCurrentTime(0)
  }

  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length)
      setCurrentSongIndex(randomIndex)
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % songs.length)
    }
    setIsPlaying(true)
  }

  const handlePrevious = () => {
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length)
    setIsPlaying(true)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progress = progressRef.current
    if (!audio || !progress) return

    const rect = progress.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const percentage = clickX / width
    audio.currentTime = percentage * duration
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <audio
        ref={audioRef}
        src={currentSong.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      {/* Sidebar */}
      <aside className="w-56 h-full flex flex-col bg-black/40 backdrop-blur-xl border-r border-white/5">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/5">
          <Music className="w-6 h-6 text-rose-500 mr-2" />
          <span className="text-lg font-bold">Music</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <Search size={18} className="text-rose-500" />
              <span>Search</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <Home size={18} className="text-rose-500" />
              <span>Home</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <Radio size={18} className="text-rose-500" />
              <span>Radio</span>
            </button>
          </div>

          {/* Library Section */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Library
            </h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white bg-rose-500/10 border-l-2 border-rose-500">
                <Music size={18} className="text-rose-500" />
                <span>Songs</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <Mic size={18} className="text-rose-500" />
                <span>Artists</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <ListMusic size={18} className="text-rose-500" />
                <span>Albums</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <Clock size={18} className="text-rose-500" />
                <span>Recently Added</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <Tv size={18} className="text-rose-500" />
                <span>Music Videos</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <User size={18} className="text-rose-500" />
                <span>Made for You</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-white/5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-300">User</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-black/20 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Songs</h2>
          
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Find in Songs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 w-44"
              />
            </div>
          </div>
        </header>

        {/* Songs Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-28" style={{ scrollbarWidth: 'none' }}>
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Music size={48} className="mb-4 text-gray-600" />
              <p className="text-sm font-medium">No songs found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredSongs.map((song, i) => {
                const originalIndex = songs.findIndex(s => s.id === song.id)
                const isCurrentSong = currentSongIndex === originalIndex
                
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(originalIndex)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-2 shadow-lg">
                      <img
                        src={song.img}
                        alt={song.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          {isCurrentSong && isPlaying ? (
                            <Pause size={18} className="fill-current" />
                          ) : (
                            <Play size={18} className="fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Now Playing Indicator */}
                      {isCurrentSong && isPlaying && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                          <div className="flex gap-0.5">
                            <div className="w-1 h-4 bg-rose-500 rounded-full animate-pulse" />
                            <div className="w-1 h-4 bg-rose-500 rounded-full animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-rose-500 rounded-full animate-pulse delay-150" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xs font-semibold text-white truncate">{song.title}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{song.artist}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Floating Player */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[620px] h-[52px] rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between px-5">
          {/* Song Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden flex-shrink-0">
              <img src={currentSong.img} alt={currentSong.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{currentSong.title}</span>
              <span className="text-xs text-gray-400 truncate">{currentSong.artist}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1 transition-colors ${isShuffle ? 'text-rose-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle size={14} />
            </button>
            <button 
              onClick={handlePrevious}
              className="p-1 text-gray-300 hover:text-white transition-colors"
            >
              <SkipBack size={16} className="fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              {isPlaying ? (
                <Pause size={14} className="fill-current" />
              ) : (
                <Play size={14} className="fill-current ml-0.5" />
              )}
            </button>
            <button 
              onClick={handleNext}
              className="p-1 text-gray-300 hover:text-white transition-colors"
            >
              <SkipForward size={16} className="fill-current" />
            </button>
            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1 transition-colors ${isRepeat ? 'text-rose-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Repeat size={14} />
            </button>
          </div>

          {/* Volume & Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="text-xs text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 cursor-pointer group"
        >
          <div 
            className="h-full bg-rose-500 transition-all group-hover:bg-rose-400"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </main>
    </div>
  )
}
