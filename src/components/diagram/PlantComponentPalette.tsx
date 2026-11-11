import { useState, useMemo } from 'react';
import { Plus, PanelRightClose, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { getLimitStatus } from '@/lib/layout3dEngine';
import {
  ADDABLE_COMPONENT_CATALOG,
  resolveCatalogUnitPrice,
} from '@/lib/diagramNodeSpecs';
import { MODULES_PER_3D_PV_ARRAY } from '@/lib/solarConstants';
import { AddableComponentSpec } from '@/types/layout3d';
import { formatPeso } from '@/lib/utils';

type CategoryFilter =
  | 'All'
  | 'Breakers & SPD'
  | 'Switches & ATS'
  | 'Batteries & Power'
  | 'Panels & Ground';

const CATEGORY_TABS: { id: CategoryFilter; short: string }[] = [
  { id: 'All', short: 'All' },
  { id: 'Breakers & SPD', short: 'Breakers' },
  { id: 'Switches & ATS', short: 'Switches' },
  { id: 'Batteries & Power', short: 'Power & ESS' },
  { id: 'Panels & Ground', short: 'Panels' },
];

export function PlantComponentPalette() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'ok' | 'warn';
    text: string;
  } | null>(null);

  const isPaletteOpen = useCalculatorStore((s) => s.isPaletteOpen);
  const setIsPaletteOpen = useCalculatorStore((s) => s.setIsPaletteOpen);
  const layout3d = useCalculatorStore((s) => s.layout3d);
  const addPlacedComponent = useCalculatorStore((s) => s.addPlacedComponent);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const accessories = useCalculatorStore((s) => s.accessories);
  const customPrices = useCalculatorStore((s) => s.customPrices);

  const accessoryPriceLookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const acc of accessories) {
      if (typeof acc.price_php === 'number' && acc.price_php >= 0) {
        map.set(acc.accessory_key, acc.price_php);
      }
    }
    return map;
  }, [accessories]);

  const placedCountsByKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of layout3d.placedComponents) {
      map[item.catalogKey] = (map[item.catalogKey] || 0) + 1;
    }
    return map;
  }, [layout3d.placedComponents]);

  if (!isPaletteOpen) return null;

  const resolveSubtitle = (spec: AddableComponentSpec): string => {
    if (spec.key === 'inverter_unit') {
      return `${selectedInverter.brand} ${selectedInverter.model}`;
    }
    if (spec.key === 'battery_unit') {
      return selectedBattery ? selectedBattery.model : '51.2V-200 Ah LiFePO4';
    }
    if (spec.key === 'pv_array_unit') {
      return `${MODULES_PER_3D_PV_ARRAY}x ${selectedModule.pv_wattage_w}W Modules`;
    }
    return spec.defaultRatingLabel;
  };

  const visibleCatalog = ADDABLE_COMPONENT_CATALOG.filter(
    (item) => activeCategory === 'All' || item.categoryLabel === activeCategory
  );

  const handleSpawn = (spec: AddableComponentSpec) => {
    const res = addPlacedComponent(spec.key);
    if (res.ok && res.item) {
      setFeedbackBanner({
        tone: 'ok',
        text: `Added ${res.item.label} (${res.item.surface})`,
      });
    } else {
      setFeedbackBanner({
        tone: 'warn',
        text: res.error || 'Component limit reached.',
      });
    }
  };

  return (
    <aside
      aria-label="3D Component Library"
      className="w-72 sm:w-80 shrink-0 h-full z-20 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden pointer-events-auto"
    >
      <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-950/60">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white truncate">
              3D Hardware Library
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPaletteOpen(false)}
          title="Collapse component panel"
          aria-label="Collapse component panel"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.short}
            </button>
          );
        })}
      </div>

      {feedbackBanner && (
        <div
          className={`px-3 py-1.5 text-[10px] font-mono flex items-center justify-between gap-2 border-b ${
            feedbackBanner.tone === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
          }`}
        >
          <span className="inline-flex items-center gap-1.5 truncate">
            {feedbackBanner.tone === 'ok' ? (
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className="truncate">{feedbackBanner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-[10px] opacity-70 hover:opacity-100 font-bold cursor-pointer"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {visibleCatalog.map((spec) => {
          const limit = getLimitStatus(layout3d.placedComponents, spec.key);
          const unitPrice = resolveCatalogUnitPrice(spec, customPrices, accessoryPriceLookup, {
            inverterPricePhp: selectedInverter.price_php,
            modulePricePhp: selectedModule.price_php,
            batteryPricePhp: selectedBattery?.price_php,
          });
          const countAdded = placedCountsByKey[spec.key] || 0;

          return (
            <button
              key={spec.key}
              type="button"
              disabled={!limit.canAdd}
              onClick={() => handleSpawn(spec)}
              title={limit.canAdd ? `Click to add ${spec.title} to 3D plant room` : limit.reason}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                limit.canAdd
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-amber-500 dark:hover:border-amber-500/80 hover:bg-amber-50/30 dark:hover:bg-slate-900 active:scale-[0.99] cursor-pointer'
                  : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-100/60 dark:bg-slate-950/30 opacity-55 cursor-not-allowed'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-[#090D16] border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src={spec.imagePath}
                  alt={spec.title}
                  loading="lazy"
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {spec.title}
                  </span>
                  {countAdded > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold shrink-0">
                      +{countAdded}
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {resolveSubtitle(spec)}
                </div>

                <div className="flex items-center justify-between gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPeso(unitPrice)}
                    {limit.canAdd && (
                      <span className="w-4 h-4 rounded-md bg-amber-600 text-white inline-flex items-center justify-center">
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
