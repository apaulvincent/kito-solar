// src/features/combiner-builder/utils/wireRouting3D.ts
import * as THREE from 'three';
import { FerruleColor, PolarityRole, WireGaugeMm2 } from '../types';

export interface RouteEndpoints {
  startPos: [number, number, number];
  startDirection: 'top' | 'bottom' | 'front';
  endPos: [number, number, number];
  endDirection: 'top' | 'bottom' | 'front';
  isJumperLoop?: boolean;
}

/**
 * Computes 3D waypoints for insulated wire geometry inside the combiner box enclosure.
 */
export function computeWireWaypoints(endpoints: RouteEndpoints): [number, number, number][] {
  const { startPos, startDirection, endPos, endDirection, isJumperLoop } = endpoints;
  const [sx, sy, sz] = startPos;
  const [ex, ey, ez] = endPos;

  // Case 1: Short jumper loop between adjacent terminals (e.g., MCB to SPD)
  if (isJumperLoop || (startDirection === endDirection && Math.abs(sy - ey) < 0.25 && Math.abs(sx - ex) < 0.5)) {
    const isTop = startDirection === 'top';
    const archYOffset = isTop ? 0.22 : -0.22;
    const archZOffset = 0.14; // Bulges forward into cabinet space

    const p1: [number, number, number] = [sx, sy + (isTop ? 0.08 : -0.08), sz + 0.03];
    const p2: [number, number, number] = [
      (sx * 2 + ex) / 3,
      sy + archYOffset * 0.85,
      Math.max(sz, ez) + archZOffset,
    ];
    const p3: [number, number, number] = [
      (sx + ex * 2) / 3,
      ey + archYOffset * 0.85,
      Math.max(sz, ez) + archZOffset,
    ];
    const p4: [number, number, number] = [ex, ey + (isTop ? 0.08 : -0.08), ez + 0.03];

    return [startPos, p1, p2, p3, p4, endPos];
  }

  // Case 2: Standard wiring across rails or to side ground busbar
  // Step 1: Exit start terminal along its terminal vector
  const startVectorY = startDirection === 'top' ? 0.16 : startDirection === 'bottom' ? -0.16 : 0;
  const startVectorZ = startDirection === 'front' ? 0.12 : 0.05;
  const pStartExit: [number, number, number] = [sx, sy + startVectorY, sz + startVectorZ];

  // Step 2: Exit end terminal along its terminal vector
  const endVectorY = endDirection === 'top' ? 0.16 : endDirection === 'bottom' ? -0.16 : 0;
  const endVectorZ = endDirection === 'front' ? 0.12 : 0.05;
  const pEndEnter: [number, number, number] = [ex, ey + endVectorY, ez + endVectorZ];

  // Step 3: Determine intermediate wiring channel Y coordinate
  let channelY: number;
  if (sy > 0.5 && ey > 0.5) {
    // Both on top rail
    channelY = sy + (startDirection === 'top' ? 0.28 : -0.28);
  } else if (sy < -0.3 && ey < -0.3) {
    // Both in bottom section
    channelY = sy + (startDirection === 'top' ? 0.28 : -0.28);
  } else {
    // Cross-rail: use mid raceway between top and middle rails (~Y = 0.45)
    channelY = (sy + ey) / 2;
  }

  const pChannel1: [number, number, number] = [sx, channelY, 0.06];
  const pChannel2: [number, number, number] = [ex, channelY, 0.06];

  return [startPos, pStartExit, pChannel1, pChannel2, pEndEnter, endPos];
}

/**
 * Creates a smooth CatmullRomCurve3 from 3D waypoints.
 */
export function createCurveFromWaypoints(waypoints: [number, number, number][]): THREE.CatmullRomCurve3 {
  const vectors = waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.25);
}

/**
 * Calculates physical wire cut length in meters (sum of 3D segments + 15% installation slack).
 */
export function calculateWireCutLengthMeters(waypoints: [number, number, number][]): number {
  if (waypoints.length < 2) return 0.2;
  let totalDistanceUnits = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x1, y1, z1] = waypoints[i];
    const [x2, y2, z2] = waypoints[i + 1];
    totalDistanceUnits += Math.hypot(x2 - x1, y2 - y1, z2 - z1);
  }
  // Enclosure 3D scale: 1 unit ~= 0.35 meters
  const physicalLengthMeters = totalDistanceUnits * 0.35 * 1.15;
  return Math.round(physicalLengthMeters * 100) / 100;
}

/**
 * Returns default wire color, ferrule color, and recommended mm² based on electrical polarity and rated amps.
 */
export function getRecommendedWireSpec(polarity: PolarityRole, ratedAmps: number): {
  wireColor: string;
  ferruleColor: FerruleColor;
  gaugeMm2: WireGaugeMm2;
} {
  switch (polarity) {
    case 'DC_POS':
      return {
        wireColor: '#ef4444', // Red
        ferruleColor: 'red',
        gaugeMm2: ratedAmps > 100 ? 35 : ratedAmps > 40 ? 10 : 6,
      };
    case 'DC_NEG':
      return {
        wireColor: '#1e293b', // Black / Dark slate
        ferruleColor: 'black',
        gaugeMm2: ratedAmps > 100 ? 35 : ratedAmps > 40 ? 10 : 6,
      };
    case 'L':
      return {
        wireColor: '#ef4444', // Red Line
        ferruleColor: ratedAmps > 40 ? 'red' : 'white',
        gaugeMm2: ratedAmps > 60 ? 16 : ratedAmps > 40 ? 10 : 6,
      };
    case 'N':
      return {
        wireColor: '#3b82f6', // Blue Neutral
        ferruleColor: 'blue',
        gaugeMm2: ratedAmps > 60 ? 16 : ratedAmps > 40 ? 10 : 6,
      };
    case 'PE':
      return {
        wireColor: '#22c55e', // Earth Green
        ferruleColor: 'green_yellow',
        gaugeMm2: 6,
      };
    case 'SENSE_L':
    case 'SENSE_N':
      return {
        wireColor: '#eab308', // Yellow Control / Sense
        ferruleColor: 'yellow',
        gaugeMm2: 1.5,
      };
    default:
      return {
        wireColor: '#f8fafc',
        ferruleColor: 'white',
        gaugeMm2: 6,
      };
  }
}

/**
 * Maps wire gauge mm² to 3D Three.js Tube radius.
 * Calibrated for realistic, slim wiring proportions inside the combiner cabinet.
 */
export function getTubeRadiusForGauge(gaugeMm2: WireGaugeMm2): number {
  switch (gaugeMm2) {
    case 1.5:
      return 0.004; // Slim control / sense wire
    case 2.5:
      return 0.0055;
    case 4:
      return 0.007;
    case 6:
      return 0.0085; // Standard 6mm² PV & AC wire
    case 10:
      return 0.011;
    case 16:
      return 0.014;
    case 25:
      return 0.018;
    case 35:
    case 50:
      return 0.022; // 35mm² battery storage cable
    default:
      return 0.0085;
  }
}
