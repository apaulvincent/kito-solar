// src/features/combiner-builder/CombinerBuilderPage.tsx
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { CombinerTelemetryHud } from './components/CombinerTelemetryHud';
import { CombinerCanvasToolbar } from './components/CombinerCanvasToolbar';
import { CombinerHardwareLibrary } from './components/CombinerHardwareLibrary';
import { CombinerBox2DSchematic } from './components/CombinerBox2DSchematic';
import { WireGaugeAndFerruleSelector } from './components/WireGaugeAndFerruleSelector';
import { DrcInspectorModal } from './components/DrcInspectorModal';
import { BomAndPinoutExportModal } from './components/BomAndPinoutExportModal';
import { CombinerSceneCanvas } from './three/CombinerSceneCanvas';
import { useCombinerBoxStore } from './store/useCombinerBoxStore';

export function CombinerBuilderPage() {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const setIsExportModalOpen = useCombinerBoxStore((s) => s.setIsExportModalOpen);
  const selectedComponentId = useCombinerBoxStore((s) => s.selectedComponentId);
  const selectedWireId = useCombinerBoxStore((s) => s.selectedWireId);
  const removeComponent = useCombinerBoxStore((s) => s.removeComponent);
  const removeWire = useCombinerBoxStore((s) => s.removeWire);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetViewCount, setResetViewCount] = useState(0);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcut: Delete or Backspace to delete selected component or wire
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          e.preventDefault();
          removeComponent(selectedComponentId);
        } else if (selectedWireId) {
          e.preventDefault();
          removeWire(selectedWireId);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedComponentId, selectedWireId, removeComponent, removeWire]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleResetView = () => {
    setResetViewCount((c) => c + 1);
  };

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-3 flex flex-col">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('tool')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Solar Studio</span>
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider font-mono">
            3D Combiner Box & ATS Wiring Builder
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Wiring PDF</span>
          </button>
        </div>
      </div>

      {/* Live Engineering Telemetry Summary */}
      <section aria-label="Combiner Box Telemetry Summary" className="flex-shrink-0">
        <CombinerTelemetryHud />
      </section>

      {/* Main Interactive Workbench (3D CAD Viewport or 2D Schematic with docked Drawer) */}
      <section
        ref={containerRef}
        aria-label="Combiner Box Workspace"
        className={`w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-[#0b0f19] shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 h-screen rounded-none'
            : 'h-[600px] lg:h-[650px] xl:h-[680px]'
        }`}
      >
        {/* Dedicated Workbench Toolbar Header */}
        <div className="flex-shrink-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3 py-2 text-slate-900 dark:text-slate-100">
          <CombinerCanvasToolbar
            onResetView={handleResetView}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode((m) => (m === '3d' ? '2d' : '3d'))}
          />
        </div>

        {/* CAD Canvas + Hardware Library Row */}
        <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
          <div className="relative flex-1 min-w-0 h-full overflow-hidden">
            {viewMode === '3d' ? (
              <div className="w-full h-full">
                <CombinerSceneCanvas resetViewCount={resetViewCount} />
              </div>
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                <CombinerBox2DSchematic />
              </div>
            )}

            {/* Floating Wire Gauge & Ferrule Selector (3D View Only) */}
            {viewMode === '3d' && <WireGaugeAndFerruleSelector />}
          </div>

          {/* Right Column: Docked 3D Hardware Library (3D View Only) */}
          {viewMode === '3d' && <CombinerHardwareLibrary />}
        </div>
      </section>

      {/* Modals */}
      <DrcInspectorModal />
      <BomAndPinoutExportModal />
    </main>
  );
}

export default CombinerBuilderPage;
