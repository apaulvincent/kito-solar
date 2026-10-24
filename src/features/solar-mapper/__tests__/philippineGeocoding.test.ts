// src/features/solar-mapper/__tests__/philippineGeocoding.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchLocations,
  isWithinPhilippineBounds,
} from '../services/geocodingService';

describe('Philippine Geocoding & Address Prioritization Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly determines whether coordinates are within the Philippine territory', () => {
    // Metro Manila
    expect(isWithinPhilippineBounds(14.5995, 120.9842)).toBe(true);
    // Batangas
    expect(isWithinPhilippineBounds(14.044, 121.158)).toBe(true);
    // Cebu City
    expect(isWithinPhilippineBounds(10.3157, 123.8854)).toBe(true);
    // Davao City
    expect(isWithinPhilippineBounds(7.1907, 125.4553)).toBe(true);
    // Basco, Batanes (Far North)
    expect(isWithinPhilippineBounds(20.4485, 121.9708)).toBe(true);
    // Bongao, Tawi-Tawi (Far South)
    expect(isWithinPhilippineBounds(5.0286, 119.7731)).toBe(true);

    // Foreign locations (must be false)
    expect(isWithinPhilippineBounds(35.6762, 139.6503)).toBe(false); // Tokyo
    expect(isWithinPhilippineBounds(29.4241, -98.4936)).toBe(false); // San Antonio, TX
    expect(isWithinPhilippineBounds(1.3521, 103.8198)).toBe(false); // Singapore
  });

  it('immediately recognizes direct coordinate queries and tags Philippine bounds', async () => {
    // Philippine coordinates
    const phCoords = await searchLocations('14.5547, 121.0244');
    expect(phCoords.length).toBe(1);
    expect(phCoords[0].coordinates.lat).toBeCloseTo(14.5547, 4);
    expect(phCoords[0].coordinates.lng).toBeCloseTo(121.0244, 4);
    expect(phCoords[0].isPhilippine).toBe(true);
    expect(phCoords[0].displayName).toContain('Philippines');

    // Outside coordinates
    const foreignCoords = await searchLocations('51.5074, -0.1278');
    expect(foreignCoords.length).toBe(1);
    expect(foreignCoords[0].isPhilippine).toBe(false);
  });

  it('provides instant zero-latency suggestions for popular Philippine cities and solar hubs', async () => {
    // Global fetch is mocked to avoid external calls or timeouts
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    );

    // Search by alias "bgc"
    const bgcResults = await searchLocations('bgc');
    expect(bgcResults.length).toBeGreaterThan(0);
    expect(bgcResults[0].shortName).toContain('Bonifacio Global City');
    expect(bgcResults[0].isPhilippine).toBe(true);

    // Search "makati"
    const makatiResults = await searchLocations('makati');
    expect(makatiResults.some((r) => r.shortName.toLowerCase().includes('makati'))).toBe(true);

    // Search "nuvali"
    const nuvaliResults = await searchLocations('nuvali');
    expect(nuvaliResults.some((r) => r.shortName.toLowerCase().includes('nuvali') || r.shortName.toLowerCase().includes('santa rosa'))).toBe(true);

    // Search "clark"
    const clarkResults = await searchLocations('clark');
    expect(clarkResults.some((r) => r.shortName.toLowerCase().includes('clark'))).toBe(true);

    // Search "cebu"
    const cebuResults = await searchLocations('cebu');
    expect(cebuResults.some((r) => r.shortName.toLowerCase().includes('cebu'))).toBe(true);
  });

  it('queries Nominatim with countrycodes=ph parameter to focus suggestions on the Philippines', async () => {
    let capturedUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              place_id: 123456,
              lat: '14.5869',
              lon: '121.0614',
              display_name: 'San Antonio, Pasig, Metro Manila, 1600, Philippines',
              address: {
                suburb: 'San Antonio',
                city: 'Pasig',
                state: 'Metro Manila',
                country_code: 'ph',
              },
            },
          ]),
          { status: 200 }
        )
      );
    });

    const results = await searchLocations('San Antonio');
    expect(capturedUrl).toContain('countrycodes=ph');
    expect(results.length).toBeGreaterThan(0);

    const phResult = results.find((r) => r.placeId === '123456');
    expect(phResult).toBeDefined();
    expect(phResult?.shortName).toBe('San Antonio, Pasig');
    expect(phResult?.isPhilippine).toBe(true);
  });

  it('formats address short names into readable Philippine locality and province', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              place_id: 998877,
              lat: '14.5547',
              lon: '121.0244',
              display_name: 'Ayala Avenue, Bel-Air, Makati, Metro Manila, 1226, Philippines',
              address: {
                road: 'Ayala Avenue',
                suburb: 'Bel-Air',
                city: 'Makati',
                state: 'Metro Manila',
                country_code: 'ph',
              },
            },
          ]),
          { status: 200 }
        )
      );
    });

    const results = await searchLocations('Ayala Ave');
    const ayala = results.find((r) => r.placeId === '998877');
    expect(ayala).toBeDefined();
    expect(ayala?.shortName).toBe('Ayala Avenue, Makati');
    expect(ayala?.isPhilippine).toBe(true);
  });
});
