// src/features/solar-mapper/__tests__/panelPackingEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculatePanelPacking,
  isPointInPolygon,
  insetPolygon,
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

    // 60m² * 0.82 = 49.2 m² usable area
    expect(packing.usableAreaSqm).toBeCloseTo(49.2, 1);

    // Each 580W panel with 20mm gap is ~1.154m x 2.298m ≈ 2.65 m²
    // Theoretical max ~ 49.2 / 2.65 ≈ 18 panels
    expect(packing.recommendedMaxPanels).toBeGreaterThanOrEqual(10);
    expect(packing.recommendedMaxPanels).toBeLessThanOrEqual(20);
    expect(packing.placedPanels.length).toBe(packing.recommendedMaxPanels);

    // Total kWp should match panelCount * 580W
    const expectedKwp = Math.round(((packing.recommendedMaxPanels * 580) / 1000) * 100) / 100;
    expect(packing.totalArrayKwp).toBe(expectedKwp);
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
});
