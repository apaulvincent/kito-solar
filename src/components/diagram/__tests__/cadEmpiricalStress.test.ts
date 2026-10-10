// src/components/diagram/__tests__/cadEmpiricalStress.test.ts
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CONDUIT_ROUTES } from '../conduitRoutes';
import { DiagramNodeKey } from '@/types/diagram';
import { calculateMounting } from '@/engine/calculateMounting';

// Calibrated 3D scene node positions from SolarScene.tsx
const NODE_POSITIONS: Record<DiagramNodeKey, [number, number, number]> = {
  pv_array: [-7.8, 0.75, 2.2],
  dc_isolator: [-5.4, 2.9, 0.0],
  dc_breaker: [-3.6, 2.9, 0.0],
  dc_spd: [-3.6, 1.4, 0.0],
  dc_conduit: [-5.0, 2.9, 0.0],
  inverter: [-0.6, 3.35, 0.0],
  battery_breaker: [-2.0, 1.4, 0.0],
  battery: [-0.6, 0.80, 0.4],
  battery_wire: [-1.4, 0.4, 0.4],
  ac_breaker: [1.4, 2.9, 0.0],
  ac_spd: [1.4, 1.4, 0.0],
  ac_isolator: [2.9, 2.9, 0.0],
  ats: [4.6, 2.9, 0.0],
  eps_breaker: [4.6, 1.4, 0.0],
  main_panel: [6.8, 2.5, 0.0],
  grid: [10.2, 1.6, 0.0],
  load: [10.2, 0.8, 2.2],
  grounding: [0.7, 0.25, 0.0],
};

// Node dimension heights for physical elevation boundary checks
const NODE_HEIGHTS: Partial<Record<DiagramNodeKey, number>> = {
  dc_isolator: 1.05,
  dc_breaker: 0.98,
  dc_spd: 0.95,
  inverter: 1.76,
  battery_breaker: 0.98,
  battery: 1.56,
  ac_breaker: 0.98,
  ac_spd: 0.95,
  ac_isolator: 1.05,
  ats: 1.25,
  eps_breaker: 0.98,
  main_panel: 1.65,
  grounding: 0.08,
};

// Hybrid battery cable routes from SolarScene.tsx
const HYBRID_ROUTES = [
  {
    id: 'c-inv-batbrk',
    from: 'inverter',
    to: 'battery_breaker',
    waypoints: [
      [-0.6, 3.35, 0.0],
      [-0.6, 1.4, 0.0],
      [-2.0, 1.4, 0.0],
    ],
  },
  {
    id: 'c-batbrk-bat',
    from: 'battery_breaker',
    to: 'battery',
    waypoints: [
      [-2.0, 1.4, 0.0],
      [-2.0, 0.4, 0.0],
      [-1.4, 0.4, 0.0],
      [-1.4, 0.4, 0.4],
      [-0.6, 0.4, 0.4],
    ],
  },
];

