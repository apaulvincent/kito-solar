// src/features/solar-mapper/utils/panelPackingEngine.ts
import { LocalPoint, PANEL_SPECS, PanelOrientation, PlacedPanel } from '../types/solarMapper';
import { degToRad } from './geodesicMath';

const CLAMP_GAP_METERS = 0.02; // 20mm mid/end clamp spacing

/**
 * Standard ray-casting point-in-polygon test.
 */
export function isPointInPolygon(point: LocalPoint, polygon: LocalPoint[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Scales polygon vertices inward towards centroid by a setback ratio (0.5 to 0.95).
 */
export function insetPolygon(polygon: LocalPoint[], setbackRatio: number): LocalPoint[] {
  if (polygon.length === 0) return [];
  const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
  const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;

  const scale = Math.sqrt(Math.max(0.2, Math.min(0.98, setbackRatio)));
  return polygon.map((p) => ({
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale,
  }));
}

export interface PackingResult {
  maxPanelsPortrait: number;
  maxPanelsLandscape: number;
  recommendedOrientation: 'portrait' | 'landscape';
  recommendedMaxPanels: number;
  placedPanels: PlacedPanel[];
  usableAreaSqm: number;
  totalArrayKwp: number;
}

/**
 * Computes maximum panel packing in portrait and landscape layouts,
 * generates exact 2D/3D panel center coordinates within setback boundaries.
 */
export function calculatePanelPacking({
  localVertices,
  slopedAreaSqm,
  pitchDeg,
  setbackRatio = 0.82,
  panelWattage = 580,
  orientationPreference = 'auto_best',
}: {
  localVertices: LocalPoint[];
  slopedAreaSqm: number;
  pitchDeg: number;
  setbackRatio?: number;
  panelWattage?: 550 | 580 | 600;
  orientationPreference?: PanelOrientation;
}): PackingResult {
  const spec = PANEL_SPECS[panelWattage] ?? PANEL_SPECS[580];
  const usableAreaSqm = Math.round(slopedAreaSqm * setbackRatio * 100) / 100;

  if (localVertices.length < 3 || usableAreaSqm <= 0) {
    return {
      maxPanelsPortrait: 0,
      maxPanelsLandscape: 0,
      recommendedOrientation: 'portrait',
      recommendedMaxPanels: 0,
      placedPanels: [],
      usableAreaSqm: 0,
      totalArrayKwp: 0,
    };
  }

  const inPolygon = insetPolygon(localVertices, setbackRatio);

  let inMinX = Infinity;
  let inMaxX = -Infinity;
  let inMinY = Infinity;
  let inMaxY = -Infinity;

  for (const v of inPolygon) {
    if (v.x < inMinX) inMinX = v.x;
    if (v.x > inMaxX) inMaxX = v.x;
    if (v.y < inMinY) inMinY = v.y;
    if (v.y > inMaxY) inMaxY = v.y;
  }

  // Helper to pack grid in a specific orientation
  const packGrid = (isLandscape: boolean): PlacedPanel[] => {
    const widthM = isLandscape ? spec.lengthM : spec.widthM;
    const lengthM = isLandscape ? spec.widthM : spec.lengthM;

    const cellW = widthM + CLAMP_GAP_METERS;
    // Scale slope length along Y by cos(pitch)
    const cosPitch = Math.cos(degToRad(Math.min(55, Math.max(0, pitchDeg))));
    const effectiveLengthM = lengthM / Math.max(0.1, cosPitch);
    const cellH = effectiveLengthM + CLAMP_GAP_METERS;

    const spanX = inMaxX - inMinX;
    const spanY = inMaxY - inMinY;

    if (spanX < cellW || spanY < cellH) return [];

    const cols = Math.max(1, Math.floor(spanX / cellW));
    const rows = Math.max(1, Math.floor(spanY / cellH));

    const startX = inMinX + (spanX - cols * cellW) / 2 + cellW / 2;
    const startY = inMinY + (spanY - rows * cellH) / 2 + cellH / 2;

    const panels: PlacedPanel[] = [];
    let panelIdCounter = 1;

    for (let r = 0; r < rows; r++) {
      const y = startY + r * cellH;
      for (let c = 0; c < cols; c++) {
        const x = startX + c * cellW;
        // Test corners and center inside inset boundary
        const center = { x, y };
        const c1 = { x: x - widthM * 0.45, y: y - effectiveLengthM * 0.45 };
        const c2 = { x: x + widthM * 0.45, y: y - effectiveLengthM * 0.45 };
        const c3 = { x: x - widthM * 0.45, y: y + effectiveLengthM * 0.45 };
        const c4 = { x: x + widthM * 0.45, y: y + effectiveLengthM * 0.45 };

        if (
          isPointInPolygon(center, inPolygon) &&
          isPointInPolygon(c1, inPolygon) &&
          isPointInPolygon(c2, inPolygon) &&
          isPointInPolygon(c3, inPolygon) &&
          isPointInPolygon(c4, inPolygon)
        ) {
          panels.push({
            id: `p-${panelIdCounter++}`,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            widthM,
            lengthM,
            orientation: isLandscape ? 'landscape' : 'portrait',
          });
        }
      }
    }

    return panels;
  };

  const portraitPanels = packGrid(false);
  const landscapePanels = packGrid(true);

  // Area-based theoretical limits with clamp gap
  const panelGrossArea = (spec.widthM + CLAMP_GAP_METERS) * (spec.lengthM + CLAMP_GAP_METERS);
  const areaBasedMax = Math.floor(usableAreaSqm / panelGrossArea);

  // Take the geometric grid placement, with area-based upper bound
  const maxPanelsPortrait = Math.min(areaBasedMax, portraitPanels.length);
  const maxPanelsLandscape = Math.min(areaBasedMax, landscapePanels.length);

  let chosenOrientation: 'portrait' | 'landscape';
  let chosenPanels: PlacedPanel[];

  if (orientationPreference === 'landscape') {
    chosenOrientation = 'landscape';
    chosenPanels = landscapePanels;
  } else if (orientationPreference === 'portrait') {
    chosenOrientation = 'portrait';
    chosenPanels = portraitPanels;
  } else {
    // auto_best picks orientation that packs more panels
    if (landscapePanels.length > portraitPanels.length) {
      chosenOrientation = 'landscape';
      chosenPanels = landscapePanels;
    } else {
      chosenOrientation = 'portrait';
      chosenPanels = portraitPanels;
    }
  }

  const recommendedMaxPanels = Math.min(areaBasedMax, chosenPanels.length);
  const totalArrayKwp = Math.round(((recommendedMaxPanels * spec.wattage) / 1000) * 100) / 100;

  return {
    maxPanelsPortrait,
    maxPanelsLandscape,
    recommendedOrientation: chosenOrientation,
    recommendedMaxPanels,
    placedPanels: chosenPanels.slice(0, recommendedMaxPanels),
    usableAreaSqm,
    totalArrayKwp,
  };
}
