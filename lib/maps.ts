// Maps utility library

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface Route {
  geometry: Coordinate[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export type TravelMode = 'driving' | 'walking' | 'cycling' | 'transit';

// Geocoding service (mock implementation - replace with real API)
export async function geocode(query: string): Promise<Coordinate | null> {
  // Mock implementation - in production, use a real geocoding API
  // like Mapbox, Google Maps, or OpenStreetMap Nominatim
  console.log('Geocoding:', query);
  
  // For demo purposes, return Paris coordinates
  if (query.toLowerCase().includes('eiffel') || query.toLowerCase().includes('paris')) {
    return { lat: 48.8584, lon: 2.2945 };
  }
  if (query.toLowerCase().includes('golden gate') || query.toLowerCase().includes('san francisco')) {
    return { lat: 37.8199, lon: -122.4783 };
  }
  
  return null;
}

// Route calculation service (mock implementation - replace with real API)
export async function calculateRoute(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode = 'driving'
): Promise<Route[] | null> {
  // Mock implementation - in production, use a real routing API
  // like Mapbox Directions, Google Directions, or OSRM
  console.log('Calculating route:', origin, destination, mode);
  
  // Generate mock route
  const mockRoute: Route = {
    geometry: [
      origin,
      destination,
    ],
    distance: calculateDistance(origin, destination),
    duration: estimateDuration(origin, destination, mode),
    steps: [
      {
        instruction: 'Head towards destination',
        distance: calculateDistance(origin, destination),
        duration: estimateDuration(origin, destination, mode),
      },
    ],
  };
  
  return [mockRoute];
}

// Location service
export const locationService = {
  getCurrentPosition: (): Promise<{ currentLocation: Coordinate } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            currentLocation: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
          });
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },
};

// Utility functions
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours} hr ${minutes} min`;
}

// Helper functions
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  // Haversine formula to calculate distance between two coordinates
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function estimateDuration(origin: Coordinate, destination: Coordinate, mode: TravelMode): number {
  // Estimate duration based on mode and distance
  const distance = calculateDistance(origin, destination);
  
  // Average speeds in m/s
  const speeds = {
    driving: 13.9, // ~50 km/h
    walking: 1.4, // ~5 km/h
    cycling: 4.2, // ~15 km/h
    transit: 8.3, // ~30 km/h
  };
  
  return distance / speeds[mode];
}
