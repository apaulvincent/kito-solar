import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEYS = {
  theme: 'kito_solar_theme',
  workingLayout3d: 'kito_working_layout_3d_v1',
  step1DetailMode: 'kito_step1_detail_mode',
  step2DetailMode: 'kito_step2_detail_mode',
  showFinancialRoiDetails: 'kito_show_financial_roi_details',
  applianceLoad: 'kito_solar_load_v1',
  solarMapper: 'kito_solar_mapper_v4',
  yieldSimulator: 'kito_solar_yield_simulator_v1',
  financialRoi: 'kito_financial_roi_v3',
  savedProjectsPrefix: 'kito_saved_projects_',
} as const;

export const savedProjectsKey = (userId: string): string => `${STORAGE_KEYS.savedProjectsPrefix}${userId}`;

// Storage can be missing (SSR, tests) or throw (Safari private mode, quota exceeded,
// disabled cookies). Persistence is best-effort, so every access degrades to a no-op.
function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const safeStorage: StateStorage & {
  keys: () => string[];
} = {
  getItem: (name) => {
    try {
      return getStorage()?.getItem(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      getStorage()?.setItem(name, value);
    } catch {
      /* best-effort persistence */
    }
  },
  removeItem: (name) => {
    try {
      getStorage()?.removeItem(name);
    } catch {
      /* best-effort persistence */
    }
  },
  keys: () => {
    const storage = getStorage();
    if (!storage) return [];
    const result: string[] = [];
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) result.push(key);
      }
    } catch {
      return result;
    }
    return result;
  },
};

export function readJson<T>(name: string): T | null {
  const raw = safeStorage.getItem(name);
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(name: string, value: unknown): void {
  safeStorage.setItem(name, JSON.stringify(value));
}
