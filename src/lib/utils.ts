// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWatts(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${Math.round(watts)} W`;
}

export function formatAmps(amps: number): string {
  return `${amps.toFixed(amps % 1 === 0 ? 0 : 2)} A`;
}

export function formatVolts(volts: number): string {
  return `${volts.toFixed(volts % 1 === 0 ? 0 : 1)} V`;
}

/**
 * Formats a numeric value into Philippine Peso (₱) with exactly 2 decimal places.
 * If null, undefined, NaN, or non-positive (<= 0), returns 'TBD'.
 */
export function formatPeso(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return 'TBD';
  }
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parses numeric values safely from either pure numbers or string ratings/ranges
 * (e.g., '7.6/7.2', '8.4/8', '390-420', '300-6000', '13+13').
 */
export function parseNumericValue(
  val: number | string | null | undefined,
  strategy: 'max' | 'min' | 'first' = 'max'
): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  const num = Number(str);
  if (!isNaN(num)) return num;

  if (str.includes('/')) {
    const parts = str.split('/').map((p) => Number(p.trim())).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      return strategy === 'max' ? Math.max(...parts) : parts[0];
    }
  }

  if (str.includes('-') && !str.startsWith('-')) {
    const parts = str.split('-').map((p) => Number(p.trim())).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      return strategy === 'max' ? Math.max(...parts) : parts[0];
    }
  }

  if (str.includes('+')) {
    const parts = str.split('+').map((p) => Number(p.trim())).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      return parts.reduce((a, b) => a + b, 0);
    }
  }

  const match = str.match(/[-+]?\d*\.?\d+/);
  return match ? Number(match[0]) : 0;
}
