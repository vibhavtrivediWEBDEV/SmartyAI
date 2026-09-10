/**
 * API Request Manager
 *
 * Implements:
 * - Request deduplication
 * - Request cancellation
 * - Response caching
 * - Request coalescing
 * - Memory cleanup
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  abortController: AbortController;
}

class APIRequestManagerClass {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private windowRequests = new Map<string, Set<string>>();

  /**
   * Fetch with deduplication and caching
   */
  async fetch<T>(
    windowId: string,
    url: string,
    options: RequestInit & {
      cache?: boolean;
      cacheTTL?: number;
      dedupe?: boolean;
    } = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = 60000, // 1 minute default
      dedupe = true,
      ...fetchOptions
    } = options;

    const requestKey = `${fetchOptions.method || 'GET'}:${url}:${JSON.stringify(fetchOptions.body || '')}`;

    // Track request by window
    if (!this.windowRequests.has(windowId)) {
      this.windowRequests.set(windowId, new Set());
    }
    this.windowRequests.get(windowId)!.add(requestKey);

    // Check cache
    if (cache) {
      const cached = this.cache.get(requestKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`🔄 [APIManager] Cache hit: ${url}`);
        return cached.data;
      }
    }

    // Check for pending request (deduplication)
    if (dedupe && this.pendingRequests.has(requestKey)) {
      console.log(`🔄 [APIManager] Deduplicating: ${url}`);
      return this.pendingRequests.get(requestKey)!.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = this.executeRequest<T>(url, {
      ...fetchOptions,
      signal: abortController.signal,
    }, requestKey, cache, cacheTTL);

    this.pendingRequests.set(requestKey, { promise, abortController });

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
      this.windowRequests.get(windowId)?.delete(requestKey);
    }
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    requestKey: string,
    cache: boolean,
    cacheTTL: number
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache successful response
      if (cache) {
        this.cache.set(requestKey, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + cacheTTL,
        });
      }

      return data;
    } catch (error) {
      // Don't cache errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`🚫 [APIManager] Request aborted: ${url}`);
      }
      throw error;
    }
  }

  /**
   * Cancel all requests for a window
   */
  cancelWindowRequests(windowId: string) {
    const requestKeys = this.windowRequests.get(windowId);
    if (!requestKeys) return;

    requestKeys.forEach(requestKey => {
      const pending = this.pendingRequests.get(requestKey);
      if (pending) {
        pending.abortController.abort();
        this.pendingRequests.delete(requestKey);
      }
    });

    this.windowRequests.delete(windowId);
    console.log(`🚫 [APIManager] Cancelled ${requestKeys.size} requests for window ${windowId}`);
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string) {
    if (pattern) {
      // Clear matching cache entries
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get pending request count (for debugging)
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }

  /**
   * Get cache size (for debugging)
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedResponses: this.cache.size,
      windowsWithRequests: this.windowRequests.size,
    };
  }
}

// Global singleton
export const APIRequestManager = new APIRequestManagerClass();

/**
 * Hook to use API manager
 */
export function useAPIRequestManager(windowId: string) {
  const fetch = useCallback(<T>(url: string, options?: Parameters<typeof APIRequestManager.fetch>[2]) => {
    return APIRequestManager.fetch<T>(windowId, url, options);
  }, [windowId]);

  const cancelRequests = useCallback(() => {
    APIRequestManager.cancelWindowRequests(windowId);
  }, [windowId]);

  useEffect(() => {
    return () => {
      // Cancel all requests on unmount
      cancelRequests();
    };
  }, [cancelRequests]);

  return {
    fetch,
    cancelRequests,
  };
}
