// src/features/solar-mapper/services/geocodingService.ts
import { GeoPoint } from '../types/solarMapper';
import { REGIONAL_PRESETS } from './regionalPresets';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  shortName: string;
  coordinates: GeoPoint;
}

/**
 * Searches locations using OpenStreetMap Nominatim with fallback to local presets.
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Check matching local presets first for instant results
  const lower = trimmed.toLowerCase();
  const matchedPresets = REGIONAL_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.provinceOrState.toLowerCase().includes(lower)
  ).map((p) => ({
    placeId: `preset-${p.id}`,
    displayName: `${p.name}, ${p.provinceOrState}, ${p.country}`,
    shortName: p.name,
    coordinates: p.coordinates,
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const onExternalAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onExternalAbort);
    }

    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=5&addressdetails=1`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }

    if (!res.ok) {
      return matchedPresets;
    }

    const data = await res.json();
    if (!Array.isArray(data)) return matchedPresets;

    const remoteResults: GeocodingResult[] = data.map((item: any) => {
      const parts = (item.display_name || '').split(',');
      const short = parts.slice(0, 2).join(',').trim() || item.display_name;
      return {
        placeId: String(item.place_id || `${item.lat}_${item.lon}`),
        displayName: item.display_name,
        shortName: short,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };
    });

    // Merge without duplicates
    const combined = [...matchedPresets];
    for (const remote of remoteResults) {
      if (!combined.some((c) => Math.abs(c.coordinates.lat - remote.coordinates.lat) < 0.005 && Math.abs(c.coordinates.lng - remote.coordinates.lng) < 0.005)) {
        combined.push(remote);
      }
    }

    return combined.slice(0, 6);
  } catch (_e) {
    return matchedPresets;
  }
}
