import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  BASE_NODE_SPECS,
  getBreakerAppearance,
  getNodeTypeFromKey,
  getOptimalCameraDistance,
} from '@/lib/diagramNodeSpecs';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { ComponentInspector } from '../ComponentInspector';

describe('Component3DPreview & Node Spec Architecture', () => {
  beforeEach(() => {
    useCalculatorStore.getState().resetToDefaults();
  });

  it('maps all diagram node keys to valid 3D node types with consistent camera distances', () => {
    expect(getNodeTypeFromKey('pv_array')).toBe('pv');
    expect(getNodeTypeFromKey('dc_isolator')).toBe('isolator');
    expect(getNodeTypeFromKey('ac_isolator')).toBe('isolator');
    expect(getNodeTypeFromKey('dc_breaker')).toBe('breaker');
    expect(getNodeTypeFromKey('ac_breaker')).toBe('breaker');
    expect(getNodeTypeFromKey('battery_breaker')).toBe('breaker');
    expect(getNodeTypeFromKey('eps_breaker')).toBe('breaker');
    expect(getNodeTypeFromKey('dc_spd')).toBe('spd');
    expect(getNodeTypeFromKey('ac_spd')).toBe('spd');
    expect(getNodeTypeFromKey('inverter')).toBe('inverter');
    expect(getNodeTypeFromKey('battery')).toBe('battery');
    expect(getNodeTypeFromKey('ats')).toBe('ats');
    expect(getNodeTypeFromKey('main_panel')).toBe('panel');
    expect(getNodeTypeFromKey('grid')).toBe('grid');
    expect(getNodeTypeFromKey('load')).toBe('load');
    expect(getNodeTypeFromKey('grounding')).toBe('grounding');

    expect(getOptimalCameraDistance('grid')).toBeGreaterThan(getOptimalCameraDistance('breaker'));
    expect(getBreakerAppearance('battery_breaker').hasTieBar).toBe(true);
    expect(getBreakerAppearance('dc_breaker').toggleColor).toBe('#DC2626');
  });

  it('uses .svg 2D fallback assets for every baseline node spec', () => {
    for (const spec of Object.values(BASE_NODE_SPECS)) {
      expect(spec.imagePath.endsWith('.svg')).toBe(true);
    }
  });

  it('renders ComponentInspector with the node rating and 2D fallback asset in non-WebGL environments', () => {
    useCalculatorStore.getState().setSelectedNodeKey('ats');
    const html = renderToStaticMarkup(createElement(ComponentInspector));
    expect(html).toContain('Automatic Transfer Switch (ATS)');
    expect(html).toContain('/assets/accessories/ats.svg');
    expect(html).toContain('2D Asset');
  });
});
