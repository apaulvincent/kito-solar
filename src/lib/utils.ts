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
