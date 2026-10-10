import { useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Header } from '@/components/header/Header';
import { SystemSummary } from '@/components/summary/SystemSummary';
import { SolarDiagramCanvas } from '@/components/diagram/SolarDiagramCanvas';
import { DiagramComponentList } from '@/components/diagram/DiagramComponentList';
import { ConfigurationPanel } from '@/components/config/ConfigurationPanel';
import { CalculationWorkbench } from '@/components/results/CalculationWorkbench';
import { ComponentInspector } from '@/components/inspector/ComponentInspector';
import { EngineeringDisclaimer } from '@/components/common/EngineeringDisclaimer';

export function App() {
  const initializeCatalog = useCalculatorStore((state) => state.initializeCatalog);

  useEffect(() => {
    initializeCatalog();
  }, [initializeCatalog]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Header />

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Step 1: Live System Summary Telemetry HUD */}
        <section aria-label="System Summary">
          <SystemSummary />
        </section>

        {/* Step 2: First-Class Interactive 3D Solar Diagram */}
        <section aria-label="Interactive 3D Solar Diagram" className="space-y-4">
          <SolarDiagramCanvas />
          <DiagramComponentList />
        </section>

        {/* Step 3: Equipment Configurator & Segmented Calculation Workbench (2-Column Studio) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1 (lg: 4 cols): Configuration Workbench */}
          <section className="lg:col-span-4 space-y-6" aria-label="Configuration Panel">
            <ConfigurationPanel />
          </section>

          {/* Column 2 (lg: 8 cols): Segmented Engineering Calculation Workbench */}
          <section className="lg:col-span-8 space-y-6" aria-label="Engineering Calculation Workbench">
            <CalculationWorkbench />
          </section>
        </div>

        {/* Step 4: Engineering Disclaimer */}
        <EngineeringDisclaimer />
      </main>

      {/* Slide-out Component Inspector Modal */}
      <ComponentInspector />
    </div>
  );
}

export default App;
