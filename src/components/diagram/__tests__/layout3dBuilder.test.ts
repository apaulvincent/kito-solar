// src/components/diagram/__tests__/layout3dBuilder.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  ADDABLE_COMPONENT_CATALOG,
  DEFAULT_SYSTEM_WIRE_SPECS,
  clampAndSnapPosition,
  createEmptyLayout3D,
  findCompanionPairPort,
  findNearestSnapPort,
  findNearestSnapPortByRay,
  getNodeTerminalPorts,
  sanitizeLayout3D,
  serializeLayout3DPreset,
} from '@/lib/layout3dEngine';
import { PLANT_ROOM_GEOMETRY, SCENE_LIMITS } from '@/types/layout3d';
import { projectService } from '@/services/projectService';
import { generateSizingPdf } from '@/services/pdfExportService';

describe('3D Interactive Plant Builder: Spatial, Wiring, BOM & Persistence Suite', () => {
  beforeEach(() => {
    useCalculatorStore.getState().resetToDefaults();
  });

  it('exposes expanded commercial plant room geometry and medium-business limits', () => {
    expect(PLANT_ROOM_GEOMETRY.wall.width).toBeGreaterThanOrEqual(40);
    expect(PLANT_ROOM_GEOMETRY.backboard.width).toBeGreaterThanOrEqual(34);
    expect(PLANT_ROOM_GEOMETRY.backboard.unistrutYTiers.length).toBe(4);
    expect(PLANT_ROOM_GEOMETRY.floor.width).toBeGreaterThanOrEqual(40);
    expect(PLANT_ROOM_GEOMETRY.floor.depth).toBeGreaterThanOrEqual(18);

    expect(SCENE_LIMITS.maxTotalPlacedComponents).toBe(112);
    expect(SCENE_LIMITS.maxTotalWires).toBe(200);
    expect(SCENE_LIMITS.byGroup.batteries).toBe(16);
    expect(SCENE_LIMITS.byGroup.breakers).toBe(32);
    expect(ADDABLE_COMPONENT_CATALOG.length).toBe(14);

    // Baseline layout starts with port-to-port (+), (-), and (ground) wires replacing the old center-to-center conduit
    const initialLayout = createEmptyLayout3D();
    expect(initialLayout.wires.length).toBe(DEFAULT_SYSTEM_WIRE_SPECS.length);
    expect(initialLayout.wires.some((w) => w.polarity === 'positive')).toBe(true);
    expect(initialLayout.wires.some((w) => w.polarity === 'negative')).toBe(true);
    expect(initialLayout.wires.some((w) => w.polarity === 'ground')).toBe(true);
  });

  it('enforces per-category commercial component caps and prevents exceeding limits', () => {
    const store = useCalculatorStore.getState();
    const maxInverters = SCENE_LIMITS.byGroup.inverters;

    for (let i = 0; i < maxInverters; i++) {
      const res = store.addPlacedComponent('inverter_unit');
      expect(res.ok).toBe(true);
    }

    expect(useCalculatorStore.getState().layout3d.placedComponents.length).toBe(maxInverters);

    // Next inverter beyond medium-business cap must be rejected cleanly
    const overLimit = useCalculatorStore.getState().addPlacedComponent('inverter_unit');
    expect(overLimit.ok).toBe(false);
    expect(overLimit.error).toContain(String(maxInverters));
  });

  it('snaps wall components to Unistrut rails and supports dual wall/floor battery placement', () => {
    // Wall breaker near Y=2.98m snaps onto the 2.9m Unistrut channel
    const wallSnap = clampAndSnapPosition({
      wallHit: [8.44, 2.98, 0],
      floorHit: null,
      capability: 'wall',
      componentHeight: 0.98,
      floorCenterY: 0.49,
    });
    expect(wallSnap.surface).toBe('wall');
    expect(wallSnap.position[0]).toBe(8.4);
    expect(wallSnap.position[1]).toBe(2.9);
    expect(wallSnap.position[2]).toBe(0);

    // Battery ('both' capability) dragged out onto floor slab (Z=4.2m) transitions to floor
    const floorBat = clampAndSnapPosition({
      wallHit: [3.2, 0.4, 0],
      floorHit: [3.22, 0.78, 4.24],
      capability: 'both',
      componentHeight: 1.56,
      floorCenterY: 0.78,
    });
    expect(floorBat.surface).toBe('floor');
    expect(floorBat.position).toEqual([3.2, 0.78, 4.2]);

    // Battery dragged up onto wall backboard (Y=1.42m, close Z) transitions to wall Unistrut
    const wallBat = clampAndSnapPosition({
      wallHit: [3.22, 1.42, 0],
      floorHit: [3.22, 0.78, 0.3],
      capability: 'both',
      componentHeight: 1.56,
      floorCenterY: 0.78,
    });
    expect(wallBat.surface).toBe('wall');
    expect(wallBat.position[1]).toBe(1.4);
    expect(wallBat.position[2]).toBe(0);
  });

  it('snaps magnetically to matching terminals and flags reverse-polarity (+) to (-) short circuits', () => {
    const breakerPorts = getNodeTerminalPorts('brk_1', 'DC Breaker #1', 'breaker', [7.4, 2.9, 0]);
    const batteryPorts = getNodeTerminalPorts('bat_1', 'Battery #1', 'battery', [7.4, 0.78, 2.0]);
    const allPorts = [...breakerPorts, ...batteryPorts];

    const batPosPort = batteryPorts.find((p) => p.polarity === 'positive')!;
    const batNegPort = batteryPorts.find((p) => p.polarity === 'negative')!;

    // Cursor within 0.4m of battery ports while pulling Positive (+) wire snaps to BAT (+)
    const validSnap = findNearestSnapPort({
      cursorWorld: [
        batPosPort.worldPosition[0] + 0.15,
        batPosPort.worldPosition[1] + 0.1,
        batPosPort.worldPosition[2],
      ],
      allPorts,
      sourceNodeId: 'brk_1',
      wirePolarity: 'positive',
    });
    expect(validSnap).not.toBeNull();
    expect(validSnap!.polarityMismatch).toBe(false);
    expect(validSnap!.port.portId).toBe('bat_pos');

    // Aiming Positive (+) wire directly onto Negative (-) lug (< 0.05m) triggers polarityMismatch
    const shortCircuitAttempt = findNearestSnapPort({
      cursorWorld: [
        batNegPort.worldPosition[0] + 0.02,
        batNegPort.worldPosition[1],
        batNegPort.worldPosition[2],
      ],
      allPorts,
      sourceNodeId: 'brk_1',
      wirePolarity: 'positive',
    });
    expect(shortCircuitAttempt).not.toBeNull();
    expect(shortCircuitAttempt!.polarityMismatch).toBe(true);

    // Screen-ray magnetic snap across 3D depth also locks onto floor battery terminal
    const origin: [number, number, number] = [0.6, 4.4, 18.5];
    const dir: [number, number, number] = [
      batPosPort.worldPosition[0] - origin[0],
      batPosPort.worldPosition[1] - origin[1],
      batPosPort.worldPosition[2] - origin[2],
    ];
    const raySnap = findNearestSnapPortByRay({
      rayOrigin: origin,
      rayDirection: dir,
      allPorts,
      sourceNodeId: 'brk_1',
      wirePolarity: 'positive',
    });
    expect(raySnap).not.toBeNull();
    expect(raySnap!.polarityMismatch).toBe(false);
    expect(raySnap!.port.portId).toBe('bat_pos');

    // Companion (+/-) pair lookup finds bat_neg from bat_pos
    const companion = findCompanionPairPort(batPosPort, batteryPorts);
    expect(companion?.portId).toBe('bat_neg');
  });

  it('reflects added 3D components, (+/-) wires, and movements in real-time BOM totals & PDF export', () => {
    const baselineTotal = useCalculatorStore.getState().calculationResult.costSummary.grandTotalPhp;
    const baselinePanels = useCalculatorStore.getState().calculationResult.summary.totalPanels;

    // 1. Add a DC breaker, an AC isolator switch, a battery module, and a PV sub-array
    const brk = useCalculatorStore.getState().addPlacedComponent('pv_dc_breaker');
    const sw = useCalculatorStore.getState().addPlacedComponent('ac_isolator');
    const bat = useCalculatorStore.getState().addPlacedComponent('battery_unit');
    const pv = useCalculatorStore.getState().addPlacedComponent('pv_array_unit');

    expect(brk.ok && sw.ok && bat.ok && pv.ok).toBe(true);

    // 2. Wire Positive (+) and Negative (-) conductors between the added breaker and battery
    const brkPorts = getNodeTerminalPorts(brk.item!.id, brk.item!.label, 'breaker', brk.item!.position);
    const batPorts = getNodeTerminalPorts(bat.item!.id, bat.item!.label, 'battery', bat.item!.position);

    const posWire = useCalculatorStore.getState().addWireConnection({
      polarity: 'positive',
      fromNodeId: brk.item!.id,
      fromPortId: 'out_pos',
      toNodeId: bat.item!.id,
      toPortId: 'bat_pos',
      fromWorldPos: brkPorts.find((p) => p.portId === 'out_pos')!.worldPosition,
      toWorldPos: batPorts.find((p) => p.portId === 'bat_pos')!.worldPosition,
    });
    const negWire = useCalculatorStore.getState().addWireConnection({
      polarity: 'negative',
      fromNodeId: brk.item!.id,
      fromPortId: 'out_neg',
      toNodeId: bat.item!.id,
      toPortId: 'bat_neg',
      fromWorldPos: brkPorts.find((p) => p.portId === 'out_neg')!.worldPosition,
      toWorldPos: batPorts.find((p) => p.portId === 'bat_neg')!.worldPosition,
    });
    expect(posWire.ok).toBe(true);
    expect(negWire.ok).toBe(true);

    const afterAddState = useCalculatorStore.getState();
    const afterSummary = afterAddState.calculationResult.costSummary;

    expect(afterAddState.calculationResult.summary.totalPanels).toBe(baselinePanels + 3);
    expect(afterAddState.calculationResult.pvSizing.activePanelCount).toBe(baselinePanels + 3);
    expect(afterAddState.calculationResult.pvSizing.totalPvPowerW).toBe(
      (baselinePanels + 3) * Number(afterAddState.selectedModule.pv_wattage_w)
    );
    expect(afterSummary.custom3dSummary?.totalAddedComponents).toBe(4);
    expect(afterSummary.custom3dSummary?.totalWireCount).toBe(2);
    expect(afterSummary.custom3dSummary?.positiveWireMeters).toBeGreaterThan(0);
    expect(afterSummary.custom3dSummary?.negativeWireMeters).toBeGreaterThan(0);
    expect(afterSummary.custom3dSummary?.addedSubtotalPhp).toBeGreaterThan(70000);
    expect(afterSummary.grandTotalPhp).toBeGreaterThan(baselineTotal);

    // 3. Moving the battery further out on the floor slab dynamically recalculates wire length & BOM total
    const costBeforeMove = afterSummary.grandTotalPhp;
    useCalculatorStore.getState().movePlacedComponent(bat.item!.id, [16.0, 0.78, 15.0], 'floor');
    const costAfterMove = useCalculatorStore.getState().calculationResult.costSummary.grandTotalPhp;
    expect(costAfterMove).toBeGreaterThan(costBeforeMove);

    // 4. Verify PDF generator succeeds with custom 3D plant additions
    const st = useCalculatorStore.getState();
    const pdfDoc = generateSizingPdf({
      calculationResult: st.calculationResult,
      selectedInverter: st.selectedInverter,
      selectedModule: st.selectedModule,
      selectedBattery: st.selectedBattery,
      batteryCount: st.batteryCount,
      gridVoltageV: st.gridVoltageV,
      mainBreakerA: st.mainBreakerA,
    });
    expect(pdfDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    // 5. Removing all custom items resets grand total cleanly back to baseline
    useCalculatorStore.getState().resetLayout3D();
    expect(useCalculatorStore.getState().calculationResult.costSummary.grandTotalPhp).toBe(
      baselineTotal
    );
  });

  it('persists and restores 3D layout & wires when saving and loading projects', async () => {
    const store = useCalculatorStore.getState();
    const addedBreaker = store.addPlacedComponent('battery_breaker');
    const addedBattery = store.addPlacedComponent('battery_unit');
    store.moveBaseNode('dc_breaker', [-4.2, 2.9, 0]);
    store.addWireConnection({
      polarity: 'positive',
      fromNodeId: addedBreaker.item!.id,
      fromPortId: 'out_pos',
      toNodeId: addedBattery.item!.id,
      toPortId: 'bat_pos',
      fromWorldPos: addedBreaker.item!.position,
      toWorldPos: addedBattery.item!.position,
    });

    const snapshotState = useCalculatorStore.getState();
    const expectedGrandTotal = snapshotState.calculationResult.costSummary.grandTotalPhp;

    const saveRes = await projectService.saveProject('test-user-3d', {
      name: 'Commercial Cold Storage 3D Plant',
      system_type: snapshotState.calculationResult.systemType === 'hybrid' ? 'HYBRID' : 'ON-GRID',
      inverter_model: snapshotState.selectedInverter.model,
      module_model: snapshotState.selectedModule.model,
      battery_model: snapshotState.selectedBattery?.model || null,
      battery_count: snapshotState.batteryCount,
      grid_voltage_v: snapshotState.gridVoltageV,
      main_breaker_a: snapshotState.mainBreakerA,
      panel_count_override: snapshotState.panelCountOverride,
      total_kwp: snapshotState.calculationResult.summary.totalArrayPowerKw,
      inverter_kw: snapshotState.calculationResult.summary.inverterPowerKw,
      panel_count: snapshotState.calculationResult.summary.totalPanels,
      battery_kwh: 10.24,
      dc_breaker_a: snapshotState.calculationResult.dc.breakerRatingA,
      ac_breaker_a: snapshotState.calculationResult.ac.breakerRatingA,
      custom_prices: snapshotState.customPrices,
      layout_3d: snapshotState.layout3d,
    });

    expect(saveRes.success).toBe(true);
    const saved = saveRes.project!;
    expect(saved.layout_3d?.placedComponents.length).toBe(2);
    expect(saved.layout_3d?.wires.length).toBe(DEFAULT_SYSTEM_WIRE_SPECS.length + 1);

    // Reset store completely, then load the saved project back
    useCalculatorStore.getState().resetToDefaults();
    expect(useCalculatorStore.getState().layout3d.placedComponents.length).toBe(0);

    useCalculatorStore.getState().loadProject(saved);
    const reloaded = useCalculatorStore.getState();
    expect(reloaded.layout3d.placedComponents.length).toBe(2);
    expect(reloaded.layout3d.wires.length).toBe(DEFAULT_SYSTEM_WIRE_SPECS.length + 1);
    expect(reloaded.layout3d.baseNodePositions.dc_breaker).toEqual([-4.2, 2.9, 0]);
    expect(reloaded.calculationResult.costSummary.grandTotalPhp).toBe(expectedGrandTotal);

    // Verify malformed JSON degrades safely
    expect(sanitizeLayout3D({ broken: true }).placedComponents).toEqual([]);
  });

  it('supports dragging wires to organize channels, grounding wires, and removing individual or all wires', () => {
    const store = useCalculatorStore.getState();
    const firstWire = store.layout3d.wires[0];
    expect(firstWire).toBeDefined();

    // Drag wire channel offset to organize layout
    store.updateWireRouteOffset(firstWire.id, [0.45, -0.35]);
    const updatedWire = useCalculatorStore
      .getState()
      .layout3d.wires.find((w) => w.id === firstWire.id);
    expect(updatedWire?.routeOffset).toEqual([0.45, -0.35]);

    // Remove a single wire
    const countBeforeRemove = useCalculatorStore.getState().layout3d.wires.length;
    store.removeWireConnection(firstWire.id);
    expect(useCalculatorStore.getState().layout3d.wires.length).toBe(countBeforeRemove - 1);

    // Clear all wires at once
    store.clearAllWires();
    expect(useCalculatorStore.getState().layout3d.wires.length).toBe(0);
  });

  it('allows deleting default (baseline) components, removes their attached wires & BOM cost, and restores on Reset 3D', () => {
    const store = useCalculatorStore.getState();
    const initialWires = store.layout3d.wires.length;
    const initialGrandTotal = store.calculationResult.costSummary.grandTotalPhp;

    // Delete default PV DC Breaker ('dc_breaker')
    store.removeBaseNode('dc_breaker');
    const afterRemove = useCalculatorStore.getState();

    expect(afterRemove.layout3d.removedBaseNodes).toContain('dc_breaker');
    expect(afterRemove.layout3d.wires.length).toBeLessThan(initialWires);
    expect(
      afterRemove.layout3d.wires.some(
        (w) => w.fromNodeId === 'dc_breaker' || w.toNodeId === 'dc_breaker'
      )
    ).toBe(false);
    expect(
      afterRemove.calculationResult.costSummary.items.find((i) => i.key === 'pv_dc_breaker')
    ).toBeUndefined();
    expect(afterRemove.calculationResult.costSummary.grandTotalPhp).toBe(initialGrandTotal - 280);

    // Reset 3D restores deleted baseline component and its wires
    afterRemove.resetLayout3D();
    const restored = useCalculatorStore.getState();
    expect(restored.layout3d.removedBaseNodes).toEqual([]);
    expect(restored.layout3d.wires.length).toBe(initialWires);
    expect(restored.calculationResult.costSummary.grandTotalPhp).toBe(initialGrandTotal);
  });

  it('exports and imports organized 3D wiring setups via JSON preset', () => {
    const store = useCalculatorStore.getState();
    const targetWire = store.layout3d.wires[0];
    store.updateWireRouteOffset(targetWire.id, [0.8, -0.4]);
    store.moveBaseNode('dc_isolator', [-5.8, 2.9, 0.0]);

    const exportedPreset = serializeLayout3DPreset(useCalculatorStore.getState().layout3d);
    expect(exportedPreset.baseNodePositions.dc_isolator).toEqual([-5.8, 2.9, 0.0]);
    expect(
      exportedPreset.wires.find((w) => w.id === targetWire.id)?.routeOffset
    ).toEqual([0.8, -0.4]);

    // Reset then import JSON preset back
    store.resetLayout3D();
    const importRes = useCalculatorStore.getState().importLayout3DJson(exportedPreset);
    expect(importRes.ok).toBe(true);
    expect(useCalculatorStore.getState().layout3d.baseNodePositions.dc_isolator).toEqual([
      -5.8, 2.9, 0.0,
    ]);
    expect(
      useCalculatorStore.getState().layout3d.wires.find((w) => w.id === targetWire.id)
        ?.routeOffset
    ).toEqual([0.8, -0.4]);
  });

  it('manages 3D undo and redo stacks with max of 10 entries and clears on reset/refresh', () => {
    const store = useCalculatorStore.getState();

    // 1. Initially starts with 0 undo and 0 redo entries
    expect(store.layout3dUndoStack.length).toBe(0);
    expect(store.layout3dRedoStack.length).toBe(0);

    // 2. Perform an action (add component)
    const addRes = store.addPlacedComponent('battery_breaker');
    expect(addRes.ok).toBe(true);
    expect(useCalculatorStore.getState().layout3d.placedComponents.length).toBe(1);
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(1);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(0);

    // 3. Perform a second action (remove a wire)
    const firstWire = useCalculatorStore.getState().layout3d.wires[0];
    const initialWireCount = useCalculatorStore.getState().layout3d.wires.length;
    useCalculatorStore.getState().removeWireConnection(firstWire.id);
    expect(useCalculatorStore.getState().layout3d.wires.length).toBe(initialWireCount - 1);
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(2);

    // 4. Undo the wire removal
    useCalculatorStore.getState().undoLayout3D();
    expect(useCalculatorStore.getState().layout3d.wires.length).toBe(initialWireCount);
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(1);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(1);

    // 5. Redo the wire removal
    useCalculatorStore.getState().redoLayout3D();
    expect(useCalculatorStore.getState().layout3d.wires.length).toBe(initialWireCount - 1);
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(2);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(0);

    // 6. Undo twice to get back to empty placedComponents
    useCalculatorStore.getState().undoLayout3D(); // restores wire
    useCalculatorStore.getState().undoLayout3D(); // removes placed component
    expect(useCalculatorStore.getState().layout3d.placedComponents.length).toBe(0);
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(0);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(2);

    // 7. Verify capping at max of 10 entries (breakers cap is 32)
    for (let i = 0; i < 15; i++) {
      useCalculatorStore.getState().addPlacedComponent('battery_breaker');
    }
    // Capped at exactly 10
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(10);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(0);

    // 8. Undo once, then a new action clears redo stack
    useCalculatorStore.getState().undoLayout3D();
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(9);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(1);

    useCalculatorStore.getState().clearAllWires();
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(10);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(0); // cleared

    // 9. Resetting defaults (or refreshing page) clears undo and redo stacks
    useCalculatorStore.getState().resetToDefaults();
    expect(useCalculatorStore.getState().layout3dUndoStack.length).toBe(0);
    expect(useCalculatorStore.getState().layout3dRedoStack.length).toBe(0);
  });
});
