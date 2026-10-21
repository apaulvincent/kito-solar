// src/features/solar-mapper/types/solarMapper.ts
import { z } from 'zod';

export type IrradianceSource = 'nasa_power' | 'pvgis_v52' | 'regional_fallback';
export type PshDesignBasis = 'annual_avg' | 'p25_conservative' | 'worst_month';
export type PanelOrientation = 'portrait' | 'landscape' | 'auto_best';

export interface MonthlyClimatePoint {
  monthIndex: number; // 0 = Jan, 11 = Dec
  monthLabel: string; // 'Jan', 'Feb', ...
  rawGhiKwhM2: number; // Global Horizontal Irradiance (kWh/m²/day = raw PSH)
  tiltedPoaKwhM2: number; // Plane of Array tilted irradiance
  ambientTempC: number; // T2M (°C)
  estimatedCellTempC: number; // Operating cell temperature
  tempDeratingFactor: number; // e.g. 0.89 (-11% loss)
  effectivePsh: number; // Tilted POA * tempDeratingFactor * orientationFactor
}

export interface LocationIrradianceProfile {
  latitude: number;
  longitude: number;
  locationName: string;
  source: IrradianceSource;
  fetchedAtIso: string;
  optimalTiltDeg: number;
  optimalAzimuthDeg: number; // 180° = South in Northern Hemisphere
  annualAvgRawPsh: number;
  annualAvgEffectivePsh: number;
  worstMonth: {
    monthLabel: string;
    rawPsh: number;
    effectivePsh: number;
  };
  bestMonth: {
    monthLabel: string;
    rawPsh: number;
    effectivePsh: number;
  };
  p25EffectivePsh: number;
  monthlySeries: MonthlyClimatePoint[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocalPoint {
  x: number;
  y: number;
}

export interface PlacedPanel {
  id: string;
  x: number; // center relative to local polygon centroid (meters)
  y: number;
  widthM: number;
  lengthM: number;
  orientation: 'portrait' | 'landscape';
  rotationDeg?: number; // rotation in degrees relative to local axes
}

export interface PanelSpec {
  wattage: 550 | 580 | 600;
  widthM: number;
  lengthM: number;
  areaSqm: number;
  label: string;
}

export const PANEL_SPECS: Record<550 | 580 | 600, PanelSpec> = {
  550: {
    wattage: 550,
    widthM: 1.134,
    lengthM: 2.278,
    areaSqm: 2.583,
    label: '550W Mono PERC (2.28m × 1.13m)',
  },
  580: {
    wattage: 580,
    widthM: 1.134,
    lengthM: 2.278,
    areaSqm: 2.583,
    label: '580W N-Type TOPCon (2.28m × 1.13m)',
  },
  600: {
    wattage: 600,
    widthM: 1.303,
    lengthM: 2.384,
    areaSqm: 3.106,
    label: '600W Large Format (2.38m × 1.30m)',
  },
};

export interface OuterTiltSide {
  sideIndex: number; // 0, 1, 2, 3
  name: string; // 'Side 1 (South / Eave)', etc.
  shortName: string; // 'Side 1', 'Side 2', 'Side 3', 'Side 4'
  cardinalDir: 'South' | 'East' | 'North' | 'West';
  azimuthDeg: number; // Downslope compass heading (e.g. 180°, 90°, 0°, 270°)
  lengthM: number;
  startMeters: LocalPoint;
  endMeters: LocalPoint;
  midpointMeters: LocalPoint;
}

export interface RoofPolygonSection {
  id: string;
  name: string;
  vertices: GeoPoint[];
  pitchDeg: number; // 0° to 45°
  azimuthDeg: number; // 0° = N, 90° = E, 180° = S, 270° = W
  rollDeg?: number; // -45° to +45° secondary roll tilt (default 0)
  baseHeightMeters?: number; // Optional elevation above ground in meters (default 4.0)
  pivotEdgeIndex?: number; // 0-based index of polygon edge acting as rotation/hinge axis
  shadingLossPercent: number; // 0% to 50%
  setbackRatio: number; // default 0.82 (18% reserved for edges & walkways)
  panelOrientation: PanelOrientation;
  panelWattage: 550 | 580 | 600;
  panelRotationDeg?: number; // Custom panel alignment angle in degrees (auto-aligns to roof edge if undefined)
  // Computed metrics
  flatAreaSqm: number;
  slopedAreaSqm: number;
  usableAreaSqm: number;
  edgeLengthsMeters: number[];
  maxPanelsPortrait: number;
  maxPanelsLandscape: number;
  recommendedMaxPanels: number;
  placedPanels: PlacedPanel[];
  maxArrayKwp: number;
  orientationYieldFactor: number;
  estimatedDailyKwh: number;
  hasBowtieCross: boolean;
}

export interface DetectedRoofFace {
  name: string;
  vertices: GeoPoint[];
  pitchDeg: number;
  azimuthDeg: number;
  shadingLossPercent?: number;
  confidence?: number;
}

export interface MarqueeBoundingBox {
  northWest: GeoPoint;
  southEast: GeoPoint;
  widthMeters: number;
  lengthMeters: number;
  areaSqm: number;
}

export interface RoofMappingSummary {
  sections: RoofPolygonSection[];
  totalFlatAreaSqm: number;
  totalSlopedAreaSqm: number;
  totalUsableAreaSqm: number;
  totalMaxPanels: number;
  totalMaxKwp: number;
  totalEstimatedDailyKwh: number;
  weightedEffectivePsh: number;
}

export interface RegionalPreset {
  id: string;
  name: string;
  provinceOrState: string;
  country: string;
  coordinates: GeoPoint;
  elevationM: number;
  annualRawPsh: number;
  annualEffectivePsh: number;
  worstMonthPsh: number;
  bestMonthPsh: number;
  optimalTiltDeg: number;
  optimalAzimuthDeg: number;
  monthlyGhi: number[]; // 12 values
  monthlyT2m: number[]; // 12 values (°C)
}

// Zod schemas for NASA POWER Climatology API
export const NasaPowerClimatologyResponseSchema = z.object({
  properties: z.object({
    parameter: z.object({
      ALLSKY_SFC_SW_DWN: z.record(z.string(), z.number()).optional(),
      T2M: z.record(z.string(), z.number()).optional(),
      SI_EF_OPTIMAL_ANG: z.record(z.string(), z.number()).optional(),
    }),
  }),
  header: z.object({
    title: z.string().optional(),
  }).optional(),
});

export type NasaPowerClimatologyResponse = z.infer<typeof NasaPowerClimatologyResponseSchema>;
