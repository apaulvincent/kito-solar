import { SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { PvSizingResult } from '@/types/calculator';
import { parseNumericValue } from '@/lib/utils';
import { parseMpptVoltageRange } from './inverterHelpers';

export function calculatePvSizing(
  inverter: SolarInverterRecord,
  module: SolarModuleRecord,
  panelCountOverride?: number | null,
  extraAddedPanels: number = 0
): PvSizingResult {
  const vmp = Number(module.vmp_v) || 1;
  const voc = Number(module.voc_v) || 1;
  const moduleWattage = parseNumericValue(module.pv_wattage_w) || 1;
  const ratedAcPower = parseNumericValue(inverter.rated_ac_power_w) || 0;
  const maxPvPower = Number(inverter.max_pv_input_power_w) || ratedAcPower * 1.5;

  const { minMpptV, maxMpptV } = parseMpptVoltageRange(inverter, 500);

  const minPanels = Math.max(1, Math.ceil(minMpptV / vmp));
  const recommendedPanels = Math.max(minPanels, Math.floor(ratedAcPower / moduleWattage));
  const maxPanels = Math.max(recommendedPanels, Math.floor(maxPvPower / moduleWattage));

  const baseActivePanels =
    panelCountOverride !== undefined && panelCountOverride !== null && panelCountOverride > 0
      ? panelCountOverride
      : recommendedPanels;
  const activePanelCount = baseActivePanels + extraAddedPanels;

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
    minMpptV,
    maxMpptV,
    explanation: {
      min: `Requires at least ${minPanels} modules in series to produce ${minMpptV} V and initiate MPPT tracking reliably.`,
      recommended: `Balances nominal inverter capacity (${(ratedAcPower / 1000).toFixed(1)} kW AC) with 100% DC/AC nameplate parity for optimal return.`,
      max: `Strict hardware ceiling of ${(maxPvPower / 1000).toFixed(1)} kW PV input to avoid triggering inverter over-power thermal clipping.`,
    },
  };
}
