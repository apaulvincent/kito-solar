// src/features/solar-mapper/__tests__/solarMapperIntegration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { REGIONAL_PRESETS } from '../services/regionalPresets';

describe('Solar Mapper Zustand Store & Integration Suite', () => {
  beforeEach(() => {
    // Reset store state
    useSolarMapperStore.setState({
      roofSections: [],
      activeSectionId: null,
      isDrawingMode: false,
      designBasis: 'annual_avg',
      panelWattage: 580,
    });
  });

  it('initializes with Samson Street, Baritan, Malabon (NCR) regional preset as default location', () => {
    const state = useSolarMapperStore.getState();
    expect(state.coordinates.lat).toBeCloseTo(14.6704, 2);
    expect(state.coordinates.lng).toBeCloseTo(120.9477, 2);
    expect(state.coordinates.locationName).toContain('Samson Street, Baritan, Malabon');
    expect(state.irradianceProfile).toBeDefined();
    expect(state.irradianceProfile.annualAvgEffectivePsh).toBeGreaterThan(4.0);
  });

  it('allows adding and removing roof sections', () => {
    const id = useSolarMapperStore.getState().addRoofSection('Main House South');
    let state = useSolarMapperStore.getState();
    expect(state.roofSections.length).toBe(1);
    expect(state.activeSectionId).toBe(id);
    expect(state.roofSections[0].name).toBe('Main House South');

    useSolarMapperStore.getState().removeRoofSection(id);
    state = useSolarMapperStore.getState();
    expect(state.roofSections.length).toBe(0);
    expect(state.activeSectionId).toBeNull();
  });

  it('loads realistic demo 4-corner roof and computes solar metrics', () => {
    useSolarMapperStore.getState().loadDemoRoofPolygon();
    const state = useSolarMapperStore.getState();

    expect(state.roofSections.length).toBe(1);
    const sec = state.roofSections[0];
    expect(sec.vertices.length).toBe(4);
    expect(sec.flatAreaSqm).toBeGreaterThan(50);
    expect(sec.slopedAreaSqm).toBeGreaterThanOrEqual(sec.flatAreaSqm);
    expect(sec.recommendedMaxPanels).toBeGreaterThan(0);
    expect(sec.maxArrayKwp).toBeGreaterThan(0);
    expect(sec.hasBowtieCross).toBe(false);

    const summary = useSolarMapperStore.getState().getSummary();
    expect(summary.totalMaxPanels).toBe(sec.recommendedMaxPanels);
    expect(summary.totalMaxKwp).toBe(sec.maxArrayKwp);
  });

  it('updates design basis and returns correct PSH tier', () => {
    const store = useSolarMapperStore.getState();
    store.setDesignBasis('worst_month');
    const worstPsh = useSolarMapperStore.getState().getSelectedPsh();

    store.setDesignBasis('annual_avg');
    const avgPsh = useSolarMapperStore.getState().getSelectedPsh();

    expect(worstPsh).toBeLessThan(avgPsh);
  });

  it('defaults new and sample roofs to flat (0° pitch)', () => {
    // 1. Manually added section
    const id = useSolarMapperStore.getState().addRoofSection('Flat House');
    const sec = useSolarMapperStore.getState().roofSections[0];
    expect(sec.pitchDeg).toBe(0);
    expect(sec.pivotEdgeIndex).toBe(0);

    // 2. Demo sample roof
    useSolarMapperStore.getState().loadDemoRoofPolygon();
    const demoSec = useSolarMapperStore.getState().roofSections[0];
    expect(demoSec.pitchDeg).toBe(0);
    expect(demoSec.pivotEdgeIndex).toBe(0);
    expect(demoSec.slopedAreaSqm).toBe(demoSec.flatAreaSqm);
  });

  it('translates roof sections across horizontal ground plane cleanly', () => {
    useSolarMapperStore.getState().loadDemoRoofPolygon();
    const secBefore = useSolarMapperStore.getState().roofSections[0];
    const initialLat = secBefore.vertices[0].lat;
    const initialLng = secBefore.vertices[0].lng;

    // Translate by 5m East and 2m North
    useSolarMapperStore.getState().translateRoofSection(secBefore.id, 5.0, 2.0);
    const secAfter = useSolarMapperStore.getState().roofSections[0];

    // Footprint area should remain invariant under translation
    expect(secAfter.flatAreaSqm).toBeCloseTo(secBefore.flatAreaSqm, 1);
    expect(secAfter.recommendedMaxPanels).toBe(secBefore.recommendedMaxPanels);
    expect(secAfter.vertices[0].lat).toBeGreaterThan(initialLat);
    expect(secAfter.vertices[0].lng).toBeGreaterThan(initialLng);
  });

  it('sets roof section pivot edge and automatically updates downslope azimuth', () => {
    useSolarMapperStore.getState().loadDemoRoofPolygon();
    const sec = useSolarMapperStore.getState().roofSections[0];

    // By default edge 0 faces South (180°)
    useSolarMapperStore.getState().setRoofSectionPivotEdge(sec.id, 1);
    const secEdge1 = useSolarMapperStore.getState().roofSections[0];
    expect(secEdge1.pivotEdgeIndex).toBe(1);
    // Side 1 faces East (90°)
    expect(secEdge1.azimuthDeg).toBeCloseTo(90, 0);

    // Switch to Side 2
    useSolarMapperStore.getState().setRoofSectionPivotEdge(sec.id, 2);
    const secEdge2 = useSolarMapperStore.getState().roofSections[0];
    expect(secEdge2.pivotEdgeIndex).toBe(2);
    // Side 2 faces North (0° / 360°)
    expect(secEdge2.azimuthDeg % 360).toBeCloseTo(0, 0);
  });

  it('automatically initializes a fresh active roof section when drawing with no active selection', () => {
    // Start with 1 closed demo roof but activeSectionId set to null (e.g. user clicked outside)
    useSolarMapperStore.getState().loadDemoRoofPolygon();
    useSolarMapperStore.getState().setActiveSectionId(null);

    let state = useSolarMapperStore.getState();
    expect(state.activeSectionId).toBeNull();
    expect(state.roofSections.length).toBe(1);
    expect(state.roofSections[0].vertices.length).toBe(4);

    // User starts drawing a new roof: adds first vertex
    const newPoint = { lat: 14.05, lng: 121.16 };
    useSolarMapperStore.getState().addVertexToActiveSection(newPoint);

    state = useSolarMapperStore.getState();
    // Must create a new section, activate it, and NOT corrupt the demo roof
    expect(state.roofSections.length).toBe(2);
    expect(state.activeSectionId).toBe(state.roofSections[1].id);
    expect(state.roofSections[0].vertices.length).toBe(4); // Untouched
    expect(state.roofSections[1].vertices.length).toBe(1);
    expect(state.roofSections[1].vertices[0]).toEqual(newPoint);

    // Add 2nd, 3rd, and 4th vertex to create a 4-corner rectangle roof
    useSolarMapperStore.getState().addVertexToActiveSection({ lat: 14.05, lng: 121.1601 });
    useSolarMapperStore.getState().addVertexToActiveSection({ lat: 14.0501, lng: 121.1601 });
    useSolarMapperStore.getState().addVertexToActiveSection({ lat: 14.0501, lng: 121.16 });

    state = useSolarMapperStore.getState();
    // Must NOT split or create extra roof sections at 3 or 4 points
    expect(state.roofSections.length).toBe(2);
    expect(state.activeSectionId).toBe(state.roofSections[1].id);
    expect(state.roofSections[1].vertices.length).toBe(4);
    expect(state.roofSections[1].flatAreaSqm).toBeGreaterThan(0);
  });
});
