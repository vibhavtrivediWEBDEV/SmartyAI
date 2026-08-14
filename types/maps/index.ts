/**
 * Map and Navigation Type Definitions
 * 
 * These types support multiple routing providers (Valhalla, GraphHopper)
 * and enable a production-ready navigation system.
 */

// ============================================================================
// GEOGRAPHIC TYPES
// ============================================================================

/**
 * Geographic coordinate (latitude, longitude)
 */
export interface Coordinate {
  lat: number;
  lon: number;
}

/**
 * Bounding box for map view
 */
export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

/**
 * Route point with additional metadata
 */
export interface RoutePoint extends Coordinate {
  elevation?: number;
  timestamp?: number;
  speed?: number;
  heading?: number;
}

// ============================================================================
// GEOCODING TYPES
// ============================================================================

/**
 * Geocoded location result
 */
export interface GeocodedLocation {
  id: string;
  name: string;
  displayName: string;
  address: string;
  coordinates: Coordinate;
  bbox?: BoundingBox;
  type?: string;
  importance?: number;
}

/**
 * Geocoding search result from provider
 */
export interface GeocodingResult {
  success: boolean;
  locations: GeocodedLocation[];
  provider: string;
  query: string;
}

// ============================================================================
// POI (POINT OF INTEREST) TYPES
// ============================================================================

/**
 * POI category for nearby search
 */
export type POICategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'hotel'
  | 'hospital'
  | 'pharmacy'
  | 'bank'
  | 'atm'
  | 'gas_station'
  | 'charging_station'
  | 'parking'
  | 'grocery'
  | 'supermarket'
  | 'park'
  | 'tourism'
  | 'attraction';

/**
 * POI search result
 */
export interface POIResult {
  id: string;
  name: string;
  category: POICategory;
  coordinates: Coordinate;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  reviews?: number;
  distance?: number; // straight-line distance in meters
  travelTime?: number; // route travel time in seconds
  travelDistance?: number; // route distance in meters
}

// ============================================================================
// ROUTING TYPES
// ============================================================================

/**
 * Travel mode for routing
 */
export type TravelMode = 'driving' | 'walking' | 'cycling';

/**
 * Maneuver type for turn-by-turn navigation
 */
export type ManeuverType =
  | 'turn'
  | 'new_name'
  | 'depart'
  | 'arrive'
  | 'merge'
  | 'on_ramp'
  | 'off_ramp'
  | 'fork'
  | 'roundabout'
  | 'continue'
  | 'uturn'
  | 'keep';

/**
 * Turn direction
 */
export type TurnDirection =
  | 'left'
  | 'right'
  | 'straight'
  | 'slight_left'
  | 'slight_right'
  | 'sharp_left'
  | 'sharp_right'
  | 'uturn';

/**
 * Maneuver instruction
 */
export interface Maneuver {
  type: ManeuverType;
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  turnDirection?: TurnDirection;
  streetName?: string;
  exitNumber?: number; // for roundabouts
  coordinates: Coordinate;
  bearingBefore?: number;
  bearingAfter?: number;
}

/**
 * Route leg (segment between waypoints)
 */
export interface RouteLeg {
  distance: number; // meters
  duration: number; // seconds
  maneuvers: Maneuver[];
  geometry: Coordinate[]; // polyline
}

/**
 * Route summary
 */
export interface RouteSummary {
  distance: number; // total meters
  duration: number; // total seconds
  boundingBox: BoundingBox;
}

/**
 * Complete route result
 */
export interface Route {
  id: string;
  geometry: Coordinate[];
  legs: RouteLeg[];
  summary: RouteSummary;
  mode: TravelMode;
  provider: string;
  alternatives?: Route[];
}

/**
 * Route request parameters
 */
export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
  waypoints?: Coordinate[]; // intermediate stops
  mode: TravelMode;
  alternatives?: boolean; // request alternative routes
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
}

// ============================================================================
// NAVIGATION STATE TYPES
// ============================================================================

/**
 * Navigation status
 */
export type NavigationStatus =
  | 'idle'
  | 'loading'
  | 'navigating'
  | 'recalculating'
  | 'arrived'
  | 'error';

