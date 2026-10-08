// src/components/header/CalculationHelpModal.tsx
import { X, BookOpen, Calculator, Cpu, Sun } from 'lucide-react';

interface CalculationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculationHelpModal({ isOpen, onClose }: CalculationHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400 font-bold">
                CALCULATION REFERENCE
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Engineering Formulas & Code Standards</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          {/* DC Side */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" /> DC Photovoltaic Calculations
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              <div>• Continuous DC Current = <span className="font-bold text-amber-800 dark:text-amber-400">Module Isc × 125%</span> (NEC / PEC 690.8 continuous factor)</div>
              <div>• DC Circuit Breaker = Mapped from standard DC breaker range table above continuous current</div>
              <div>• DC Homerun Wire = Sized from conductor ampacity table (e.g. 20A → 4.0mm² THHN/THWN / 12 AWG)</div>
              <div>• DC Isolator = Rated load-break rotary switch exceeding DC breaker rating</div>
              <div>• DC SPD = Selected based on inverter Max PV Input Voltage ceiling (≤600V, ≤1000V, ≤1500V)</div>
            </div>
          </div>

          {/* AC Side */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <h4 className="text-sm font-bold text-sky-800 dark:text-sky-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" /> AC Grid Interconnect Calculations
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              <div>• Continuous AC Current = <span className="font-bold text-sky-800 dark:text-sky-400">Inverter Max AC Current × 125%</span></div>
              <div>• AC Grid Breaker = Standard AC breaker tier above continuous current (e.g. 35.75A → 40A)</div>
              <div>• AC Feeder Wire = Selected from AC conductor table matching breaker rating (e.g. 40A → 14.0mm² / 8 AWG)</div>
              <div>• AC SPD = Selected from nominal utility voltage (230V → 440V Uc rating)</div>
              <div>• ATS = Sized to match or slightly exceed main panel utility service breaker</div>
            </div>
          </div>

          {/* PV Sizing */}
          <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> PV Module Sizing Formulas
            </h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              <div>• Minimum Panels = <span className="font-bold text-emerald-800 dark:text-emerald-400">CEILING(Inverter Min MPPT Voltage / Module Vmp)</span></div>
              <div>• Recommended Panels = <span className="font-bold text-emerald-800 dark:text-emerald-400">ROUNDDOWN(Rated AC Power / Module Wattage)</span></div>
              <div>• Maximum Panels = <span className="font-bold text-emerald-800 dark:text-emerald-400">ROUNDDOWN(Max PV Input Power / Module Wattage)</span></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Source: Excel Engineering Calculator V10.4. Conductor selections incorporate thermal derating factors and conduit fill guidelines.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-subtle"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
