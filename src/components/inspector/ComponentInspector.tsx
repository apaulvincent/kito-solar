// src/components/inspector/ComponentInspector.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { X, ShieldCheck, Info, Cable, BookOpen } from 'lucide-react';
import { Component3DPreview } from './Component3DPreview';

export function ComponentInspector() {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const setAtsSource = useCalculatorStore((s) => s.setAtsSource);

  if (!selectedNodeKey) return null;

  let title = 'Component Inspector';
  let category = 'System Component';
  let purpose = '';
  let calculatedInput = '';
  let recommendedRating = '';
  let explanation = '';
  let wireConduit = '';
  let codeReference = '';
  let imagePath = '/assets/accessories/pv-dc-breaker.svg';

  switch (selectedNodeKey) {
    case 'pv_array':
      title = 'Solar Photovoltaic Array';
      category = 'DC Generation';
      purpose = 'Converts incident sunlight into direct current (DC) electrical energy through silicon photovoltaic semiconductor cells.';
      calculatedInput = `${calculationResult.summary.totalPanels} modules @ ${calculationResult.summary.modulePowerW} Wp each`;
      recommendedRating = `${calculationResult.summary.totalArrayPowerKw} kW DC Array Peak`;
      explanation = calculationResult.stringSizing.explanation;
      wireConduit = `Homerun cable: ${calculationResult.dc.wireSpec} inside ${calculationResult.dc.conduitSpec}`;
      codeReference = 'NEC 690.7 & 690.8 / PEC Article 6.90 (PV source & output circuit maximum voltage and current sizing)';
      imagePath = '/assets/accessories/roof-rail.svg';
      break;

    case 'dc_isolator':
      title = 'PV Array DC Disconnect Switch';
      category = 'Manual Safety Isolation';
      purpose = 'Provides a visible, lockable load-break disconnect switch on the DC homerun line to safely isolate high-voltage PV array power before overcurrent protection, inverter entry, and servicing.';
      calculatedInput = `Sized for continuous array current = ${calculationResult.dc.rawCurrentA} A (Isc) × 125% = ${calculationResult.dc.computedCurrentA} A`;
      recommendedRating = `${calculationResult.dc.isolatorRatingA} A 4-Pole Rotary Isolator (1000V DC rated)`;
      explanation = calculationResult.dc.explanation.isolator;
      wireConduit = `Homerun enclosure: IP66 UV-resistant exterior casing • ${calculationResult.dc.wireSpec}`;
      codeReference = 'NEC 690.13 & 690.15 / PEC Article 6.90 / IEC 62548 (Manual load-break disconnect installed ahead of equipment)';
      imagePath = '/assets/accessories/dc-isolator.svg';
      break;

    case 'dc_breaker':
      title = 'PV String DC Circuit Breaker';
      category = 'DC Overcurrent Protection';
      purpose = 'Protects DC homerun cabling and inverter MPPT inputs against short circuits, line faults, and reverse current faults.';
      calculatedInput = `Continuous current = ${calculationResult.dc.rawCurrentA} A (Isc) × 125% = ${calculationResult.dc.computedCurrentA} A`;
      recommendedRating = `${calculationResult.dc.breakerRatingA} A DC MCB (1000V DC rated, 10kA Icu)`;
      explanation = calculationResult.dc.explanation.breaker;
      wireConduit = `Connected wire: ${calculationResult.dc.wireSpec}`;
      codeReference = 'NEC 690.8 & 690.9 / PEC 6.90.2.1 (125% continuous duty overcurrent protection rule)';
      imagePath = '/assets/accessories/pv-dc-breaker.svg';
      break;

    case 'dc_spd':
      title = 'DC Surge Protective Device (SPD)';
      category = 'Transient Surge Protection';
      purpose = 'Diverts indirect lightning-induced transients and atmospheric high-voltage surges on the DC string bus safely to earth ground.';
      calculatedInput = `Inverter Max Open-Circuit Voltage = ${calculationResult.stringSizing.maxPvVoltageV} V DC`;
      recommendedRating = calculationResult.dc.spdRating;
      explanation = calculationResult.dc.explanation.spd;
      wireConduit = `Earth grounding: ${calculationResult.dc.groundConductorSpec} solid copper to ground busbar`;
      codeReference = 'NEC 690.35 & 242.11 / IEC 61643-31 / UL 1449 4th Ed (Type 2 DC surge protective device)';
      imagePath = '/assets/accessories/dc-spd.svg';
      break;

    case 'inverter':
      title = 'Solar Hybrid / Grid Inverter';
      category = 'Power Conditioning Unit';
      purpose = 'Converts DC solar and battery energy into synchronized 230V AC grid electricity with MPPT tracking and energy storage management.';
      calculatedInput = `Max PV input: ${calculationResult.pvSizing.totalPvPowerW} W | AC capacity: ${calculationResult.summary.inverterPowerKw} kW`;
      recommendedRating = `${calculationResult.summary.inverterModel} (${calculationResult.systemType.toUpperCase()})`;
      explanation = `MPPT trackers: ${calculationResult.stringSizing.trackerCount} | Grid connection: ${gridVoltageV}V L+N+PE`;
      wireConduit = `AC Output: ${calculationResult.ac.wireSpec} | DC Input: ${calculationResult.dc.wireSpec}`;
      codeReference = 'NEC 690.4 & 705.12 / UL 1741 SB / IEEE 1547 (Grid-support utility interactive equipment)';
      imagePath = '/assets/accessories/ac-breaker.svg';
      break;

    case 'battery_breaker':
      title = 'Battery Bank DC MCCB';
      category = 'High-Current DC Protection';
      purpose = 'Safeguards low-voltage high-capacity battery storage bank against dead-short faults, thermal runaway, and busbar overloads.';
      calculatedInput = `Continuous discharge current = ${calculationResult.battery.dischargeCurrentA} A`;
      recommendedRating = `${calculationResult.battery.recommendedBreakerA} A DC MCCB (Molded Case Circuit Breaker)`;
      explanation = calculationResult.battery.explanation.breaker;
      wireConduit = `Battery Cable: ${calculationResult.battery.wireSpec}`;
      codeReference = 'NEC 706.21 & 706.30 / PEC Article 7.06 / UL 489B (DC Molded Case Circuit Breaker for ESS)';
      imagePath = '/assets/accessories/battery-breaker.svg';
      break;

    case 'battery':
      title = 'Battery Energy Storage System (BESS)';
      category = 'Chemical Energy Storage';
      purpose = 'Stores excess daytime solar generation for evening self-consumption and provides instantaneous EPS backup power during utility outages.';
      calculatedInput = `${calculationResult.battery.batteryType}`;
      recommendedRating = `${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh Bank @ ${calculationResult.battery.bankVoltageV} V Nominal`;
      explanation = calculationResult.battery.explanation.sizing;
      wireConduit = `Battery Cables: ${calculationResult.battery.wireSpec}`;
      codeReference = 'NEC Article 706 / NFPA 855 / UL 9540 (Energy storage system installation & safety)';
      imagePath = '/assets/accessories/battery-cable.svg';
      break;

    case 'ac_breaker':
      title = 'Inverter AC Grid Breaker';
      category = 'AC Overcurrent Protection';
      purpose = 'Protects AC interconnect feeder cable and main distribution busbar against overcurrent and inverter fault conditions.';
      calculatedInput = `Continuous current = ${calculationResult.ac.rawCurrentA} A (Max AC) × 125% = ${calculationResult.ac.computedCurrentA} A`;
      recommendedRating = `${calculationResult.ac.breakerRatingA} A 2-Pole AC MCB (10kA interrupt)`;
      explanation = calculationResult.ac.explanation.breaker;
      wireConduit = `Feeder cable: ${calculationResult.ac.wireSpec}`;
      codeReference = 'NEC 705.12 / PEC Article 7.05 (125% Inverter continuous output overcurrent protection)';
      imagePath = '/assets/accessories/ac-breaker.svg';
      break;

    case 'ac_spd':
      title = 'AC Surge Protective Device (SPD)';
      category = 'AC Transient Protection';
      purpose = 'Clamps utility switching surges and lightning transients on the AC distribution line before they reach inverter circuits.';
      calculatedInput = `Grid Utility Voltage = ${gridVoltageV} V AC nominal`;
      recommendedRating = calculationResult.ac.spdRating;
      explanation = calculationResult.ac.explanation.spd;
      wireConduit = `Earth Grounding: ${calculationResult.dc.groundConductorSpec} solid copper to ground busbar`;
      codeReference = 'NEC 242 / UL 1449 / IEC 61643-11 (Type 2 AC surge protective device for main service entrance)';
      imagePath = '/assets/accessories/ac-spd.svg';
      break;

    case 'ac_isolator':
      title = 'AC Disconnect Switch';
      category = 'Manual AC Isolation';
      purpose = 'Allows utility technicians and electricians to mechanically isolate solar generation from the building distribution grid.';
      calculatedInput = `Sized to exceed ${calculationResult.ac.breakerRatingA} A breaker rating`;
      recommendedRating = `${calculationResult.ac.isolatorRatingA} A Lockable Rotary Disconnect`;
      explanation = calculationResult.ac.explanation.isolator;
      wireConduit = `Enclosure: IP65 Rated exterior rated • ${calculationResult.ac.wireSpec}`;
      codeReference = 'NEC 705.20 / PEC Article 7.05 (Readily accessible lockable AC disconnect)';
      imagePath = '/assets/accessories/ac-isolator.svg';
      break;

    case 'ats':
      title = 'Automatic Transfer Switch (ATS)';
      category = 'Emergency Power Transfer';
      purpose = 'Automatic transfer switch that selects between Utility Grid (Source 1) and Main Service Panel Solar Feed (Source 2) to power the building loads.';
      calculatedInput = calculationResult.ac.atsConfigured ? `Main service breaker size: ${calculationResult.ac.atsRatingA} A` : 'Main breaker omitted';
      recommendedRating = calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA} A Dual-Power ATS` : 'ATS Not Configured';
      explanation = calculationResult.ac.explanation.ats;
      wireConduit = `Input 1 from Utility Grid • Input 2 from Main Service Panel • Output to Building Loads`;
      codeReference = 'NEC Article 702 (Optional Standby Systems) & UL 1008 (Transfer Switch Equipment)';
      imagePath = '/assets/accessories/ats.svg';
      break;

    case 'grounding':
      title = 'Equipment Grounding Busbar & Earth Electrode';
      category = 'System Grounding & Bonding';
      purpose = 'Bonds all non-current-carrying metallic equipment (PV racking frames, inverter chassis, SPD ground terminals, battery enclosures) to earth potential to eliminate hazardous touch voltages and safely dissipate lightning surges.';
      calculatedInput = `Ground Conductor: ${calculationResult.dc.groundConductorSpec} | Earth Electrode: ${calculationResult.dc.groundRodSpec}`;
      recommendedRating = `${calculationResult.dc.groundConductorSpec} Solid Bare Copper (< 5 Ω Earth Resistance)`;
      explanation = calculationResult.dc.explanation.grounding;
      wireConduit = 'Continuous solid copper conductor bonded via tin-plated copper lugs to grounding electrode system';
      codeReference = 'NEC Article 250 & 690.43 / PEC Article 2.50 & 6.90.5 (Equipment grounding & bonding to earth electrode)';
      imagePath = '/assets/accessories/roof-rail.svg';
      break;

    case 'main_panel':
      title = 'Main AC Distribution Panel';
      category = 'Building Distribution';
      purpose = 'Central AC load center housing branch circuit breakers and interconnecting solar inverter feed with building electrical loads and utility grid.';
      calculatedInput = `Busbar rating: ${mainBreakerA ? `${mainBreakerA} A Main Breaker` : '200 A Service Bus'} | System Voltage: ${gridVoltageV}V AC Single-Phase`;
      recommendedRating = mainBreakerA ? `${mainBreakerA} A Main Service Panel` : 'Standard 230V Split-Bus Distribution Panel';
      explanation = 'Compliant with NEC 705.12 (120% Busbar Interconnection Rule) and PEC Article 7.05. Ensures solar backfed breaker plus main utility breaker does not exceed 120% of the distribution busbar ampacity rating.';
      wireConduit = `AC Feeder: ${calculationResult.ac.wireSpec}`;
      codeReference = 'NEC 705.12(B) (120% Busbar Ampacity Interconnection Rule) / PEC Article 7.05';
      imagePath = '/assets/accessories/ac-breaker.svg';
      break;

    case 'grid':
      title = 'Utility Electric Grid Interconnection';
      category = 'Grid Interconnection';
      purpose = 'Point of Common Coupling (PCC) with the local electric distribution utility for bi-directional net-metered power exchange or grid power import.';
      calculatedInput = `Grid Service Voltage: ${gridVoltageV} V AC nominal | Frequency: 60 Hz`;
      recommendedRating = 'Bi-directional Net Metering (Distribution Utility Interconnect)';
      explanation = 'Interconnection governed by IEEE 1547 and distribution utility net-metering interconnection guidelines. Includes anti-islanding protection (UL 1741 SA/SB) to automatically disconnect during utility blackouts.';
      wireConduit = 'Overhead / Underground Service Entrance Conductors';
      codeReference = 'IEEE 1547 & Distribution Utility Interconnection Standards';
      imagePath = '/assets/accessories/ats.svg';
      break;

    case 'load':
      title = 'Facility & Building Electrical Loads';
      category = 'AC Consumption';
      purpose = 'Consumes solar and stored battery electrical energy to power building lighting, HVAC, appliances, and critical equipment.';
      calculatedInput = `Inverter Continuous Supply Capacity: ${calculationResult.summary.inverterPowerKw} kW AC`;
      recommendedRating = 'Branch Circuits: 15A / 20A / 30A 230V AC Sub-Circuits';
      explanation = 'Load management balances daytime PV self-consumption with battery storage reserve. In hybrid systems, critical loads are sustained without interruption during grid outages via inverter EPS port.';
      wireConduit = 'THHN/THWN copper building branch wiring inside EMT conduit';
      codeReference = 'NEC Article 210 & 220 (Branch Circuits and Service Load Calculations)';
      imagePath = '/assets/accessories/ats.svg';
      break;

    case 'dc_conduit':
      title = 'DC Homerun EMT Conduit System';
      category = 'Raceway & Conductor Protection';
      purpose = 'Encloses DC positive and negative homerun conductors from the roof penetrations down to the indoor wall equipment.';
      calculatedInput = `${calculationResult.dc.conduitSpec} (Continuous Trade Size)`;
      recommendedRating = `${calculationResult.dc.conduitSpec} Electrical Metallic Tubing (EMT)`;
      explanation = calculationResult.dc.explanation.conduit;
      wireConduit = `${calculationResult.dc.wireSpec} inside ${calculationResult.dc.conduitSpec}`;
      codeReference = 'NEC Chapter 9 Table 1 & Article 358 (< 40% EMT Conduit Fill Limit)';
      imagePath = '/assets/accessories/pv-dc-breaker.svg';
      break;

    case 'battery_wire':
      title = 'Battery Bank High-Current Interconnect Cables';
      category = 'DC Battery Conductor';
      purpose = 'Carries low-voltage high-current DC power between the battery storage bank terminals and the inverter battery port.';
      calculatedInput = `Continuous discharge current = ${calculationResult.battery.dischargeCurrentA} A`;
      recommendedRating = `${calculationResult.battery.wireSpec} Flexible Copper Welding/Battery Cable`;
      explanation = calculationResult.battery.explanation.wire;
      wireConduit = `High-strand class K flexible copper with heavy-duty heat-shrink sealed ring terminals`;
      codeReference = 'NEC 706.31 & Table 310.16 (Ampacity of conductors in free air and raceways)';
      imagePath = '/assets/accessories/battery-cable.svg';
      break;

    default: {
      const fallbackKey = String(selectedNodeKey).toUpperCase().replace('_', ' ');
      title = fallbackKey;
      purpose = 'System electrical node in the single line diagram.';
      calculatedInput = 'Standard electrical parameter';
      recommendedRating = 'Specified by NEC / PEC standards';
      explanation = 'Sized in accordance with system design.';
      codeReference = 'NEC / PEC / IEC Electrical Standards';
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="w-full sm:w-36 h-36 flex-shrink-0">
              <Component3DPreview
                nodeKey={selectedNodeKey}
                fallbackImagePath={imagePath}
                title={title}
                className="w-full h-full"
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

          {/* Active ATS Source Switcher */}
          {selectedNodeKey === 'ats' && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Active ATS Source Position
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Switch power source feeding the main distribution & building loads:
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setAtsSource('solar')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    atsSource === 'solar'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  SOLAR (LEFT)
                </button>
                <button
                  type="button"
                  onClick={() => setAtsSource('utility')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    atsSource === 'utility'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  UTILITY (RIGHT)
                </button>
              </div>
            </div>
          )}

          {/* Applicable Code Standards & Compliance */}
          {codeReference && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Applicable Electrical Code & Standards
              </div>
              <p className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 font-medium">
                {codeReference}
              </p>
            </div>
          )}

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
            Planning guide based on standard 125% continuous duty rule
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
