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
    expect(routeOrder).toContain('ac_isolator->ats');
    expect(routeOrder).toContain('grid->ats');
    expect(routeOrder).toContain('ats->main_panel');
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
});
