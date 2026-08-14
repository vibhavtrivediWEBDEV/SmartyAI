/**
 * Routing Service - Valhalla Provider
 * 
 * Production routing using Valhalla open-source routing engine.
 * Uses public Valhalla demo server for development.
 * Should be replaced with self-hosted Valhalla for production.
 * 
 * Provider: Valhalla (Open Source)
 * Data: OpenStreetMap
 * Coverage: Global
 */

import type {
  Route,
  RouteRequest,
  RouteLeg,
  Maneuver,
  ManeuverType,
  TurnDirection,
  Coordinate,
  TravelMode,
  RoutingProvider,
  RoutingCapabilities,
} from '@/types/maps';

/**
 * Valhalla API base URL (public demo server)
 * For production: Replace with self-hosted Valhalla instance
 */
const VALHALLA_BASE = 'https://valhalla1.openstreetmap.de';

/**
 * Valhalla costing models
 */
const COSTING_MODELS: Record<TravelMode, string> = {
  driving: 'auto',
  walking: 'pedestrian',
  cycling: 'bicycle',
};

/**
 * Valhalla costing options
 */
const COSTING_OPTIONS: Record<TravelMode, any> = {
  driving: {
    use_highways: 1,
    use_tolls: 1,
  },
  walking: {},
  cycling: {
    use_roads: 0.5,
    bicycle_type: 'Hybrid',
  },
};

/**
 * Map Valhalla maneuver type to our type
 */
function mapManeuverType(type: number): ManeuverType {
  const maneuverTypes: Record<number, ManeuverType> = {
    0: 'turn',        // kNone
    1: 'continue',    // kStart
    2: 'turn',        // kStartRight
    3: 'turn',        // kStartLeft
    4: 'depart',      // kDestination
    5: 'depart',      // kDestinationRight
    6: 'depart',      // kDestinationLeft
    7: 'merge',       // kBecomes
    8: 'continue',    // kContinue
    9: 'turn',        // kSlightRight
    10: 'turn',       // kRight
    11: 'turn',       // kSharpRight
    12: 'uturn',      // kUturnRight
    13: 'uturn',      // kUturnLeft
    14: 'turn',       // kSharpLeft
    15: 'turn',       // kLeft
    16: 'turn',       // kSlightLeft
    17: 'keep',       // kRampStraight
    18: 'turn',       // kRampRight
    19: 'turn',       // kRampLeft
    20: 'fork',       // kExitRight
    21: 'fork',       // kExitLeft
    22: 'merge',      // kKeepStraight
    23: 'keep',       // kKeepRight
    24: 'keep',       // kKeepLeft
    25: 'merge',      // kMerge
    26: 'fork',       // kForkStraight
    27: 'fork',       // kForkRight
    28: 'fork',       // kForkLeft
    29: 'turn',       // kRoundaboutEnter
    30: 'turn',       // kRoundaboutExit
    31: 'on_ramp',    // kFerryEnter
    32: 'off_ramp',   // kFerryExit
    33: 'roundabout', // kTransit
    34: 'transit',    // kTransitTransfer
  };
  return maneuverTypes[type] || 'turn';
}

/**
 * Map Valhalla turn instruction to direction
 */
function mapTurnDirection(maneuverType: number): TurnDirection | undefined {
  const directions: Record<number, TurnDirection> = {
    9: 'slight_right',
    10: 'right',
    11: 'sharp_right',
    12: 'uturn',
    13: 'uturn',
    14: 'sharp_left',
    15: 'left',
    16: 'slight_left',
    17: 'straight',
    18: 'right',
    19: 'left',
    23: 'slight_right',
    24: 'slight_left',
  };
  return directions[maneuverType];
}

/**
 * Decode Valhalla encoded polyline
 */
function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lon += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      lat: lat / 1000000,
      lon: lon / 1000000,
    });
  }

  return coordinates;
}

/**
 * Convert Valhalla datetime string to Date
 */
function parseDatetime(datetime: string): Date {
  // Valhalla returns ISO datetime strings
  return new Date(datetime);
}

/**
 * Valhalla routing provider
 */
export class ValhallaRouting implements RoutingProvider {
  readonly name = 'valhalla';

