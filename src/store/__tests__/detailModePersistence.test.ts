// src/store/__tests__/detailModePersistence.test.ts
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { useCalculatorStore } from '@/store/useCalculatorStore';

describe('Detail Mode & LocalStorage Persistence Suite', () => {
  const storeMap: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => storeMap[key] ?? null,
      setItem: (key: string, value: string) => {
        storeMap[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storeMap[key];
      },
      clear: () => {
        for (const k of Object.keys(storeMap)) {
          delete storeMap[k];
        }
      },
      length: 0,
      key: () => null,
    };

    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
  });

  afterAll(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).window;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults both step1DetailMode and step2DetailMode to min', () => {
    const store = useCalculatorStore.getState();
    store.setStep1DetailMode('min');
    store.setStep2DetailMode('min');
    expect(useCalculatorStore.getState().step1DetailMode).toBe('min');
    expect(useCalculatorStore.getState().step2DetailMode).toBe('min');
  });

  it('updates step1DetailMode and persists to localStorage', () => {
    const store = useCalculatorStore.getState();

    store.setStep1DetailMode('detailed');
    expect(useCalculatorStore.getState().step1DetailMode).toBe('detailed');
    expect(localStorage.getItem('kito_step1_detail_mode')).toBe('detailed');

    store.setStep1DetailMode('min');
    expect(useCalculatorStore.getState().step1DetailMode).toBe('min');
    expect(localStorage.getItem('kito_step1_detail_mode')).toBe('min');
  });

  it('updates step2DetailMode and persists to localStorage', () => {
    const store = useCalculatorStore.getState();

    store.setStep2DetailMode('detailed');
    expect(useCalculatorStore.getState().step2DetailMode).toBe('detailed');
    expect(localStorage.getItem('kito_step2_detail_mode')).toBe('detailed');

    store.setStep2DetailMode('min');
    expect(useCalculatorStore.getState().step2DetailMode).toBe('min');
    expect(localStorage.getItem('kito_step2_detail_mode')).toBe('min');
  });
});
