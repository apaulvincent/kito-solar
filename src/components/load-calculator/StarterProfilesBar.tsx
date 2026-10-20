// src/components/load-calculator/StarterProfilesBar.tsx
import React from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { STARTER_PROFILES } from '@/lib/applianceSizingEngine';
import { RotateCcw, Home, Building2, Trees, Trash2 } from 'lucide-react';

export const StarterProfilesBar: React.FC = () => {
  const activeProfileId = useApplianceLoadStore((s) => s.activeProfileId);
  const loadProfile = useApplianceLoadStore((s) => s.loadProfile);
  const clearAll = useApplianceLoadStore((s) => s.clearAll);
  const itemsCount = useApplianceLoadStore((s) => s.items.length);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Starter Baselines:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => loadProfile('small_home_wfh')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
            activeProfileId === 'small_home_wfh'
              ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-amber-500" />
          <span>Small Home / WFH</span>
        </button>

        <button
          type="button"
          onClick={() => loadProfile('standard_family_home')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
            activeProfileId === 'standard_family_home'
              ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Family Home (2 ACs)</span>
        </button>

        <button
          type="button"
          onClick={() => loadProfile('offgrid_cabin_farm')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
            activeProfileId === 'offgrid_cabin_farm'
              ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          <Trees className="w-3.5 h-3.5 text-emerald-500" />
          <span>Off-Grid Cabin / Farm</span>
        </button>

        {itemsCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all appliances in your active list?')) {
                clearAll();
              }
            }}
            title="Clear all active loads"
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
