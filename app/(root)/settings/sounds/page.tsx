'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundSettingsData, getAllSoundsFlat, type SoundSetting, type SoundCategory } from '@/lib/sound/soundSettingsSchema';
import { playById } from '@/lib/sound';

export default function SoundSettingsPage() {
  const [sounds, setSounds] = useState(soundSettingsData);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('terminal');
  const [selectedSound, setSelectedSound] = useState<SoundSetting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalVolume, setGlobalVolume] = useState(0.5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  
  const playSound = useCallback(async (soundId: string, volume: number) => {
    try {
      setIsPlaying(soundId);
      await playById(soundId, { volume: volume * globalVolume });
      setTimeout(() => setIsPlaying(null), 1000);
    } catch (error) {
      console.error('Failed to play sound:', error);
      setIsPlaying(null);
    }
  }, [globalVolume]);

  const toggleSound = useCallback((categoryId: string, soundId: string) => {
    setSounds(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          sounds: cat.sounds.map(s => 
            s.id === soundId ? { ...s, enabled: !s.enabled } : s
          )
        };
      }
      return cat;
    }));
  }, []);

  const updateVolume = useCallback((categoryId: string, soundId: string, volume: number) => {
    setSounds(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          sounds: cat.sounds.map(s => 
            s.id === soundId ? { ...s, volume } : s
          )
        };
      }
      return cat;
    }));
  }, []);

  const filteredSounds = searchQuery 
    ? soundSettingsData.map(cat => ({
        ...cat,
        sounds: cat.sounds.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.intent.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.sounds.length > 0)
    : sounds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔊</span>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Sound Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your sound reactions and audio feedback
              </p>
            </div>
          </div>

          {/* Global Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xl">🎛️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sound Enabled</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Master toggle for all sounds</p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    soundEnabled 
                      ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{ left: soundEnabled ? 30 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Global Volume */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-xl">🔊</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Global Volume</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(globalVolume * 100)}%</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={globalVolume}
                  onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 ${globalVolume * 100}%, #e5e7eb ${globalVolume * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search sounds by name, description, or intent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: 'Total Sounds', value: getAllSoundsFlat().length, emoji: '🎵' },
            { label: 'Enabled', value: getAllSoundsFlat().filter(s => s.enabled).length, emoji: '✅' },
            { label: 'Categories', value: soundSettingsData.length, emoji: '📂' },
            { label: 'Intent Types', value: new Set(getAllSoundsFlat().map(s => s.intent)).size, emoji: '🎯' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stat.emoji}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Sound Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredSounds.map((category, catIndex) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <span className="text-2xl">{category.emoji}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                    {category.sounds.length} sounds
                  </span>
                  <motion.div
                    animate={{ rotate: expandedCategory === category.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              </button>

              {/* Category Sounds */}
              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6 space-y-4">
                      {category.sounds.map((sound, soundIndex) => (
                        <motion.div
                          key={sound.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: soundIndex * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            {/* Sound Icon */}
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl">
                                {sound.emoji}
                              </div>
                            </div>

                            {/* Sound Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{sound.name}</h4>
                                <span className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono">
                                  {sound.intent}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{sound.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                <span className="font-semibold">Plays on:</span> {sound.playsOn}
                              </p>

                              {/* Volume Control */}
                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Volume:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={sound.volume}
                                  onChange={(e) => updateVolume(category.id, sound.id, parseFloat(e.target.value))}
                                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-600"
                                  style={{
                                    background: `linear-gradient(to right, #8b5cf6 ${sound.volume * 100}%, #e5e7eb ${sound.volume * 100}%)`
                                  }}
                                />
                                <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12">
                                  {Math.round(sound.volume * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {/* Play Button */}
                              <button
                                onClick={() => playSound(sound.id, sound.volume)}
                                disabled={!soundEnabled || isPlaying === sound.id}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  isPlaying === sound.id
                                    ? 'bg-purple-500 shadow-lg shadow-purple-500/30'
                                    : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30'
                                } text-white disabled:opacity-50`}
                              >
                                {isPlaying === sound.id ? (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                  >
                                    🔊
                                  </motion.div>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </button>

                              {/* Enable/Disable Toggle */}
                              <button
                                onClick={() => toggleSound(category.id, sound.id)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  sound.enabled
                                    ? 'bg-green-500 shadow-lg shadow-green-500/30'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              >
                                {sound.enabled ? '✓' : '✕'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>💡 Pro tip: Click the play button to preview sounds before enabling them</p>
        </motion.div>
      </div>
    </div>
  );
}
