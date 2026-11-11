import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeso(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return 'TBD';
  }
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
