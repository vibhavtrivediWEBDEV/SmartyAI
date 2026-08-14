// Maps type definitions

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
