// src/components/inspector/__tests__/Component3DPreview.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getNodeTypeFromKey } from '@/components/diagram/NodeGeometry';

describe('Component3DPreview & NodeGeometry Architecture', () => {
  it('correctly maps all diagram node keys to valid 3D node types', () => {
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
  });

  it('verifies Component3DPreview source implements 3D canvas and fallback', () => {
    const previewFile = path.resolve(process.cwd(), 'src/components/inspector/Component3DPreview.tsx');
    const source = fs.readFileSync(previewFile, 'utf-8');

    expect(source).toContain('<Canvas');
    expect(source).toContain('OrbitControls');
    expect(source).toContain('NodeGeometry');
    expect(source).toContain('safeFallback');
    expect(source).toContain('webgl');
  });

  it('verifies ComponentInspector embeds Component3DPreview', () => {
    const inspectorFile = path.resolve(process.cwd(), 'src/components/inspector/ComponentInspector.tsx');
    const source = fs.readFileSync(inspectorFile, 'utf-8');

    expect(source).toContain('<Component3DPreview');
    expect(source).toContain('nodeKey={selectedNodeKey}');
    expect(source).not.toContain('/assets/accessories/pv-dc-breaker.webp');
  });
});
