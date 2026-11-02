// src/engine/calculateStringSizing.ts
import { SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { StringSizingResult } from '@/types/calculator';

export function calculateStringSizing(
  inverter: SolarInverterRecord,
  module: SolarModuleRecord,
  activePanelCount: number
): StringSizingResult {
  const vmp = Number(module.vmp_v) || 1;
  const voc = Number(module.voc_v) || 1;
  const maxPvVoltageV = Number(inverter.max_pv_input_voltage_v) || 500;

  let minMpptV = Number(inverter.startup_voltage_v) || 120;
  let maxMpptV = maxPvVoltageV;

  if (inverter.mppt_voltage_range && inverter.mppt_voltage_range.includes('-')) {
    const parts = inverter.mppt_voltage_range.split('-');
    const p0 = parseFloat(parts[0].trim());
    const p1 = parseFloat(parts[1].trim());
    if (!isNaN(p0)) minMpptV = p0;
    if (!isNaN(p1)) maxMpptV = p1;
  }

  const vstart = Number(inverter.startup_voltage_v) || minMpptV;
  const vtarget = Number(inverter.rated_pv_input_voltage_v) || (minMpptV + maxMpptV) / 2;

  // Parse tracker count and max available string inputs from mppt_tracker_string_config (e.g., '2 / 1+1' or '2/2+2')
  let trackerCount = 1;
  let maxStrings = 1;
  const configRaw = inverter.mppt_tracker_string_config || '1 / 1';

  if (typeof configRaw === 'number') {
    trackerCount = configRaw;
    maxStrings = configRaw;
  } else if (typeof configRaw === 'string' && (configRaw.includes('/') || configRaw.includes('`'))) {
    const delimiter = configRaw.includes('/') ? '/' : '`';
    const [tPart, sPart] = configRaw.split(delimiter).map((s) => s.trim());
    const parsedTrackers = parseInt(tPart, 10);
    if (!isNaN(parsedTrackers) && parsedTrackers > 0) trackerCount = parsedTrackers;

    if (sPart) {
      if (sPart.includes('+')) {
        const stringAddends = sPart.split('+').map((s) => parseInt(s.trim(), 10) || 0);
        maxStrings = stringAddends.reduce((acc, v) => acc + v, 0) || trackerCount;
      } else {
        const parsedStrings = parseInt(sPart, 10);
        if (!isNaN(parsedStrings) && parsedStrings > 0) maxStrings = parsedStrings;
      }
    } else {
      maxStrings = trackerCount;
    }
  }

  if (maxStrings <= 0) maxStrings = trackerCount || 1;

  // Determine optimal string count that satisfies electrical safety and MPPT window
  const panelCount = Math.max(1, activePanelCount);
  const maxCandidateStrings = Math.min(panelCount, maxStrings);

  let recommendedStrings = 1;
  let bestScore = -Infinity;

  for (let s = 1; s <= maxCandidateStrings; s++) {
    const panelsPerStr = Math.max(1, Math.round(panelCount / s));
    const stringVoc = Number((panelsPerStr * voc).toFixed(1));
    const stringVmp = Number((panelsPerStr * vmp).toFixed(1));

    let score = 0;

    // Hard Safety rule: Voc must not exceed inverter maximum DC voltage
    if (stringVoc > maxPvVoltageV) {
      score -= 50000;
    }

    // MPPT window matching
    if (stringVmp >= minMpptV && stringVmp <= maxMpptV) {
      score += 1000;
      // Proximity to target/rated MPPT voltage
      score += Math.max(0, 200 - Math.abs(stringVmp - vtarget));
    } else if (stringVmp < minMpptV) {
      score -= 500 + (minMpptV - stringVmp) * 15;
      if (stringVmp < vstart) {
        score -= 2000; // Severe penalty for falling below startup voltage
      }
    } else {
      score -= 500 + (stringVmp - maxMpptV) * 15;
    }

    // Tracker balance
    if (s === trackerCount) {
      score += 250; // Optimal 1:1 match per tracker
    } else if (trackerCount > 1 && s > trackerCount && s % trackerCount === 0) {
      score += 180; // Symmetrical parallel strings across all trackers (e.g. 2+2)
    } else if (s < trackerCount) {
      score += 40; // Valid, but uses fewer trackers than available
    } else {
      score -= 50; // Asymmetrical across trackers
    }

    // Even panel distribution across strings
    if (panelCount % s === 0) {
      score += 100;
    }

    // Prefer simpler BOS (fewer strings) if electrical scores are comparable
    score += (maxStrings - s) * 5;

    if (score > bestScore) {
      bestScore = score;
      recommendedStrings = s;
    }
  }

  // Split panels across strings
  const panelsPerString = Math.max(1, Math.round(panelCount / recommendedStrings));
  const voltagePerStringVmp = Number((panelsPerString * vmp).toFixed(1));
  const voltagePerStringVoc = Number((panelsPerString * voc).toFixed(1));

  const withinMpptRange = voltagePerStringVmp >= minMpptV && voltagePerStringVmp <= maxMpptV;

  const explanation = withinMpptRange
    ? `${recommendedStrings} string${recommendedStrings > 1 ? 's' : ''} of ${panelsPerString} module${panelsPerString > 1 ? 's' : ''} each. Operating Vmp of ${voltagePerStringVmp} V per string stays squarely within the inverter's MPPT operating window (${minMpptV}–${maxMpptV} V), with open-circuit Voc of ${voltagePerStringVoc} V safely below the ${maxPvVoltageV} V safety ceiling.`
    : `${recommendedStrings} string${recommendedStrings > 1 ? 's' : ''} of ${panelsPerString} module${panelsPerString > 1 ? 's' : ''} each. Operating Vmp of ${voltagePerStringVmp} V falls outside the inverter's rated MPPT operating window (${minMpptV}–${maxMpptV} V). Adjust panel count or string topology.`;

  return {
    trackerCount,
    recommendedStrings,
    stringConfigRaw: configRaw,
    panelsPerString,
    voltagePerStringVmp,
    voltagePerStringVoc,
    maxPvVoltageV,
    withinMpptRange,
    explanation,
  };
}
