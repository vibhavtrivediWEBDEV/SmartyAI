'use client';

/**
 * Error Sound Handler Component
 * 
 * Initializes global error handler to play "faaah" sound on ANY error
 * Add this to root layout to enable error sounds throughout the app
 */

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/lib/sound/errorSoundMiddleware';
import { initializeReactionEngine, playById } from '@/lib/sound/reactionEngine';

export default function ErrorSoundHandler() {
  useEffect(() => {
    // Initialize sound system
    initializeReactionEngine({
      enableAI: true,
      preloadOnStartup: true,
      maxLatency: 100
    }).then(() => {
      console.log('🔊 [App] Sound system initialized');
    });

    // Setup global error handler
    setupGlobalErrorHandler();

    const originalFetch = window.fetch;
    let lastServerErrorSoundAt = 0;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const now = Date.now();
      if (response.status === 500 && now - lastServerErrorSoundAt >= 3000) {
        lastServerErrorSoundAt = now;
        void playById('maa-tari-oo-bhai').catch(() => {});
      }
      return response;
    };

    console.log('✅ [App] Error sound handler initialized');

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
