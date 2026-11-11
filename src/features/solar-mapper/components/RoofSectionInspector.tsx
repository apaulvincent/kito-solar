import React, { useState } from 'react';
import { Compass, Layers, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { PanelOrientation, RoofPolygonSection } from '../types/solarMapper';
import { getCardinalDirection } from '../utils/geometryAngles';
import { CustomPanelSpecEditor } from './CustomPanelSpecEditor';

const SectionTabsBar: React.FC<{
  roofSections: RoofPolygonSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove?: (id: string) => void;
}> = ({ roofSections, activeSectionId, onSelect, onAdd, onRemove }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {roofSections.map((sec, idx) => {
        const isSelected = sec.id === activeSectionId;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onSelect(sec.id)}
            className={`group px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              isSelected
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? 'bg-slate-950' : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
            <span>{sec.name || `Face ${idx + 1}`}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected
                  ? 'bg-slate-950/15 text-slate-950'
                  : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
              }`}
            >
              {sec.recommendedMaxPanels}p
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
        title="Add another roof plane (e.g. Garage / Extension)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>

    {onRemove && activeSectionId && roofSections.length > 1 && (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onRemove(activeSectionId)}
          className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
          title="Delete this roof plane"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
);

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

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  const handleApplyToAllFaces = (specs: {
    customPanelWidthM: number;
    customPanelLengthM: number;
    customPanelWattage: number;
  }) => {
    roofSections.forEach((sec) => {
      updateRoofSectionConfig(sec.id, specs);
    });
  };

  if (roofSections.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#0B111E] border border-slate-200/80 dark:border-white/10 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Roof Faces Defined Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Click &quot;Draw Roof&quot; on the satellite map or add a new plane to configure pitch,
            azimuth orientation, and solar harvest calculations.
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
    );
  }

  if (!activeSection) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#0B111E] border border-slate-200/80 dark:border-white/10 p-6 space-y-5 shadow-sm">
        <SectionTabsBar
          roofSections={roofSections}
          activeSectionId={null}
          onSelect={setActiveSectionId}
          onAdd={() => addRoofSection()}
        />

        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Roof Section Selected
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click any roof in the 3D scene or satellite map, or choose a tab above to inspect
              engineering metrics, pitch, and orientation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSectionId(roofSections[0].id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Select {roofSections[0].name || 'First Roof Face'}</span>
          </button>
        </div>
      </div>
    );
  }

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
    <div className="rounded-2xl bg-white dark:bg-[#0B111E] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-5 shadow-sm">
      <SectionTabsBar
        roofSections={roofSections}
        activeSectionId={activeSection.id}
        onSelect={setActiveSectionId}
        onAdd={() => addRoofSection()}
        onRemove={removeRoofSection}
      />

      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={activeSection.name}
          onChange={(e) => updateRoofSectionConfig(activeSection.id, { name: e.target.value })}
          placeholder="Section Name (e.g. Main South Roof)"
          className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-white/15 focus:border-amber-400 focus:outline-hidden pb-1"
        />
      </div>

      <CustomPanelSpecEditor
        activeSection={activeSection}
        roofSectionsCount={roofSections.length}
        defaultPanelWattage={panelWattage}
        onSetPanelWattage={setPanelWattage}
        onUpdateSection={updateRoofSectionConfig}
        onApplySpecsToAll={handleApplyToAllFaces}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Flat Footprint
          </div>
          <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
            {activeSection.flatAreaSqm.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">m²</span>
          </div>
        </div>

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

      <div className="space-y-4 pt-1">
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Roof Orientation
                </div>
                <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 pt-0.5">
                  {activeSection.pitchDeg === 0
                    ? 'Flat Surface (0°)'
                    : `${activeSection.pitchDeg}° Pitch`}
                  {' • '}
                  {getCardinalDirection(activeSection.azimuthDeg).label}
                  {(activeSection.rollDeg ?? 0) !== 0 && ` • ${activeSection.rollDeg}° Roll`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 hover:text-amber-500 hover:bg-amber-500/10 border border-slate-200 dark:border-white/10 transition-all shadow-xs active:scale-95"
                title="Reset roof flat on surface (0° pitch, 0° roll)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset Flat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`py-2 px-1.5 rounded-xl text-center text-xs font-semibold transition-all whitespace-nowrap ${
                    activeSection.panelOrientation === opt.key
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/50 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400">Panel Alignment:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {activeSection.panelRotationDeg !== undefined
                    ? `${activeSection.panelRotationDeg}° (Custom)`
                    : `${Math.round(activeSection.placedPanels[0]?.rotationDeg ?? 0)}° (Auto Roof Edge)`}
                </span>
                <button
                  type="button"
                  title="Rotate panel alignment by 90°"
                  onClick={() => {
                    const current =
                      activeSection.panelRotationDeg !== undefined
                        ? activeSection.panelRotationDeg
                        : activeSection.placedPanels[0]?.rotationDeg ?? 0;
                    let next = Math.round(current + 90);
                    while (next > 90) next -= 180;
                    updateRoofSectionConfig(activeSection.id, { panelRotationDeg: next });
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/80 dark:bg-white/10 hover:bg-amber-400 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  +90°
                </button>
                {activeSection.panelRotationDeg !== undefined && (
                  <button
                    type="button"
                    title="Reset to Auto Roof Edge Alignment"
                    onClick={() =>
                      updateRoofSectionConfig(activeSection.id, {
                        panelRotationDeg: undefined,
                      })
                    }
                    className="px-1.5 py-0.5 rounded text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

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

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reset roof flat on surface?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This will reset pitch to 0°, level secondary roll tilt, and align elevation flat to
                  the surface plane.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateRoofSectionConfig(activeSection.id, {
                    pitchDeg: 0,
                    rollDeg: 0,
                    baseHeightMeters: 4.0,
                  });
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
