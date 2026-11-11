import { GeoPoint, LocalPoint, OuterTiltSide } from '../types/solarMapper';

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export function normalizeHalfTurnRad(angleRad: number): number {
  let normalized = angleRad;
  while (normalized >= Math.PI / 2) normalized -= Math.PI;
  while (normalized < -Math.PI / 2) normalized += Math.PI;
  return normalized;
}

/**
 * Finds the angle of the longest polygon edge normalized into [-PI/2, PI/2).
 */
export function findLongestEdgeAngleRad(localVertices: LocalPoint[]): number {
  if (localVertices.length < 2) return 0;
  let maxLenSq = -1;
  let bestAngleRad = 0;

  for (let i = 0; i < localVertices.length; i++) {
    const nextIdx = (i + 1) % localVertices.length;
    const dx = localVertices[nextIdx].x - localVertices[i].x;
    const dy = localVertices[nextIdx].y - localVertices[i].y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > maxLenSq) {
      maxLenSq = lenSq;
      bestAngleRad = Math.atan2(dy, dx);
    }
  }

  return normalizeHalfTurnRad(bestAngleRad);
}

/**
 * Returns the dominant edge angle in degrees [-90, 90), rounded to 0.1 deg.
 */
export function findDominantEdgeAngle(localVertices: LocalPoint[]): number {
  if (localVertices.length < 2) return 0;
  return Math.round(radToDeg(findLongestEdgeAngleRad(localVertices)) * 10) / 10;
}

/**
 * Primary horizontal eave axis closest to East-West (folded into [-PI/4, PI/4]).
 */
export function findEaveAxisAngleRad(localVertices: LocalPoint[]): number {
  let eaveAngleRad = findLongestEdgeAngleRad(localVertices);
  if (Math.abs(eaveAngleRad) > Math.PI / 4) {
    eaveAngleRad = eaveAngleRad > 0 ? eaveAngleRad - Math.PI / 2 : eaveAngleRad + Math.PI / 2;
  }
  return eaveAngleRad;
}

export function getPivotSideAngleRad(sides: OuterTiltSide[], pivotEdgeIndex = 0): number {
  if (sides.length === 0) return 0;
  const pivotIdx = ((pivotEdgeIndex % 4) + 4) % 4;
  const pivotSide = sides[pivotIdx] || sides[0];
  const dx = pivotSide.endMeters.x - pivotSide.startMeters.x;
  const dy = pivotSide.endMeters.y - pivotSide.startMeters.y;
  return Math.atan2(dy, dx);
}

const CARDINAL_SECTORS: readonly { shortLabel: string; label: string }[] = [
  { shortLabel: 'N', label: 'North (0°)' },
  { shortLabel: 'NE', label: 'North-East (45°)' },
  { shortLabel: 'E', label: 'East (90°)' },
  { shortLabel: 'SE', label: 'South-East (135°)' },
  { shortLabel: 'S', label: 'South (180°) • Peak Yield' },
  { shortLabel: 'SW', label: 'South-West (225°)' },
  { shortLabel: 'W', label: 'West (270°)' },
  { shortLabel: 'NW', label: 'North-West (315°)' },
];

export function getCardinalDirection(azimuthDeg: number): { shortLabel: string; label: string } {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  const sectorIdx = Math.floor(((normalized + 22.5) % 360) / 45);
  return CARDINAL_SECTORS[sectorIdx];
}

export function computeLocalPolygonBoundingRadius(
  vertices: GeoPoint[] | undefined,
  projectPoint: (pt: GeoPoint, origin: GeoPoint) => LocalPoint
): number {
  if (!vertices || vertices.length < 3) return 0;
  const ref = vertices[0];
  const pts = vertices.map((v) => projectPoint(v, ref));
  let sumX = 0;
  let sumY = 0;
  for (const p of pts) {
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / pts.length;
  const cy = sumY / pts.length;
  let maxDist = 0;
  for (const p of pts) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > maxDist) maxDist = d;
  }
  return maxDist;
}
