// src/lib/__tests__/solarNames.test.ts
import { describe, it, expect } from 'vitest';
import { generateRandomSolarName } from '../solarNames';

describe('solarNames utility', () => {
  it('generates a solar or electrical-themed name with two words', () => {
    const name = generateRandomSolarName();
    expect(typeof name).toBe('string');
    expect(name.trim().length).toBeGreaterThan(4);
    const parts = name.split(' ');
    expect(parts.length).toBe(2);
  });

  it('generates names containing recognized solar, electrical, or sun terms', () => {
    const validRoots = [
      'Solar',
      'Sun',
      'Electrical',
      'Helios',
      'Photon',
      'Sol',
      'Volt',
      'Ampere',
      'Watt',
      'Zenith',
      'Aurora',
      'Corona',
      'Ohm',
      'Electro',
      'Sunbeam',
      'Radiant',
    ];

    for (let i = 0; i < 20; i++) {
      const generated = generateRandomSolarName();
      const firstWord = generated.split(' ')[0];
      expect(validRoots).toContain(firstWord);
    }
  });
});
