// src/features/combiner-builder/components/CombinerHardwareLibrary.tsx
import { useState, useMemo } from 'react';
import { X, Search, Plus, Shield, Zap, ArrowRightLeft, Layers, Battery } from 'lucide-react';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { COMBINER_HARDWARE_CATALOG } from '../data/combinerHardwareCatalog';
import { ComponentCategory } from '../types';

type CategoryFilter = 'ALL' | 'DC' | 'AC' | 'ATS_METER' | 'MCCB_BUSBAR';

export function CombinerHardwareLibrary() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isPaletteOpen = useCombinerBoxStore((s) => s.isPaletteOpen);
  const setIsPaletteOpen = useCombinerBoxStore((s) => s.setIsPaletteOpen);
  const addComponent = useCombinerBoxStore((s) => s.addComponent);

  const filteredItems = useMemo(() => {
    return COMBINER_HARDWARE_CATALOG.filter((item) => {
      // Category filter
      if (activeCategory === 'DC') {
        if (item.category !== 'dc_mcb' && item.category !== 'dc_spd') return false;
      } else if (activeCategory === 'AC') {
        if (item.category !== 'ac_mcb' && item.category !== 'ac_rcbo' && item.category !== 'ac_spd') {
          return false;
        }
      } else if (activeCategory === 'ATS_METER') {
        if (item.category !== 'ats_cb' && item.category !== 'ats_solenoid' && item.category !== 'din_meter') {
          return false;
        }
      } else if (activeCategory === 'MCCB_BUSBAR') {
        if (item.category !== 'battery_mccb' && item.category !== 'terminal_block' && item.category !== 'pe_busbar') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [activeCategory, searchQuery]);

  if (!isPaletteOpen) return null;

  const getCategoryIcon = (category: ComponentCategory) => {
    switch (category) {
      case 'dc_mcb':
      case 'dc_spd':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'ac_mcb':
      case 'ac_rcbo':
      case 'ac_spd':
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      case 'ats_cb':
      case 'ats_solenoid':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />;
      case 'battery_mccb':
        return <Battery className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <aside className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-200 select-none flex-shrink-0 h-full z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>3D Hardware Catalog</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            DIN-Rail modular components & transfer gear
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPaletteOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search breakers, SPDs, ATS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-800 overflow-x-auto text-[11px] scrollbar-none font-medium">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'DC', label: 'DC / PV' },
          { id: 'AC', label: 'AC Mains' },
          { id: 'ATS_METER', label: 'ATS & Meters' },
          { id: 'MCCB_BUSBAR', label: 'MCCB & PE' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id as CategoryFilter)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="pt-2.5 first:pt-0 flex flex-col gap-1.5 group hover:bg-slate-800/30 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.widthMm}mm ({item.modules1P}P)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                      {item.ratedVoltage}
                    </span>
                    {item.ratedAmps > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-semibold">
                        {item.ratedAmps}A
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={() => addComponent(item.id)}
                className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                title={`Spawn ${item.name} onto DIN rail`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400">
              <span>Est. Market Price:</span>
              <span className="font-bold text-emerald-400">
                ₱{item.pricePhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No matching equipment found in catalog.
          </div>
        )}
      </div>
    </aside>
  );
}
