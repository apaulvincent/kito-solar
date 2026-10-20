// src/features/solar-mapper/utils/geodesicMath.ts
import { GeoPoint, LocalPoint } from '../types/solarMapper';

export const EARTH_RADIUS_METERS = 6378137; // WGS84 Major Axis Radius

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Calculates great-circle Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = degToRad(p2.lat - p1.lat);
  const dLng = degToRad(p2.lng - p1.lng);
  const lat1 = degToRad(p1.lat);
  const lat2 = degToRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates edge lengths in meters for each segment of a closed polygon.
 */
export function calculateEdgeLengthsMeters(vertices: GeoPoint[]): number[] {
  if (vertices.length < 2) return [];
  const lengths: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const nextIdx = (i + 1) % vertices.length;
    lengths.push(calculateHaversineDistanceMeters(vertices[i], vertices[nextIdx]));
  }
  return lengths;
}

/**
 * Computes 2D orthographic footprint area in m² from WGS84 coordinates
 * using spherical excess / geodesic shoelace integration.
 * Returns 0 if vertices.length < 3.
 */
export function calculateSphericalPolygonAreaSqm(vertices: GeoPoint[]): number {
  const n = vertices.length;
  if (n < 3) return 0;

  let totalExcess = 0;
  for (let i = 0; i < n; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % n];

    const lambda1 = degToRad(p1.lng);
    const lambda2 = degToRad(p2.lng);
    const phi1 = degToRad(p1.lat);
    const phi2 = degToRad(p2.lat);

    totalExcess += (lambda2 - lambda1) * (Math.sin(phi1) + Math.sin(phi2));
  }

  const area = (Math.abs(totalExcess) * (EARTH_RADIUS_METERS * EARTH_RADIUS_METERS)) / 2;
  return Math.round(area * 100) / 100;
}

/**
 * Computes true 3D sloped surface area given 2D footprint area and roof pitch angle.
 * Aslop = Aflat / cos(pitchDeg)
 */
export function calculateSlopedRoofAreaSqm(flatAreaSqm: number, pitchDeg: number): number {
  if (flatAreaSqm <= 0) return 0;
  const clampedPitch = Math.min(60, Math.max(0, pitchDeg));
  const cosTheta = Math.cos(degToRad(clampedPitch));
  if (cosTheta <= 0.05) return flatAreaSqm;
  return Math.round((flatAreaSqm / cosTheta) * 100) / 100;
}

/**
 * Geometric centroid of polygon vertices.
 */
export function calculateCentroid(vertices: GeoPoint[]): GeoPoint {
  if (vertices.length === 0) return { lat: 0, lng: 0 };
  const sum = vertices.reduce(
    (acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / vertices.length,
    lng: sum.lng / vertices.length,
  };
}

/**
 * Projects (lat, lng) coordinates relative to polygon centroid into local (x, y) meters.
 * x = East (+), y = North (+)
 */
export function projectVerticesToLocalMeters(vertices: GeoPoint[]): LocalPoint[] {
  if (vertices.length === 0) return [];
  const centroid = calculateCentroid(vertices);
  const latCRad = degToRad(centroid.lat);

  return vertices.map((v) => {
    const dLngRad = degToRad(v.lng - centroid.lng);
    const dLatRad = degToRad(v.lat - centroid.lat);

    const x = dLngRad * EARTH_RADIUS_METERS * Math.cos(latCRad);
    const y = dLatRad * EARTH_RADIUS_METERS;

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
    };
  });
}

/**
 * Unprojects a local (x, y) point in meters back to (lat, lng) relative to centroid.
 */
export function unprojectLocalMetersToGeo(point: LocalPoint, centroid: GeoPoint): GeoPoint {
  const latCRad = degToRad(centroid.lat);
  const dLatDeg = radToDeg(point.y / EARTH_RADIUS_METERS);
  const dLngDeg = radToDeg(point.x / (EARTH_RADIUS_METERS * Math.cos(latCRad)));

  return {
    lat: centroid.lat + dLatDeg,
    lng: centroid.lng + dLngDeg,
  };
}

/**
 * 2D segment intersection helper.
 */
function ccw(p1: LocalPoint, p2: LocalPoint, p3: LocalPoint): boolean {
  return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
}

function segmentsIntersect(a: LocalPoint, b: LocalPoint, c: LocalPoint, d: LocalPoint): boolean {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

/**
 * Detects if any non-adjacent edges of a closed polygon cross each other (bowtie shape).
 */
export function hasSelfIntersection(vertices: GeoPoint[]): boolean {
  const n = vertices.length;
  if (n < 4) return false;

  const localPts = projectVerticesToLocalMeters(vertices);

  for (let i = 0; i < n; i++) {
    const a = localPts[i];
    const b = localPts[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      // Don't test adjacent segments or the wrap-around edge
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === n - 1) continue;

      const c = localPts[j];
      const d = localPts[(j + 1) % n];

      if (segmentsIntersect(a, b, c, d)) {
        return true;
      }
    }
  }

  return false;
}
