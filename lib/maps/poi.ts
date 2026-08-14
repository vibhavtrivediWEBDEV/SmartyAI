/**
 * POI (Point of Interest) Service - OpenStreetMap Overpass API
 * 
 * Search for nearby places using OpenStreetMap data.
 * Can calculate route distances for proper navigation.
 */

import type {
  POIResult,
  POICategory,
  Coordinate,
  POIProvider,
} from '@/types/maps';
import { calculateRoute } from './routing';

/**
 * Overpass API endpoint
 */
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

/**
 * POI category to OSM tags mapping
 */
const CATEGORY_TAGS: Record<POICategory, Record<string, string[]>> = {
  restaurant: {
    amenity: ['restaurant'],
  },
  cafe: {
    amenity: ['cafe'],
  },
  bar: {
    amenity: ['bar', 'pub'],
  },
  hotel: {
    tourism: ['hotel'],
  },
  hospital: {
    amenity: ['hospital'],
    healthcare: ['hospital'],
  },
  pharmacy: {
    amenity: ['pharmacy'],
  },
  bank: {
    amenity: ['bank'],
  },
  atm: {
    amenity: ['atm'],
  },
  gas_station: {
    amenity: ['fuel', 'gas'],
  },
  charging_station: {
    amenity: ['charging_station'],
  },
  parking: {
    amenity: ['parking'],
  },
  grocery: {
    shop: ['convenience', 'grocery'],
  },
  supermarket: {
    shop: ['supermarket'],
  },
  park: {
    leisure: ['park'],
  },
  tourism: {
    tourism: ['attraction', 'museum', 'artwork', 'viewpoint'],
  },
  attraction: {
    tourism: ['attraction', 'museum', 'theme_park'],
  },
};

/**
 * Build Overpass QL query for category search
 */
function buildOverpassQuery(
  location: Coordinate,
  category: POICategory,
  radius: number,
  limit: number = 20
): string {
  const tags = CATEGORY_TAGS[category];
  if (!tags) {
    throw new Error(`Unknown POI category: ${category}`);
  }

  const conditions: string[] = [];

  // Build tag filters
  for (const [key, values] of Object.entries(tags)) {
    for (const value of values) {
      conditions.push(`["${key}"="${value}"]`);
    }
  }

  // If multiple conditions, use OR
  const tagFilter = conditions.length === 1
    ? conditions[0]
    : `(${conditions.map(c => `n${c};w${c};`).join('')})`;

  const query = `
    [out:json][timeout:25];
    (
      nwr(around:${radius},${location.lat},${location.lon})${tagFilter};
    );
    out ${limit < 100 ? `limit ${limit}` : ''} body;
    out center;
  `;

  return query;
}

/**
 * Calculate straight-line distance between two coordinates (Haversine formula)
 */
function calculateStraightDistance(p1: Coordinate, p2: Coordinate): number {
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

/**
 * POI service using Overpass API
 */
export class OverpassPOI implements POIProvider {
  readonly name = 'overpass';

  /**
   * Search for POIs near a location
   */
  async searchNearby(
    location: Coordinate,
    category: POICategory,
    radius: number,
    limit: number = 20
  ): Promise<POIResult[]> {
    try {
      const query = buildOverpassQuery(location, category, radius, limit);

      const response = await fetch(OVERPASS_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass error: ${response.status}`);
      }

      const data = await response.json();

      const results: POIResult[] = (data.elements || []).map((element: any) => {
        const coords = element.center || element;
        const tags = element.tags || {};

        // Get coordinates (handle ways/relations with center property)
        const coordinates: Coordinate = {
          lat: coords.lat,
          lon: coords.lon,
        };

        // Calculate straight-line distance
        const straightDistance = calculateStraightDistance(location, coordinates);

        return {
          id: `osm-${element.type}-${element.id}`,
          name: tags.name || tags.brand || 'Unknown',
          category,
          coordinates,
          address: this.formatAddress(tags),
          phone: tags.phone,
          website: tags.website,
          openingHours: tags.opening_hours,
          rating: undefined, // OSM doesn't have ratings
          distance: straightDistance,
        };
      });

      // Sort by distance
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return results.slice(0, limit);
    } catch (error) {
      console.error('Overpass POI search error:', error);
      return [];
    }
  }

  /**
   * Search with route calculation (more useful for navigation)
   */
  async searchNearbyWithRoutes(
    location: Coordinate,
    category: POICategory,
    radius: number,
    mode: 'driving' | 'walking' | 'cycling' = 'walking',
    limit: number = 10
  ): Promise<POIResult[]> {
    // First get POIs
    const pois = await this.searchNearby(location, category, radius, limit * 2);

    if (pois.length === 0) {
      return [];
    }

    // Calculate routes to top results (limit to avoid too many requests)
    const topPOIs = pois.slice(0, limit);
    const resultsWithRoutes = await Promise.all(
      topPOIs.map(async (poi) => {
        try {
          const routes = await calculateRoute(location, poi.coordinates, mode, false);
          if (routes && routes.length > 0) {
            const route = routes[0];
            return {
              ...poi,
              travelDistance: route.summary.distance,
              travelTime: route.summary.duration,
            };
          }
          return poi;
        } catch {
          return poi;
        }
      })
    );

    // Sort by travel time (if available)
    resultsWithRoutes.sort((a, b) => {
      if (a.travelTime !== undefined && b.travelTime !== undefined) {
        return a.travelTime - b.travelTime;
      }
      return (a.distance || 0) - (b.distance || 0);
    });

    return resultsWithRoutes;
  }

  /**
   * Format address from OSM tags
   */
  private formatAddress(tags: Record<string, string>): string {
    const parts: string[] = [];
    
    if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }
    if (tags['addr:housenumber']) {
      if (parts.length > 0) {
        parts[0] += ` ${tags['addr:housenumber']}`;
      }
    }
    if (tags['addr:city']) {
      parts.push(tags['addr:city']);
    }
    
    return parts.join(', ') || tags['addr:postcode'] || '';
  }
}

/**
 * Default POI service instance
 */
export const poiService = new OverpassPOI();

/**
 * Quick POI search function
 */
export async function searchNearby(
  location: Coordinate,
  category: POICategory,
  radius: number = 5000,
  limit: number = 10
): Promise<POIResult[]> {
  return poiService.searchNearby(location, category, radius, limit);
}

/**
 * Quick POI search with route calculation
 */
export async function searchNearbyWithRouteInfo(
  location: Coordinate,
  category: POICategory,
  radius: number = 5000,
  mode: 'driving' | 'walking' | 'cycling' = 'walking',
  limit: number = 10
): Promise<POIResult[]> {
  return poiService.searchNearbyWithRoutes(location, category, radius, mode, limit);
}
