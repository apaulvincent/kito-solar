// src/features/solar-mapper/components/RoofSectionInspector.tsx
import React from 'react';
import {
  Compass,
  Maximize2,
  Sliders,
  Sun,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Trash2,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { PanelOrientation } from '../types/solarMapper';

function getCardinalDirection(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return 'North (0°)';
  if (deg >= 22.5 && deg < 67.5) return 'North-East (45°)';
  if (deg >= 67.5 && deg < 112.5) return 'East (90°)';
  if (deg >= 112.5 && deg < 157.5) return 'South-East (135°)';
  if (deg >= 157.5 && deg < 202.5) return 'South (180°) • Peak Yield';
  if (deg >= 202.5 && deg < 247.5) return 'South-West (225°)';
  if (deg >= 247.5 && deg < 292.5) return 'West (270°)';
  return 'North-West (315°)';
}

export const RoofSectionInspector: React.FC = () => {
  const {
    roofSections,
    activeSectionId,
    setActiveSectionId,
    updateRoofSectionConfig,
    removeRoofSection,
    addRoofSection,
    panelWattage,
    setPanelWattage,
  } = useSolarMapperStore();

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  if (!activeSection) {
    return (
      <div className="p-1.5 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="rounded-[calc(1.5rem-0.375rem)] bg-white dark:bg-[#0B111E] p-8 text-center space-y-4 shadow-xs dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Roof Faces Defined Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click &quot;Draw Roof&quot; on the satellite map or add a new plane to configure pitch, azimuth orientation, and solar harvest calculations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addRoofSection()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Roof Plane</span>
          </button>
        </div>
      </div>
    );
  }

  const pitchPresets = [
    { label: 'Flat 5°', pitch: 5 },
    { label: 'Low 12°', pitch: 12 },
    { label: 'Standard 18°', pitch: 18 },
    { label: 'Steep 30°', pitch: 30 },
  ];

  const azimuthPresets = [
    { label: 'North 0°', deg: 0 },
    { label: 'East 90°', deg: 90 },
    { label: 'South 180°', deg: 180 },
    { label: 'West 270°', deg: 270 },
  ];

  const orientationOptions: { key: PanelOrientation; label: string }[] = [
    { key: 'auto_best', label: 'Auto (Best Fit)' },
    { key: 'portrait', label: 'Portrait' },
    { key: 'landscape', label: 'Landscape' },
  ];

  const slopeExpansionPercent =
    activeSection.flatAreaSqm > 0
      ? Math.round(
          ((activeSection.slopedAreaSqm - activeSection.flatAreaSqm) /
            activeSection.flatAreaSqm) *
            1000
        ) / 10
      : 0;

  return (
    <div className="p-1.5 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/10 shadow-sm">
      <div className="rounded-[calc(1.5rem-0.375rem)] bg-white dark:bg-[#0B111E] p-5 sm:p-6 space-y-6 shadow-xs dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        {/* Section Switcher Tabs & Actions */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {roofSections.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`group px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  sec.id === activeSection.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sec.id === activeSection.id
                      ? 'bg-slate-950'
                      : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                />
                <span>{sec.name || `Face ${idx + 1}`}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                    sec.id === activeSection.id
                      ? 'bg-slate-950/15 text-slate-950'
                      : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {sec.recommendedMaxPanels}p
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => addRoofSection()}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
              title="Add another roof plane (e.g. Garage / Extension)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {roofSections.length > 1 && (
            <button
              type="button"
              onClick={() => removeRoofSection(activeSection.id)}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex-shrink-0"
              title="Delete this roof plane"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Name & Module Power Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={activeSection.name}
              onChange={(e) =>
                updateRoofSectionConfig(activeSection.id, { name: e.target.value })
              }
              placeholder="Section Name (e.g. Main South Roof)"
              className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-white/15 focus:border-amber-400 focus:outline-hidden pb-1"
            />
          </div>

          {/* Global Panel Wattage Presets */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">
              Panel:
            </span>
            {([550, 580, 600] as const).map((watt) => (
              <button
                key={watt}
                type="button"
                onClick={() => setPanelWattage(watt)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  panelWattage === watt
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {watt}W
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Readout Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Flat 2D Footprint */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Flat Footprint
            </div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              {activeSection.flatAreaSqm.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m²</span>
            </div>
          </div>

          {/* 3D Sloped Area */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>3D Sloped Area</span>
              {slopeExpansionPercent > 0 && (
                <span className="text-amber-500 font-mono text-[10px] font-bold">
                  +{slopeExpansionPercent}%
                </span>
              )}
            </div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              {activeSection.slopedAreaSqm.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m²</span>
            </div>
          </div>

          {/* Max Panel Fit */}
          <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              Max Panel Fit
            </div>
            <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {activeSection.recommendedMaxPanels}{' '}
              <span className="text-xs font-normal opacity-80">
                ({activeSection.maxArrayKwp.toFixed(2)} kWp)
              </span>
            </div>
          </div>

          {/* Est. Daily Harvest */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20">
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              Est. Daily Harvest
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {activeSection.estimatedDailyKwh.toFixed(1)}{' '}
              <span className="text-xs font-normal opacity-80">kWh/day</span>
            </div>
          </div>
        </div>

        {/* Engineering Controls (Sliders & Selectors) */}
        <div className="space-y-6 pt-2">
          {/* Pitch Slider Card */}
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                Roof Pitch / Tilt Angle:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {activeSection.pitchDeg}°
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={activeSection.pitchDeg}
              onChange={(e) =>
                updateRoofSectionConfig(activeSection.id, {
                  pitchDeg: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {pitchPresets.map((p) => (
                <button
                  key={p.pitch}
                  type="button"
                  onClick={() =>
                    updateRoofSectionConfig(activeSection.id, { pitchDeg: p.pitch })
                  }
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeSection.pitchDeg === p.pitch
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Azimuth / Compass Direction Card */}
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                Compass Azimuth (Facing):
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                  {getCardinalDirection(activeSection.azimuthDeg)}
                </span>
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {Math.round(activeSection.orientationYieldFactor * 100)}% yield
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={activeSection.azimuthDeg}
              onChange={(e) =>
                updateRoofSectionConfig(activeSection.id, {
                  azimuthDeg: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {azimuthPresets.map((a) => (
                <button
                  key={a.deg}
                  type="button"
                  onClick={() =>
                    updateRoofSectionConfig(activeSection.id, { azimuthDeg: a.deg })
                  }
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeSection.azimuthDeg === a.deg
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Orientation & Shading Factor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Layout Orientation */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Module Packing Orientation
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {orientationOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      updateRoofSectionConfig(activeSection.id, {
                        panelOrientation: opt.key,
                      })
                    }
                    className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold transition-all ${
                      activeSection.panelOrientation === opt.key
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shading Loss Slider */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Adjacent Tree / Building Shading:
                </span>
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {activeSection.shadingLossPercent}% loss
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={activeSection.shadingLossPercent}
                onChange={(e) =>
                  updateRoofSectionConfig(activeSection.id, {
                    shadingLossPercent: parseInt(e.target.value, 10),
                  })
                }
                className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% Clear Sky</span>
                <span>25% Moderate</span>
                <span>50% Heavy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
