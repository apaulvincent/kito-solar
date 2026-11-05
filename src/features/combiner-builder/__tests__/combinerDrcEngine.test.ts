// src/features/combiner-builder/__tests__/combinerDrcEngine.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateCombinerWiringDRC, getMinimumWireGaugeForAmps } from '../utils/combinerDrcEngine';
import { buildTemplate1JEsolar, buildTemplate2MTC } from '../data/prebuiltBoxTemplates';
import { CombinerComponentInstance, CombinerWireConnection } from '../types';

describe('Combiner Box Design Rule Checker (DRC) Engine', () => {
  it('validates pre-built Template 1 (JEsolar Video Replica) with zero critical errors', () => {
    const template = buildTemplate1JEsolar();
    const result = evaluateCombinerWiringDRC(template.components, template.wires);

    expect(result.errorCount).toBe(0);
    expect(result.isNormal).toBe(true);
    // All SPDs should be bonded to ground in this template
    const unbonded = result.diagnostics.find((d) => d.code === 'UNBONDED_SPD_PE');
    expect(unbonded).toBeUndefined();
  });

  it('validates pre-built Template 2 (MT SolarCell Photo Replica) with zero critical errors', () => {
    const template = buildTemplate2MTC();
    const result = evaluateCombinerWiringDRC(template.components, template.wires);

    expect(result.errorCount).toBe(0);
    expect(result.isNormal).toBe(true);
  });

  it('detects direct L to N short circuit violation', () => {
    const template = buildTemplate1JEsolar();
    const rcbo = template.components.find((c) => c.category === 'ac_rcbo')!;

    // Create a dead short wire bridging RCBO output L and N
    const shortWire: CombinerWireConnection = {
      id: 'short_wire_test',
      fromPortId: rcbo.ports[2].id, // 2/L Out
      toPortId: rcbo.ports[3].id, // N Out
      wireColor: '#ef4444',
      ferruleColor: 'red',
      gaugeMm2: 6,
      isJumperLoop: false,
    };

    const result = evaluateCombinerWiringDRC(template.components, [...template.wires, shortWire]);

    expect(result.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.isNormal).toBe(false);
    const shortDiag = result.diagnostics.find((d) => d.code === 'SHORT_CIRCUIT_LN');
    expect(shortDiag).toBeDefined();
    expect(shortDiag?.severity).toBe('error');
    expect(shortDiag?.description).toContain('opposite polarities');
  });

  it('detects AC to DC domain cross-connection', () => {
    const template = buildTemplate1JEsolar();
    const rcbo = template.components.find((c) => c.category === 'ac_rcbo')!;
    const pvMcb = template.components.find((c) => c.category === 'dc_mcb')!;

    // Illegally cross-wire AC RCBO to DC MCB
    const crossWire: CombinerWireConnection = {
      id: 'cross_domain_wire_test',
      fromPortId: rcbo.ports[0].id, // AC 1/L
      toPortId: pvMcb.ports[0].id, // DC+
      wireColor: '#ef4444',
      ferruleColor: 'red',
      gaugeMm2: 6,
      isJumperLoop: false,
    };

    const result = evaluateCombinerWiringDRC(template.components, [...template.wires, crossWire]);

    const crossDiag = result.diagnostics.find((d) => d.code === 'CROSS_DOMAIN_AC_DC');
    expect(crossDiag).toBeDefined();
    expect(crossDiag?.severity).toBe('error');
    expect(crossDiag?.title).toContain('Cross-Connection');
  });

  it('detects unbonded SPD PE ground terminals', () => {
    const template = buildTemplate1JEsolar();
    // Remove all ground wires to simulate forgotten earth bonding
    const ungroundedWires = template.wires.filter((w) => w.wireColor !== '#22c55e');

    const result = evaluateCombinerWiringDRC(template.components, ungroundedWires);

    const unbondedDiag = result.diagnostics.find((d) => d.code === 'UNBONDED_SPD_PE');
    expect(unbondedDiag).toBeDefined();
    expect(unbondedDiag?.severity).toBe('warning');
    expect(unbondedDiag?.title).toContain('Unbonded Surge Protector');
  });

  it('detects undersized wire gauge for high ampacity breakers', () => {
    const template = buildTemplate1JEsolar();
    const batteryMccb = template.components.find((c) => c.category === 'battery_mccb')!; // 160A rated

    // Wire 160A MCCB with tiny 1.5mm² wire instead of 35mm²
    const dummyComp: CombinerComponentInstance = {
      ...batteryMccb,
      id: 'dummy_load',
      ratedAmps: 160,
      ports: [
        {
          id: 'dummy_load:p0',
          componentId: 'dummy_load',
          label: 'In',
          positionOffset: [0, 0, 0],
          entryDirection: 'top',
          domain: 'DC',
          polarity: 'DC_POS',
        },
      ],
    };

    const undersizedWire: CombinerWireConnection = {
      id: 'undersized_wire_test',
      fromPortId: batteryMccb.ports[2].id,
      toPortId: dummyComp.ports[0].id,
      wireColor: '#ef4444',
      ferruleColor: 'red',
      gaugeMm2: 1.5, // 1.5mm² on 160A circuit is dangerous!
      isJumperLoop: false,
    };

    const result = evaluateCombinerWiringDRC(
      [...template.components, dummyComp],
      [...template.wires, undersizedWire],
    );

    const undersizedDiag = result.diagnostics.find(
      (d) => d.code === 'UNDERSIZED_WIRE_GAUGE' && d.affectedIds.includes('undersized_wire_test'),
    );
    expect(undersizedDiag).toBeDefined();
    expect(undersizedDiag?.severity).toBe('warning');
    expect(undersizedDiag?.description).toContain('160A breaker');
  });

  it('correctly maps standard minimum wire gauge for amperages', () => {
    expect(getMinimumWireGaugeForAmps(160)).toBe(35);
    expect(getMinimumWireGaugeForAmps(100)).toBe(25);
    expect(getMinimumWireGaugeForAmps(63)).toBe(16);
    expect(getMinimumWireGaugeForAmps(50)).toBe(10);
    expect(getMinimumWireGaugeForAmps(32)).toBe(4);
    expect(getMinimumWireGaugeForAmps(16)).toBe(2.5);
    expect(getMinimumWireGaugeForAmps(10)).toBe(1.5);
  });
});
