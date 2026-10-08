// src/components/diagram/DiagramComponentList.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { ShieldAlert, Zap, Cpu, Battery, Cable, ArrowRight } from 'lucide-react';

interface ComponentListItem {
  key: DiagramNodeKey;
  title: string;
  category: string;
  calculatedValue: string;
  wireOrRating: string;
  icon: typeof Zap;
}

export function DiagramComponentList() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);

  const items: ComponentListItem[] = [
    {
      key: 'pv_array',
      title: 'Solar PV Array',
      category: 'DC Generation',
      calculatedValue: `${calculationResult.summary.totalPanels} Modules (${calculationResult.summary.totalArrayPowerKw} kW)`,
      wireOrRating: `${calculationResult.stringSizing.recommendedStrings} Strings @ ${calculationResult.stringSizing.voltagePerStringVmp} Vmp`,
      icon: Zap,
    },
    {
      key: 'dc_breaker',
      title: 'PV DC Breaker',
      category: 'DC Protection',
      calculatedValue: `${calculationResult.dc.computedCurrentA} A (Continuous)`,
      wireOrRating: `${calculationResult.dc.breakerRatingA} A Rating`,
      icon: ShieldAlert,
    },
    {
      key: 'dc_isolator',
      title: 'PV DC Isolator',
      category: 'DC Disconnect',
      calculatedValue: 'Load-Break Switch',
      wireOrRating: `${calculationResult.dc.isolatorRatingA} A Switch`,
      icon: ShieldAlert,
    },
    {
      key: 'dc_spd',
      title: 'DC Surge Protector (SPD)',
      category: 'DC Surge',
      calculatedValue: 'Type 2 DC Arrester',
      wireOrRating: calculationResult.dc.spdRating,
      icon: ShieldAlert,
    },
    {
      key: 'inverter',
      title: 'Solar Inverter',
      category: 'Power Conversion',
      calculatedValue: `${calculationResult.summary.inverterPowerKw} kW AC (${calculationResult.systemType.toUpperCase()})`,
      wireOrRating: calculationResult.summary.inverterModel,
      icon: Cpu,
    },
  ];

  if (calculationResult.battery.hasBattery) {
    items.push(
      {
        key: 'battery_breaker',
        title: 'Battery DC MCCB',
        category: 'Storage Protection',
        calculatedValue: `${calculationResult.battery.dischargeCurrentA} A Discharge`,
        wireOrRating: `${calculationResult.battery.recommendedBreakerA} A Breaker`,
        icon: Battery,
      },
      {
        key: 'battery',
        title: 'Battery Storage Bank',
        category: 'Energy Storage',
        calculatedValue: `${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh Usable`,
        wireOrRating: calculationResult.battery.batteryType,
        icon: Battery,
      }
    );
  }

  items.push(
    {
      key: 'ac_breaker',
      title: 'Inverter AC Grid Breaker',
      category: 'AC Protection',
      calculatedValue: `${calculationResult.ac.computedCurrentA} A (Continuous)`,
      wireOrRating: `${calculationResult.ac.breakerRatingA} A Rating`,
      icon: ShieldAlert,
    },
    {
      key: 'ac_isolator',
      title: 'AC Isolator Switch',
      category: 'AC Disconnect',
      calculatedValue: 'Manual Rotary Switch',
      wireOrRating: `${calculationResult.ac.isolatorRatingA} A Switch`,
      icon: ShieldAlert,
    },
    {
      key: 'ac_spd',
      title: 'AC Surge Protector (SPD)',
      category: 'AC Surge',
      calculatedValue: 'Type 2 AC Arrester',
      wireOrRating: calculationResult.ac.spdRating,
      icon: ShieldAlert,
    },
    {
      key: 'ats',
      title: 'Automatic Transfer Switch',
      category: 'Transfer Bypass',
      calculatedValue: calculationResult.ac.atsConfigured ? 'Dual Power Transfer' : 'Bypass',
      wireOrRating: calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA} A ATS` : 'Not Configured',
      icon: Cable,
    }
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark transition-colors duration-200">
      <div className="flex items-center justify-between mb-3.5">
        <h4 className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
          Single-Line Component Index
        </h4>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Hover to highlight on diagram • Click to inspect
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {items.map((item) => {
          const isSelected = selectedNodeKey === item.key;
          const IconComponent = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setSelectedNodeKey(item.key)}
              onMouseEnter={() => setHoveredNodeKey(item.key)}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-amber-600 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-950/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-subtle'
              }`}
            >
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  isSelected
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-subtle'
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1" />
                </div>
                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold truncate mt-0.5">
                  {item.wireOrRating}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                  {item.calculatedValue}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
