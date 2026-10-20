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

  it('initializes with Batangas regional preset as default location', () => {
    const state = useSolarMapperStore.getState();
    expect(state.coordinates.lat).toBeCloseTo(14.044, 2);
    expect(state.coordinates.lng).toBeCloseTo(121.158, 2);
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
});
