// src/store/__tests__/useApplianceLoadStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useApplianceLoadStore } from '../useApplianceLoadStore';
import { PRESET_APPLIANCES } from '@/lib/applianceSizingEngine';

describe('useApplianceLoadStore', () => {
  beforeEach(() => {
    useApplianceLoadStore.getState().clearAll();
  });

  it('initializes with clear items or adds presets properly', () => {
    const store = useApplianceLoadStore.getState();
    expect(store.items).toHaveLength(0);

    const firstPreset = PRESET_APPLIANCES[0];
    store.addPreset(firstPreset.id);

    const updated = useApplianceLoadStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].name).toBe(firstPreset.name);
    expect(updated.items[0].runningWatts).toBe(firstPreset.defaultRunningWatts);
  });

  it('increments quantity when adding the same preset twice', () => {
    const store = useApplianceLoadStore.getState();
    const preset = PRESET_APPLIANCES[1];

    store.addPreset(preset.id);
    store.addPreset(preset.id);

    const updated = useApplianceLoadStore.getState();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(2);
  });

  it('loads a starter profile properly', () => {
    const store = useApplianceLoadStore.getState();
    store.loadProfile('standard_family_home');

    const updated = useApplianceLoadStore.getState();
    expect(updated.items.length).toBeGreaterThan(4);
    expect(updated.activeProfileId).toBe('standard_family_home');
    expect(updated.config.primaryGoal).toBe('bill_savings');

    const result = updated.getSizingResult();
    expect(result.continuousRunningWatts).toBeGreaterThan(1000);
    expect(result.recommendedInverterKw).toBeGreaterThanOrEqual(3.0);
  });

  it('updates item attributes and clamps values', () => {
    const store = useApplianceLoadStore.getState();
    store.addItem({
      name: 'Custom Heater',
      category: 'kitchen',
      loadType: 'resistive',
      quantity: 1,
      runningWatts: 1500,
      surgeMultiplier: 1.0,
      dutyCycle: 1.0,
      hoursPerDay: 2,
      daytimeRatio: 0.5,
      isCriticalBackup: false,
    });

    const item = useApplianceLoadStore.getState().items[0];
    store.updateItem(item.id, { quantity: 3, runningWatts: 2000 });

    const updatedItem = useApplianceLoadStore.getState().items[0];
    expect(updatedItem.quantity).toBe(3);
    expect(updatedItem.runningWatts).toBe(2000);
  });

  it('removes an item', () => {
    const store = useApplianceLoadStore.getState();
    store.addPreset(PRESET_APPLIANCES[0].id);
    const item = useApplianceLoadStore.getState().items[0];

    store.removeItem(item.id);
    expect(useApplianceLoadStore.getState().items).toHaveLength(0);
  });
});
