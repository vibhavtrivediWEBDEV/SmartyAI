/**
 * Lazy App Loader
 *
 * Implements intersection observer-based lazy loading for desktop apps
 * Only loads app code when user hovers/clicks the dock icon
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyAppOptions {
  appName: string;
  preloadOnHover?: boolean;
  preloadDelay?: number;
}

interface LazyAppState {
  Component: React.ComponentType<any> | null;
  loading: boolean;
  error: Error | null;
  preload: () => void;
  load: () => void;
}

// Cache of loaded apps
const appCache = new Map<string, React.ComponentType<any>>();
const loadingPromises = new Map<string, Promise<void>>();

/**
 * Lazy load a desktop app component
 * Returns Component only when loaded
 */
export function useLazyApp(options: LazyAppOptions): LazyAppState {
  const { appName, preloadOnHover = true, preloadDelay = 200 } = options;
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(() => appCache.get(appName) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadApp = useCallback(async () => {
    // Already loaded
    if (appCache.has(appName)) {
      setComponent(() => appCache.get(appName)!);
      return;
    }

    // Already loading
    if (loadingPromises.has(appName)) {
      await loadingPromises.get(appName);
      setComponent(() => appCache.get(appName) || null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadPromise = (async () => {
        // Dynamic import based on app name
        const module = await import(`@/components/Dekstop/apps/${appName}`);
        const component = module.default;
        appCache.set(appName, component);
        loadingPromises.delete(appName);
      })();

      loadingPromises.set(appName, loadPromise);
      await loadPromise;

      setComponent(() => appCache.get(appName) || null);
    } catch (err) {
      console.error(`Failed to load app ${appName}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to load app'));
    } finally {
      setLoading(false);
    }
  }, [appName]);

  const preload = useCallback(() => {
    if (!appCache.has(appName) && !loadingPromises.has(appName)) {
      void loadApp();
    }
  }, [appName, loadApp]);

  // Preload on hover (optional)
  const handleMouseEnter = useCallback(() => {
    if (preloadOnHover && hoverTimeoutRef.current === null) {
      hoverTimeoutRef.current = setTimeout(() => {
        preload();
        hoverTimeoutRef.current = null;
      }, preloadDelay);
    }
  }, [preloadOnHover, preloadDelay, preload]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Cleanup hover timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    Component,
    loading,
    error,
    preload,
    load: loadApp,
  };
}

/**
 * Hook for dock icon - preload on hover, load on click
 */
export function useDockIcon(appName: string) {
  const { Component, loading, load } = useLazyApp({
    appName,
    preloadOnHover: true,
    preloadDelay: 300, // Preload after 300ms hover
  });

  const handleClick = useCallback(() => {
    load();
  }, [load]);

  return {
    Component,
    loading,
    onClick: handleClick,
  };
}

/**
 * Preload multiple apps in background (for frequently used apps)
 */
export function preloadApps(appNames: string[]) {
  // Stagger preloading to avoid loading all at once
  appNames.forEach((appName, index) => {
    setTimeout(() => {
      if (!appCache.has(appName)) {
        import(`@/components/Dekstop/apps/${appName}`)
          .then(module => {
            appCache.set(appName, module.default);
            console.log(`📦 Preloaded app: ${appName}`);
          })
          .catch(err => {
            console.warn(`Failed to preload ${appName}:`, err);
          });
      }
    }, index * 500); // Load one app every 500ms
  });
}

/**
 * Get all loaded apps (for debugging)
 */
export function getLoadedApps() {
  return Array.from(appCache.keys());
}

/**
 * Clear app cache (for memory cleanup)
 */
export function clearAppCache() {
  appCache.clear();
  loadingPromises.clear();
  console.log('🧹 App cache cleared');
}
