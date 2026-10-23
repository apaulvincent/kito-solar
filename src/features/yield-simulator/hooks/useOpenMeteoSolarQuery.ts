// src/features/yield-simulator/hooks/useOpenMeteoSolarQuery.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { OpenMeteoForecastResponse } from '../types/yieldSimulator';

const OpenMeteoSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().default('Asia/Manila'),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number().nullable()).transform((arr) =>
      arr.map((v) => (v === null || !Number.isFinite(v) ? 28 : v))
    ),
    cloud_cover: z.array(z.number().nullable()).transform((arr) =>
      arr.map((v) => (v === null || !Number.isFinite(v) ? 25 : v))
    ),
    shortwave_radiation: z.array(z.number().nullable()).transform((arr) =>
      arr.map((v) => (v === null || !Number.isFinite(v) ? 0 : Math.max(0, v)))
    ),
    direct_normal_irradiance: z.array(z.number().nullable()).transform((arr) =>
      arr.map((v) => (v === null || !Number.isFinite(v) ? 0 : Math.max(0, v)))
    ),
    diffuse_radiation: z.array(z.number().nullable()).transform((arr) =>
      arr.map((v) => (v === null || !Number.isFinite(v) ? 0 : Math.max(0, v)))
    ),
  }),
});

export async function fetchOpenMeteoSolarRadiation(
  lat: number,
  lon: number
): Promise<OpenMeteoForecastResponse> {
  const safeLat = Number(lat.toFixed(4));
  const safeLon = Number(lon.toFixed(4));
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${safeLat}&longitude=${safeLon}&hourly=temperature_2m,cloud_cover,shortwave_radiation,direct_normal_irradiance,diffuse_radiation&timezone=auto&forecast_days=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Open-Meteo solar telemetry request failed (HTTP ${response.status})`
    );
  }
  const rawJson = await response.json();
  return OpenMeteoSchema.parse(rawJson);
}

export function useOpenMeteoSolarQuery(
  lat: number,
  lon: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['open-meteo-solar', Number(lat.toFixed(3)), Number(lon.toFixed(3))],
    queryFn: () => fetchOpenMeteoSolarRadiation(lat, lon),
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes cache per PRD
    retry: 1,
  });
}
