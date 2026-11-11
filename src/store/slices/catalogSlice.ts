import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import accessoriesSeed from '@/data/seed/calculator_accessories.json';
import {
  AccessoryRecord,
  BatteryRecord,
  SolarInverterRecord,
  SolarModuleRecord,
} from '@/types/supabase';
import { catalogService } from '@/services/catalogService';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  CalculatorSliceCreator,
  CatalogSlice,
  recalculateForState,
} from './storeTypes';

const INITIAL_INVERTERS = invertersSeed as SolarInverterRecord[];
const INITIAL_MODULES = modulesSeed as SolarModuleRecord[];
const INITIAL_BATTERIES = batteriesSeed as BatteryRecord[];
const INITIAL_ACCESSORIES = accessoriesSeed as AccessoryRecord[];

export const defaultInverter =
  INITIAL_INVERTERS.find(
    (i) => i.brand.toUpperCase() === 'DEYE' && i.model === 'SUN-6K-SG05LP1-EU'
  ) ||
  INITIAL_INVERTERS.find((i) => i.brand.toUpperCase() === 'DEYE') ||
  INITIAL_INVERTERS[0];

export const defaultModule =
  INITIAL_MODULES.find(
    (m) => m.brand.toUpperCase() === 'AIKO' && m.model === 'AIKO-M-500'
  ) ||
  INITIAL_MODULES.find((m) => m.brand.toUpperCase() === 'AIKO') ||
  INITIAL_MODULES[0];

export const defaultBattery =
  INITIAL_BATTERIES.find((b) => b.model === '51.2V-200 Ah') || INITIAL_BATTERIES[0];

export const createCatalogSlice: CalculatorSliceCreator<CatalogSlice> = (set) => ({
  inverters: INITIAL_INVERTERS,
  modules: INITIAL_MODULES,
  batteries: INITIAL_BATTERIES,
  accessories: INITIAL_ACCESSORIES,
  isLoadingCatalog: false,
  catalogSource: 'local_seed',

  initializeCatalog: async () => {
    if (!isSupabaseConfigured) return;
    set({ isLoadingCatalog: true });
    try {
      const [invs, mods, bats, accs] = await Promise.all([
        catalogService.getInverters(),
        catalogService.getModules(),
        catalogService.getBatteries(),
        catalogService.getAccessories(),
      ]);

      const isLive = catalogService.isLive;

      set((state) => {
        const selectedInverter =
          invs.find((i) => i.model === state.selectedInverter.model) ||
          invs[0] ||
          state.selectedInverter;
        const selectedModule =
          mods.find((m) => m.model === state.selectedModule.model) ||
          mods[0] ||
          state.selectedModule;
        const selectedBattery = state.selectedBattery
          ? bats.find((b) => b.model === state.selectedBattery?.model) || bats[0] || null
          : null;

        return {
          inverters: invs,
          modules: mods,
          batteries: bats,
          accessories: accs,
          selectedInverter,
          selectedModule,
          selectedBattery,
          isLoadingCatalog: false,
          catalogSource: isLive ? 'supabase' : 'local_seed',
          calculationResult: recalculateForState(state, {
            selectedInverter,
            selectedModule,
            selectedBattery,
            accessories: accs,
          }),
        };
      });
    } catch (err) {
      console.error('Failed to initialize live catalog:', err);
      set({ isLoadingCatalog: false, catalogSource: 'local_seed' });
    }
  },
});
