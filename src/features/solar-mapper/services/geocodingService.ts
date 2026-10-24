// src/features/solar-mapper/services/geocodingService.ts
import { GeoPoint } from '../types/solarMapper';
import { REGIONAL_PRESETS } from './regionalPresets';
import { PHILIPPINE_POPULAR_LOCATIONS } from './philippineLocations';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  coordinates: GeoPoint;
  isPhilippine?: boolean;
  regionOrProvince?: string;
}

/**
 * Checks if coordinates fall within the Philippine territorial / EEZ bounding box.
 * Lat: 4.4°N to 21.6°N, Lng: 116.4°E to 127.2°E.
 */
export function isWithinPhilippineBounds(lat: number, lng: number): boolean {
  return lat >= 4.4 && lat <= 21.6 && lng >= 116.4 && lng <= 127.2;
}

/**
 * Parses user input for direct latitude / longitude coordinates.
 */
function parseCoordinateQuery(query: string): GeocodingResult | null {
  const coordRegex = /^([-+]?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*([-+]?\d{1,3}(?:\.\d+)?)$/;
  const match = query.trim().match(coordRegex);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const isPh = isWithinPhilippineBounds(lat, lng);
  return {
    placeId: `coord-${lat.toFixed(5)}_${lng.toFixed(5)}`,
    displayName: `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E ${isPh ? '• Philippines' : '• Custom Coordinates'}`,
    shortName: `Coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
    coordinates: { lat, lng },
    isPhilippine: isPh,
    regionOrProvince: isPh ? 'Philippine Coordinates' : 'Custom Coordinates',
  };
}

/**
 * Formats a clean short name from OpenStreetMap address details.
 * Prioritizes Barangay, Suburb, Road, and City/Municipality in the Philippines.
 */
function formatPhilippineShortName(item: any): string {
  const addr = item.address || {};
  const locality = addr.city || addr.town || addr.municipality || addr.city_district || '';
  const subLocality = addr.quarter || addr.suburb || addr.village || addr.neighbourhood || '';
  const road = addr.road || addr.pedestrian || addr.building || '';

  if (road && locality) {
    return `${road}, ${locality}`;
  }
  if (subLocality && locality && subLocality !== locality) {
    return `${subLocality}, ${locality}`;
  }
  if (locality) {
    const province = addr.province || addr.state || '';
    return province && province !== locality ? `${locality}, ${province}` : locality;
  }

  // Fallback to first two segments of display_name
  const parts = (item.display_name || '').split(',');
  return parts.slice(0, 2).join(',').trim() || item.display_name;
}

/**
 * Searches locations with strict prioritization for the Philippines (PH).
 * Queries OpenStreetMap Nominatim with countrycodes=ph, accompanied by instant local PH presets.
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Direct coordinate check
  const coordResult = parseCoordinateQuery(trimmed);
  if (coordResult) {
    return [coordResult];
  }

  const lower = trimmed.toLowerCase();

  // 2. Instant matching against curated Philippine cities & business hubs
  const matchedPhHubs: GeocodingResult[] = PHILIPPINE_POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lower) ||
      loc.provinceOrRegion.toLowerCase().includes(lower) ||
      loc.aliases?.some((alias) => alias.toLowerCase().includes(lower) || lower.includes(alias.toLowerCase()))
  ).map((loc) => ({
    placeId: `hub-${loc.id}`,
    displayName: `${loc.name}, ${loc.provinceOrRegion}, Philippines`,
    shortName: loc.name,
    coordinates: loc.coordinates,
    isPhilippine: true,
    regionOrProvince: loc.provinceOrRegion,
  }));

  // 3. Match against regional presets (Batangas, Manila, Cebu, Davao, etc.)
  const matchedPresets: GeocodingResult[] = REGIONAL_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.provinceOrState.toLowerCase().includes(lower)
  ).map((p) => ({
    placeId: `preset-${p.id}`,
    displayName: `${p.name}, ${p.provinceOrState}, ${p.country}`,
    shortName: p.name,
    coordinates: p.coordinates,
    isPhilippine: true,
    regionOrProvince: p.provinceOrState,
  }));

  // Merge local PH suggestions (de-duplicated)
  const localSuggestions: GeocodingResult[] = [];
  for (const item of [...matchedPhHubs, ...matchedPresets]) {
    if (
      !localSuggestions.some(
        (existing) =>
          Math.abs(existing.coordinates.lat - item.coordinates.lat) < 0.02 &&
          Math.abs(existing.coordinates.lng - item.coordinates.lng) < 0.02
      )
    ) {
      localSuggestions.push(item);
    }
  }

  // 4. Remote geocoding: Query OpenStreetMap Nominatim prioritizing the Philippines
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const onExternalAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onExternalAbort);
    }

    // Use countrycodes=ph to strictly prioritize Philippine results
    const phEndpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&countrycodes=ph&limit=8&addressdetails=1`;

    const res = await fetch(phEndpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KitoSolar-PH-Solar-CAD/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }

    let remoteResults: GeocodingResult[] = [];

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        remoteResults = data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const isPh = isWithinPhilippineBounds(lat, lng) || item.address?.country_code === 'ph';
          const short = formatPhilippineShortName(item);

          return {
            placeId: String(item.place_id || `${item.lat}_${item.lon}`),
            displayName: item.display_name,
            shortName: short,
            coordinates: { lat, lng },
            isPhilippine: isPh,
            regionOrProvince: item.address?.province || item.address?.state || 'Philippines',
          };
        });
      }
    }

    // If no PH-specific results returned and query is long, try fallback with ", Philippines" appended
    if (remoteResults.length === 0 && trimmed.length >= 3 && !trimmed.toLowerCase().includes('philippines')) {
      try {
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            `${trimmed}, Philippines`
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'KitoSolar-PH-Solar-CAD/1.0',
            },
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            remoteResults = fallbackData.map((item: any) => ({
              placeId: String(item.place_id || `${item.lat}_${item.lon}`),
              displayName: item.display_name,
              shortName: formatPhilippineShortName(item),
              coordinates: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              },
              isPhilippine: true,
              regionOrProvince: item.address?.province || item.address?.state || 'Philippines',
            }));
          }
        }
      } catch (_fbErr) {
        // Fallback silently ignores errors
      }
    }

    // 5. Combine results: Specific remote addresses first, followed by local hubs
    const combined: GeocodingResult[] = [];

    for (const remote of remoteResults) {
      if (
        !combined.some(
          (c) =>
            Math.abs(c.coordinates.lat - remote.coordinates.lat) < 0.001 &&
            Math.abs(c.coordinates.lng - remote.coordinates.lng) < 0.001
        )
      ) {
        combined.push(remote);
      }
    }

    for (const local of localSuggestions) {
      if (
        !combined.some(
          (c) =>
            c.shortName.toLowerCase() === local.shortName.toLowerCase() ||
            (Math.abs(c.coordinates.lat - local.coordinates.lat) < 0.005 &&
              Math.abs(c.coordinates.lng - local.coordinates.lng) < 0.005)
        )
      ) {
        combined.push(local);
      }
    }

    // Sort: Ensure Philippine entries are strictly at the top
    combined.sort((a, b) => {
      const aPh = a.isPhilippine ? 1 : 0;
      const bPh = b.isPhilippine ? 1 : 0;
      return bPh - aPh;
    });

    return combined.slice(0, 8);
  } catch (_e) {
    return localSuggestions.slice(0, 8);
  }
}
