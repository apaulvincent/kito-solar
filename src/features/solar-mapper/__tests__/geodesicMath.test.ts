// src/features/solar-mapper/__tests__/geodesicMath.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  calculateEdgeLengthsMeters,
  calculateSphericalPolygonAreaSqm,
  calculateSlopedRoofAreaSqm,
  hasSelfIntersection,
  projectVerticesToLocalMeters,
  unprojectLocalMetersToGeo,
  translatePolygonGeo,
  calculateEdgeAzimuthDeg,
  getOuterTiltSides,
} from '../utils/geodesicMath';
import { GeoPoint } from '../types/solarMapper';

describe('Geodesic Math & Spherical Polygon Utilities', () => {
  const origin: GeoPoint = { lat: 14.044, lng: 121.158 }; // Malvar, Batangas

  it('calculates accurate Haversine distance for local distances', () => {
    // 10 meters East
    const pEast = unprojectLocalMetersToGeo({ x: 10, y: 0 }, origin);
    const distEast = calculateHaversineDistanceMeters(origin, pEast);
    expect(distEast).toBeCloseTo(10.0, 1);

    // 15 meters North
    const pNorth = unprojectLocalMetersToGeo({ x: 0, y: 15 }, origin);
    const distNorth = calculateHaversineDistanceMeters(origin, pNorth);
    expect(distNorth).toBeCloseTo(15.0, 1);
  });

  it('computes edge lengths for polygon segments', () => {
    const v1 = unprojectLocalMetersToGeo({ x: 0, y: 0 }, origin);
    const v2 = unprojectLocalMetersToGeo({ x: 10, y: 0 }, origin);
    const v3 = unprojectLocalMetersToGeo({ x: 10, y: 10 }, origin);
    const v4 = unprojectLocalMetersToGeo({ x: 0, y: 10 }, origin);

    const lengths = calculateEdgeLengthsMeters([v1, v2, v3, v4]);
    expect(lengths.length).toBe(4);
    for (const len of lengths) {
      expect(len).toBeCloseTo(10.0, 1);
    }
  });

  it('calculates spherical polygon area for a 10m x 10m square to approximately 100 m²', () => {
    const v1 = unprojectLocalMetersToGeo({ x: -5, y: -5 }, origin);
    const v2 = unprojectLocalMetersToGeo({ x: 5, y: -5 }, origin);
    const v3 = unprojectLocalMetersToGeo({ x: 5, y: 5 }, origin);
    const v4 = unprojectLocalMetersToGeo({ x: -5, y: 5 }, origin);

    const area = calculateSphericalPolygonAreaSqm([v1, v2, v3, v4]);
    expect(area).toBeGreaterThan(99.0);
    expect(area).toBeLessThan(101.0);
  });

  it('returns 0 area for incomplete polygons with fewer than 3 vertices', () => {
    expect(calculateSphericalPolygonAreaSqm([])).toBe(0);
    expect(calculateSphericalPolygonAreaSqm([origin])).toBe(0);
    expect(calculateSphericalPolygonAreaSqm([origin, origin])).toBe(0);
  });

  it('calculates 3D sloped roof area with cos(pitch) expansion', () => {
    const flatArea = 100;

    // Flat roof 0° pitch
    expect(calculateSlopedRoofAreaSqm(flatArea, 0)).toBe(100);

    // 30° pitch: 100 / cos(30°) = 100 / 0.866025 ≈ 115.47 m²
    const sloped30 = calculateSlopedRoofAreaSqm(flatArea, 30);
    expect(sloped30).toBeCloseTo(115.47, 1);

    // 45° pitch: 100 / cos(45°) = 100 / 0.7071 ≈ 141.42 m²
    const sloped45 = calculateSlopedRoofAreaSqm(flatArea, 45);
    expect(sloped45).toBeCloseTo(141.42, 1);
  });

  it('detects bowtie self-intersecting polygons', () => {
    // Normal non-crossing rectangle
    const validSquare = [
      unprojectLocalMetersToGeo({ x: 0, y: 0 }, origin),
      unprojectLocalMetersToGeo({ x: 10, y: 0 }, origin),
      unprojectLocalMetersToGeo({ x: 10, y: 10 }, origin),
      unprojectLocalMetersToGeo({ x: 0, y: 10 }, origin),
    ];
    expect(hasSelfIntersection(validSquare)).toBe(false);

    // Crossed bowtie rectangle: (0,0) -> (10,10) -> (10,0) -> (0,10)
    const bowtie = [
      unprojectLocalMetersToGeo({ x: 0, y: 0 }, origin),
      unprojectLocalMetersToGeo({ x: 10, y: 10 }, origin),
      unprojectLocalMetersToGeo({ x: 10, y: 0 }, origin),
      unprojectLocalMetersToGeo({ x: 0, y: 10 }, origin),
    ];
    expect(hasSelfIntersection(bowtie)).toBe(true);
  });

  it('projects and unprojects between Geo and local Cartesian meters symmetrically', () => {
    const originalLocal = { x: 12.5, y: -8.3 };
    const geo = unprojectLocalMetersToGeo(originalLocal, origin);
    const projected = projectVerticesToLocalMeters([origin, geo]);

    // Difference between projected[1] and projected[0] should match originalLocal
    const dx = projected[1].x - projected[0].x;
    const dy = projected[1].y - projected[0].y;

    expect(dx).toBeCloseTo(12.5, 1);
    expect(dy).toBeCloseTo(-8.3, 1);
  });

  it('translates polygon vertices cleanly by delta meters in horizontal plane', () => {
    const square = [
      unprojectLocalMetersToGeo({ x: -5, y: -5 }, origin),
      unprojectLocalMetersToGeo({ x: 5, y: -5 }, origin),
      unprojectLocalMetersToGeo({ x: 5, y: 5 }, origin),
      unprojectLocalMetersToGeo({ x: -5, y: 5 }, origin),
    ];

    // Shift 3 meters East, 4 meters North
    const shifted = translatePolygonGeo(square, 3.0, 4.0);
    const originalLocal = projectVerticesToLocalMeters(square, origin);
    const shiftedLocal = projectVerticesToLocalMeters(shifted, origin);

    expect(shiftedLocal[0].x - originalLocal[0].x).toBeCloseTo(3.0, 1);
    expect(shiftedLocal[0].y - originalLocal[0].y).toBeCloseTo(4.0, 1);
  });

  it('calculates physical outward edge azimuth correctly for polygon sides', () => {
    // 10m x 6m rectangle centered at origin
    // Side 0 (bottom/South): (-5, -3) to (5, -3) -> midpoint (0, -3), facing South 180°
    // Side 1 (right/East): (5, -3) to (5, 3) -> midpoint (5, 0), facing East 90°
    // Side 2 (top/North): (5, 3) to (-5, 3) -> midpoint (0, 3), facing North 0°
    // Side 3 (left/West): (-5, 3) to (-5, -3) -> midpoint (-5, 0), facing West 270°
    const rect = [
      unprojectLocalMetersToGeo({ x: -5, y: -3 }, origin),
      unprojectLocalMetersToGeo({ x: 5, y: -3 }, origin),
      unprojectLocalMetersToGeo({ x: 5, y: 3 }, origin),
      unprojectLocalMetersToGeo({ x: -5, y: 3 }, origin),
    ];

    expect(calculateEdgeAzimuthDeg(rect, 0)).toBeCloseTo(180, 0); // South
    expect(calculateEdgeAzimuthDeg(rect, 1)).toBeCloseTo(90, 0);  // East
    expect(calculateEdgeAzimuthDeg(rect, 2)).toBeCloseTo(0, 0);   // North
    expect(calculateEdgeAzimuthDeg(rect, 3)).toBeCloseTo(270, 0); // West
  });
  it('computes exactly 4 outer tilt sides for any polygon, ignoring inner notch edges', () => {
    // 8-vertex U-shaped roof polygon:
    // Outer bounds: -10 to +10 X, -5 to +5 Y (20m wide x 10m deep)
    // Has an inner notch / courtyard carved into the top edge (Side 3)
    const uShapedRoof = [
      unprojectLocalMetersToGeo({ x: -10, y: -5 }, origin), // Bottom-left
      unprojectLocalMetersToGeo({ x: 10, y: -5 }, origin),  // Bottom-right
      unprojectLocalMetersToGeo({ x: 10, y: 5 }, origin),   // Top-right
      unprojectLocalMetersToGeo({ x: 3, y: 5 }, origin),    // Notch right
      unprojectLocalMetersToGeo({ x: 3, y: 0 }, origin),    // Notch bottom-right (inner side)
      unprojectLocalMetersToGeo({ x: -3, y: 0 }, origin),   // Notch bottom-left (inner side)
      unprojectLocalMetersToGeo({ x: -3, y: 5 }, origin),   // Notch left
      unprojectLocalMetersToGeo({ x: -10, y: 5 }, origin),  // Top-left
    ];

    expect(uShapedRoof.length).toBe(8);

    const outerSides = getOuterTiltSides(uShapedRoof);
    // MUST always produce strictly 4 outer tilt sides, never 8!
    expect(outerSides).toHaveLength(4);

    expect(outerSides[0].name).toContain('Side 1');
    expect(outerSides[0].cardinalDir).toBe('South');
    expect(outerSides[0].lengthM).toBeCloseTo(20.0, 0);

    expect(outerSides[1].name).toContain('Side 2');
    expect(outerSides[1].cardinalDir).toBe('East');
    expect(outerSides[1].lengthM).toBeCloseTo(10.0, 0);

    expect(outerSides[2].name).toContain('Side 3');
    expect(outerSides[2].cardinalDir).toBe('North');
    expect(outerSides[2].lengthM).toBeCloseTo(20.0, 0);

    expect(outerSides[3].name).toContain('Side 4');
    expect(outerSides[3].cardinalDir).toBe('West');
    expect(outerSides[3].lengthM).toBeCloseTo(10.0, 0);
  });
});
