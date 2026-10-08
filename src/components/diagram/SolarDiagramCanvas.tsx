// src/components/diagram/SolarDiagramCanvas.tsx
import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, Eye, Box, Sliders } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SolarScene } from './SolarScene';
import { Schematic2DView } from './Schematic2DView';

export function SolarDiagramCanvas() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] shadow-card dark:shadow-card-dark transition-all duration-300 ${
        isFullscreen ? 'h-screen fixed inset-0 z-50 rounded-none' : 'h-[480px] lg:h-[540px] xl:h-[600px]'
      }`}
    >
      {/* Top Engineering HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: System Status & View Selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D CAD STUDIO
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                viewMode === '2d'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              2D SCHEMATIC
            </button>
          </div>

          {/* System Mode Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                calculationResult.systemType === 'hybrid'
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                  : 'bg-sky-500 shadow-[0_0_6px_rgba(2,132,199,0.5)]'
              }`}
            />
            {calculationResult.systemType === 'hybrid'
              ? 'HYBRID SYSTEM'
              : 'ON-GRID SYSTEM'}
          </span>

          {selectedNodeKey && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 shadow-sm animate-in fade-in">
              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              FOCUS: {selectedNodeKey.toUpperCase().replace('_', ' ')}
              <button
                onClick={() => setSelectedNodeKey(null)}
                className="ml-1 hover:text-amber-950 dark:hover:text-amber-100 font-bold"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {/* Right: Viewport Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-sm">
          {viewMode === '3d' && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume Power Flow Animation' : 'Pause Power Flow Animation'}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setSelectedNodeKey(null)}
            title="Reset Active Focus"
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Viewport'}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pointer-events-none">
        <span className="hidden sm:inline bg-white/95 dark:bg-slate-900/95 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
          {viewMode === '3d'
            ? 'Hover accessories to inspect ratings • Orbit: Drag • Zoom: Scroll • Click node to open full calculations'
            : 'Click any schematic component to open equipment sizing and calculation derivations'}
        </span>
        <span className="bg-white/95 dark:bg-slate-900/95 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm font-semibold text-slate-800 dark:text-slate-200 backdrop-blur-sm">
          BUSBAR: {calculationResult.summary.totalArrayPowerKw} kW DC → {calculationResult.summary.inverterPowerKw} kW AC
        </span>
      </div>

      {/* Canvas Viewport */}
      {viewMode === '3d' ? (
        <Canvas
          camera={{ position: [0, 8, 18], fov: 42 }}
          shadows
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <SolarScene isAnimationPaused={isPaused} />
          </Suspense>
        </Canvas>
      ) : (
        <Schematic2DView />
      )}
    </div>
  );
}
