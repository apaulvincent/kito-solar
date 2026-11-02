// src/components/diagram/DiagramComponentList.tsx
import { useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { ADDABLE_CATALOG_MAP } from '@/lib/layout3dEngine';
import {
  ShieldAlert,
  Shield,
  Zap,
  Cpu,
  Battery,
  Cable,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';

interface ComponentListItem {
  key: DiagramNodeKey;
  title: string;
  category: string;
  calculatedValue: string;
  wireOrRating: string;
  icon: typeof Zap;
  imagePath: string;
}

export function DiagramComponentList() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const layout3d = useCalculatorStore((s) => s.layout3d);
  const selectedCustomNodeId = useCalculatorStore((s) => s.selectedCustomNodeId);
  const setSelectedCustomNodeId = useCalculatorStore((s) => s.setSelectedCustomNodeId);
  const removePlacedComponent = useCalculatorStore((s) => s.removePlacedComponent);
  const removeBaseNode = useCalculatorStore((s) => s.removeBaseNode);

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kito_show_component_index');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch (e) {}
    }
    return false; // Default to hidden to make it easy to the eyes
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kito_show_component_index', String(next));
        } catch (e) {}
      }
      return next;
    });
  };

  // Correct DC Sequence: PV Array -> DC Isolator -> DC Breaker -> DC SPD -> Inverter
  const allBaseItems: ComponentListItem[] = [
    {
      key: 'pv_array',
      title: 'Solar PV Array',
      category: 'DC Generation',
      calculatedValue: `${calculationResult.summary.totalPanels} Modules (${calculationResult.summary.totalArrayPowerKw} kW)`,
      wireOrRating: `${calculationResult.stringSizing.recommendedStrings} Strings @ ${calculationResult.stringSizing.voltagePerStringVmp} Vmp`,
      icon: Zap,
      imagePath: '/assets/accessories/pv-array.svg',
    },
    {
      key: 'dc_isolator',
      title: 'PV DC Isolator',
      category: 'DC Disconnect',
      calculatedValue: 'Load-Break Switch (NEC 690.13)',
      wireOrRating: `${calculationResult.dc.isolatorRatingA} A Rotary Switch`,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/dc-isolator.svg',
    },
    {
      key: 'dc_breaker',
      title: 'PV DC Breaker',
      category: 'DC Protection',
      calculatedValue: `${calculationResult.dc.computedCurrentA} A (Continuous)`,
      wireOrRating: `${calculationResult.dc.breakerRatingA} A Rating`,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/pv-dc-breaker.svg',
    },
    {
      key: 'dc_spd',
      title: 'DC Surge Protector (SPD)',
      category: 'DC Surge',
      calculatedValue: 'Type 2 DC Arrester',
      wireOrRating: calculationResult.dc.spdRating,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/dc-spd.svg',
    },
    {
      key: 'inverter',
      title: 'Solar Inverter',
      category: 'Power Conversion',
      calculatedValue: `${calculationResult.summary.inverterPowerKw} kW AC (${calculationResult.systemType.toUpperCase()})`,
      wireOrRating: calculationResult.summary.inverterModel,
      icon: Cpu,
      imagePath: '/assets/accessories/solar-inverter.svg',
    },
  ];

  if (calculationResult.battery.hasBattery) {
    allBaseItems.push(
      {
        key: 'battery_breaker',
        title: 'Battery DC MCCB',
        category: 'Storage Protection',
        calculatedValue: `${calculationResult.battery.dischargeCurrentA} A Discharge`,
        wireOrRating: `${calculationResult.battery.recommendedBreakerA} A Breaker`,
        icon: Battery,
        imagePath: '/assets/accessories/battery-breaker.svg',
      },
      {
        key: 'battery',
        title: 'Battery Storage Bank',
        category: 'Energy Storage',
        calculatedValue: `${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh Usable`,
        wireOrRating: calculationResult.battery.batteryType,
        icon: Battery,
        imagePath: '/assets/accessories/battery-unit.svg',
      }
    );
  }

  allBaseItems.push(
    {
      key: 'ac_breaker',
      title: 'Inverter AC Grid Breaker',
      category: 'AC Protection',
      calculatedValue: `${calculationResult.ac.computedCurrentA} A (Continuous)`,
      wireOrRating: `${calculationResult.ac.breakerRatingA} A Rating`,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/ac-breaker.svg',
    },
    {
      key: 'ac_spd',
      title: 'AC Surge Protector (SPD)',
      category: 'AC Surge',
      calculatedValue: 'Type 2 AC Arrester',
      wireOrRating: calculationResult.ac.spdRating,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/ac-spd.svg',
    },
    {
      key: 'ac_isolator',
      title: 'AC Isolator Switch',
      category: 'AC Disconnect',
      calculatedValue: 'Manual Rotary Switch',
      wireOrRating: `${calculationResult.ac.isolatorRatingA} A Switch`,
      icon: ShieldAlert,
      imagePath: '/assets/accessories/ac-isolator.svg',
    },
    {
      key: 'ats',
      title: 'Automatic Transfer Switch',
      category: 'Transfer Bypass',
      calculatedValue: calculationResult.ac.atsConfigured ? 'Dual Power Transfer' : 'Bypass',
      wireOrRating: calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA} A ATS` : 'Not Configured',
      icon: Cable,
      imagePath: '/assets/accessories/ats.svg',
    },
    {
      key: 'grounding',
      title: 'Equipment Grounding Busbar',
      category: 'System Grounding',
      calculatedValue: 'Solid Earth Bond (NEC 250 / PEC 2.50)',
      wireOrRating: `${calculationResult.dc.groundConductorSpec} Ground Bus`,
      icon: Shield,
      imagePath: '/assets/accessories/grounding-lug.svg',
    }
  );

  const removedBaseSet = new Set(layout3d.removedBaseNodes || []);
  const items = allBaseItems.filter((i) => !removedBaseSet.has(i.key));

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card dark:shadow-card-dark transition-all duration-200 ${
        isOpen ? 'p-4 sm:p-5' : 'p-3 sm:px-5 sm:py-3.5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            Single-Line Component Index
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200/80 dark:border-slate-700">
            {items.length + layout3d.placedComponents.length} Nodes
          </span>
          {layout3d.wires.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800/60">
              {layout3d.wires.length} (+/-) Wires
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isOpen && (
            <span className="hidden md:inline text-xs font-mono text-slate-500 dark:text-slate-400">
              Hover to highlight on diagram • Click to inspect
            </span>
          )}

          <button
            type="button"
            onClick={toggleOpen}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
              isOpen
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 shadow-xs'
            }`}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
                <ChevronUp className="w-3.5 h-3.5 opacity-60" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {items.map((item) => {
          const isSelected = selectedNodeKey === item.key;
          const isHovered = hoveredNodeKey === item.key;

          return (
            <div
              key={item.key}
              onClick={() => setSelectedNodeKey(item.key)}
              onMouseEnter={() => setHoveredNodeKey(item.key)}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-amber-600 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/20 shadow-sm scale-[1.02]'
                  : isHovered
                  ? 'border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-subtle scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-950/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-subtle'
              }`}
            >
              <img
                src={item.imagePath}
                alt={item.title}
                className="w-9 h-9 rounded-lg bg-[#090D16] border border-slate-700/80 p-1 object-contain flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 break-words">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBaseNode(item.key);
                      }}
                      title={`Remove ${item.title} from 3D plant room`}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold break-words mt-0.5">
                  {item.wireOrRating}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 break-words mt-0.5 font-medium">
                  {item.calculatedValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {isOpen && layout3d.placedComponents.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Custom 3D Plant Room Hardware ({layout3d.placedComponents.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Included in BOM &amp; saved with project
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {layout3d.placedComponents.map((comp) => {
              const spec = ADDABLE_CATALOG_MAP.get(comp.catalogKey);
              const isCustomSelected = selectedCustomNodeId === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCustomNodeId(comp.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isCustomSelected
                      ? 'border-amber-600 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {spec && (
                    <img
                      src={spec.imagePath}
                      alt={spec.title}
                      className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 object-contain shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {comp.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlacedComponent(comp.id);
                        }}
                        title={`Remove ${comp.label}`}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold uppercase">
                      {comp.surface} • [{comp.position[0]}m, {comp.position[1]}m]
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