  /**
   * Get route between origin and destination
   */
  async route(request: RouteRequest): Promise<Route[] | null> {
    try {
      const url = new URL(`${VALHALLA_BASE}/route`);
      
      const body = {
        locations: [
          { lat: request.origin.lat, lon: request.origin.lon },
          ...(request.waypoints || []).map(wp => ({ lat: wp.lat, lon: wp.lon })),
          { lat: request.destination.lat, lon: request.destination.lon },
        ],
        costing: COSTING_MODELS[request.mode],
        costing_options: {
          [COSTING_MODELS[request.mode]]: COSTING_OPTIONS[request.mode],
        },
        directions_options: {
          units: 'kilometers',
          language: 'en-US',
          format: 'json',
        },
        ...(request.alternatives && { alternates: 3 }),
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Valhalla routing error:', error);
        return null;
      }

      const data = await response.json();

      // Process primary route
      const routes = this.processRoute(data, request.mode);

      // Process alternatives if available
      if (data.alternates && Array.isArray(data.alternates)) {
        for (const alt of data.alternates) {
          routes.push(...this.processRoute(alt, request.mode, true));
        }
      }

      return routes;
    } catch (error) {
      console.error('Valhalla routing exception:', error);
      return null;
    }
  }

  /**
   * Process Valhalla route response
   */
  private processRoute(data: any, mode: TravelMode, isAlternative = false): Route[] {
    if (!data.trip || !data.trip.legs) {
      return [];
    }

    const trip = data.trip;
    const legs: RouteLeg[] = [];
    const allCoordinates: Coordinate[] = [];

    // Process each leg
    for (const valhallaLeg of trip.legs) {
      // Decode polyline
      const geometry = decodePolyline(valhallaLeg.shape);
      allCoordinates.push(...geometry);

      // Process maneuvers
      const maneuvers: Maneuver[] = [];
      let currentCoordIndex = 0;

      for (const man of valhallaLeg.maneuvers) {
        // Find coordinate index for this maneuver
        const coordIndex = Math.min(man.begin_shape_index || 0, geometry.length - 1);
        
        const maneuver: Maneuver = {
          type: mapManeuverType(man.type),
          instruction: this.cleanInstruction(man.instruction || ''),
          distance: man.length * 1000, // km to meters
          duration: man.time, // seconds
          turnDirection: mapTurnDirection(man.type),
          streetName: this.extractStreetName(man),
          coordinates: geometry[coordIndex],
          bearingBefore: man.begin_bearing,
          bearingAfter: man.end_bearing,
        };

        // Handle roundabout exit number
        if (man.type === 29 || man.type === 30) {
          maneuver.exitNumber = man.roundabout_exit_count;
        }

        maneuvers.push(maneuver);
        currentCoordIndex = coordIndex;
      }

      legs.push({
        distance: valhallaLeg.summary.length * 1000, // km to meters
        duration: valhallaLeg.summary.time, // seconds
        maneuvers,
        geometry,
      });
    }

    // Calculate bounding box from geometry
    const bbox = this.calculateBoundingBox(allCoordinates);

    const route: Route = {
      id: `valhalla-${Date.now()}${isAlternative ? '-alt' : ''}`,
      geometry: allCoordinates,
      legs,
      summary: {
        distance: trip.summary.length * 1000, // km to meters
        duration: trip.summary.time, // seconds
        boundingBox: bbox,
      },
      mode,
      provider: this.name,
    };

    return [route];
  }

  /**
   * Clean instruction text
   */
  private cleanInstruction(instruction: string): string {
    // Remove HTML tags if any
    return instruction
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract street name from maneuver
   */
  private extractStreetName(man: any): string | undefined {
    const streets = man.street_names;
    if (streets && streets.length > 0) {
      return streets[0];
    }
    return undefined;
  }

  /**
   * Calculate bounding box from coordinates
   */
  private calculateBoundingBox(coords: Coordinate[]): { minLon: number; minLat: number; maxLon: number; maxLat: number } {
    if (!coords || coords.length === 0) {
      return { minLon: -180, minLat: -90, maxLon: 180, maxLat: 90 };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    for (const coord of coords) {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLon = Math.min(minLon, coord.lon);
      maxLon = Math.max(maxLon, coord.lon);
    }

    // Add padding
    const padding = 0.01;
    return {
      minLat: minLat - padding,
      maxLat: maxLat + padding,
      minLon: minLon - padding,
      maxLon: maxLon + padding,
    };
  }

  /**
   * Check if routing provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${VALHALLA_BASE}/status`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): RoutingCapabilities {
    return {
      modes: ['driving', 'walking', 'cycling'],
      supportsAlternatives: true,
      supportsWaypoints: true,
      supportsAvoidances: false,
      maxWaypoints: 23,
      supportsElevation: true,
    };
  }
}

/**
 * Default routing instance
 */
export const routing = new ValhallaRouting();

/**
 * Quick route function
 */
export async function calculateRoute(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode = 'driving',
  alternatives = false
): Promise<Route[] | null> {
  return routing.route({
    origin,
    destination,
    mode,
    alternatives,
  });
}
