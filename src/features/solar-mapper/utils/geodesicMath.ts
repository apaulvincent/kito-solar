// src/features/solar-mapper/utils/geodesicMath.ts
import { GeoPoint, LocalPoint, OuterTiltSide } from '../types/solarMapper';

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
 * Projects (lat, lng) coordinates relative to polygon centroid (or custom origin) into local (x, y) meters.
 * x = East (+), y = North (+)
 */
export function projectVerticesToLocalMeters(
  vertices: GeoPoint[],
  customCentroid?: GeoPoint
): LocalPoint[] {
  if (vertices.length === 0) return [];
  const centroid = customCentroid || calculateCentroid(vertices);
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
 * Projects a single GPS coordinate to local meters relative to an origin point.
 */
export function projectSinglePointToMeters(point: GeoPoint, origin: GeoPoint): LocalPoint {
  const latRad = degToRad(origin.lat);
  const dLngRad = degToRad(point.lng - origin.lng);
  const dLatRad = degToRad(point.lat - origin.lat);

  return {
    x: Math.round(dLngRad * EARTH_RADIUS_METERS * Math.cos(latRad) * 1000) / 1000,
    y: Math.round(dLatRad * EARTH_RADIUS_METERS * 1000) / 1000,
  };
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

/**
 * Translates all vertices of a polygon by delta meters in local horizontal plane.
 * deltaMetersX = East (+), deltaMetersY = North (+)
 */
export function translatePolygonGeo(
  vertices: GeoPoint[],
  deltaMetersX: number,
  deltaMetersY: number
): GeoPoint[] {
  if (vertices.length === 0) return [];
  const centroid = calculateCentroid(vertices);
  const latCRad = degToRad(centroid.lat);
  const dLatDeg = radToDeg(deltaMetersY / EARTH_RADIUS_METERS);
  const dLngDeg = radToDeg(deltaMetersX / (EARTH_RADIUS_METERS * Math.cos(latCRad)));

  return vertices.map((v) => ({
    lat: v.lat + dLatDeg,
    lng: v.lng + dLngDeg,
  }));
}

/**
 * Calculates outward downslope compass azimuth (0°=N, 90°=E, 180°=S, 270°=W)
 * for a specific polygon edge (side).
 */
export function calculateEdgeAzimuthDeg(vertices: GeoPoint[], edgeIndex: number): number {
  const n = vertices.length;
  if (n < 3) return 180;
  const idx = ((edgeIndex % n) + n) % n;
  const centroid = calculateCentroid(vertices);
  const localPts = projectVerticesToLocalMeters(vertices, centroid);
  
  const p1 = localPts[idx];
  const p2 = localPts[(idx + 1) % n];
  // Midpoint of the edge relative to centroid
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  // Vector from centroid (0,0) to edge midpoint points outwards towards this side
  // In our local meters: +x is East, +y is North.
  // Compass azimuth: 0° is North (+y), 90° is East (+x), 180° is South (-y), 270° is West (-x).
  const headingRad = Math.atan2(mx, my);
  const headingDeg = (radToDeg(headingRad) + 360) % 360;
  return Math.round(headingDeg);
}


/**
 * Computes the exactly 4 outer bounding tilt sides of ANY roof polygon (never inner cutout notches).
 * Side 1: South / Front Eave
 * Side 2: East / Right Edge
 * Side 3: North / Back Ridge
 * Side 4: West / Left Edge
 */
export function getOuterTiltSides(vertices: GeoPoint[]): OuterTiltSide[] {
  if (vertices.length < 3) {
    const defaultMeters = { x: 0, y: 0 };
    return [
      {
        sideIndex: 0,
        name: 'Side 1 (Front Eave)',
        shortName: 'Side 1',
        cardinalDir: 'South',
        azimuthDeg: 180,
        lengthM: 0,
        startMeters: defaultMeters,
        endMeters: defaultMeters,
        midpointMeters: defaultMeters,
      },
      {
        sideIndex: 1,
        name: 'Side 2 (Right Edge)',
        shortName: 'Side 2',
        cardinalDir: 'East',
        azimuthDeg: 90,
        lengthM: 0,
        startMeters: defaultMeters,
        endMeters: defaultMeters,
        midpointMeters: defaultMeters,
      },
      {
        sideIndex: 2,
        name: 'Side 3 (Back Ridge)',
        shortName: 'Side 3',
        cardinalDir: 'North',
        azimuthDeg: 0,
        lengthM: 0,
        startMeters: defaultMeters,
        endMeters: defaultMeters,
        midpointMeters: defaultMeters,
      },
      {
        sideIndex: 3,
        name: 'Side 4 (Left Edge)',
        shortName: 'Side 4',
        cardinalDir: 'West',
        azimuthDeg: 270,
        lengthM: 0,
        startMeters: defaultMeters,
        endMeters: defaultMeters,
        midpointMeters: defaultMeters,
      },
    ];
  }

  const centroid = calculateCentroid(vertices);
  const localPts = projectVerticesToLocalMeters(vertices, centroid);

  // Find dominant edge orientation
  let maxLenSq = -1;
  let domAngleRad = 0;
  const n = localPts.length;

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dx = localPts[next].x - localPts[i].x;
    const dy = localPts[next].y - localPts[i].y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > maxLenSq) {
      maxLenSq = lenSq;
      domAngleRad = Math.atan2(dy, dx);
    }
  }

  while (domAngleRad >= Math.PI / 2) domAngleRad -= Math.PI;
  while (domAngleRad < -Math.PI / 2) domAngleRad += Math.PI;

  const cosTheta = Math.cos(domAngleRad);
  const sinTheta = Math.sin(domAngleRad);

  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const p of localPts) {
    const u = p.x * cosTheta + p.y * sinTheta;
    const v = -p.x * sinTheta + p.y * cosTheta;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  const widthU = Math.max(0.1, maxU - minU);
  const lengthV = Math.max(0.1, maxV - minV);

  const unrot = (u: number, v: number): LocalPoint => ({
    x: Math.round((u * cosTheta - v * sinTheta) * 100) / 100,
    y: Math.round((u * sinTheta + v * cosTheta) * 100) / 100,
  });

  const c1 = unrot(minU, minV);
  const c2 = unrot(maxU, minV);
  const c3 = unrot(maxU, maxV);
  const c4 = unrot(minU, maxV);

  const calcAzimuth = (pA: LocalPoint, pB: LocalPoint): number => {
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const nx = dy;
    const ny = -dx;
    const az = (Math.atan2(nx, ny) * (180 / Math.PI) + 360) % 360;
    return Math.round(az);
  };

  return [
    {
      sideIndex: 0,
      name: 'Side 1 (Front Eave)',
      shortName: 'Side 1',
      cardinalDir: 'South',
      azimuthDeg: calcAzimuth(c1, c2),
      lengthM: Math.round(widthU * 10) / 10,
      startMeters: c1,
      endMeters: c2,
      midpointMeters: unrot((minU + maxU) / 2, minV),
    },
    {
      sideIndex: 1,
      name: 'Side 2 (Right Edge)',
      shortName: 'Side 2',
      cardinalDir: 'East',
      azimuthDeg: calcAzimuth(c2, c3),
      lengthM: Math.round(lengthV * 10) / 10,
      startMeters: c2,
      endMeters: c3,
      midpointMeters: unrot(maxU, (minV + maxV) / 2),
    },
    {
      sideIndex: 2,
      name: 'Side 3 (Back Ridge)',
      shortName: 'Side 3',
      cardinalDir: 'North',
      azimuthDeg: calcAzimuth(c3, c4),
      lengthM: Math.round(widthU * 10) / 10,
      startMeters: c3,
      endMeters: c4,
      midpointMeters: unrot((minU + maxU) / 2, maxV),
    },
    {
      sideIndex: 3,
      name: 'Side 4 (Left Edge)',
      shortName: 'Side 4',
      cardinalDir: 'West',
      azimuthDeg: calcAzimuth(c4, c1),
      lengthM: Math.round(lengthV * 10) / 10,
      startMeters: c4,
      endMeters: c1,
      midpointMeters: unrot(minU, (minV + maxV) / 2),
    },
  ];
}
