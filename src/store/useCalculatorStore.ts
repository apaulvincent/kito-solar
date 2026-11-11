import { create } from 'zustand';
import accessoriesSeed from '@/data/seed/calculator_accessories.json';
import { AccessoryRecord } from '@/types/supabase';
import {
  createCatalogSlice,
  defaultBattery,
  defaultInverter,
  defaultModule,
} from './slices/catalogSlice';
import { createEquipmentSizingSlice } from './slices/equipmentSizingSlice';
import {
  MAX_LAYOUT3D_HISTORY,
  createLayout3DSliceWithInitial,
  getInitialLayout3D,
} from './slices/layout3dSlice';
import { createProjectUiSlice } from './slices/projectUiSlice';
import { CalculatorState, recalculateForState } from './slices/storeTypes';

export type { ActiveView, DetailMode, WorkbenchTabKey } from '@/types/calculator';
export type { CalculatorState } from './slices/storeTypes';
export { MAX_LAYOUT3D_HISTORY };
export { extractProjectIdFromUrl, isOAuthHash, pathToView } from '@/lib/urlSync';

const initialLayout3D = getInitialLayout3D();
const initialAccessories = accessoriesSeed as AccessoryRecord[];

export const useCalculatorStore = create<CalculatorState>((set, get, api) => {
  api.getInitialState = () => get();

  const initialCalculationResult = recalculateForState({
    selectedInverter: defaultInverter,
    selectedModule: defaultModule,
    selectedBattery: defaultBattery,
    batteryCount: 1,
    gridVoltageV: 230,
    mainBreakerA: 100,
    panelCountOverride: null,
    accessories: initialAccessories,
    customPrices: {},
    layout3d: initialLayout3D,
  });

  return {
    ...createCatalogSlice(set, get, api),
    ...createProjectUiSlice(set, get, api),
    ...createEquipmentSizingSlice(set, get, api),
    ...createLayout3DSliceWithInitial(initialLayout3D)(set, get, api),
    calculationResult: initialCalculationResult,
  };
});
