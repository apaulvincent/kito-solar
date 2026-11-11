import { LocalPoint, PANEL_SPECS, PanelOrientation, PlacedPanel } from '../types/solarMapper';
import { degToRad, findDominantEdgeAngle } from './geometryAngles';

export { findDominantEdgeAngle };

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
  dominantAngleDeg: number;
}

/**
 * Computes maximum panel packing in portrait and landscape layouts,
 * generates exact 2D/3D panel center coordinates within setback boundaries,
 * aligned with the roof's dominant edge / eave direction.
 */
export function calculatePanelPacking({
  localVertices,
  slopedAreaSqm,
  pitchDeg,
  setbackRatio = 0.82,
  panelWattage = 580,
  orientationPreference = 'auto_best',
  alignmentAngleDeg,
  customWidthM,
  customLengthM,
  customWattage,
}: {
  localVertices: LocalPoint[];
  slopedAreaSqm: number;
  pitchDeg: number;
  setbackRatio?: number;
  panelWattage?: 550 | 580 | 600 | number;
  orientationPreference?: PanelOrientation;
  alignmentAngleDeg?: number;
  customWidthM?: number;
  customLengthM?: number;
  customWattage?: number;
}): PackingResult {
  const fallbackSpec = PANEL_SPECS[(panelWattage as 550 | 580 | 600)] ?? PANEL_SPECS[580];
  const effectiveWidthM = customWidthM && customWidthM > 0.1 ? customWidthM : fallbackSpec.widthM;
  const effectiveLengthM = customLengthM && customLengthM > 0.1 ? customLengthM : fallbackSpec.lengthM;
  const effectiveWattage = customWattage && customWattage > 0 ? customWattage : (panelWattage ?? fallbackSpec.wattage);
  const usableAreaSqm = Math.round(slopedAreaSqm * setbackRatio * 100) / 100;

  const dominantAngleDeg =
    alignmentAngleDeg !== undefined
      ? alignmentAngleDeg
      : findDominantEdgeAngle(localVertices);

  if (localVertices.length < 3 || usableAreaSqm <= 0) {
    return {
      maxPanelsPortrait: 0,
      maxPanelsLandscape: 0,
      recommendedOrientation: 'portrait',
      recommendedMaxPanels: 0,
      placedPanels: [],
      usableAreaSqm: 0,
      totalArrayKwp: 0,
      dominantAngleDeg,
    };
  }

  const inPolygon = insetPolygon(localVertices, setbackRatio);

  const thetaRad = degToRad(dominantAngleDeg);
  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);

  // Transform inset polygon vertices to rotated (u, v) space along dominant edge
  const inPolygonRot: LocalPoint[] = inPolygon.map((p) => ({
    x: p.x * cosTheta + p.y * sinTheta,
    y: -p.x * sinTheta + p.y * cosTheta,
  }));

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (const v of inPolygonRot) {
    if (v.x < minU) minU = v.x;
    if (v.x > maxU) maxU = v.x;
    if (v.y < minV) minV = v.y;
    if (v.y > maxV) maxV = v.y;
  }

  // Helper to pack grid in a specific orientation in rotated (u, v) space
  const packGrid = (isLandscape: boolean): PlacedPanel[] => {
    const widthM = isLandscape ? effectiveLengthM : effectiveWidthM;
    const lengthM = isLandscape ? effectiveWidthM : effectiveLengthM;

    const cellW = widthM + CLAMP_GAP_METERS;
    const cellH = lengthM + CLAMP_GAP_METERS;

    const spanU = maxU - minU;
    const spanV = maxV - minV;

    if (spanU < cellW || spanV < cellH) return [];

    const cols = Math.max(1, Math.floor(spanU / cellW));
    const rows = Math.max(1, Math.floor(spanV / cellH));

    const startU = minU + (spanU - cols * cellW) / 2 + cellW / 2;
    const startV = minV + (spanV - rows * cellH) / 2 + cellH / 2;

    const panels: PlacedPanel[] = [];
    let panelIdCounter = 1;

    for (let r = 0; r < rows; r++) {
      const v = startV + r * cellH;
      for (let c = 0; c < cols; c++) {
        const u = startU + c * cellW;
        // Test corners and center inside rotated inset boundary
        const center = { x: u, y: v };
        const c1 = { x: u - widthM * 0.45, y: v - lengthM * 0.45 };
        const c2 = { x: u + widthM * 0.45, y: v - lengthM * 0.45 };
        const c3 = { x: u - widthM * 0.45, y: v + lengthM * 0.45 };
        const c4 = { x: u + widthM * 0.45, y: v + lengthM * 0.45 };

        if (
          isPointInPolygon(center, inPolygonRot) &&
          isPointInPolygon(c1, inPolygonRot) &&
          isPointInPolygon(c2, inPolygonRot) &&
          isPointInPolygon(c3, inPolygonRot) &&
          isPointInPolygon(c4, inPolygonRot)
        ) {
          // Unrotate back to local (x, y) coordinates
          const x = u * cosTheta - v * sinTheta;
          const y = u * sinTheta + v * cosTheta;

          panels.push({
            id: `p-${panelIdCounter++}`,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            widthM,
            lengthM,
            orientation: isLandscape ? 'landscape' : 'portrait',
            rotationDeg: dominantAngleDeg,
          });
        }
      }
    }

    return panels;
  };

  const portraitPanels = packGrid(false);
  const landscapePanels = packGrid(true);

  // Area-based theoretical limits with clamp gap
  const panelGrossArea = (effectiveWidthM + CLAMP_GAP_METERS) * (effectiveLengthM + CLAMP_GAP_METERS);
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
  const totalArrayKwp = Math.round(((recommendedMaxPanels * effectiveWattage) / 1000) * 100) / 100;

  return {
    maxPanelsPortrait,
    maxPanelsLandscape,
    recommendedOrientation: chosenOrientation,
    recommendedMaxPanels,
    placedPanels: chosenPanels.slice(0, recommendedMaxPanels),
    usableAreaSqm,
    totalArrayKwp,
    dominantAngleDeg,
  };
}
