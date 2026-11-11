import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS, safeStorage } from '@/lib/storage';
import {
  ApplianceCategory,
  ApplianceItem,
  DEFAULT_SIZING_CONFIG,
  PRESET_APPLIANCES,
  STARTER_PROFILES,
  SizingConfig,
  SizingResult,
  calculateApplianceSizing,
} from '@/lib/applianceSizingEngine';

export interface ApplianceLoadStoreState {
  items: ApplianceItem[];
  config: SizingConfig;
  activeCategory: ApplianceCategory | 'all';
  activeProfileId: string | null;

  // Actions
  addItem: (item: Omit<ApplianceItem, 'id'>) => void;
  addPreset: (presetId: string) => void;
  updateItem: (id: string, updates: Partial<ApplianceItem>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  loadProfile: (profileKey: 'small_home_wfh' | 'standard_family_home' | 'offgrid_cabin_farm') => void;
  setConfig: (updates: Partial<SizingConfig>) => void;
  setActiveCategory: (cat: ApplianceCategory | 'all') => void;
  resetConfig: () => void;

  // Selectors / Helpers
  getSizingResult: () => SizingResult;
}

const generateId = () => `appl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const initialStarterItems: ApplianceItem[] = STARTER_PROFILES.small_home_wfh.items.map((item, idx) => ({
  ...item,
  id: `initial_${idx}_${Date.now()}`,
}));

export const useApplianceLoadStore = create<ApplianceLoadStoreState>()(
  persist(
    (set, get) => ({
      items: initialStarterItems,
      config: {
        ...DEFAULT_SIZING_CONFIG,
        primaryGoal: 'bill_and_backup',
        gridReliability: 'occasional_outages',
      },
      activeCategory: 'all',
      activeProfileId: 'small_home_wfh',

      addItem: (item) => {
        const newItem: ApplianceItem = {
          ...item,
          id: generateId(),
          quantity: Math.max(1, item.quantity),
          runningWatts: Math.max(1, item.runningWatts),
          hoursPerDay: Math.max(0.1, Math.min(24, item.hoursPerDay)),
          surgeMultiplier: Math.max(1.0, item.surgeMultiplier),
          dutyCycle: Math.max(0.05, Math.min(1.0, item.dutyCycle)),
          daytimeRatio: Math.max(0, Math.min(1.0, item.daytimeRatio)),
        };

        set((state) => ({
          items: [newItem, ...state.items],
          activeProfileId: null, // customized
        }));
      },

      addPreset: (presetId) => {
        const preset = PRESET_APPLIANCES.find((p) => p.id === presetId);
        if (!preset) return;

        // Check if item of this preset already exists in active list; if so, bump quantity by 1
        const existing = get().items.find((i) => i.presetId === presetId);
        if (existing) {
          get().updateItem(existing.id, { quantity: existing.quantity + 1 });
          return;
        }

        const newItem: ApplianceItem = {
          id: generateId(),
          presetId: preset.id,
          name: preset.name,
          category: preset.category,
          loadType: preset.loadType,
          quantity: 1,
          runningWatts: preset.defaultRunningWatts,
          surgeMultiplier: preset.surgeMultiplier,
          dutyCycle: preset.dutyCycle,
          hoursPerDay: preset.defaultHoursPerDay,
          daytimeRatio: preset.defaultDaytimeRatio,
          isCriticalBackup: preset.category === 'kitchen' || preset.category === 'lighting_utility',
        };

        set((state) => ({
          items: [newItem, ...state.items],
          activeProfileId: null,
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            if (updated.quantity !== undefined) updated.quantity = Math.max(1, Math.round(updated.quantity));
            if (updated.runningWatts !== undefined) updated.runningWatts = Math.max(1, Math.round(updated.runningWatts));
            if (updated.hoursPerDay !== undefined) {
              updated.hoursPerDay = Math.max(0.1, Math.min(24, Number(updated.hoursPerDay.toFixed(2))));
            }
            if (updated.surgeMultiplier !== undefined) {
              updated.surgeMultiplier = Math.max(1.0, Number(updated.surgeMultiplier.toFixed(2)));
            }
            if (updated.dutyCycle !== undefined) {
              updated.dutyCycle = Math.max(0.05, Math.min(1.0, Number(updated.dutyCycle.toFixed(2))));
            }
            if (updated.daytimeRatio !== undefined) {
              updated.daytimeRatio = Math.max(0, Math.min(1.0, Number(updated.daytimeRatio.toFixed(2))));
            }
            return updated;
          }),
          activeProfileId: null,
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          activeProfileId: null,
        }));
      },

      clearAll: () => {
        set({
          items: [],
          activeProfileId: null,
        });
      },

      loadProfile: (profileKey) => {
        const profile = STARTER_PROFILES[profileKey];
        if (!profile) return;

        const newItems: ApplianceItem[] = profile.items.map((item, idx) => ({
          ...item,
          id: `profile_${profileKey}_${idx}_${Date.now()}`,
        }));

        set((state) => ({
          items: newItems,
          activeProfileId: profileKey,
          config: {
            ...state.config,
            primaryGoal: profile.recommendedGoal,
            gridReliability: profile.recommendedGrid,
          },
        }));
      },

      setConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      setActiveCategory: (cat) => {
        set({ activeCategory: cat });
      },

      resetConfig: () => {
        set({ config: DEFAULT_SIZING_CONFIG });
      },

      getSizingResult: () => {
        const state = get();
        return calculateApplianceSizing(state.items, state.config);
      },
    }),
    {
      name: STORAGE_KEYS.applianceLoad,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        items: state.items,
        config: state.config,
        activeCategory: state.activeCategory,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);
