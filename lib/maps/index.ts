/**
 * Maps Service Index
 * 
 * Provides unified access to all map-related services:
 * - Geocoding (location search)
 * - Routing (route calculation)
 * - POI (nearby places)
 * - Location (GPS tracking)
 * 
 * Architecture:
 * Map UI → Map Service → Geocoding/Routing/POI/Location Services
 */

export type {
  Coordinate,
  BoundingBox,
  RoutePoint,
  GeocodedLocation,
  GeocodingResult,
  POICategory,
  POIResult,
  TravelMode,
  ManeuverType,
  TurnDirection,
  Maneuver,
  RouteLeg,
  RouteSummary,
  Route,
  RouteRequest,
  NavigationStatus,
  NavigationPosition,
  NavigationProgress,
  NavigationState,
  RoutingProvider,
  RoutingCapabilities,
  GeocodingProvider,
  POIProvider,
  MapStyle,
  CameraConfig,
  NavigationCameraMode,
  MapMarker,
  AIMapCommand,
  AICommandResult,
} from '@/types/maps';

export {
  formatDistance,
  formatDuration,
  calculateETA,
  formatETA,
} from '@/types/maps';

// Geocoding service
export {
  NominatimGeocoding,
  geocoding,
  geocode,
  reverseGeocode,
} from './geocoding';

// Routing service
export {
  ValhallaRouting,
  routing,
  calculateRoute,
} from './routing';

// POI service
export {
  OverpassPOI,
  poiService,
  searchNearby,
  searchNearbyWithRouteInfo,
} from './poi';

// Location service
export {
  LocationService,
  locationService,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
} from './location';

export type {
  LocationOptions,
  LocationCallback,
  LocationErrorCallback,
} from './location';
