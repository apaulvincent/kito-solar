// src/features/combiner-builder/CombinerBuilderPage.tsx
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { CombinerTelemetryHud } from './components/CombinerTelemetryHud';
import { CombinerCanvasToolbar } from './components/CombinerCanvasToolbar';
import { CombinerHardwareLibrary } from './components/CombinerHardwareLibrary';
import { WireGaugeAndFerruleSelector } from './components/WireGaugeAndFerruleSelector';
import { DrcInspectorModal } from './components/DrcInspectorModal';
import { BomAndPinoutExportModal } from './components/BomAndPinoutExportModal';
import { CombinerSceneCanvas } from './three/CombinerSceneCanvas';
import { useCombinerBoxStore } from './store/useCombinerBoxStore';

export function CombinerBuilderPage() {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const setIsExportModalOpen = useCombinerBoxStore((s) => s.setIsExportModalOpen);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetViewCount, setResetViewCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-4 flex flex-col">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('tool')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Solar Studio</span>
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
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

      {/* Main 3D Interactive Workbench (Spacious CAD viewport with docked Hardware Drawer) */}
      <section
        ref={containerRef}
        aria-label="3D Combiner Box Canvas"
        className={`w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 h-screen rounded-none'
            : 'h-[720px] lg:h-[820px] xl:h-[880px]'
        }`}
      >
        {/* Dedicated Workbench Toolbar Header */}
        <div className="flex-shrink-0 z-20 border-b border-slate-800 bg-slate-900/95 px-3 py-2">
          <CombinerCanvasToolbar
            onResetView={handleResetView}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>

        {/* CAD Canvas + Hardware Library Row */}
        <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
          {/* Left Column: 3D Scene Viewport + HUD Overlays */}
          <div className="relative flex-1 min-w-0 h-full overflow-hidden">
            {/* 3D Scene Viewport */}
            <div className="w-full h-full">
              <CombinerSceneCanvas resetViewCount={resetViewCount} />
            </div>

            {/* Floating Wire Gauge & Ferrule Selector */}
            <WireGaugeAndFerruleSelector />
          </div>

          {/* Right Column: Docked 3D Hardware Library (Pushes 3D viewport left when open) */}
          <CombinerHardwareLibrary />
        </div>
      </section>

      {/* Modals */}
      <DrcInspectorModal />
      <BomAndPinoutExportModal />
    </main>
  );
}

export default CombinerBuilderPage;
