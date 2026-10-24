// src/features/solar-mapper/__tests__/basemapProvider.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSolarMapperStore } from '../store/useSolarMapperStore';

describe('Basemap Provider & High-Resolution Tile Engine', () => {
  beforeEach(() => {
    useSolarMapperStore.setState({
      basemapProvider: 'google_satellite',
      zoom: 19,
    });
  });

  it('defaults to Google Satellite (HD) as the primary high-resolution imagery provider', () => {
    const state = useSolarMapperStore.getState();
    expect(state.basemapProvider).toBe('google_satellite');
  });

  it('allows seamless switching between Google Satellite, Google Hybrid, Esri, and OSM', () => {
    const store = useSolarMapperStore.getState();

    store.setBasemapProvider('google_hybrid');
    expect(useSolarMapperStore.getState().basemapProvider).toBe('google_hybrid');

    store.setBasemapProvider('esri_satellite');
    expect(useSolarMapperStore.getState().basemapProvider).toBe('esri_satellite');

    store.setBasemapProvider('osm_streets');
    expect(useSolarMapperStore.getState().basemapProvider).toBe('osm_streets');

    store.setBasemapProvider('google_satellite');
    expect(useSolarMapperStore.getState().basemapProvider).toBe('google_satellite');
  });

  it('supports zoom level up to 21 without throwing errors', () => {
    const store = useSolarMapperStore.getState();
    store.setZoom(20);
    expect(useSolarMapperStore.getState().zoom).toBe(20);

    store.setZoom(21);
    expect(useSolarMapperStore.getState().zoom).toBe(21);
  });
});
