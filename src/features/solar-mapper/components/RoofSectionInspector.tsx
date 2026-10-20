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
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { PANEL_SPECS, PanelOrientation } from '../types/solarMapper';

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
      <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-xs text-center space-y-3">
        <Layers className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          No Roof Sections Active
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click "Draw Roof" on the satellite map or add a new section to customize slope, pitch, and orientation.
        </p>
        <button
          type="button"
          onClick={() => addRoofSection()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Roof Face</span>
        </button>
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
    { label: 'N (0°)', deg: 0 },
    { label: 'E (90°)', deg: 90 },
    { label: 'S (180°)', deg: 180 },
    { label: 'W (270°)', deg: 270 },
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
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-xs p-5 space-y-6 transition-all">
      {/* Section Switcher Tabs & Add Face Button */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {roofSections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSectionId(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                sec.id === activeSection.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sec.name || `Face ${idx + 1}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addRoofSection()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
            title="Add another roof plane"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {roofSections.length > 1 && (
          <button
            type="button"
            onClick={() => removeRoofSection(activeSection.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Delete this roof section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section Name & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={activeSection.name}
            onChange={(e) =>
              updateRoofSectionConfig(activeSection.id, { name: e.target.value })
            }
            placeholder="Section Name (e.g. Main South Roof)"
            className="w-full text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-hidden pb-1"
          />
        </div>

        {/* Global Panel Wattage Preset */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Panel:</span>
          {([550, 580, 600] as const).map((watt) => (
            <button
              key={watt}
              type="button"
              onClick={() => setPanelWattage(watt)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                panelWattage === watt
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {watt}W
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Readout Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Flat 2D Footprint
          </div>
          <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
            {activeSection.flatAreaSqm.toFixed(1)} <span className="text-xs font-normal">m²</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span>3D Sloped Area</span>
            {slopeExpansionPercent > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                +{slopeExpansionPercent}%
              </span>
            )}
          </div>
          <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
            {activeSection.slopedAreaSqm.toFixed(1)} <span className="text-xs font-normal">m²</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Max Panel Fit
          </div>
          <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
            {activeSection.recommendedMaxPanels}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({activeSection.maxArrayKwp.toFixed(2)} kWp)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Est. Daily Harvest
          </div>
          <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {activeSection.estimatedDailyKwh.toFixed(1)}{' '}
            <span className="text-xs font-normal">kWh/day</span>
          </div>
        </div>
      </div>

      {/* Sliders Configuration */}
      <div className="space-y-5">
        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
              Roof Pitch / Tilt Angle:
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {activeSection.pitchDeg}°
            </span>
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
            className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-1">
            {pitchPresets.map((p) => (
              <button
                key={p.pitch}
                type="button"
                onClick={() =>
                  updateRoofSectionConfig(activeSection.id, { pitchDeg: p.pitch })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeSection.pitchDeg === p.pitch
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Azimuth / Compass Direction Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              Roof Compass Azimuth:
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {activeSection.azimuthDeg}° (
              {Math.round(activeSection.orientationYieldFactor * 100)}% yield)
            </span>
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
            className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 pt-1">
            {azimuthPresets.map((a) => (
              <button
                key={a.deg}
                type="button"
                onClick={() =>
                  updateRoofSectionConfig(activeSection.id, { azimuthDeg: a.deg })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeSection.azimuthDeg === a.deg
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Orientation & Shading Factor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Layout Orientation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Panel Layout Orientation
            </label>
            <div className="grid grid-cols-3 gap-1">
              {orientationOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    updateRoofSectionConfig(activeSection.id, {
                      panelOrientation: opt.key,
                    })
                  }
                  className={`p-2 rounded-xl text-center text-xs font-semibold transition-all ${
                    activeSection.panelOrientation === opt.key
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/70'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shading Loss Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Adjacent Shading Loss
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {activeSection.shadingLossPercent}%
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
              className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
