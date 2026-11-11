import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { installMockLocalStorage } from '@/test/mockLocalStorage';

describe('Detail Mode & LocalStorage Persistence Suite', () => {
  let storageHandle: ReturnType<typeof installMockLocalStorage>;

  beforeAll(() => {
    storageHandle = installMockLocalStorage();
  });

  afterAll(() => {
    storageHandle.restore();
  });

  beforeEach(() => {
    storageHandle.reset();
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