/**
 * Current navigation position on route
 */
export interface NavigationPosition {
  currentLocation: Coordinate;
  snappedLocation: Coordinate; // map-matched position
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

/**
 * Navigation progress tracking
 */
export interface NavigationProgress {
  routeIndex: number; // which route if alternatives
  legIndex: number;
  maneuverIndex: number;
  segmentIndex: number; // position within current segment
  distanceToNextManeuver: number; // meters
  distanceRemaining: number; // meters
  durationRemaining: number; // seconds
  distanceTraveled: number; // meters
  percentComplete: number; // 0-100
  eta: Date;
}

/**
 * Full navigation state
 */
export interface NavigationState {
  status: NavigationStatus;
  route: Route | null;
  position: NavigationPosition | null;
  progress: NavigationProgress | null;
  isOffRoute: boolean;
  offRouteDistance: number;
  lastRecalculation?: number;
  error?: string;
}

// ============================================================================
// PROVIDER ABSTRACTION TYPES
// ============================================================================

/**
 * Routing provider interface (supports Valhalla, GraphHopper, etc.)
 */
export interface RoutingProvider {
  name: string;
  route(request: RouteRequest): Promise<Route[] | null>;
  isAvailable(): Promise<boolean>;
  getCapabilities(): RoutingCapabilities;
}

/**
 * Routing provider capabilities
 */
export interface RoutingCapabilities {
  modes: TravelMode[];
  supportsAlternatives: boolean;
  supportsWaypoints: boolean;
  supportsAvoidances: boolean;
  maxWaypoints: number;
  supportsElevation: boolean;
}

/**
 * Geocoding provider interface
 */
export interface GeocodingProvider {
  name: string;
  geocode(query: string): Promise<GeocodingResult>;
  reverseGeocode(coordinate: Coordinate): Promise<GeocodedLocation | null>;
  suggest?(query: string, near?: Coordinate): Promise<GeocodedLocation[]>;
}

/**
 * POI provider interface
 */
export interface POIProvider {
  name: string;
  searchNearby(
    location: Coordinate,
    category: POICategory,
    radius: number,
    limit?: number
  ): Promise<POIResult[]>;
}

// ============================================================================
// MAP CONFIGURATION TYPES
// ============================================================================

/**
 * Map style for MapLibre
 */
export type MapStyle =
  | 'streets'
  | 'satellite'
  | 'hybrid'
  | 'dark'
  | 'light'
  | 'terrain';

/**
 * Map camera configuration
 */
export interface CameraConfig {
  center: Coordinate;
  zoom: number;
  pitch?: number; // 0-60 for 3D
  bearing?: number; // rotation
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Navigation camera mode
 */
export type NavigationCameraMode =
  | 'overview' // entire route visible
  | 'following' // follow user position
  | 'focused'; // zoomed on current maneuver

// ============================================================================
// MARKER TYPES
// ============================================================================

/**
 * Map marker
 */
export interface MapMarker {
  id: string;
  coordinates: Coordinate;
  type: 'origin' | 'destination' | 'waypoint' | 'poi' | 'maneuver' | 'user';
  label?: string;
  icon?: string;
  color?: string;
  data?: any;
}

// ============================================================================
// AI/NATURAL LANGUAGE TYPES
// ============================================================================

/**
 * AI parsed map command
 */
export interface AIMapCommand {
  intent:
    | 'search'
    | 'route'
    | 'nearby'
    | 'navigate'
    | 'stopNavigation'
    | 'setMode'
    | 'clear';
  query?: string;
  destination?: Partial<GeocodedLocation>;
  category?: POICategory;
  radius?: number;
  mode?: TravelMode;
  origin?: Coordinate;
}

/**
 * AI command parsing result
 */
export interface AICommandResult {
  success: boolean;
  command?: AIMapCommand;
  error?: string;
  message?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Calculate ETA timestamp
 */
export function calculateETA(durationSeconds: number): Date {
  return new Date(Date.now() + durationSeconds * 1000);
}

/**
 * Format ETA time
 */
export function formatETA(eta: Date): string {
  return eta.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
