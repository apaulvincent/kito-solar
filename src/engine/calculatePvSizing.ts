// src/engine/calculatePvSizing.ts
import { SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { PvSizingResult } from '@/types/calculator';
import { parseNumericValue } from '@/lib/utils';

export function calculatePvSizing(
  inverter: SolarInverterRecord,
  module: SolarModuleRecord,
  panelCountOverride?: number | null
): PvSizingResult {
  const vmp = Number(module.vmp_v) || 1;
  const voc = Number(module.voc_v) || 1;
  const moduleWattage = parseNumericValue(module.pv_wattage_w) || 1;
  const ratedAcPower = parseNumericValue(inverter.rated_ac_power_w) || 0;
  const maxPvPower = Number(inverter.max_pv_input_power_w) || ratedAcPower * 1.5;

  // Extract min MPPT voltage from mppt_voltage_range (e.g., '120-450' -> 120) or startup_voltage_v
  let minMpptVoltage = Number(inverter.startup_voltage_v) || 120;
  let maxMpptVoltage = Number(inverter.max_pv_input_voltage_v) || 500;

  if (inverter.mppt_voltage_range && inverter.mppt_voltage_range.includes('-')) {
    const parts = inverter.mppt_voltage_range.split('-');
    const parsedMin = parseFloat(parts[0].trim());
    const parsedMax = parseFloat(parts[1].trim());
    if (!isNaN(parsedMin)) minMpptVoltage = parsedMin;
    if (!isNaN(parsedMax)) maxMpptVoltage = parsedMax;
  }

  // PRD formulas:
  // Minimum panels = CEILING(minimum MPPT voltage / module Vmp, 1)
  const minPanels = Math.max(1, Math.ceil(minMpptVoltage / vmp));

  // Recommended panels = ROUNDDOWN(rated AC output power / module wattage, 0)
  const recommendedPanels = Math.max(minPanels, Math.floor(ratedAcPower / moduleWattage));

  // Maximum panels = ROUNDDOWN(max PV input power / module wattage, 0)
  const maxPanels = Math.max(recommendedPanels, Math.floor(maxPvPower / moduleWattage));

  // Active panel count: user override if provided, otherwise recommended panels
  const activePanelCount = (panelCountOverride !== undefined && panelCountOverride !== null && panelCountOverride > 0)
    ? panelCountOverride
    : recommendedPanels;

  const totalPvPowerW = activePanelCount * moduleWattage;
  const dcAcRatio = ratedAcPower > 0 ? Number((totalPvPowerW / ratedAcPower).toFixed(2)) : 1.0;
  const totalVocV = Number((activePanelCount * voc).toFixed(1));
  const totalVmpV = Number((activePanelCount * vmp).toFixed(1));

  return {
    minPanels,
    recommendedPanels,
    maxPanels,
    activePanelCount,
    totalPvPowerW,
    dcAcRatio,
    totalVocV,
    totalVmpV,
    minMpptV: minMpptVoltage,
    maxMpptV: maxMpptVoltage,
    explanation: {
      min: `Requires at least ${minPanels} modules in series to produce ${minMpptVoltage} V and initiate MPPT tracking reliably.`,
      recommended: `Balances nominal inverter capacity (${(ratedAcPower / 1000).toFixed(1)} kW AC) with 100% DC/AC nameplate parity for optimal return.`,
      max: `Strict hardware ceiling of ${(maxPvPower / 1000).toFixed(1)} kW PV input to avoid triggering inverter over-power thermal clipping.`,
    },
  };
}
