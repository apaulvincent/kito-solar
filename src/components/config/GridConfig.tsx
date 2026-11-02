// src/components/config/GridConfig.tsx
import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Network, Sliders } from 'lucide-react';
import { Autocomplete, HighlightMatch } from '@/components/common/Autocomplete';

interface GridVoltageOption {
  value: number;
  label: string;
  phase: '1-Phase' | '3-Phase';
  isStandard?: boolean;
}

const GRID_VOLTAGE_OPTIONS: GridVoltageOption[] = [
  { value: 220, label: '220 V (Single Phase)', phase: '1-Phase' },
  { value: 230, label: '230 V (Single Phase - Standard)', phase: '1-Phase', isStandard: true },
  { value: 240, label: '240 V (Single Phase)', phase: '1-Phase' },
  { value: 380, label: '380 V (Three Phase)', phase: '3-Phase' },
  { value: 400, label: '400 V (Three Phase)', phase: '3-Phase' },
];

interface MainBreakerOption {
  value: number | null;
  label: string;
  category: string;
  isStandard?: boolean;
}

const MAIN_BREAKER_OPTIONS: MainBreakerOption[] = [
  { value: null, label: 'None / ATS Bypass', category: 'ATS / Bypass' },
  { value: 40, label: '40 A', category: 'Residential' },
  { value: 50, label: '50 A', category: 'Residential' },
  { value: 60, label: '60 A', category: 'Residential' },
  { value: 63, label: '63 A (IEC Standard)', category: 'Residential' },
  { value: 100, label: '100 A (Standard Residential)', category: 'Standard', isStandard: true },
  { value: 125, label: '125 A', category: 'Heavy Residential' },
  { value: 150, label: '150 A', category: 'Commercial' },
  { value: 200, label: '200 A', category: 'Commercial' },
];

export function GridConfig() {
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);
  const panelCountOverride = useCalculatorStore((s) => s.panelCountOverride);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);

  const setGridVoltage = useCalculatorStore((s) => s.setGridVoltage);
  const setMainBreaker = useCalculatorStore((s) => s.setMainBreaker);
  const setPanelCountOverride = useCalculatorStore((s) => s.setPanelCountOverride);
  const layout3d = useCalculatorStore((s) => s.layout3d);

  const added3DPvArrays =
    layout3d?.placedComponents?.filter((p) => p.catalogKey === 'pv_array_unit').length || 0;
  const addedPanelsFrom3D = added3DPvArrays * 3;

  const activePanels = calculationResult.pvSizing.activePanelCount;
  const minPanels = calculationResult.pvSizing.minPanels;
  const maxPanels = calculationResult.pvSizing.maxPanels;
  const recPanels = calculationResult.pvSizing.recommendedPanels;

  const [selectedVoltage, setSelectedVoltage] = useState<GridVoltageOption | null>(
    () => GRID_VOLTAGE_OPTIONS.find((opt) => opt.value === gridVoltageV) ?? GRID_VOLTAGE_OPTIONS[1]
  );

  const [selectedBreaker, setSelectedBreaker] = useState<MainBreakerOption | null>(
    () => MAIN_BREAKER_OPTIONS.find((opt) => opt.value === mainBreakerA) ?? MAIN_BREAKER_OPTIONS[5]
  );

  useEffect(() => {
    const matched = GRID_VOLTAGE_OPTIONS.find((opt) => opt.value === gridVoltageV);
    if (matched) {
      setSelectedVoltage(matched);
    }
  }, [gridVoltageV]);

  useEffect(() => {
    const matched = MAIN_BREAKER_OPTIONS.find((opt) => opt.value === mainBreakerA);
    setSelectedBreaker(matched ?? null);
  }, [mainBreakerA]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Site Grid & Array Parameters
        </label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
          PHILIPPINES / IEC UTILITY BASELINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Grid Voltage Autocomplete */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Grid Nominal Voltage (V)
          </label>
          <Autocomplete<GridVoltageOption>
            options={GRID_VOLTAGE_OPTIONS}
            value={selectedVoltage}
            onChange={(opt) => {
              setSelectedVoltage(opt);
              if (opt) setGridVoltage(opt.value);
            }}
            getOptionLabel={(opt) => opt.label}
            getOptionKey={(opt) => opt.value}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            placeholder="Search voltage (e.g. 230 V)..."
            clearable={true}
            renderOption={(opt, { inputValue }) => (
              <div className="w-full py-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  <HighlightMatch text={opt.label} query={inputValue} />
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                    opt.isStandard
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {opt.isStandard ? 'STD' : opt.phase}
                </span>
              </div>
            )}
          />
        </div>

        {/* Main Panel Service Breaker Autocomplete */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Main Panel Service Breaker (A)
          </label>
          <Autocomplete<MainBreakerOption>
            options={MAIN_BREAKER_OPTIONS}
            value={selectedBreaker}
            onChange={(opt) => {
              setSelectedBreaker(opt);
              setMainBreaker(opt ? opt.value : null);
            }}
            getOptionLabel={(opt) => opt.label}
            getOptionKey={(opt) => opt.value ?? 'none'}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            placeholder="Search breaker (e.g. 100 A, ATS)..."
            clearable={true}
            renderOption={(opt, { inputValue }) => (
              <div className="w-full py-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  <HighlightMatch text={opt.label} query={inputValue} />
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                    opt.isStandard
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {opt.category}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Array Module Count Sizing Fine-Tuning */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Configured Panel Quantity
          </div>
          <div className="flex items-center gap-2">
            {panelCountOverride !== null && (
              <button
                type="button"
                onClick={() => setPanelCountOverride(null)}
                className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Reset to Recommended ({recPanels})
              </button>
            )}
            <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-subtle">
              {activePanels} Panels{addedPanelsFrom3D > 0 ? ` (${activePanels - addedPanelsFrom3D} Base + ${addedPanelsFrom3D} in 3D)` : ''} ({(calculationResult.pvSizing.totalPvPowerW / 1000).toFixed(2)} kWp)
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={Math.min(minPanels, Math.max(1, minPanels - 2))}
            max={Math.max(maxPanels + 4, activePanels + 2)}
            value={activePanels}
            onChange={(e) => {
              const targetTotal = Number(e.target.value);
              const baseOverride = Math.max(1, targetTotal - addedPanelsFrom3D);
              setPanelCountOverride(baseOverride);
            }}
            className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            <span>Min: {minPanels}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Recommended: {recPanels}
            </span>
            <span>Max: {maxPanels}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
