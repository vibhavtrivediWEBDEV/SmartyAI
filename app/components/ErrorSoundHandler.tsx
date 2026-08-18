'use client';

/**
 * Error Sound Handler Component
 * 
 * Initializes global error handler to play "faaah" sound on ANY error
 * Add this to root layout to enable error sounds throughout the app
 */

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/lib/sound/errorSoundMiddleware';
import { initializeReactionEngine } from '@/lib/sound/reactionEngine';

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

    console.log('✅ [App] Error sound handler initialized');
  }, []);

  // This component doesn't render anything
  return null;
}
