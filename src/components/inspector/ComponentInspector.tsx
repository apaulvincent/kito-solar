// src/components/inspector/ComponentInspector.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { X, ShieldCheck, Info, Cable } from 'lucide-react';

export function ComponentInspector() {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);

  if (!selectedNodeKey) return null;

  let title = 'Component Inspector';
  let category = 'System Component';
  let purpose = '';
  let calculatedInput = '';
  let recommendedRating = '';
  let explanation = '';
  let wireConduit = '';
  let imagePath = '/assets/accessories/pv-dc-breaker.webp';

  switch (selectedNodeKey) {
    case 'pv_array':
      title = 'Solar Photovoltaic Array';
      category = 'DC Generation';
      purpose = 'Converts incident sunlight into direct current (DC) electrical energy.';
      calculatedInput = `${calculationResult.summary.totalPanels} modules @ ${calculationResult.summary.modulePowerW} Wp each`;
      recommendedRating = `${calculationResult.summary.totalArrayPowerKw} kW DC Array Peak`;
      explanation = calculationResult.stringSizing.explanation;
      wireConduit = `Homerun cable: ${calculationResult.dc.wireSpec} inside ${calculationResult.dc.conduitSpec}`;
      imagePath = '/assets/accessories/roof-rail.webp';
      break;

    case 'dc_breaker':
      title = 'PV String DC Circuit Breaker';
      category = 'DC Overcurrent Protection';
      purpose = 'Protects DC homerun cabling and inverter MPPT inputs against short circuits and reverse current faults.';
      calculatedInput = `Continuous current = ${calculationResult.dc.rawCurrentA} A (Isc) × 125% = ${calculationResult.dc.computedCurrentA} A`;
      recommendedRating = `${calculationResult.dc.breakerRatingA} A DC MCB (1000V DC rated)`;
      explanation = calculationResult.dc.explanation.breaker;
      wireConduit = `Connected wire: ${calculationResult.dc.wireSpec}`;
      imagePath = '/assets/accessories/pv-dc-breaker.webp';
      break;

    case 'dc_isolator':
      title = 'PV Array DC Disconnect Switch';
      category = 'Manual Safety Isolation';
      purpose = 'Provides visible, lockable load-break disconnect for safe maintenance and fire department isolation.';
      calculatedInput = `Sized for ${calculationResult.dc.breakerRatingA} A circuit protection with 125% duty headroom`;
      recommendedRating = `${calculationResult.dc.isolatorRatingA} A 4-Pole Rotary Isolator (1000V DC)`;
      explanation = calculationResult.dc.explanation.isolator;
      wireConduit = `Homerun enclosure: IP66 UV-resistant exterior casing`;
      imagePath = '/assets/accessories/dc-isolator.webp';
      break;

    case 'dc_spd':
      title = 'DC Surge Protective Device (SPD)';
      category = 'Transient Surge Protection';
      purpose = 'Diverts indirect lightning surges and high-voltage atmospheric transients to ground.';
      calculatedInput = `Inverter Max Open-Circuit Voltage = ${calculationResult.stringSizing.maxPvVoltageV} V DC`;
      recommendedRating = calculationResult.dc.spdRating;
      explanation = calculationResult.dc.explanation.spd;
      wireConduit = `Earth grounding: ${calculationResult.dc.groundConductorSpec} to earth rod`;
      imagePath = '/assets/accessories/dc-spd.webp';
      break;

    case 'inverter':
      title = 'Solar Hybrid / Grid Inverter';
      category = 'Power Conditioning Unit';
      purpose = 'Converts DC energy into synchronized 230V AC grid electricity with MPPT tracking and energy storage management.';
      calculatedInput = `Max PV input: ${calculationResult.pvSizing.totalPvPowerW} W | AC capacity: ${calculationResult.summary.inverterPowerKw} kW`;
      recommendedRating = `${calculationResult.summary.inverterModel} (${calculationResult.systemType.toUpperCase()})`;
      explanation = `MPPT trackers: ${calculationResult.stringSizing.trackerCount} | Grid connection: 230V L+N+PE`;
      wireConduit = `AC Output: ${calculationResult.ac.wireSpec} | DC Input: ${calculationResult.dc.wireSpec}`;
      imagePath = '/assets/accessories/ac-breaker.webp';
      break;

    case 'battery_breaker':
      title = 'Battery Bank DC MCCB';
      category = 'High-Current DC Protection';
      purpose = 'Safeguards low-voltage high-capacity battery bank against severe dead-short faults and busbar overloads.';
      calculatedInput = `Discharge current = ${calculationResult.battery.dischargeCurrentA} A`;
      recommendedRating = `${calculationResult.battery.recommendedBreakerA} A DC MCCB`;
      explanation = calculationResult.battery.explanation.breaker;
      wireConduit = `Battery Cable: ${calculationResult.battery.wireSpec}`;
      imagePath = '/assets/accessories/battery-breaker.webp';
      break;

    case 'battery':
      title = 'Battery Energy Storage System (BESS)';
      category = 'Chemical Energy Storage';
      purpose = 'Stores excess solar generation for nighttime self-consumption and instant EPS backup power during blackouts.';
      calculatedInput = `${calculationResult.battery.batteryType}`;
      recommendedRating = `${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh Bank @ ${calculationResult.battery.bankVoltageV} V Nominal`;
      explanation = calculationResult.battery.explanation.sizing;
      wireConduit = `Battery Cables: ${calculationResult.battery.wireSpec}`;
      imagePath = '/assets/accessories/battery-cable.webp';
      break;

    case 'ac_breaker':
      title = 'Inverter AC Grid Breaker';
      category = 'AC Overcurrent Protection';
      purpose = 'Protects AC interconnect feeder cable and main distribution busbar against overcurrent.';
      calculatedInput = `Continuous current = ${calculationResult.ac.rawCurrentA} A (Max AC) × 125% = ${calculationResult.ac.computedCurrentA} A`;
      recommendedRating = `${calculationResult.ac.breakerRatingA} A 2-Pole AC MCB (10kA interrupt)`;
      explanation = calculationResult.ac.explanation.breaker;
      wireConduit = `Feeder cable: ${calculationResult.ac.wireSpec}`;
      imagePath = '/assets/accessories/ac-breaker.webp';
      break;

    case 'ac_isolator':
      title = 'AC Disconnect Switch';
      category = 'Manual AC Isolation';
      purpose = 'Allows utility technicians or electricians to mechanically isolate solar generation from distribution.';
      calculatedInput = `Sized to exceed ${calculationResult.ac.breakerRatingA} A breaker rating`;
      recommendedRating = `${calculationResult.ac.isolatorRatingA} A Lockable Rotary Disconnect`;
      explanation = calculationResult.ac.explanation.isolator;
      wireConduit = `Enclosure: IP65 Rated exterior rated`;
      imagePath = '/assets/accessories/ac-isolator.webp';
      break;

    case 'ac_spd':
      title = 'AC Surge Protective Device (SPD)';
      category = 'AC Transient Protection';
      purpose = 'Clamps utility switching surges and lightning strikes on the AC distribution line.';
      calculatedInput = `Grid Utility Voltage = 230 V AC nominal`;
      recommendedRating = calculationResult.ac.spdRating;
      explanation = calculationResult.ac.explanation.spd;
      wireConduit = `Earth Grounding: ${calculationResult.dc.groundConductorSpec}`;
      imagePath = '/assets/accessories/ac-spd.webp';
      break;

    case 'ats':
      title = 'Automatic Transfer Switch (ATS)';
      category = 'Emergency Power Transfer';
      purpose = 'Switches critical loads between the utility grid and inverter EPS backup within milliseconds.';
      calculatedInput = calculationResult.ac.atsConfigured ? `Main service breaker size: ${calculationResult.ac.atsRatingA} A` : 'Main breaker omitted';
      recommendedRating = calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA} A Dual-Power ATS` : 'ATS Not Configured';
      explanation = calculationResult.ac.explanation.ats;
      wireConduit = `Connected to utility main panel and inverter EPS port`;
      imagePath = '/assets/accessories/ats.webp';
      break;

    default:
      title = selectedNodeKey.toUpperCase().replace('_', ' ');
      purpose = 'System electrical node in the single line diagram.';
      calculatedInput = 'Standard electrical parameter';
      recommendedRating = 'Specified by NEC / PEC standards';
      explanation = 'Sized in accordance with system design.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
                {category}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedNodeKey(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top visual & spec pill */}
          <div className="flex items-center gap-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden p-2 shadow-subtle">
              <img
                src={imagePath}
                alt={title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = imagePath.replace('.webp', '.svg');
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                RECOMMENDED SPECIFICATION
              </div>
              <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {recommendedRating}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                {calculatedInput}
              </div>
            </div>
          </div>

          {/* Purpose & Application */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Engineering Purpose
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {purpose}
            </p>
          </div>

          {/* Engineering Calculation Explanation */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Calculation Basis & Derivation
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {explanation}
            </p>
          </div>

          {/* Cable & Conduit Requirement */}
          {wireConduit && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                <Cable className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Associated Conductor / Enclosure
              </div>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                {wireConduit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Compliant with standard 125% continuous duty rule
          </span>
          <button
            onClick={() => setSelectedNodeKey(null)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-subtle"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
