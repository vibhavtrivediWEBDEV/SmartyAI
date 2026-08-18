'use client';

/**
 * Comprehensive Sound Testing Page
 * Test ALL sounds in the system
 */

import { useState } from 'react';
import { playById } from '@/lib/sound/reactionEngine';
import { soundSettingsData } from '@/lib/sound/soundSettingsSchema';

export default function ComprehensiveSoundTestPage() {
  const [testLog, setTestLog] = useState<string[]>([]);
  const [currentSound, setCurrentSound] = useState<string | null>(null);

  const log = (message: string) => {
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSound = async (soundId: string, soundName: string) => {
    setCurrentSound(soundId);
    try {
      await playById(soundId, { volume: 0.7 });
      log(`✅ Played: ${soundName} (${soundId})`);
    } catch (error: any) {
      log(`❌ Failed: ${soundName} - ${error?.message || 'Unknown error'}`);
    }
  };

  const testAllSounds = async () => {
    log('🎵 Testing all sounds...');
    const allSounds = soundSettingsData.flatMap(cat => cat.sounds);

    for (const sound of allSounds) {
      await testSound(sound.id, sound.name);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay
    }

    log(`✨ Completed testing ${allSounds.length} sounds`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔊 Complete Sound Testing</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test all {soundSettingsData.reduce((acc, cat) => acc + cat.sounds.length, 0)} sounds in the system
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={testAllSounds}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            🎵 Test All Sounds
          </button>
          <button
            onClick={() => setTestLog([])}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Clear Log
          </button>
        </div>

        {/* Sound Categories */}
        <div className="grid gap-6">
          {soundSettingsData.map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {category.sounds.length} sounds
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.sounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => testSound(sound.id, sound.name)}
                    disabled={currentSound === sound.id}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      currentSound === sound.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{sound.emoji}</span>
                      <div className="font-semibold text-sm">{sound.name}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{sound.id}</code>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {sound.description}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Plays on: {sound.playsOn}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Test Log */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold mb-4">📋 Test Log</h3>
          <div className="max-h-96 overflow-y-auto font-mono text-sm space-y-1">
            {testLog.length === 0 ? (
              <p className="text-gray-400">Click any sound to test, or "Test All Sounds" to play all</p>
            ) : (
              testLog.map((entry, i) => (
                <div
                  key={i}
                  className={`py-1 ${
                    entry.includes('✅') ? 'text-green-600 dark:text-green-400' :
                    entry.includes('❌') ? 'text-red-600 dark:text-red-400' :
                    entry.includes('🎵') ? 'text-purple-600 dark:text-purple-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manual Testing */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold mb-4">🛠️ Manual Testing</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Copy this code to test sounds in browser console:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
{`// Test any sound by ID
const { playById } = await import('/lib/sound/reactionEngine.ts');
await playById('faaah');  // Or any other sound ID

// Test all sounds programmatically
const sounds = ['faaah', 'correct', 'error_CDOxCYm'];
for (const id of sounds) {
  await playById(id);
  await new Promise(r => setTimeout(r, 500));
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
