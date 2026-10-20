// src/components/load-calculator/CustomApplianceModal.tsx
import React, { useState } from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { ApplianceCategory, LoadType } from '@/lib/applianceSizingEngine';
import { X, Plus, Zap, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomApplianceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const addItem = useApplianceLoadStore((s) => s.addItem);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ApplianceCategory>('custom');
  const [loadType, setLoadType] = useState<LoadType>('resistive');
  const [runningWatts, setRunningWatts] = useState<number>(300);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [quantity, setQuantity] = useState<number>(1);
  const [hoursPerDay, setHoursPerDay] = useState<number>(4);
  const [dutyCycle, setDutyCycle] = useState<number>(1.0);
  const [daytimeRatio, setDaytimeRatio] = useState<number>(0.5);
  const [isCriticalBackup, setIsCriticalBackup] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addItem({
      name: name.trim(),
      category,
      loadType,
      quantity,
      runningWatts,
      surgeMultiplier,
      dutyCycle,
      hoursPerDay,
      daytimeRatio,
      isCriticalBackup,
    });

    onClose();
    setName('');
    setRunningWatts(300);
    setSurgeMultiplier(1.0);
  };

  const handleSurgePreset = (multiplier: number, type: LoadType) => {
    setSurgeMultiplier(multiplier);
    setLoadType(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[2rem] p-1.5 bg-slate-100/90 dark:bg-slate-900/90 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-2xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Custom Appliance
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Appliance Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Deep Freezer, Pool Pump, 3D Printer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Running Power (Watts)
                </label>
                <input
                  type="number"
                  min="1"
                  max="15000"
                  required
                  value={runningWatts}
                  onChange={(e) => setRunningWatts(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Inrush / Surge Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Motor Startup Surge Multiplier</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {surgeMultiplier}x ({Math.round(runningWatts * surgeMultiplier)}W peak)
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSurgePreset(1.0, 'resistive')}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    surgeMultiplier === 1.0
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">1.0x Resistive</div>
                  <div className="text-[10px] text-slate-400">LEDs, Heaters, TV</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSurgePreset(1.3, 'inverter_motor')}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    surgeMultiplier === 1.3
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">1.3x Inverter</div>
                  <div className="text-[10px] text-slate-400">Inverter AC / Fridge</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSurgePreset(3.5, 'inductive_motor')}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    surgeMultiplier === 3.5
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">3.5x Motor</div>
                  <div className="text-[10px] text-slate-400">Pumps, Compressors</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Daily Usage (Hours)
                </label>
                <input
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  required
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Time of Day
                </label>
                <select
                  value={daytimeRatio}
                  onChange={(e) => setDaytimeRatio(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
                >
                  <option value={0.8}>Daytime (80/20)</option>
                  <option value={0.5}>Balanced (50/50)</option>
                  <option value={0.2}>Nighttime (20/80)</option>
                </select>
              </div>
            </div>

            {/* Critical Backup Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCriticalBackup}
                  onChange={(e) => setIsCriticalBackup(e.target.checked)}
                  className="w-4 h-4 rounded-md text-amber-500 focus:ring-amber-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Critical Brownout Backup Load
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    Keeps running during utility grid blackouts via hybrid battery
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="group inline-flex items-center gap-2 pl-5 pr-2.5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-md shadow-amber-500/20"
              >
                <span>Add Appliance</span>
                <span className="w-6 h-6 rounded-full bg-slate-950/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
