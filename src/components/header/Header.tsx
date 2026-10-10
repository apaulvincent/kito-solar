// src/components/header/Header.tsx
import { useState } from 'react';
import { RotateCcw, HelpCircle, Zap, Sun, Moon, Coffee } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { CalculationHelpModal } from './CalculationHelpModal';

export function Header() {
  const [helpOpen, setHelpOpen] = useState(false);
  const resetToDefaults = useCalculatorStore((s) => s.resetToDefaults);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const theme = useCalculatorStore((s) => s.theme);
  const toggleTheme = useCalculatorStore((s) => s.toggleTheme);
  const catalogSource = useCalculatorStore((s) => s.catalogSource);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-subtle dark:shadow-card-dark transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm font-bold flex-shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                  KITO SOLAR
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  HYBRID & ONGRID
                </span>
                {catalogSource === 'supabase' ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    SUPABASE LIVE
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    title="Using bundled local catalog. Connect Supabase to switch to live cloud database."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    LOCAL SEED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                Solar PV Engineering, Sizing & Protection Studio
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden lg:flex items-center gap-3 pr-3 border-r border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-400 dark:text-slate-500">
                ACTIVE CONFIG:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {calculationResult.summary.inverterModel}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {calculationResult.summary.totalArrayPowerKw} kWp
              </span>
            </div>

            {/* Buy Me a Coffee */}
            <a
              href="https://ko-fi.com/mepapap"
              target="_blank"
              rel="noopener noreferrer"
              title="Support development on Ko-fi"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-mono font-medium text-amber-800 dark:text-amber-300 shadow-sm transition-colors"
            >
              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Buy me coffee</span>
            </a>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Calculation Help */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Calculation Help</span>
            </button>

            {/* Reset */}
            <button
              onClick={resetToDefaults}
              title="Reset to Excel Reference Scenario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 dark:text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <CalculationHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
