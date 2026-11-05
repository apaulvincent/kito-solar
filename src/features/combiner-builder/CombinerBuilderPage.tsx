// src/features/combiner-builder/CombinerBuilderPage.tsx
import { ArrowLeft, Box, Download, FileText } from 'lucide-react';
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

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('tool')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors"
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

      {/* Main 3D Interactive Workbench */}
      <section
        aria-label="3D Combiner Box Canvas"
        className="flex-1 min-h-[520px] relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-2xl flex flex-col"
      >
        {/* Floating Top Action Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <CombinerCanvasToolbar />
          </div>
        </div>

        {/* 3D Scene Viewport */}
        <div className="w-full h-full">
          <CombinerSceneCanvas />
        </div>

        {/* Floating Wire Gauge & Ferrule Selector */}
        <WireGaugeAndFerruleSelector />

        {/* Slide-out 3D Hardware Library Drawer */}
        <CombinerHardwareLibrary />
      </section>

      {/* Modals */}
      <DrcInspectorModal />
      <BomAndPinoutExportModal />
    </main>
  );
}

export default CombinerBuilderPage;
