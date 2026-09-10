/**
 * Window Lifecycle Manager
 * Manages cleanup when windows close to prevent memory leaks
 */

import { useRef, useEffect, useCallback } from 'react';

export interface WindowLifecycle {
  windowId: string;
  abortControllers: Set<AbortController>;
  timeouts: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
  eventListeners: Map<string, EventListener>;
  webSockets: Set<WebSocket>;
  subscriptions: Set<() => void>;
}

class WindowManagerClass {
  private windows = new Map<string, WindowLifecycle>();
  private listeners = new Set<(windowId: string) => void>();

  createWindow(windowId: string): WindowLifecycle {
    const lifecycle: WindowLifecycle = {
      windowId,
      abortControllers: new Set(),
      timeouts: new Set(),
      intervals: new Set(),
      eventListeners: new Map(),
      webSockets: new Set(),
      subscriptions: new Set(),
    };

    this.windows.set(windowId, lifecycle);
    return lifecycle;
  }

  registerAbortController(windowId: string, controller: AbortController) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.abortControllers.add(controller);
    }
    return controller;
  }

  registerTimeout(windowId: string, timeout: NodeJS.Timeout) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.timeouts.add(timeout);
    }
    return timeout;
  }

  registerInterval(windowId: string, interval: NodeJS.Timeout) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.intervals.add(interval);
    }
    return interval;
  }

  registerEventListener(
    windowId: string,
    event: string,
    listener: EventListener,
    element: EventTarget = window
  ) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.eventListeners.set(`${event}-${Date.now()}`, listener);
      element.addEventListener(event, listener);
    }
    return () => {
      element.removeEventListener(event, listener);
    };
  }

  registerWebSocket(windowId: string, ws: WebSocket) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.webSockets.add(ws);
    }
    return ws;
  }

  registerSubscription(windowId: string, unsubscribe: () => void) {
    const lifecycle = this.windows.get(windowId);
    if (lifecycle) {
      lifecycle.subscriptions.add(unsubscribe);
    }
    return unsubscribe;
  }

  closeWindow(windowId: string) {
    const lifecycle = this.windows.get(windowId);
    if (!lifecycle) return;

    console.log(`🧹 [WindowManager] Cleaning up window: ${windowId}`);

    // Abort all pending requests
    lifecycle.abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
    });

    // Clear all timeouts
    lifecycle.timeouts.forEach(timeout => {
      clearTimeout(timeout);
    });

    // Clear all intervals
    lifecycle.intervals.forEach(interval => {
      clearInterval(interval);
    });

    // Remove all event listeners
    lifecycle.eventListeners.forEach((listener, key) => {
      try {
        window.removeEventListener(key.split('-')[0], listener);
      } catch (e) {
        console.warn('Failed to remove listener:', e);
      }
    });

    // Close all WebSockets
    lifecycle.webSockets.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (e) {
        console.warn('Failed to close WebSocket:', e);
      }
    });

    // Run all cleanup subscriptions
    lifecycle.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn('Failed to run subscription cleanup:', e);
      }
    });

    // Remove from registry
    this.windows.delete(windowId);

    // Notify listeners
    this.listeners.forEach(listener => listener(windowId));

    console.log(`✅ [WindowManager] Window ${windowId} cleaned up`);
  }

  onWindowClosed(listener: (windowId: string) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getWindowIds(): string[] {
    return Array.from(this.windows.keys());
  }

  getWindowStats() {
    const stats: Record<string, any> = {};
    this.windows.forEach((lifecycle, windowId) => {
      stats[windowId] = {
        abortControllers: lifecycle.abortControllers.size,
        timeouts: lifecycle.timeouts.size,
        intervals: lifecycle.intervals.size,
        eventListeners: lifecycle.eventListeners.size,
        webSockets: lifecycle.webSockets.size,
        subscriptions: lifecycle.subscriptions.size,
      };
    });
    return stats;
  }
}

// Global singleton
export const WindowManager = new WindowManagerClass();

/**
 * Hook to use window lifecycle
 * Automatically cleans up when component unmounts
 */
export function useWindowLifecycle(windowId: string) {
  const lifecycleRef = useRef<WindowLifecycle | null>(null);

  useEffect(() => {
    lifecycleRef.current = WindowManager.createWindow(windowId);

    return () => {
      WindowManager.closeWindow(windowId);
    };
  }, [windowId]);

  const registerAbortController = useCallback(() => {
    const controller = new AbortController();
    if (lifecycleRef.current) {
      WindowManager.registerAbortController(windowId, controller);
    }
    return controller;
  }, [windowId]);

  const registerTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    if (lifecycleRef.current) {
      WindowManager.registerTimeout(windowId, timeout);
    }
    return timeout;
  }, [windowId]);

  const registerInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    if (lifecycleRef.current) {
      WindowManager.registerInterval(windowId, interval);
    }
    return interval;
  }, [windowId]);

  const registerEventListener = useCallback((
    event: string,
    listener: EventListener,
    element: EventTarget = window
  ) => {
    return WindowManager.registerEventListener(windowId, event, listener, element);
  }, [windowId]);

  const registerWebSocket = useCallback((ws: WebSocket) => {
    return WindowManager.registerWebSocket(windowId, ws);
  }, [windowId]);

  const registerSubscription = useCallback((unsubscribe: () => void) => {
    return WindowManager.registerSubscription(windowId, unsubscribe);
  }, [windowId]);

  return {
    registerAbortController,
    registerTimeout,
    registerInterval,
    registerEventListener,
    registerWebSocket,
    registerSubscription,
  };
}
