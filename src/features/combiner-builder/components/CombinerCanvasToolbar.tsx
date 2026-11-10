// src/features/combiner-builder/components/CombinerCanvasToolbar.tsx
import {
  Move,
  Scissors,
  Link,
  Zap,
  ArrowRightLeft,
  Undo2,
  Redo2,
  Trash2,
  FileDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Layers,
} from 'lucide-react';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { ActiveCanvasTool } from '../types';

interface CombinerCanvasToolbarProps {
  onResetView?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  viewMode?: '3d' | '2d';
  onToggleViewMode?: () => void;
}

export function CombinerCanvasToolbar({
  onResetView,
  isFullscreen,
  onToggleFullscreen,
  viewMode = '3d',
  onToggleViewMode,
}: CombinerCanvasToolbarProps) {
  const canvasTool = useCombinerBoxStore((s) => s.canvasTool);
  const setCanvasTool = useCombinerBoxStore((s) => s.setCanvasTool);
  const isEnergized = useCombinerBoxStore((s) => s.isEnergized);
  const toggleEnergized = useCombinerBoxStore((s) => s.toggleEnergized);
  const atsSourceState = useCombinerBoxStore((s) => s.atsSourceState);
  const setAtsSourceState = useCombinerBoxStore((s) => s.setAtsSourceState);
  const clearWires = useCombinerBoxStore((s) => s.clearWires);
  const removeComponent = useCombinerBoxStore((s) => s.removeComponent);
  const removeWire = useCombinerBoxStore((s) => s.removeWire);
  const selectedComponentId = useCombinerBoxStore((s) => s.selectedComponentId);
  const selectedWireId = useCombinerBoxStore((s) => s.selectedWireId);
  const components = useCombinerBoxStore((s) => s.components);
  const undo = useCombinerBoxStore((s) => s.undo);
  const redo = useCombinerBoxStore((s) => s.redo);
  const undoStack = useCombinerBoxStore((s) => s.undoStack);
  const redoStack = useCombinerBoxStore((s) => s.redoStack);
  const setIsPaletteOpen = useCombinerBoxStore((s) => s.setIsPaletteOpen);
  const isPaletteOpen = useCombinerBoxStore((s) => s.isPaletteOpen);
  const setIsExportModalOpen = useCombinerBoxStore((s) => s.setIsExportModalOpen);
  const activeTemplateId = useCombinerBoxStore((s) => s.activeTemplateId);
  const loadTemplate = useCombinerBoxStore((s) => s.loadTemplate);
  const componentsCount = components.length;

  const selectedComponent = components.find((c) => c.id === selectedComponentId);

  const tools: { id: ActiveCanvasTool; label: string; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'move', label: 'Move / Select', icon: <Move className="w-3.5 h-3.5" />, tooltip: 'Select, inspect, or move equipment' },
    {
      id: 'wire_pos',
      label: 'L / DC+ Wire',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />,
      tooltip: 'Connect Line (AC) or Positive (DC) wire between terminals',
    },
    {
      id: 'wire_neg',
      label: 'N / DC- Wire',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />,
      tooltip: 'Connect Neutral (AC) or Negative (DC) wire between terminals',
    },
    {
      id: 'wire_sense',
      label: 'Sense Wire',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />,
      tooltip: 'Connect low-voltage sensing wire for ATS control',
    },
    {
      id: 'wire_pe',
      label: 'PE Earth',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />,
      tooltip: 'Connect Protective Earth ground wire to busbar',
    },
    { id: 'jumper', label: 'Jumper U-Loop', icon: <Link className="w-3.5 h-3.5" />, tooltip: 'Create arched jumper loop between adjacent breakers' },
    { id: 'cut', label: 'Cut / Delete', icon: <Scissors className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />, tooltip: 'Click any wire or component to delete it' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 select-none text-xs">
      {/* 1. Wiring & Placement Tools */}
      <div className="flex flex-wrap items-center gap-1 max-w-full bg-slate-100 dark:bg-slate-950/80 p-1 rounded-lg border border-slate-300 dark:border-slate-800">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCanvasTool(t.id)}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              canvasTool === t.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80'
            }`}
            title={t.tooltip}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 2. Preset Selector, Live Simulation & 2D/3D Parity Switcher */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Combiner Box Preset"
          value={activeTemplateId || 'template_reference_diagram'}
          onChange={(e) => loadTemplate(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none focus:border-amber-500"
          title="Load Pre-Built Combiner Box Layout"
        >
          <option value="template_reference_diagram">Ref. Combiner Box (100A ATS)</option>
          <option value="template_jesolar_hybrid">JEsolar 2-String Hybrid</option>
          <option value="template_mt_solarcell">MTC Solenoid ATS Build</option>
        </select>

        <button
          type="button"
          onClick={toggleEnergized}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isEnergized
              ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500/60 text-emerald-900 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
          title="Toggle circuit energization"
        >
          <Zap className={`w-3.5 h-3.5 ${isEnergized ? 'text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400' : ''}`} />
          <span>{isEnergized ? 'Live Energized' : 'Offline'}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setAtsSourceState(
              atsSourceState === 'source_a'
                ? 'source_b'
                : atsSourceState === 'source_b'
                ? 'off'
                : 'source_a',
            )
          }
          className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-400 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/25 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Simulate ATS Auto Transfer between Inverter and Grid"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>
            {atsSourceState === 'source_a'
              ? 'ATS: Source A (Inverter)'
              : atsSourceState === 'source_b'
              ? 'ATS: Source B (Grid)'
              : 'ATS: Disconnected (0)'}
          </span>
        </button>

        {onToggleViewMode && (
          <button
            type="button"
            onClick={onToggleViewMode}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === '2d'
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle between 3D Cabinet Model and 2D Single-Line Schematic"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{viewMode === '2d' ? '3D Cabinet View' : '2D Schematic (SLD)'}</span>
          </button>
        )}
      </div>

      {/* 3. Selected Item Delete Action */}
      {selectedComponent && (
        <button
          type="button"
          onClick={() => removeComponent(selectedComponent.id)}
          className="px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 border border-rose-400 dark:border-rose-500/50 hover:bg-rose-200 dark:hover:bg-rose-500/30 text-rose-900 dark:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title={`Delete selected ${selectedComponent.name}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Delete {selectedComponent.name.split(' ')[0]}</span>
        </button>
      )}

      {selectedWireId && !selectedComponent && (
        <button
          type="button"
          onClick={() => removeWire(selectedWireId)}
          className="px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 border border-rose-400 dark:border-rose-500/50 hover:bg-rose-200 dark:hover:bg-rose-500/30 text-rose-900 dark:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Delete selected wire"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Delete Wire</span>
        </button>
      )}

      {/* 4. History, Viewport & Drawer Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          title="Undo last action"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          title="Redo last action"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={clearWires}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          title="Clear all wires"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {onResetView && (
          <button
            type="button"
            onClick={onResetView}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white transition-colors cursor-pointer"
            title="Reset Camera Angle & Focus"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Viewport'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-900 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Export Wiring Schedule & Bill of Materials PDF"
        >
          <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden lg:inline">Export BoM</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPaletteOpen
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title="Toggle Hardware Library Drawer"
        >
          <Box className="w-3.5 h-3.5" />
          <span>+ Hardware ({componentsCount})</span>
        </button>
      </div>
    </div>
  );
}
