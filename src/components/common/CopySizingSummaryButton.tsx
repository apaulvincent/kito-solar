import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useTimedFlag } from '@/hooks/useTimedFlag';
import { Copy, Check } from 'lucide-react';

interface CopySizingSummaryButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
}

export function buildSizingSummaryText({
  calculationResult,
  selectedInverter,
  selectedModule,
  selectedBattery,
  batteryCount,
  gridVoltageV,
  mainBreakerA,
}: {
  calculationResult: ReturnType<typeof useCalculatorStore.getState>['calculationResult'];
  selectedInverter: ReturnType<typeof useCalculatorStore.getState>['selectedInverter'];
  selectedModule: ReturnType<typeof useCalculatorStore.getState>['selectedModule'];
  selectedBattery: ReturnType<typeof useCalculatorStore.getState>['selectedBattery'];
  batteryCount: number;
  gridVoltageV: number;
  mainBreakerA: number | null;
}): string {
  const isHybrid = calculationResult.systemType === 'hybrid';
  const topologyLabel = isHybrid ? 'Hybrid Solar Storage (DC-Coupled Battery)' : 'Grid-Tied Solar PV';

  const inverterKw = calculationResult.summary?.inverterPowerKw ?? (selectedInverter ? Number(selectedInverter.rated_ac_power_w) / 1000 : 0);
  const inverterName = selectedInverter
    ? `${selectedInverter.brand} ${selectedInverter.model} (${inverterKw} kW)`
    : calculationResult.summary?.inverterModel || 'Standard Inverter';

  const moduleWattage = selectedModule ? selectedModule.pv_wattage_w : (calculationResult.summary?.modulePowerW || 0);
  const moduleName = selectedModule
    ? `${selectedModule.brand} ${selectedModule.model} (${moduleWattage}W)`
    : calculationResult.summary?.moduleModel || 'Standard Module';

  const totalPanels = calculationResult.summary?.totalPanels ?? 0;
  const totalArrayKw = calculationResult.summary?.totalArrayPowerKw ?? 0;
  const dcAcRatio = calculationResult.summary?.dcAcRatio ? calculationResult.summary.dcAcRatio.toFixed(2) : '1.00';

  const batteryLine =
    isHybrid && selectedBattery && batteryCount > 0
      ? `• Battery Storage: ${batteryCount}x ${selectedBattery.model} (${(((selectedBattery.capacity_ah ?? 0) * (selectedBattery.nominal_voltage_v ?? 0) * batteryCount) / 1000).toFixed(2)} kWh total)`
      : isHybrid
      ? `• Battery Storage: ${calculationResult.summary?.batteryBankSummary || 'Configured Storage'}`
      : '';

  const dc = calculationResult.dc;
  const ac = calculationResult.ac;
  const voc =
    calculationResult.stringSizing?.voltagePerStringVoc ??
    calculationResult.stringSizing?.maxPvVoltageV ??
    0;

  return [
    'KITO SOLAR | SYSTEM SIZING & ELECTRICAL SCHEDULE',
    'Reference: Philippine Electrical Code (PEC 2017)',
    `Topology: ${topologyLabel}`,
    '--------------------------------------------------',
    'EQUIPMENT SPECIFICATIONS:',
    `• Inverter: ${inverterName}`,
    `• PV Modules: ${totalPanels}x ${moduleName} (${totalArrayKw} kWp total)`,
    batteryLine,
    `• AC Grid Service: ${gridVoltageV}V AC, ${mainBreakerA ? `${mainBreakerA}A Main Breaker` : 'Standard Service'}`,
    `• DC/AC Ratio: ${dcAcRatio}`,
    '',
    'DC ELECTRICAL SCHEDULE (Array to Inverter):',
    `• String Open Circuit Voltage (Voc): ${voc > 0 ? `${voc.toFixed(1)} V DC` : 'Calculated per string'}`,
    `• Calculated Continuous DC Current: ${dc?.computedCurrentA ? `${dc.computedCurrentA.toFixed(1)} A (1.25x Isc)` : 'Standard'}`,
    `• DC Circuit Breaker: ${dc?.breakerRatingA ? `${dc.breakerRatingA} A Non-Polarized (1000V DC)` : 'Standard'}`,
    `• DC Conductor: ${dc?.wireSpec || '4.0 mm² PV Solar Cable'}`,
    `• DC Surge Protection (SPD): ${dc?.spdRating || 'Type II 600V DC'}`,
    `• DC Isolator Switch: ${dc?.isolatorRatingA ? `${dc.isolatorRatingA} A Rotary Lockable` : 'Standard'}`,
    `• DC Grounding Conductor: ${dc?.groundConductorSpec || '10 mm² Bare Copper'}`,
    '',
    'AC ELECTRICAL SCHEDULE (Inverter to Distribution):',
    `• Continuous AC Current: ${ac?.computedCurrentA ? `${ac.computedCurrentA.toFixed(1)} A` : 'Standard'}`,
    `• AC Circuit Breaker: ${ac?.breakerRatingA ? `${ac.breakerRatingA} A 2-Pole MCB` : 'Standard'}`,
    `• AC Conductor: ${ac?.wireSpec || '6.0 mm² THHN/THWN-2'}`,
    `• AC Surge Protection (SPD): ${ac?.spdRating || 'Type II 275V AC'}`,
    `• AC Isolator Switch: ${ac?.isolatorRatingA ? `${ac.isolatorRatingA} A 2-Pole Rotary` : 'Standard'}`,
    ac?.atsConfigured ? `• Automatic Transfer Switch (ATS): ${ac.atsRatingA} A` : '',
    '--------------------------------------------------',
    'Generated via Kito Solar (https://kitosolar.pvdeo.com)',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function CopySizingSummaryButton({
  className = '',
  variant = 'secondary',
}: CopySizingSummaryButtonProps) {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const batteryCount = useCalculatorStore((s) => s.batteryCount);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);

  const [copied, triggerCopied] = useTimedFlag(2500);

  const handleCopy = async () => {
    const text = buildSizingSummaryText({
      calculationResult,
      selectedInverter,
      selectedModule,
      selectedBattery,
      batteryCount,
      gridVoltageV,
      mainBreakerA,
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      triggerCopied();
    } catch (err) {
      console.error('Failed to copy sizing summary to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy Technical Sizing Schedule to Clipboard"
      aria-label={copied ? 'Technical schedule copied to clipboard' : 'Copy technical sizing schedule to clipboard'}
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
        copied
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
      } ${
        variant === 'compact'
          ? 'px-3 py-1.5 text-xs'
          : 'px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Copied Schedule!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span>Copy Schedule</span>
        </>
      )}
    </button>
  );
}
