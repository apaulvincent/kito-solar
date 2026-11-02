// src/components/diagram/SolarDiagramCanvas.tsx
import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Box,
  Sliders,
  Columns2,
  Move,
  Trash2,
  PanelRightOpen,
  AlertTriangle,
  Undo2,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SolarScene } from './SolarScene';
import { Schematic2DView } from './Schematic2DView';
import { PlantComponentPalette } from './PlantComponentPalette';

export function SolarDiagramCanvas() {
  const [viewMode, setViewMode] = useState<'3d' | 'split' | '2d'>('3d');
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetViewCount, setResetViewCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const toggleAtsSource = useCalculatorStore((s) => s.toggleAtsSource);

  const layout3d = useCalculatorStore((s) => s.layout3d);
  const canvasTool = useCalculatorStore((s) => s.canvasTool);
  const setCanvasTool = useCalculatorStore((s) => s.setCanvasTool);
  const isPaletteOpen = useCalculatorStore((s) => s.isPaletteOpen);
  const setIsPaletteOpen = useCalculatorStore((s) => s.setIsPaletteOpen);
  const selectedCustomNodeId = useCalculatorStore((s) => s.selectedCustomNodeId);
  const setSelectedCustomNodeId = useCalculatorStore((s) => s.setSelectedCustomNodeId);
  const selectedWireId = useCalculatorStore((s) => s.selectedWireId);
  const setSelectedWireId = useCalculatorStore((s) => s.setSelectedWireId);
  const removePlacedComponent = useCalculatorStore((s) => s.removePlacedComponent);
  const removeWireConnection = useCalculatorStore((s) => s.removeWireConnection);
  const resetLayout3D = useCalculatorStore((s) => s.resetLayout3D);
  const polarityAlertMessage = useCalculatorStore((s) => s.polarityAlertMessage);
  const setPolarityAlertMessage = useCalculatorStore((s) => s.setPolarityAlertMessage);

  const selectedCustomNode = layout3d.placedComponents.find((c) => c.id === selectedCustomNodeId) || null;
  const selectedWire = layout3d.wires.find((w) => w.id === selectedWireId) || null;
  const hasCustomLayoutChanges =
    layout3d.placedComponents.length > 0 ||
    layout3d.wires.length > 0 ||
    Object.keys(layout3d.baseNodePositions).length > 0;

  // Auto-dismiss polarity alert after 5 seconds
  useEffect(() => {
    if (!polarityAlertMessage) return;
    const timer = window.setTimeout(() => {
      setPolarityAlertMessage(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [polarityAlertMessage, setPolarityAlertMessage]);

  // Keyboard shortcuts for Delete/Backspace on selected 3D node/wire & Escape to return to Select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCustomNodeId) {
          e.preventDefault();
          removePlacedComponent(selectedCustomNodeId);
        } else if (selectedWireId) {
          e.preventDefault();
          removeWireConnection(selectedWireId);
        }
      } else if (e.key === 'Escape') {
        if (canvasTool !== 'select') {
          setCanvasTool('select');
        } else if (selectedCustomNodeId) {
          setSelectedCustomNodeId(null);
        } else if (selectedWireId) {
          setSelectedWireId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedCustomNodeId,
    selectedWireId,
    canvasTool,
    removePlacedComponent,
    removeWireConnection,
    setCanvasTool,
    setSelectedCustomNodeId,
    setSelectedWireId,
  ]);

  // Sync fullscreen state when Esc exits browser fullscreen
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleResetView = () => {
    setSelectedNodeKey(null);
    setSelectedCustomNodeId(null);
    setSelectedWireId(null);
    setResetViewCount((c) => c + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCanvasMiss = () => {
    if (selectedCustomNodeId) setSelectedCustomNodeId(null);
    if (selectedWireId) setSelectedWireId(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] shadow-card dark:shadow-card-dark transition-all duration-300 ${
        isFullscreen
          ? 'h-screen fixed inset-0 z-50 rounded-none'
          : viewMode === 'split'
          ? 'h-[600px] lg:h-[650px] xl:h-[700px]'
          : 'h-[540px] lg:h-[620px] xl:h-[680px]'
      }`}
    >
      {/* Top Engineering HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Selector, 3D Builder Tools & System Status */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* View Mode Toggle: 3D CAD, SPLIT, 2D SCHEMATIC */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D CAD
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              SPLIT SYNC
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              2D SCHEMATIC
            </button>
          </div>

          {/* Interactive 3D Plant Builder Toolset (Move, +Red Wire, -Black Wire, +/- Twin Pair) */}
          {(viewMode === '3d' || viewMode === 'split') && (
            <div
              role="group"
              aria-label="3D Wiring and Placement Tools"
              className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm"
            >
              <button
                type="button"
                onClick={() => setCanvasTool('select')}
                title="Move & Select components on wall or floor"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  canvasTool === 'select'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Move</span>
              </button>

              <button
                type="button"
                onClick={() => setCanvasTool('wire_pos')}
                title="Drag Positive (+) Red wire between component terminals"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  canvasTool === 'wire_pos'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    canvasTool === 'wire_pos' ? 'bg-white' : 'bg-red-500'
                  }`}
                />
                <span>+ Wire</span>
              </button>

              <button
                type="button"
                onClick={() => setCanvasTool('wire_neg')}
                title="Drag Negative (-) Dark Gray wire between component terminals"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  canvasTool === 'wire_neg'
                    ? 'bg-slate-600 text-white border border-slate-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-500 border border-slate-300" />
                <span>- Wire</span>
              </button>

              <button
                type="button"
                onClick={() => setCanvasTool('wire_pair')}
                title="Drag Twin (+/-) Red & Dark Gray cable pair simultaneously"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  canvasTool === 'wire_pair'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                <span className="inline-flex items-center -space-x-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-slate-500 border border-slate-300" />
                </span>
                <span>+/- Pair</span>
              </button>
            </div>
          )}

          {/* System Mode Pill */}
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                calculationResult.systemType === 'hybrid'
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                  : 'bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.5)]'
              }`}
            />
            {calculationResult.systemType === 'hybrid' ? 'HYBRID' : 'ON-GRID'}
          </span>

          {/* ATS Transfer Switch Active Source Pill */}
          <button
            type="button"
            onClick={toggleAtsSource}
            title={`ATS Switch: currently ${atsSource === 'solar' ? 'SOLAR (LEFT)' : 'UTILITY (RIGHT)'} - click to toggle`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:border-amber-500 transition-colors cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 font-mono">ATS:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                atsSource === 'solar'
                  ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                  : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
              }`}
            />
            <span className="font-bold">
              {atsSource === 'solar' ? 'SOLAR' : 'UTILITY'}
            </span>
          </button>

          {selectedNodeKey && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {selectedNodeKey.toUpperCase().replace(/_/g, ' ')}
              <button
                type="button"
                onClick={() => setSelectedNodeKey(null)}
                className="ml-1 hover:text-amber-950 dark:hover:text-amber-100 font-bold cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}

          {/* Contextual Custom 3D Component Selection Pill + Delete */}
          {selectedCustomNode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/70 text-amber-900 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <span>
                {selectedCustomNode.label} ({selectedCustomNode.surface.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={() => removePlacedComponent(selectedCustomNode.id)}
                title="Delete selected 3D component (Del)"
                className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </span>
          )}

          {/* Contextual Custom Wire Selection Pill + Delete */}
          {selectedWire && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900/95 border border-amber-500/70 text-white shadow-sm backdrop-blur-md">
              <span
                className={
                  selectedWire.polarity === 'positive' ? 'text-red-400 font-bold' : 'text-sky-300 font-bold'
                }
              >
                {selectedWire.polarity === 'positive' ? '(+) RED' : '(-) BLACK'}
              </span>
              <span>{selectedWire.lengthMeters}m</span>
              <button
                type="button"
                onClick={() => removeWireConnection(selectedWire.id)}
                title="Delete selected wire (Del)"
                className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Cut
              </button>
            </span>
          )}
        </div>

        {/* Right: Palette Toggle, Reset Layout & Viewport Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {(viewMode === '3d' || viewMode === 'split') && hasCustomLayoutChanges && (
            <button
              type="button"
              onClick={resetLayout3D}
              title="Reset custom 3D components, wires, and moved positions"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 shadow-sm transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset 3D</span>
            </button>
          )}

          {(viewMode === '3d' || viewMode === 'split') && !isPaletteOpen && (
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              title="Open 3D Hardware Library"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              <span>+ Hardware ({layout3d.placedComponents.length})</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-sm">
            {(viewMode === '3d' || viewMode === 'split') && (
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume Power Flow Animation' : 'Pause Power Flow Animation'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isPaused
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleResetView}
              title="Reset Camera Angle & Focus"
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Viewport'}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Polarity / Wiring Guard Alert Banner */}
      {polarityAlertMessage && (
        <div className="absolute top-14 left-3 z-30 max-w-lg px-3.5 py-2 rounded-xl bg-red-950/95 border border-red-500/80 text-red-100 text-xs font-mono flex items-center gap-2 shadow-xl backdrop-blur-md pointer-events-auto">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{polarityAlertMessage}</span>
          <button
            type="button"
            onClick={() => setPolarityAlertMessage(null)}
            className="ml-1 text-red-300 hover:text-white font-bold cursor-pointer"
            aria-label="Dismiss polarity warning"
          >
            ✕
          </button>
        </div>
      )}

      {/* Right-Side Addable 3D Hardware Component Palette */}
      {(viewMode === '3d' || viewMode === 'split') && <PlantComponentPalette />}

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-2.5 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pointer-events-none">
        <span className="hidden sm:inline bg-white/95 dark:bg-slate-900/95 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
          {canvasTool !== 'select'
            ? 'WIRE MODE: Drag from any terminal lug to snap (+) Red or (-) Black conductors onto target terminals'
            : viewMode === '3d'
            ? 'Drag equipment across wall or floor • Switch to +Wire / -Wire to attach conductors • Click base node for derivations'
            : viewMode === 'split'
            ? 'Synchronized 3D CAD & 2D Schematic • Flow: 🟡 Solar DC • 🟢 Battery • 🔵 AC'
            : 'Click component to inspect derivations • Drag canvas to pan • Scroll to zoom'}
        </span>
        <span className="bg-white/95 dark:bg-slate-900/95 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm font-semibold text-slate-800 dark:text-slate-200 backdrop-blur-sm">
          BUSBAR: {calculationResult.summary.totalArrayPowerKw} kW DC → {calculationResult.summary.inverterPowerKw} kW AC
        </span>
      </div>

      {/* Viewport Render: 3D CAD, 2D Schematic, or Synchronized Split View */}
      {viewMode === '3d' && (
        <Canvas
          camera={{ position: [0.6, 4.4, 18.5], fov: 42 }}
          shadows
          gl={{ antialias: true }}
          onPointerMissed={handleCanvasMiss}
        >
          <Suspense fallback={null}>
            <SolarScene isAnimationPaused={isPaused} resetViewCount={resetViewCount} />
          </Suspense>
        </Canvas>
      )}

      {viewMode === '2d' && <Schematic2DView resetViewCount={resetViewCount} />}

      {viewMode === 'split' && (
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 pt-14 pb-8 overflow-hidden">
          {/* Left Column: 3D CAD Wall Studio */}
          <div className="relative w-full h-[280px] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-black/20">
            <div className="absolute top-2 left-3 z-10 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 backdrop-blur-sm pointer-events-none shadow-sm">
              3D CAD Wall Backboard
            </div>
            <Canvas
              camera={{ position: [0.6, 4.2, 17.5], fov: 44 }}
              shadows
              gl={{ antialias: true }}
              onPointerMissed={handleCanvasMiss}
            >
              <Suspense fallback={null}>
                <SolarScene isAnimationPaused={isPaused} resetViewCount={resetViewCount} />
              </Suspense>
            </Canvas>
          </div>

          {/* Right Column: 2D Single-Line Schematic */}
          <div className="relative w-full h-[280px] lg:h-full overflow-hidden">
            <div className="absolute top-2 left-3 z-10 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 backdrop-blur-sm pointer-events-none shadow-sm">
              2D Single-Line Schematic
            </div>
            <Schematic2DView resetViewCount={resetViewCount} />
          </div>
        </div>
      )}
    </div>
  );
}
