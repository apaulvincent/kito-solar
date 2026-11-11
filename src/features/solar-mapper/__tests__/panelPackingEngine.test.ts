// src/features/solar-mapper/__tests__/panelPackingEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculatePanelPacking,
  isPointInPolygon,
  insetPolygon,
  findDominantEdgeAngle,
} from '../utils/panelPackingEngine';
import { LocalPoint } from '../types/solarMapper';

describe('Panel Packing Engine & Physical Layout Optimization', () => {
  it('correctly checks point-in-polygon containment', () => {
    const square: LocalPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(isPointInPolygon({ x: -1, y: 5 }, square)).toBe(false);
    expect(isPointInPolygon({ x: 12, y: 5 }, square)).toBe(false);
  });

  it('insets polygon inwards by setback ratio', () => {
    const square: LocalPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    const inset = insetPolygon(square, 0.82);
    expect(inset.length).toBe(4);

    // Bounding box should shrink
    const minX = Math.min(...inset.map((p) => p.x));
    const maxX = Math.max(...inset.map((p) => p.x));
    expect(minX).toBeGreaterThan(0);
    expect(maxX).toBeLessThan(10);
  });

  it('packs realistic 580W panels onto a 10m x 6m residential roof section', () => {
    // 10m wide (X) x 6m sloped (Y) roof plane: 60 m²
    const localVertices: LocalPoint[] = [
      { x: -5, y: -3 },
      { x: 5, y: -3 },
      { x: 5, y: 3 },
      { x: -5, y: 3 },
    ];

    const packing = calculatePanelPacking({
      localVertices,
      slopedAreaSqm: 60,
      pitchDeg: 15,
      setbackRatio: 0.82,
      panelWattage: 580,
      orientationPreference: 'auto_best',
    });

    // Usable area = 82% setback * 60m^2 = 49.2 m^2; 580W module footprint with clamp gap ~ 2.65 m^2
    expect(packing.usableAreaSqm).toBeCloseTo(49.2, 1);
    expect(packing.recommendedMaxPanels).toBeGreaterThanOrEqual(10);
    expect(packing.recommendedMaxPanels).toBeLessThanOrEqual(20);
    expect(packing.placedPanels.length).toBe(packing.recommendedMaxPanels);

    // Independent property check: 580W = 0.58 kW per panel, rounded to 0.01 kWp
    expect(packing.totalArrayKwp).toBeGreaterThanOrEqual(5.8);
    expect(packing.totalArrayKwp).toBeLessThanOrEqual(11.6);
    expect(Math.abs(packing.totalArrayKwp - packing.recommendedMaxPanels * 0.58)).toBeLessThan(0.01);
  });

  it('handles empty or tiny sub-panel polygons without crashing', () => {
    const packingEmpty = calculatePanelPacking({
      localVertices: [],
      slopedAreaSqm: 0,
      pitchDeg: 0,
    });
    expect(packingEmpty.recommendedMaxPanels).toBe(0);
    expect(packingEmpty.placedPanels.length).toBe(0);

    // Tiny 1m x 1m patch (smaller than 1 panel)
    const tinyPatch: LocalPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const packingTiny = calculatePanelPacking({
      localVertices: tinyPatch,
      slopedAreaSqm: 1,
      pitchDeg: 15,
    });
    expect(packingTiny.recommendedMaxPanels).toBe(0);
  });

  it('accurately identifies dominant edge angle on slanted roofs', () => {
    // Horizontal 30m x 8m rectangle
    const horizontalRoof: LocalPoint[] = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 8 },
      { x: 0, y: 8 },
    ];
    expect(findDominantEdgeAngle(horizontalRoof)).toBe(0);

    // Slanted 30m x 8m roof rotated by -15° (eave sloping downwards towards the east)
    const angleRad = (-15 * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const rotatedRoof: LocalPoint[] = horizontalRoof.map((p) => ({
      x: p.x * cosA - p.y * sinA,
      y: p.x * sinA + p.y * cosA,
    }));

    const detectedAngle = findDominantEdgeAngle(rotatedRoof);
    expect(detectedAngle).toBeCloseTo(-15, 0);
  });

  it('packs panels parallel to the roof edge when the roof is not straight north', () => {
    // 31m long x 8m wide roof tilted by -14° (similar to real user satellite roof)
    const angleRad = (-14 * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const basePts: LocalPoint[] = [
      { x: -15.5, y: -4 },
      { x: 15.5, y: -4 },
      { x: 15.5, y: 4 },
      { x: -15.5, y: 4 },
    ];

    const slantedRoof: LocalPoint[] = basePts.map((p) => ({
      x: p.x * cosA - p.y * sinA,
      y: p.x * sinA + p.y * cosA,
    }));

    const packing = calculatePanelPacking({
      localVertices: slantedRoof,
      slopedAreaSqm: 248, // 31m * 8m
      pitchDeg: 10,
      setbackRatio: 0.82,
      panelWattage: 580,
      orientationPreference: 'auto_best',
    });

    expect(packing.recommendedMaxPanels).toBeGreaterThan(30);
    expect(packing.placedPanels.length).toBe(packing.recommendedMaxPanels);

    // All panels should have rotationDeg matching the dominant roof edge angle (-14°)
    for (const panel of packing.placedPanels) {
      expect(panel.rotationDeg).toBeCloseTo(-14, 0);
    }
  });

  it('ensures panel count never decreases when adjusting roof pitch from 0° to 45°', () => {
    const roofQuad: LocalPoint[] = [
      { x: 0, y: 0 },
      { x: 11.0, y: 0 },
      { x: 10.2, y: 6.85 },
      { x: 0.2, y: 6.4 },
    ];

    const flatArea = 70;
    let initialCount = 0;

    for (let pitch = 0; pitch <= 45; pitch += 5) {
      const slopedArea = flatArea / Math.cos((pitch * Math.PI) / 180);
      const packing = calculatePanelPacking({
        localVertices: roofQuad,
        slopedAreaSqm: slopedArea,
        pitchDeg: pitch,
        setbackRatio: 0.82,
        panelWattage: 580,
      });

      if (pitch === 0) {
        initialCount = packing.placedPanels.length;
        expect(initialCount).toBeGreaterThan(0);
      }

      // Panels must never disappear when tilting the roof
      expect(packing.placedPanels.length).toBeGreaterThanOrEqual(initialCount);
    }
  });
});
