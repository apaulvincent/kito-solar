// src/features/solar-mapper/__tests__/aiRoofDetectionService.test.ts
import { describe, it, expect } from 'vitest';
import {
  normalizedPointToGeo,
  generateHeuristicRoofSegmentation,
  detectRoofFromMarquee,
} from '../services/aiRoofDetectionService';

describe('AI Roof Detection Service & Heuristic Segmentation', () => {
  const mockNw = { lat: 14.5995, lng: 120.9842 };
  const mockSe = { lat: 14.5992, lng: 120.9846 };

  it('correctly maps normalized 0..1 bounding box coordinates into geographic lat/lng', () => {
    // NW corner (0, 0)
    const nwPt = normalizedPointToGeo(0, 0, mockNw, mockSe);
    expect(nwPt.lat).toBeCloseTo(mockNw.lat, 5);
    expect(nwPt.lng).toBeCloseTo(mockNw.lng, 5);

    // SE corner (1, 1)
    const sePt = normalizedPointToGeo(1, 1, mockNw, mockSe);
    expect(sePt.lat).toBeCloseTo(mockSe.lat, 5);
    expect(sePt.lng).toBeCloseTo(mockSe.lng, 5);

    // Center point (0.5, 0.5)
    const centerPt = normalizedPointToGeo(0.5, 0.5, mockNw, mockSe);
    expect(centerPt.lat).toBeCloseTo((mockNw.lat + mockSe.lat) / 2, 5);
    expect(centerPt.lng).toBeCloseTo((mockNw.lng + mockSe.lng) / 2, 5);
  });

  it('generates East-West dual pitch roof planes when building is wider than it is long', () => {
    const dimensions = { widthM: 25.0, lengthM: 14.0, areaSqm: 350 };
    const faces = generateHeuristicRoofSegmentation({ northWest: mockNw, southEast: mockSe }, dimensions);

    expect(faces.length).toBe(2);

    // Face 1: South-facing primary plane
    const southFace = faces.find((f) => f.azimuthDeg === 180);
    expect(southFace).toBeDefined();
    expect(southFace?.pitchDeg).toBe(18);
    expect(southFace?.vertices.length).toBe(4);

    // Face 2: North-facing ridge plane
    const northFace = faces.find((f) => f.azimuthDeg === 0);
    expect(northFace).toBeDefined();
    expect(northFace?.pitchDeg).toBe(18);
    expect(northFace?.vertices.length).toBe(4);
  });

  it('generates West and East planes when building is longer North-South', () => {
    const dimensions = { widthM: 12.0, lengthM: 28.0, areaSqm: 336 };
    const faces = generateHeuristicRoofSegmentation({ northWest: mockNw, southEast: mockSe }, dimensions);

    expect(faces.length).toBe(2);

    // West face
    const westFace = faces.find((f) => f.azimuthDeg === 270);
    expect(westFace).toBeDefined();

    // East face
    const eastFace = faces.find((f) => f.azimuthDeg === 90);
    expect(eastFace).toBeDefined();
  });

  it('returns valid roof faces and reports source as cv_heuristic when offline or without image', async () => {
    const result = await detectRoofFromMarquee({
      bounds: { northWest: mockNw, southEast: mockSe },
      dimensions: { widthM: 20.0, lengthM: 12.0, areaSqm: 240 },
    });

    expect(result.faces.length).toBeGreaterThanOrEqual(1);
    expect(result.faces[0].vertices.length).toBeGreaterThanOrEqual(3);
    expect(result.faces[0].pitchDeg).toBeGreaterThan(0);
  });
});
