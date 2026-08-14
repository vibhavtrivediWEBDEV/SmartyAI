/**
 * GPS/Location Service - Browser Geolocation
 * 
 * Provides real-time GPS tracking for navigation.
 * Uses browser's Geolocation API with map matching support.
 */

import type {
  Coordinate,
  NavigationPosition,
} from '@/types/maps';

/**
 * Geolocation options
 */
export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Location update callback
 */
export type LocationCallback = (position: NavigationPosition) => void;

/**
 * Location error callback
 */
export type LocationErrorCallback = (error: GeolocationPositionError) => void;

/**
 * Location service using browser Geolocation API
 */
export class LocationService {
  private watchId: number | null = null;
  private lastPosition: NavigationPosition | null = null;
  private callbacks: Set<LocationCallback> = new Set();
  private errorCallbacks: Set<LocationErrorCallback> = new Set();
  private interval: ReturnType<typeof setInterval> | null = null;

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(options?: LocationOptions): Promise<NavigationPosition | null> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        console.warn('Geolocation not available');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const navPosition: NavigationPosition = {
            currentLocation: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
            snappedLocation: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.lastPosition = navPosition;
          resolve(navPosition);
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 30000,
        }
      );
    });
  }

  /**
   * Start watching position (continuous updates)
   */
  startWatching(
    callback: LocationCallback,
    errorCallback?: LocationErrorCallback,
    options?: LocationOptions
  ): void {
    if (!this.isAvailable()) {
      console.warn('Geolocation not available');
      return;
    }

    // Store callbacks
    this.callbacks.add(callback);
    if (errorCallback) {
      this.errorCallbacks.add(errorCallback);
    }

    // If already watching, just add callback
    if (this.watchId !== null) {
      return;
    }

    // Start watching
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const navPosition: NavigationPosition = {
          currentLocation: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          snappedLocation: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        this.lastPosition = navPosition;
        
        // Notify all callbacks
        this.callbacks.forEach(cb => cb(navPosition));
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        this.errorCallbacks.forEach(cb => cb(error));
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 30000,
        maximumAge: options?.maximumAge ?? 5000,
      }
    );
  }

  /**
   * Stop watching position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.callbacks.clear();
    this.errorCallbacks.clear();
  }

  /**
   * Remove a specific callback
   */
  removeCallback(callback: LocationCallback): void {
    this.callbacks.delete(callback);
    
    // If no more callbacks, stop watching
    if (this.callbacks.size === 0 && this.watchId !== null) {
      this.stopWatching();
    }
  }

  /**
   * Get last known position
   */
  getLastPosition(): NavigationPosition | null {
    return this.lastPosition;
  }

  /**
   * Simulate location updates (for testing/debugging)
   */
  simulateRoute(
    route: Coordinate[],
    duration: number = 60000, // total duration in ms
    updateInterval: number = 1000 // update every second
  ): void {
    if (route.length < 2) {
      console.warn('Route must have at least 2 points');
      return;
    }

    let currentIndex = 0;
    const totalSteps = Math.floor(duration / updateInterval);
    const stepSize = route.length / totalSteps;

    this.interval = setInterval(() => {
      currentIndex++;
      
      if (currentIndex >= route.length) {
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
        return;
      }

      const currentCoord = route[Math.floor(currentIndex)];
      const nextIndex = Math.min(currentIndex + 1, route.length - 1);
      const nextCoord = route[Math.floor(nextIndex)];

      // Calculate heading
      const heading = this.calculateHeading(currentCoord, nextCoord);

      const position: NavigationPosition = {
        currentLocation: currentCoord,
        snappedLocation: currentCoord,
        heading,
        speed: 5, // m/s (18 km/h)
        accuracy: 10,
        timestamp: Date.now(),
      };

      this.lastPosition = position;
      this.callbacks.forEach(cb => cb(position));
    }, updateInterval);
  }

  /**
   * Calculate heading (bearing) between two points
   */
  private calculateHeading(from: Coordinate, to: Coordinate): number {
    const dLon = ((to.lon - from.lon) * Math.PI) / 180;
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  /**
   * Map match a point to a route (simple snap to nearest)
   */
  mapMatchToRoute(
    position: Coordinate,
    route: Coordinate[],
    maxDistance: number = 50 // meters
  ): Coordinate | null {
    let minDistance = Infinity;
    let nearestPoint: Coordinate | null = null;

    for (const routePoint of route) {
      const distance = this.haversineDistance(position, routePoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = routePoint;
      }
    }

    // Return original if too far from route
    if (minDistance > maxDistance) {
      return null;
    }

    return nearestPoint;
  }

  /**
   * Haversine distance between two points (in meters)
   */
  private haversineDistance(p1: Coordinate, p2: Coordinate): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

/**
 * Default location service instance
 */
export const locationService = new LocationService();

/**
 * Quick get current position
 */
export async function getCurrentLocation(): Promise<NavigationPosition | null> {
  return locationService.getCurrentPosition();
}

/**
 * Quick start watching
 */
export function startLocationTracking(
  callback: LocationCallback,
  errorCallback?: LocationErrorCallback
): void {
  locationService.startWatching(callback, errorCallback);
}

/**
 * Quick stop watching
 */
export function stopLocationTracking(): void {
  locationService.stopWatching();
}
