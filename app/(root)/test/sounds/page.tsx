'use client';

/**
 * Sound Testing Page
 * 
 * Test automatic sound triggers manually
 */

import { useState } from 'react';
import { react, playById } from '@/lib/sound/reactionEngine';

export default function SoundTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFaaah = async () => {
    try {
      await playById('faaah');
      addResult('✅ Played faaah (Challo) sound');
    } catch (error) {
      addResult('❌ Failed to play faaah: ' + error);
    }
  };

  const testCorrect = async () => {
    try {
      await playById('correct');
      addResult('✅ Played correct (Job\'s Done) sound');
    } catch (error) {
      addResult('❌ Failed to play correct: ' + error);
    }
  };

  const testErrorEvent = async () => {
    try {
      await react({
        event: 'critical_error',
        severity: 0.9,
        source: 'test'
      });
      addResult('✅ Triggered critical error event (should play faaah)');
    } catch (error) {
      addResult('❌ Failed to trigger error: ' + error);
    }
  };

  const testApiError = async () => {
    try {
      await react({
        event: 'api_error',
        severity: 0.7,
        source: 'api'
      });
      addResult('✅ Triggered API error event (should play faaah)');
    } catch (error) {
      addResult('❌ Failed to trigger API error: ' + error);
    }
  };

  const testSuccess = async () => {
    try {
      await react({
        event: 'deployment_success',
        severity: 0.1,
        source: 'deployment'
      });
      addResult('✅ Triggered success event (should NOT play faaah, low severity)');
    } catch (error) {
      addResult('❌ Failed to trigger success: ' + error);
    }
  };

  const testGlobalError = () => {
    try {
      throw new Error('Test global error');
    } catch (error) {
      addResult('✅ Threw error (global handler should play faaah in browser)');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔊 Sound System Testing</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test automatic sound triggers and event classification
        </p>
      </div>

      <div className="space-y-6">
        {/* Manual Sound Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-2">🎵 Manual Sound Tests</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Test individual sounds directly</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testFaaah}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Play Faaah (Challo)
            </button>
            <button
              onClick={testCorrect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Play Correct (Job's Done)
            </button>
          </div>
        </div>

        {/* Event Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-2">⚡ Event Classification Tests</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Test reaction engine with different events</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testErrorEvent}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Critical Error (severity 0.9)
            </button>
            <button
              onClick={testApiError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              API Error (severity 0.7)
            </button>
            <button
              onClick={testSuccess}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Success Event (severity 0.1)
            </button>
          </div>
        </div>

        {/* Global Error Test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-2">🌐 Global Error Handler</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Test global error sound middleware</p>
          <button
            onClick={testGlobalError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Trigger Global Error
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">📋 Test Results</h2>
              <p className="text-gray-600 dark:text-gray-400">Sound playback results will appear here</p>
            </div>
            <button
              onClick={clearResults}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Clear
            </button>
          </div>
          <div>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No tests run yet. Click buttons above to test.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={result.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">📖 How Testing Works</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Manual Sounds:</strong> Direct playback via playById()
            </div>
            <div>
              <strong>Error Events:</strong> Triggers react() with high severity (≥ 0.6) → plays faaah
            </div>
            <div>
              <strong>Success Events:</strong> Triggers react() with low severity (&lt; 0.6) → no faaah
            </div>
            <div>
              <strong>Global Error:</strong> Tests class-based error handling
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
