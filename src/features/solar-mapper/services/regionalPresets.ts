// src/features/solar-mapper/services/regionalPresets.ts
import { RegionalPreset } from '../types/solarMapper';

export const REGIONAL_PRESETS: RegionalPreset[] = [
  {
    id: 'batangas_calabarzon',
    name: 'Batangas / Calabarzon',
    provinceOrState: 'Batangas',
    country: 'Philippines',
    coordinates: { lat: 14.044, lng: 121.158 },
    elevationM: 180,
    annualRawPsh: 4.88,
    annualEffectivePsh: 4.41,
    worstMonthPsh: 3.75, // August monsoon
    bestMonthPsh: 5.82, // April dry summer peak
    optimalTiltDeg: 12,
    optimalAzimuthDeg: 180,
    monthlyGhi: [4.65, 5.12, 5.75, 5.82, 5.24, 4.62, 4.15, 3.75, 4.22, 4.58, 4.68, 4.45],
    monthlyT2m: [25.8, 26.5, 28.1, 29.8, 30.1, 28.9, 27.8, 27.5, 27.7, 27.6, 27.1, 26.2],
  },
  {
    id: 'metro_manila',
    name: 'Metro Manila (NCR)',
    provinceOrState: 'National Capital Region',
    country: 'Philippines',
    coordinates: { lat: 14.5995, lng: 120.9842 },
    elevationM: 16,
    annualRawPsh: 4.92,
    annualEffectivePsh: 4.43,
    worstMonthPsh: 3.78, // August
    bestMonthPsh: 5.95, // April
    optimalTiltDeg: 12,
    optimalAzimuthDeg: 180,
    monthlyGhi: [4.7, 5.2, 5.85, 5.95, 5.3, 4.55, 4.1, 3.78, 4.15, 4.6, 4.75, 4.5],
    monthlyT2m: [26.5, 27.2, 28.9, 30.8, 31.2, 29.7, 28.5, 28.2, 28.3, 28.4, 27.9, 26.9],
  },
  {
    id: 'cebu_central_visayas',
    name: 'Cebu / Central Visayas',
    provinceOrState: 'Cebu',
    country: 'Philippines',
    coordinates: { lat: 10.3157, lng: 123.8854 },
    elevationM: 28,
    annualRawPsh: 4.98,
    annualEffectivePsh: 4.51,
    worstMonthPsh: 4.12, // January
    bestMonthPsh: 5.78, // April
    optimalTiltDeg: 10,
    optimalAzimuthDeg: 180,
    monthlyGhi: [4.12, 4.75, 5.48, 5.78, 5.45, 5.05, 4.88, 4.95, 4.92, 4.82, 4.65, 4.25],
    monthlyT2m: [27.0, 27.2, 28.1, 29.3, 29.8, 29.1, 28.5, 28.6, 28.5, 28.3, 28.0, 27.4],
  },
  {
    id: 'davao_mindanao',
    name: 'Davao / Southern Mindanao',
    provinceOrState: 'Davao del Sur',
    country: 'Philippines',
    coordinates: { lat: 7.1907, lng: 125.4553 },
    elevationM: 35,
    annualRawPsh: 4.82,
    annualEffectivePsh: 4.39,
    worstMonthPsh: 4.35, // Consistent low-season fluctuation
    bestMonthPsh: 5.38, // March
    optimalTiltDeg: 10,
    optimalAzimuthDeg: 180,
    monthlyGhi: [4.65, 4.92, 5.38, 5.25, 4.95, 4.72, 4.68, 4.75, 4.78, 4.72, 4.65, 4.35],
    monthlyT2m: [27.2, 27.4, 28.0, 28.8, 28.9, 28.3, 27.9, 28.0, 28.1, 28.1, 28.0, 27.5],
  },
  {
    id: 'ilocos_northern_luzon',
    name: 'Ilocos / Northern Luzon',
    provinceOrState: 'Ilocos Norte',
    country: 'Philippines',
    coordinates: { lat: 18.196, lng: 120.5927 },
    elevationM: 20,
    annualRawPsh: 5.25,
    annualEffectivePsh: 4.78,
    worstMonthPsh: 3.65, // August heavy monsoon
    bestMonthPsh: 6.45, // April intense dry season
    optimalTiltDeg: 15,
    optimalAzimuthDeg: 180,
    monthlyGhi: [5.15, 5.75, 6.25, 6.45, 5.82, 4.75, 4.25, 3.65, 4.45, 5.12, 5.25, 4.88],
    monthlyT2m: [25.2, 26.0, 27.8, 29.5, 30.1, 29.2, 28.3, 28.0, 28.2, 28.1, 27.4, 25.8],
  },
  {
    id: 'baguio_cordillera',
    name: 'Baguio / Cordillera High Altitude',
    provinceOrState: 'Benguet',
    country: 'Philippines',
    coordinates: { lat: 16.4023, lng: 120.596 },
    elevationM: 1470,
    annualRawPsh: 4.62,
    annualEffectivePsh: 4.38, // Cooler ambient temps yield lower thermal derating!
    worstMonthPsh: 2.85, // August heavy rain/fog
    bestMonthPsh: 5.92, // March
    optimalTiltDeg: 14,
    optimalAzimuthDeg: 180,
    monthlyGhi: [4.95, 5.42, 5.92, 5.85, 4.95, 3.85, 3.12, 2.85, 3.45, 4.35, 4.85, 4.82],
    monthlyT2m: [18.2, 18.9, 20.2, 21.5, 21.8, 21.0, 20.2, 20.0, 20.1, 20.2, 19.8, 18.9],
  },
];

export const DEFAULT_PRESET = REGIONAL_PRESETS[0]; // Batangas / Calabarzon
