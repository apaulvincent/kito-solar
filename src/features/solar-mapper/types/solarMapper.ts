import { z } from 'zod';

export type IrradianceSource = 'nasa_power' | 'pvgis_v52' | 'regional_fallback';
export type PshDesignBasis = 'annual_avg' | 'p25_conservative' | 'worst_month';
export type PanelOrientation = 'portrait' | 'landscape' | 'auto_best';
export type BasemapProvider = 'google_satellite' | 'google_hybrid' | 'esri_satellite' | 'osm_streets';

export interface MonthlyClimatePoint {
  monthIndex: number; // 0 = Jan, 11 = Dec
  monthLabel: string;
  rawGhiKwhM2: number; // kWh/m2/day
  tiltedPoaKwhM2: number;
  ambientTempC: number;
  estimatedCellTempC: number;
  tempDeratingFactor: number;
  effectivePsh: number;
}

export interface LocationIrradianceProfile {
  latitude: number;
  longitude: number;
  locationName: string;
  source: IrradianceSource;
  fetchedAtIso: string;
  optimalTiltDeg: number;
  optimalAzimuthDeg: number; // 180 = South in Northern Hemisphere
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
  x: number; // relative to local centroid (meters)
  y: number;
  widthM: number;
  lengthM: number;
  orientation: 'portrait' | 'landscape';
  rotationDeg?: number;
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
  sideIndex: number;
  name: string;
  shortName: string;
  cardinalDir: 'South' | 'East' | 'North' | 'West';
  azimuthDeg: number; // Downslope compass heading
  lengthM: number;
  startMeters: LocalPoint;
  endMeters: LocalPoint;
  midpointMeters: LocalPoint;
}

export interface RoofPolygonSection {
  id: string;
  name: string;
  vertices: GeoPoint[];
  pitchDeg: number; // 0 to 45 deg
  azimuthDeg: number; // 0 = N, 90 = E, 180 = S, 270 = W
  rollDeg?: number; // -45 to +45 deg secondary roll tilt
  baseHeightMeters?: number; // elevation above ground (m), default 4.0
  pivotEdgeIndex?: number;
  shadingLossPercent: number;
  setbackRatio: number; // default 0.82 (18% walkway/edge clearance)
  panelOrientation: PanelOrientation;
  panelWattage: 550 | 580 | 600;
  customPanelWidthM?: number;
  customPanelLengthM?: number;
  customPanelWattage?: number;
  panelRotationDeg?: number; // auto-aligns to longest edge when undefined
  hasCustomAzimuth?: boolean;
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
  defaultAddress?: string;
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
  monthlyGhi: number[]; // 12 monthly values
  monthlyT2m: number[]; // 12 monthly values (deg C)
}

export const NasaPowerClimatologyResponseSchema = z.object({
  properties: z.object({
    parameter: z.object({
      ALLSKY_SFC_SW_DWN: z.record(z.string(), z.number()).optional(),
      T2M: z.record(z.string(), z.number()).optional(),
      SI_EF_OPTIMAL_ANG: z.record(z.string(), z.number()).optional(),
    }),
  }),
  header: z
    .object({
      title: z.string().optional(),
    })
    .optional(),
});

export type NasaPowerClimatologyResponse = z.infer<typeof NasaPowerClimatologyResponseSchema>;
