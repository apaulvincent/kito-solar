// src/components/diagram/conduitRoutes.ts
import { ConduitRoute } from '@/types/diagram';

export const CONDUIT_ROUTES: ConduitRoute[] = [
  // 1. PV Array to DC Isolator (Outdoor homerun entering plant room wall via 90° LB Fitting)
  {
    id: 'c-pv-iso',
    from: 'pv_array',
    to: 'dc_isolator',
    type: 'dc',
    color: '#D97706',
    waypoints: [
      [-7.8, 0.75, 2.2],
      [-7.8, 0.75, 0.0],
      [-6.8, 0.75, 0.0],
      [-6.8, 2.9, 0.0],
      [-5.4, 2.9, 0.0],
    ],
  },
  // 2. DC Isolator to DC Breaker (Horizontal Unistrut Run)
  {
    id: 'c-iso-brk',
    from: 'dc_isolator',
    to: 'dc_breaker',
    type: 'dc',
    color: '#D97706',
    waypoints: [
      [-5.4, 2.9, 0.0],
      [-3.6, 2.9, 0.0],
    ],
  },
  // 3. DC Breaker to DC SPD (Vertical Protection Drop)
  {
    id: 'c-brk-spd',
    from: 'dc_breaker',
    to: 'dc_spd',
    type: 'dc',
    color: '#D97706',
    waypoints: [
      [-3.6, 2.9, 0.0],
      [-3.6, 1.4, 0.0],
    ],
  },
  // 4. DC Breaker to Inverter (Horizontal Run to MPPT Inputs with Riser)
  {
    id: 'c-brk-inv',
    from: 'dc_breaker',
    to: 'inverter',
    type: 'dc',
    color: '#D97706',
    waypoints: [
      [-3.6, 2.9, 0.0],
      [-1.8, 2.9, 0.0],
      [-1.8, 3.35, 0.0],
      [-0.6, 3.35, 0.0],
    ],
  },
  // 5. Inverter to AC Breaker (Horizontal Run with Drop)
  {
    id: 'c-inv-acbrk',
    from: 'inverter',
    to: 'ac_breaker',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [-0.6, 3.35, 0.0],
      [0.4, 3.35, 0.0],
      [0.4, 2.9, 0.0],
      [1.4, 2.9, 0.0],
    ],
  },
  // 6. AC Breaker to AC SPD (Vertical Protection Drop)
  {
    id: 'c-acbrk-spd',
    from: 'ac_breaker',
    to: 'ac_spd',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [1.4, 2.9, 0.0],
      [1.4, 1.4, 0.0],
    ],
  },
  // 7. AC Breaker to AC Isolator (Horizontal Run)
  {
    id: 'c-acbrk-iso',
    from: 'ac_breaker',
    to: 'ac_isolator',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [1.4, 2.9, 0.0],
      [2.9, 2.9, 0.0],
    ],
  },
  // 8. AC Isolator to ATS (Horizontal Service Run)
  {
    id: 'c-iso-ats',
    from: 'ac_isolator',
    to: 'ats',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [2.9, 2.9, 0.0],
      [4.6, 2.9, 0.0],
    ],
  },
  // 9. ATS to EPS Backup Sub-Panel (Vertical Critical Loads Drop)
  {
    id: 'c-ats-eps',
    from: 'ats',
    to: 'eps_breaker',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [4.6, 2.9, 0.0],
      [4.6, 1.4, 0.0],
    ],
  },
  // 10. ATS to Main Utility Panel (Horizontal Feeder)
  {
    id: 'c-ats-panel',
    from: 'ats',
    to: 'main_panel',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [4.6, 2.9, 0.0],
      [5.6, 2.9, 0.0],
      [5.6, 2.5, 0.0],
      [6.8, 2.5, 0.0],
    ],
  },
  // 11. Main Panel to Utility Grid (Exit Wall to Outdoor Pole at Z=0.0)
  {
    id: 'c-panel-grid',
    from: 'main_panel',
    to: 'grid',
    type: 'ac',
    color: '#64748B',
    bidirectional: true,
    waypoints: [
      [6.8, 2.5, 0.0],
      [8.6, 2.5, 0.0],
      [8.6, 1.6, 0.0],
      [10.2, 1.6, 0.0],
    ],
  },
  // 12. Main Panel to Building Household Load (Exit Wall to Front Service Entrance at Z=2.2)
  {
    id: 'c-panel-load',
    from: 'main_panel',
    to: 'load',
    type: 'ac',
    color: '#0284C7',
    waypoints: [
      [6.8, 2.5, 0.0],
      [7.6, 2.5, 0.0],
      [7.6, 0.8, 0.0],
      [7.6, 0.8, 2.2],
      [10.2, 0.8, 2.2],
    ],
  },
];
