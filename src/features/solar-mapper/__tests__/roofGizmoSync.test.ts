// src/features/solar-mapper/__tests__/roofGizmoSync.test.ts
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { getRoofAnchorWorldPos } from '../components/Roof3DPreviewCanvas';
import { RoofPolygonSection, GeoPoint } from '../types/solarMapper';

type TestRoofAnchorInput = Pick<
  RoofPolygonSection,
  'vertices' | 'baseHeightMeters' | 'pitchDeg' | 'rollDeg' | 'pivotEdgeIndex'
>;

describe('Roof 3D Gizmo & Sun Guide Synchronization', () => {
  const siteCenter: GeoPoint = { lat: 14.044, lng: 121.158 };

  const roofA: TestRoofAnchorInput = {
    vertices: [
      { lat: 14.0440, lng: 121.1580 },
      { lat: 14.0441, lng: 121.1580 },
      { lat: 14.0441, lng: 121.1581 },
      { lat: 14.0440, lng: 121.1581 },
    ],
    pitchDeg: 0,
    rollDeg: 0,
    baseHeightMeters: 4.0,
  };

  const roofB: TestRoofAnchorInput = {
    vertices: [
      { lat: 14.0445, lng: 121.1585 },
      { lat: 14.0446, lng: 121.1585 },
      { lat: 14.0446, lng: 121.1586 },
      { lat: 14.0445, lng: 121.1586 },
    ],
    pitchDeg: 25,
    rollDeg: 0,
    baseHeightMeters: 6.0,
  };

  it('computes distinct, deterministic 3D world anchors for different roof sections', () => {
    const posA = getRoofAnchorWorldPos(roofA, siteCenter);
    const posB = getRoofAnchorWorldPos(roofB, siteCenter);

    expect(posA).toBeInstanceOf(THREE.Vector3);
    expect(posB).toBeInstanceOf(THREE.Vector3);

    // Positions must be far apart reflecting their geographical separation
    const dist = posA.distanceTo(posB);
    expect(dist).toBeGreaterThan(40);
  });

  it('updates anchor elevation and tilt instantaneously when roof parameters change', () => {
    const flatPos = getRoofAnchorWorldPos(roofA, siteCenter);

    const elevatedRoof: TestRoofAnchorInput = {
      ...roofA,
      baseHeightMeters: 10.0,
    };
    const elevatedPos = getRoofAnchorWorldPos(elevatedRoof, siteCenter);

    // Elevation (Y) must reflect the exact 6-meter delta
    expect(elevatedPos.y - flatPos.y).toBeCloseTo(6.0, 2);
    expect(elevatedPos.x).toBeCloseTo(flatPos.x, 2);
    expect(elevatedPos.z).toBeCloseTo(flatPos.z, 2);
  });

  it('accounts for roof pitch tilt when calculating the normal surface anchor', () => {
    const flatRoof: TestRoofAnchorInput = { ...roofA, pitchDeg: 0 };
    const tiltedRoof: TestRoofAnchorInput = { ...roofA, pitchDeg: 45 };

    const flatPos = getRoofAnchorWorldPos(flatRoof, siteCenter);
    const tiltedPos = getRoofAnchorWorldPos(tiltedRoof, siteCenter);

    // Flat roof anchor is at baseHeight + 0.45m
    expect(flatPos.y).toBeCloseTo(4.45, 2);

    // Tilted roof rotates the 0.45m surface normal by 45 degrees
    expect(tiltedPos.y).not.toBeCloseTo(flatPos.y, 2);
    expect(tiltedPos.y).toBeLessThan(flatPos.y); // Normal tilts down from vertical
  });
});
