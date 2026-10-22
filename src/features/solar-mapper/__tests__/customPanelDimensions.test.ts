import { describe, it, expect } from 'vitest';
import { calculatePanelPacking } from '../utils/panelPackingEngine';
import { LocalPoint, PANEL_SPECS } from '../types/solarMapper';

describe('Custom Panel Dimensions & Specs in Packing Engine', () => {
  // A 10m x 10m square flat roof
  const squareRoof: LocalPoint[] = [
    { x: -5, y: -5 },
    { x: 5, y: -5 },
    { x: 5, y: 5 },
    { x: -5, y: 5 },
  ];
  const slopedAreaSqm = 100;

  it('packs default standard 580W panels (2.278m x 1.134m)', () => {
    const result = calculatePanelPacking({
      localVertices: squareRoof,
      slopedAreaSqm,
      pitchDeg: 0,
      panelWattage: 580,
    });

    expect(result.placedPanels.length).toBeGreaterThan(0);
    expect(result.placedPanels[0].widthM).toBeCloseTo(1.134, 2);
    expect(result.placedPanels[0].lengthM).toBeCloseTo(2.278, 2);
  });

  it('packs custom smaller residential panels (e.g. 1.72m x 1.13m, 400W)', () => {
    const customWidthM = 1.13;
    const customLengthM = 1.72;
    const customWattage = 400;

    const result = calculatePanelPacking({
      localVertices: squareRoof,
      slopedAreaSqm,
      pitchDeg: 0,
      customWidthM,
      customLengthM,
      customWattage,
    });

    expect(result.placedPanels.length).toBeGreaterThan(0);
    // Because smaller panels have smaller unit footprint, more panels should pack than with 580W
    const standard580 = calculatePanelPacking({
      localVertices: squareRoof,
      slopedAreaSqm,
      pitchDeg: 0,
      panelWattage: 580,
    });

    expect(result.recommendedMaxPanels).toBeGreaterThanOrEqual(standard580.recommendedMaxPanels);
    expect(result.placedPanels[0].widthM).toBeCloseTo(customWidthM, 2);
    expect(result.placedPanels[0].lengthM).toBeCloseTo(customLengthM, 2);
    expect(result.totalArrayKwp).toBeCloseTo(
      (result.recommendedMaxPanels * customWattage) / 1000,
      2
    );
  });

  it('packs custom large-format commercial panels (e.g. 2.45m x 1.35m, 650W)', () => {
    const customWidthM = 1.35;
    const customLengthM = 2.45;
    const customWattage = 650;

    const result = calculatePanelPacking({
      localVertices: squareRoof,
      slopedAreaSqm,
      pitchDeg: 0,
      customWidthM,
      customLengthM,
      customWattage,
    });

    expect(result.placedPanels.length).toBeGreaterThan(0);
    expect(result.placedPanels[0].widthM).toBeCloseTo(customWidthM, 2);
    expect(result.placedPanels[0].lengthM).toBeCloseTo(customLengthM, 2);
    expect(result.totalArrayKwp).toBeCloseTo(
      (result.recommendedMaxPanels * customWattage) / 1000,
      2
    );
  });
});
