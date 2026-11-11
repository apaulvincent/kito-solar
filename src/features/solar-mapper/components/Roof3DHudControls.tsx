import React from 'react';
import { Layers, Map, Move, RotateCw } from 'lucide-react';
import { formatHourDecimal12h } from '@/lib/timeFormat';
import { RoofPolygonSection } from '../types/solarMapper';
import { getCardinalDirection } from '../utils/geometryAngles';
import { getDefaultSunHour } from '../utils/solarPhysics';

interface Roof3DHudControlsProps {
  roofSections: RoofPolygonSection[];
  activeSection: RoofPolygonSection | null;
  active3DTool: 'inspect' | 'move' | 'hinge';
  sunHour: number;
  onSetViewMode: (mode: '2d_satellite' | '3d_preview') => void;
  onSetActiveTool: (tool: 'inspect' | 'move' | 'hinge') => void;
  onSetSunHour: (hour: number) => void;
}

const SUN_PRESET_HOURS = [
  { h: 6, label: '6 AM' },
  { h: 9, label: '9 AM' },
  { h: 12, label: '12 PM' },
  { h: 15, label: '3 PM' },
  { h: 18, label: '6 PM' },
] as const;

export const Roof3DHudControls: React.FC<Roof3DHudControlsProps> = ({
  roofSections,
  activeSection,
  active3DTool,
  sunHour,
  onSetViewMode,
  onSetActiveTool,
  onSetSunHour,
}) => {
  const hasValidRoof = roofSections.some((s) => s.vertices.length >= 3);
  const nowHours = new Date().getHours() + new Date().getMinutes() / 60;
  const isNowSelected = Math.abs(sunHour - nowHours) < 0.2;

  return (
    <>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSetViewMode('2d_satellite')}
          className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0"
        >
          <Map className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="whitespace-nowrap">2D Satellite Map</span>
        </button>
      </div>

      {activeSection && activeSection.vertices.length >= 3 && (
        <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-md text-xs">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 font-bold font-mono">
            {activeSection.name || 'Active Face'}
          </span>
          <span className="text-slate-400 font-mono text-[11px] pr-2">
            {activeSection.pitchDeg === 0 ? 'Flat (0°)' : `${activeSection.pitchDeg}° Pitch`} •{' '}
            {`${activeSection.azimuthDeg}° ${getCardinalDirection(activeSection.azimuthDeg).shortLabel}`}
          </span>
        </div>
      )}

      {!activeSection && hasValidRoof && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-slate-300 text-xs backdrop-blur-md shadow-md flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Click any roof to select &amp; adjust in 3D</span>
          </div>
        </div>
      )}

      {!hasValidRoof && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs z-10 p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
            <Layers className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Roof Polygons Traced Yet</h4>
            <p className="text-xs text-slate-400">
              Trace your roof corners on the satellite map to inspect the 3D model and packed solar array.
            </p>
            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => onSetViewMode('2d_satellite')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
              >
                Return to Satellite
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection && activeSection.vertices.length >= 3 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-2rem)] overflow-x-auto no-scrollbar">
          <div className="p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl flex items-center gap-1.5 select-none">
            <button
              type="button"
              onClick={() => onSetActiveTool('hinge')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                active3DTool === 'hinge' || active3DTool === 'inspect'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Adjust roof pitch and roll tilt along building edges"
            >
              <RotateCw className="w-3.5 h-3.5 text-current flex-shrink-0" />
              <span>Tilt & Pitch</span>
            </button>

            <button
              type="button"
              onClick={() => onSetActiveTool('move')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                active3DTool === 'move'
                  ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Move roof in 3D: X East/West, Y Elevation, Z North/South"
            >
              <Move className="w-3.5 h-3.5 text-current flex-shrink-0" />
              <span>Move</span>
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg">
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl space-y-2 select-none">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="text-amber-400">☀</span>
              Sun Simulation: {formatHourDecimal12h(sunHour)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSetSunHour(getDefaultSunHour())}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  isNowSelected
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Snap sun to current local time"
              >
                Now
              </button>
              {SUN_PRESET_HOURS.map(({ h, label }) => {
                const isPresetActive = Math.abs(sunHour - h) < 0.5 && !isNowSelected;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onSetSunHour(h)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      isPresetActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            type="range"
            min="6.0"
            max="18.0"
            step="0.1"
            value={sunHour}
            onChange={(e) => onSetSunHour(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
            <span>6:00 AM (Sunrise East)</span>
            <span>12:00 PM (Solar Noon South)</span>
            <span>6:00 PM (Sunset West)</span>
          </div>
        </div>
      </div>
    </>
  );
};