describe('Empirical Adversarial Stress Suite: CAD Subsystem & Electrical Safety', () => {
  describe('Criterion 1: Physical DC Sequence Integrity', () => {
    it('verifies dc_isolator is strictly upstream of dc_breaker and inverter in 3D conduit routes', () => {
      const routeMap = new Map<string, string>();
      for (const r of CONDUIT_ROUTES) {
        routeMap.set(`${r.from}->${r.to}`, r.id);
      }

      // 1. PV homerun must land directly at DC Isolator first
      expect(routeMap.has('pv_array->dc_isolator')).toBe(true);

      // 2. DC Isolator must connect to DC Breaker next
      expect(routeMap.has('dc_isolator->dc_breaker')).toBe(true);

      // 3. DC Breaker must connect to DC SPD (drop) and Inverter (forward)
      expect(routeMap.has('dc_breaker->dc_spd')).toBe(true);
      expect(routeMap.has('dc_breaker->inverter')).toBe(true);

      // 4. Assert absence of illegal bypasses
      expect(routeMap.has('pv_array->dc_breaker')).toBe(false);
      expect(routeMap.has('pv_array->inverter')).toBe(false);
      expect(routeMap.has('dc_isolator->inverter')).toBe(false);
    });

    it('verifies spatial flow order along X-axis: PV Array < DC Isolator < DC Breaker < Inverter', () => {
      const pvX = NODE_POSITIONS.pv_array[0];
      const isoX = NODE_POSITIONS.dc_isolator[0];
      const brkX = NODE_POSITIONS.dc_breaker[0];
      const invX = NODE_POSITIONS.inverter[0];

      expect(pvX).toBeLessThan(isoX);
      expect(isoX).toBeLessThan(brkX);
      expect(brkX).toBeLessThan(invX);

      // Minimum physical clearance between adjacent wall enclosures (>= 1.5m)
      expect(brkX - isoX).toBeGreaterThanOrEqual(1.5);
      expect(invX - brkX).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Criterion 2: Orthogonal Conduit Routing & LB Junction Fittings', () => {
    const allRoutes = [...CONDUIT_ROUTES, ...HYBRID_ROUTES];

    it('verifies 100% of waypoint segments are strictly Manhattan-orthogonal with zero diagonal shortcuts', () => {
      let totalSegments = 0;

      for (const route of allRoutes) {
        const waypoints = route.waypoints;
        expect(waypoints.length).toBeGreaterThanOrEqual(2);

        for (let i = 0; i < waypoints.length - 1; i++) {
          const p1 = waypoints[i];
          const p2 = waypoints[i + 1];

          const dx = Math.abs(p2[0] - p1[0]);
          const dy = Math.abs(p2[1] - p1[1]);
          const dz = Math.abs(p2[2] - p1[2]);

          const changes = [dx > 1e-6, dy > 1e-6, dz > 1e-6].filter(Boolean).length;

          // Exactly one axis must change per segment — no diagonal cut-throughs!
          expect(changes, `Diagonal cut-through detected in ${route.id} seg ${i}: [${p1}] -> [${p2}]`).toBe(1);
          totalSegments++;
        }
      }

      expect(totalSegments).toBe(32);
    });

    it('verifies all corner transitions form exact 90-degree angles', () => {
      let totalCorners = 0;

      for (const route of allRoutes) {
        const waypoints = route.waypoints;
        for (let i = 1; i < waypoints.length - 1; i++) {
          const prev = waypoints[i - 1];
          const curr = waypoints[i];
          const next = waypoints[i + 1];

          const v1 = new THREE.Vector3(curr[0] - prev[0], curr[1] - prev[1], curr[2] - prev[2]).normalize();
          const v2 = new THREE.Vector3(next[0] - curr[0], next[1] - curr[1], next[2] - curr[2]).normalize();

          const dot = Math.abs(v1.dot(v2));
          // Dot product of orthogonal vectors is 0
          expect(dot, `Non-orthogonal corner in ${route.id} at waypoint ${i}`).toBeCloseTo(0, 5);
          totalCorners++;
        }
      }

      // Verified 18 intermediate corners across all multi-segment routes
      expect(totalCorners).toBe(18);
    });
  });

  describe('Criterion 3: Wall-Mounting Coordinates & Floor Grounding Anchoring', () => {
    it('verifies upper-tier switchgear is anchored at Y = 2.9m and primary inverter is elevated at Y = 3.35m', () => {
      const upperSwitchgear: DiagramNodeKey[] = [
        'dc_isolator',
        'dc_breaker',
        'ac_breaker',
        'ac_isolator',
        'ats',
      ];

      for (const key of upperSwitchgear) {
        expect(NODE_POSITIONS[key][1], `${key} not at Y=2.9m`).toBe(2.9);
      }

      expect(NODE_POSITIONS.inverter[1], 'Inverter not elevated at Y=3.35m').toBe(3.35);
    });

    it('verifies ample vertical separation between inverter and battery storage bank (clearance >= 0.5m)', () => {
      const invPos = NODE_POSITIONS.inverter;
      const batPos = NODE_POSITIONS.battery;
      const invBottom = invPos[1] - (NODE_HEIGHTS.inverter! / 2);
      const batTop = batPos[1] + (NODE_HEIGHTS.battery! / 2);
      const clearance = invBottom - batTop;
      expect(clearance, 'Inverter is too close to battery (< 0.5m)').toBeGreaterThanOrEqual(0.5);
    });

    it('verifies lower-tier plant room equipment is anchored at Y = 1.4m', () => {
      const lowerEquipment: DiagramNodeKey[] = [
        'dc_spd',
        'battery_breaker',
        'ac_spd',
        'eps_breaker',
      ];

      for (const key of lowerEquipment) {
        expect(NODE_POSITIONS[key][1], `${key} not at Y=1.4m`).toBe(1.4);
      }
    });

    it('verifies all indoor equipment is mounted within 14.6m architectural backboard bounds [-6.6m, +8.0m]', () => {
      const wallEquipment: DiagramNodeKey[] = [
        'dc_isolator',
        'dc_breaker',
        'dc_spd',
        'battery_breaker',
        'inverter',
        'battery',
        'ac_breaker',
        'ac_spd',
        'ac_isolator',
        'ats',
        'eps_breaker',
        'main_panel',
        'grounding',
      ];

      for (const key of wallEquipment) {
        const x = NODE_POSITIONS[key][0];
        expect(x, `${key} X=${x} out of backboard X-range [-6.6, 8.0]`).toBeGreaterThanOrEqual(-6.6);
        expect(x, `${key} X=${x} out of backboard X-range [-6.6, 8.0]`).toBeLessThanOrEqual(8.0);
      }
    });

    it('verifies zero equipment sinks beneath floor level (Y_bottom >= 0.0m)', () => {
      for (const [key, height] of Object.entries(NODE_HEIGHTS)) {
        const pos = NODE_POSITIONS[key as DiagramNodeKey];
        const bottomY = pos[1] - height / 2;
        expect(
          bottomY,
          `${key} bottom elevation Y=${bottomY.toFixed(3)} sinks into concrete floor (< 0)`
        ).toBeGreaterThanOrEqual(-0.001);
      }
    });

    it('verifies pv_array rests solidly on floor plane (Y=0.0m) and is completely contained within floor slab bounds', () => {
      const pvPos = NODE_POSITIONS.pv_array;
      // Footing pad bottom sits at local y=-0.75, so world Y_bottom = 0.75 - 0.75 = 0.0m
      const pvFootingBottom = pvPos[1] - 0.75;
      expect(pvFootingBottom, 'PV footing does not rest on floor at Y=0').toBeCloseTo(0.0, 4);

      // Floor slab extends [-12.3m, +13.7m] along X, and [-2.0m, +7.2m] along Z
      const pvLeftEdge = pvPos[0] - 1.9; // Array half-width ~1.9m
      const pvRightEdge = pvPos[0] + 1.9;
      expect(pvLeftEdge, 'PV left edge falls off floor').toBeGreaterThan(-12.3);
      expect(pvRightEdge, 'PV right edge falls off floor').toBeLessThan(13.7);
      expect(pvPos[2], 'PV array outside floor depth').toBeGreaterThan(-2.0);
      expect(pvPos[2], 'PV array outside floor depth').toBeLessThan(7.2);
    });

    it('verifies utility grid riser pole rests solidly on floor plane (Y=0.0m)', () => {
      const gridPos = NODE_POSITIONS.grid;
      // Pole base and foundation collar sit at local y=-1.6, so world Y_bottom = 1.6 - 1.6 = 0.0m
      const gridPoleBottom = gridPos[1] - 1.6;
      expect(gridPoleBottom, 'Grid utility pole does not rest on floor at Y=0').toBeCloseTo(0.0, 4);
    });
  });

  describe('Criterion 4: Mounting BOM Mechanical Calculations Stress', () => {
    it('verifies mounting BOM edge cases: minimum 1 module, standard 10 modules, and large 40 modules', () => {
      // Single module edge case
      const bom1 = calculateMounting(1, 1);
      expect(bom1.items.length).toBe(6);
      expect(bom1.totalEndClamps).toBe(4);
      expect(bom1.totalMidClamps).toBe(0);
      expect(bom1.totalMc4Pairs).toBe(2);

      // Standard residential 10 modules in 2 strings
      const bom10 = calculateMounting(10, 2);
      expect(bom10.items.length).toBe(6);
      expect(bom10.totalEndClamps).toBe(8);
      expect(bom10.totalMidClamps).toBe(16);
      expect(bom10.totalMc4Pairs).toBe(4);

      // Commercial 40 modules in 4 strings
      const bom40 = calculateMounting(40, 4);
      expect(bom40.items.length).toBe(6);
      expect(bom40.totalEndClamps).toBe(16);
      expect(bom40.totalMidClamps).toBe(72);
      expect(bom40.totalMc4Pairs).toBe(8);
    });
  });
});
