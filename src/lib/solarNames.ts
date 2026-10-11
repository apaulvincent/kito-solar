// src/lib/solarNames.ts

const SOLAR_PREFIXES = [
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
] as const;

const SOLAR_SUFFIXES = [
  'Engineer',
  'Spark',
  'Dynamo',
  'Voltage',
  'Current',
  'Grid',
  'Surge',
  'Circuit',
  'Pioneer',
  'Ray',
  'Master',
  'Conductor',
  'Matrix',
  'Builder',
] as const;

/**
 * Generates a random solar, electrical, or sun-themed engineer name/callsign
 * (e.g. "Solar Spark", "Sun Voltage", "Electrical Pioneer", "Helios Dynamo").
 */
export function generateRandomSolarName(): string {
  const prefix = SOLAR_PREFIXES[Math.floor(Math.random() * SOLAR_PREFIXES.length)];
  const suffix = SOLAR_SUFFIXES[Math.floor(Math.random() * SOLAR_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}
