/**
 * Geocoding Service - OpenStreetMap Nominatim Provider
 * 
 * Production-ready geocoding using OpenStreetMap Nominatim API.
 * Can be swapped with other providers (Google, Mapbox, etc.)
 * 
 * Rate limits: Max 1 request per second (Nominatim policy)
 */

import type {
  GeocodedLocation,
  GeocodingResult,
  GeocodingProvider,
  Coordinate,
} from '@/types/maps';

/**
 * Nominatim API endpoints
 */
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Rate limiting for Nominatim (max 1 req/sec)
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

/**
 * Delay execution to respect rate limits
 */
async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

/**
 * Geocoding provider using OpenStreetMap Nominatim
 */
export class NominatimGeocoding implements GeocodingProvider {
  readonly name = 'nominatim';

  /**
   * Geocode a text query to coordinates
   */
  async geocode(query: string): Promise<GeocodingResult> {
    await respectRateLimit();

    try {
      const url = new URL(`${NOMINATIM_BASE}/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '10');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('extratags', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'SmartyAI-Maps/1.0 (contact@smarty-ai.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const data = await response.json();

      const locations: GeocodedLocation[] = data.map((item: any) => ({
        id: `osm-${item.osm_id || '-'}`,
        name: item.display_name.split(',')[0],
        displayName: item.display_name,
        address: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        },
        bbox: item.boundingbox
          ? {
              minLat: parseFloat(item.boundingbox[0]),
              maxLat: parseFloat(item.boundingbox[1]),
              minLon: parseFloat(item.boundingbox[2]),
              maxLon: parseFloat(item.boundingbox[3]),
            }
          : undefined,
        type: item.type,
        importance: item.importance,
      }));

      return {
        success: true,
        locations,
        provider: this.name,
        query,
      };
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return {
        success: false,
        locations: [],
        provider: this.name,
        query,
      };
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinate: Coordinate): Promise<GeocodedLocation | null> {
    await respectRateLimit();

    try {
      const url = new URL(`${NOMINATIM_BASE}/reverse`);
      url.searchParams.set('lat', coordinate.lat.toString());
      url.searchParams.set('lon', coordinate.lon.toString());
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'SmartyAI-Maps/1.0 (contact@smarty-ai.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        return null;
      }

      return {
        id: `osm-${data.osm_id || '-'}`,
        name: data.display_name?.split(',')[0] || 'Unknown Location',
        displayName: data.display_name || '',
        address: data.display_name || '',
        coordinates: {
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
        },
        type: data.type,
      };
    } catch (error) {
      console.error('Nominatim reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async suggest(query: string, near?: Coordinate): Promise<GeocodedLocation[]> {
    await respectRateLimit();

    try {
      const url = new URL(`${NOMINATIM_BASE}/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');

      // Prioritize results near a location
      if (near) {
        // Use viewbox to prioritize nearby results
        const offset = 0.5; // ~50km radius
        url.searchParams.set('viewbox', [
          near.lon - offset,
          near.lat - offset,
          near.lon + offset,
          near.lat + offset,
        ].join(','));
        url.searchParams.set('bounded', '0'); // Include results outside viewbox too
      }

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'SmartyAI-Maps/1.0 (contact@smarty-ai.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.map((item: any) => ({
        id: `osm-${item.osm_id || '-'}`,
        name: item.display_name.split(',')[0],
        displayName: item.display_name,
        address: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        },
        importance: item.importance,
      }));
    } catch (error) {
      console.error('Nominatim suggest error:', error);
      return [];
    }
  }
}

/**
 * Default geocoding instance
 */
export const geocoding = new NominatimGeocoding();

/**
 * Quick geocode function
 */
export async function geocode(query: string): Promise<GeocodingResult> {
  return geocoding.geocode(query);
}

/**
 * Quick reverse geocode function
 */
export async function reverseGeocode(coord: Coordinate): Promise<GeocodedLocation | null> {
  return geocoding.reverseGeocode(coord);
}
