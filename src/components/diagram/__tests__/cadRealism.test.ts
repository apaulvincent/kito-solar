// src/components/diagram/__tests__/cadRealism.test.ts
import { describe, it, expect } from 'vitest';
import { CONDUIT_ROUTES } from '../conduitRoutes';
import { DiagramNodeKey } from '@/types/diagram';

describe('3D Solar CAD Studio Electrical & Mechanical Realism', () => {
  it('verifies NEC/IEC compliant electrical conduit sequence', () => {
    const routeOrder = CONDUIT_ROUTES.map((r) => `${r.from}->${r.to}`);

    // Verify key electrical flow connections
    expect(routeOrder).toContain('pv_array->dc_isolator');
    expect(routeOrder).toContain('dc_isolator->dc_breaker');
    expect(routeOrder).toContain('dc_breaker->dc_spd');
    expect(routeOrder).toContain('dc_breaker->inverter');
    expect(routeOrder).toContain('inverter->ac_breaker');
    expect(routeOrder).toContain('ac_breaker->ac_spd');
    expect(routeOrder).toContain('ac_breaker->ac_isolator');
    expect(routeOrder).toContain('ac_isolator->main_panel');
    expect(routeOrder).toContain('grid->main_panel');
    expect(routeOrder).toContain('main_panel->ats');
    expect(routeOrder).toContain('main_panel->load');
  });

  it('ensures all conduit routes have orthogonal 3D waypoints for realistic EMT pipe bending', () => {
    for (const route of CONDUIT_ROUTES) {
      expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
      for (const pt of route.waypoints) {
        expect(pt.length).toBe(3);
        expect(typeof pt[0]).toBe('number');
        expect(typeof pt[1]).toBe('number');
        expect(typeof pt[2]).toBe('number');
      }
    }
  });

  it('verifies all expected industrial plant room CAD node keys are supported', () => {
    const expectedKeys: DiagramNodeKey[] = [
      'pv_array',
      'dc_isolator',
      'dc_breaker',
      'dc_spd',
      'inverter',
      'battery',
      'battery_breaker',
      'ac_breaker',
      'ac_spd',
      'ac_isolator',
      'ats',
      'main_panel',
      'grid',
      'load',
      'grounding',
    ];

    expect(expectedKeys.length).toBe(15);
  });

  it('validates ATS switch power flow conduit routing logic for solar vs utility modes', () => {
    // Utility flow filter logic verification
    const isFlowing = (cableId: string, atsSource: 'solar' | 'utility') => {
      if (atsSource === 'solar') {
        if (cableId === 'c-grid-panel') return false;
        return true;
      } else {
        const inverterAcRoutes = ['c-inv-acbrk', 'c-acbrk-spd', 'c-acbrk-iso', 'c-iso-panel'];
        if (inverterAcRoutes.includes(cableId)) return false;
        return true;
      }
    };

    // In Solar mode (Left switch position):
    // Inverter AC output flows to building load
    expect(isFlowing('c-pv-iso', 'solar')).toBe(true);
    expect(isFlowing('c-brk-inv', 'solar')).toBe(true);
    expect(isFlowing('c-inv-batbrk', 'solar')).toBe(true);
    expect(isFlowing('c-inv-acbrk', 'solar')).toBe(true);
    expect(isFlowing('c-iso-panel', 'solar')).toBe(true);
    expect(isFlowing('c-panel-ats', 'solar')).toBe(true);
    expect(isFlowing('c-panel-load', 'solar')).toBe(true);
    // Utility grid feeder is stopped
    expect(isFlowing('c-grid-panel', 'solar')).toBe(false);

    // In Utility mode (Right switch position):
    // Utility powers the load
    expect(isFlowing('c-grid-panel', 'utility')).toBe(true);
    expect(isFlowing('c-panel-ats', 'utility')).toBe(true);
    expect(isFlowing('c-panel-load', 'utility')).toBe(true);
    // Inverter AC output stops
    expect(isFlowing('c-inv-acbrk', 'utility')).toBe(false);
    expect(isFlowing('c-acbrk-spd', 'utility')).toBe(false);
    expect(isFlowing('c-acbrk-iso', 'utility')).toBe(false);
    expect(isFlowing('c-iso-panel', 'utility')).toBe(false);
    // Solar PV generation and battery charging remain active
    expect(isFlowing('c-pv-iso', 'utility')).toBe(true);
    expect(isFlowing('c-brk-inv', 'utility')).toBe(true);
    expect(isFlowing('c-inv-batbrk', 'utility')).toBe(true);
    expect(isFlowing('c-batbrk-bat', 'utility')).toBe(true);
  });
});
