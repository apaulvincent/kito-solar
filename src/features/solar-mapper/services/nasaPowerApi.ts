// src/features/solar-mapper/services/nasaPowerApi.ts
import {
  LocationIrradianceProfile,
  NasaPowerClimatologyResponseSchema,
  RegionalPreset,
} from '../types/solarMapper';
import { buildMonthlyClimateSeries } from '../utils/solarPhysics';
import { DEFAULT_PRESET, REGIONAL_PRESETS } from './regionalPresets';
import { calculateHaversineDistanceMeters } from '../utils/geodesicMath';

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

/**
 * Finds the nearest regional preset to the given coordinates.
 */
export function findNearestRegionalPreset(lat: number, lng: number): RegionalPreset {
  let nearest = DEFAULT_PRESET;
  let minDistance = Infinity;

  for (const preset of REGIONAL_PRESETS) {
    const dist = calculateHaversineDistanceMeters({ lat, lng }, preset.coordinates);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = preset;
    }
  }

  return nearest;
}

/**
 * Creates an irradiance profile from a regional preset.
 */
export function createProfileFromPreset(
  preset: RegionalPreset,
  pitchDeg: number = 15,
  azimuthDeg: number = 180,
  overrideName?: string
): LocationIrradianceProfile {
  return buildMonthlyClimateSeries(
    preset.monthlyGhi,
    preset.monthlyT2m,
    preset.coordinates.lat,
    pitchDeg,
    azimuthDeg,
    overrideName || `${preset.name}, ${preset.country}`,
    'regional_fallback',
    preset.coordinates.lng
  );
}

/**
 * Fetches 20-year climatology solar irradiance & temperature from NASA POWER API.
 * Returns parsed profile or falls back to the nearest regional preset.
 */
export async function fetchNasaPowerIrradiance({
  lat,
  lng,
  pitchDeg = 15,
  azimuthDeg = 180,
  locationName = 'Selected Location',
  signal,
}: {
  lat: number;
  lng: number;
  pitchDeg?: number;
  azimuthDeg?: number;
  locationName?: string;
  signal?: AbortSignal;
}): Promise<LocationIrradianceProfile> {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;

  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,T2M,SI_EF_OPTIMAL_ANG&community=RE&longitude=${roundedLng}&latitude=${roundedLat}&format=JSON`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const onExternalAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onExternalAbort);
    }

    const response = await fetch(url, {
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

    if (!response.ok) {
      throw new Error(`NASA POWER API HTTP ${response.status}`);
    }

    const rawData = await response.json();
    const parsed = NasaPowerClimatologyResponseSchema.safeParse(rawData);

    if (!parsed.success) {
      throw new Error('Invalid NASA POWER API JSON schema');
    }

    const ghiParams = parsed.data.properties.parameter.ALLSKY_SFC_SW_DWN ?? {};
    const t2mParams = parsed.data.properties.parameter.T2M ?? {};

    const monthlyGhi: number[] = [];
    const monthlyT2m: number[] = [];

    for (const k of MONTH_KEYS) {
      const valGhi = ghiParams[k];
      const valT2m = t2mParams[k];

      // -999 or undefined indicates missing/ocean fill
      if (typeof valGhi === 'number' && valGhi > 0 && valGhi < 15) {
        monthlyGhi.push(Math.round(valGhi * 100) / 100);
      } else {
        throw new Error(`Invalid GHI data point for ${k}`);
      }

      if (typeof valT2m === 'number' && valT2m > -50 && valT2m < 60) {
        monthlyT2m.push(Math.round(valT2m * 10) / 10);
      } else {
        monthlyT2m.push(28); // Standard tropical ambient fallback
      }
    }

    return buildMonthlyClimateSeries(
      monthlyGhi,
      monthlyT2m,
      roundedLat,
      pitchDeg,
      azimuthDeg,
      locationName,
      'nasa_power',
      roundedLng
    );
  } catch (_err) {
    // Graceful offline fallback to nearest regional preset
    const nearestPreset = findNearestRegionalPreset(lat, lng);
    return createProfileFromPreset(nearestPreset, pitchDeg, azimuthDeg, locationName);
  }
}
