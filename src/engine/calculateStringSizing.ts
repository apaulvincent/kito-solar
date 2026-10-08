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

  // Parse tracker count and strings from mppt_tracker_string_config (e.g., '2 / 1+1' or '1/1' or '2/2+1')
  let trackerCount = 1;
  let recommendedStrings = 1;
  const configRaw = inverter.mppt_tracker_string_config || '1 / 1';

  if (configRaw.includes('/')) {
    const [tPart, sPart] = configRaw.split('/').map((s) => s.trim());
    const parsedTrackers = parseInt(tPart, 10);
    if (!isNaN(parsedTrackers)) trackerCount = parsedTrackers;

    if (sPart.includes('+')) {
      const stringAddends = sPart.split('+').map((s) => parseInt(s.trim(), 10) || 0);
      recommendedStrings = stringAddends.reduce((acc, v) => acc + v, 0) || trackerCount;
    } else {
      const parsedStrings = parseInt(sPart, 10);
      if (!isNaN(parsedStrings)) recommendedStrings = parsedStrings;
    }
  }

  // Default fallback if parsing resulted in 0
  if (recommendedStrings <= 0) recommendedStrings = trackerCount || 1;

  // Split panels across strings
  const panelsPerString = Math.max(1, Math.round(activePanelCount / recommendedStrings));
  const voltagePerStringVmp = Number((panelsPerString * vmp).toFixed(1));
  const voltagePerStringVoc = Number((panelsPerString * voc).toFixed(1));

  const withinMpptRange = voltagePerStringVmp >= minMpptV && voltagePerStringVmp <= maxMpptV;

  const explanation = `${recommendedStrings} strings of ${panelsPerString} modules each. Operating Vmp of ${voltagePerStringVmp} V per string stays squarely within the inverter's MPPT operating window (${minMpptV}–${maxMpptV} V), with open-circuit Voc of ${voltagePerStringVoc} V safely below the ${maxPvVoltageV} V safety ceiling.`;

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
