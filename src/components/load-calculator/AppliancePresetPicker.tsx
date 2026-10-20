// src/components/load-calculator/AppliancePresetPicker.tsx
import React, { useState } from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { PRESET_APPLIANCES, ApplianceCategory } from '@/lib/applianceSizingEngine';
import { CustomApplianceModal } from './CustomApplianceModal';
import {
  Plus,
  Wind,
  Flame,
  Monitor,
  Lightbulb,
  Layers,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: { id: ApplianceCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Appliances', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'cooling', label: 'Cooling & HVAC', icon: <Wind className="w-3.5 h-3.5" /> },
  { id: 'kitchen', label: 'Kitchen', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'work_tech', label: 'Work & Tech', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'lighting_utility', label: 'Pumps & Utility', icon: <Lightbulb className="w-3.5 h-3.5" /> },
];

export const AppliancePresetPicker: React.FC = () => {
  const activeCategory = useApplianceLoadStore((s) => s.activeCategory);
  const setActiveCategory = useApplianceLoadStore((s) => s.setActiveCategory);
  const addPreset = useApplianceLoadStore((s) => s.addPreset);
  const items = useApplianceLoadStore((s) => s.items);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const filteredPresets =
    activeCategory === 'all'
      ? PRESET_APPLIANCES
      : PRESET_APPLIANCES.filter((p) => p.category === activeCategory);

  return (
    <div className="rounded-[1.75rem] p-1.5 bg-slate-100/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-[0.18em]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Step 2: Quick Presets</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Add Appliances to Load List
            </h2>
          </div>

          {/* Button-in-Button Custom Appliance Trigger */}
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs tracking-tight transition-all duration-200 active:scale-[0.98] shadow-xs"
          >
            <span>+ Custom Appliance</span>
            <span className="w-6 h-6 rounded-full bg-white/15 dark:bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-3.5 h-3.5 text-white" />
            </span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preset Appliance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const addedItem = items.find((i) => i.presetId === preset.id);
            const count = addedItem ? addedItem.quantity : 0;

            return (
              <div
                key={preset.id}
                className="group relative p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-900/30 hover:border-amber-500/60 dark:hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {preset.name}
                    </h4>
                    {count > 0 && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono font-bold text-[10px]">
                        {count} in list
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5" title={preset.description}>
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {preset.defaultRunningWatts}W
                    </span>
                    <span
                      className={`px-1 py-0.2 rounded text-[10px] ${
                        preset.surgeMultiplier >= 3.0
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                          : preset.surgeMultiplier > 1.1
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {preset.surgeMultiplier}x surge
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addPreset(preset.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Appliance Modal */}
        <CustomApplianceModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
        />
      </div>
    </div>
  );
};
