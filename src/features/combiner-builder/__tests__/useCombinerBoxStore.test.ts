// src/features/combiner-builder/__tests__/useCombinerBoxStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';

describe('Combiner Box Zustand Store', () => {
  beforeEach(() => {
    // Reset to template 1 default before each test
    useCombinerBoxStore.getState().loadTemplate('template_jesolar_hybrid');
  });

  it('initializes with Template 1 (JEsolar Video Replica) containing components and wires', () => {
    const state = useCombinerBoxStore.getState();
    expect(state.components.length).toBeGreaterThan(5);
    expect(state.wires.length).toBeGreaterThan(5);
    expect(state.activeTemplateId).toBe('template_jesolar_hybrid');
    expect(state.isEnergized).toBe(true);
    expect(state.atsSourceState).toBe('source_a');
  });

  it('switches cleanly to Template 2 (MT SolarCell Photo Replica)', () => {
    const { loadTemplate } = useCombinerBoxStore.getState();
    loadTemplate('template_mt_solarcell');

    const state = useCombinerBoxStore.getState();
    expect(state.activeTemplateId).toBe('template_mt_solarcell');
    const hasSolenoid = state.components.some((c) => c.category === 'ats_solenoid');
    const hasLcdMeter = state.components.some((c) => c.category === 'din_meter');
    expect(hasSolenoid).toBe(true);
    expect(hasLcdMeter).toBe(true);
  });

  it('allows spawning new hardware components from catalog', () => {
    const initialCount = useCombinerBoxStore.getState().components.length;
    useCombinerBoxStore.getState().addComponent('taxnele-txbd1-63-32a', 'rail_middle');

    const updated = useCombinerBoxStore.getState();
    expect(updated.components.length).toBe(initialCount + 1);
    const added = updated.components[updated.components.length - 1];
    expect(added.name).toContain('TAXNELE');
    expect(added.ratedVoltage).toBe('1000V DC');
  });

  it('toggles interactive circuit breaker switch state and triggers ATS transfer', () => {
    const state = useCombinerBoxStore.getState();
    const inverterMcb = state.components.find((c) => c.name.includes('AC MCB') || c.category === 'ac_mcb')!;
    expect(inverterMcb.isSwitchOn).toBe(true);
    expect(state.atsSourceState).toBe('source_a');

    // Turn OFF inverter breaker (simulating solar outage)
    useCombinerBoxStore.getState().toggleBreakerSwitch(inverterMcb.id);

    const toggledState = useCombinerBoxStore.getState();
    const updatedComp = toggledState.components.find((c) => c.id === inverterMcb.id)!;
    expect(updatedComp.isSwitchOn).toBe(false);
    // ATS should automatically transfer to Grid (source_b)
    expect(toggledState.atsSourceState).toBe('source_b');
  });

  it('supports full Undo and Redo lifecycle on component addition and removal', () => {
    const initialCount = useCombinerBoxStore.getState().components.length;

    // Add component
    useCombinerBoxStore.getState().addComponent('taxnele-txsa-40', 'rail_top');
    expect(useCombinerBoxStore.getState().components.length).toBe(initialCount + 1);

    // Undo addition
    useCombinerBoxStore.getState().undo();
    expect(useCombinerBoxStore.getState().components.length).toBe(initialCount);

    // Redo addition
    useCombinerBoxStore.getState().redo();
    expect(useCombinerBoxStore.getState().components.length).toBe(initialCount + 1);
  });

  it('allows point-to-point wiring between valid ports', () => {
    useCombinerBoxStore.getState().addComponent('taxnele-txba1-63-c32', 'rail_middle');
    const state = useCombinerBoxStore.getState();
    const newComp = state.components[state.components.length - 1];
    const busbar = state.components.find((c) => c.category === 'pe_busbar')!;
    const initialWiresCount = state.wires.length;

    const connected = useCombinerBoxStore
      .getState()
      .connectPorts(newComp.ports[0].id, busbar.ports[4].id, false);

    expect(connected).toBe(true);
    expect(useCombinerBoxStore.getState().wires.length).toBe(initialWiresCount + 1);
  });

  it('prevents connecting a port to itself', () => {
    const state = useCombinerBoxStore.getState();
    const c1 = state.components[0];
    const connected = useCombinerBoxStore
      .getState()
      .connectPorts(c1.ports[0].id, c1.ports[0].id, false);

    expect(connected).toBe(false);
  });
});
