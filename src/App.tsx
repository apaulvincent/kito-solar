import { useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Header } from '@/components/header/Header';
import { SystemSummary } from '@/components/summary/SystemSummary';
import { SolarDiagramCanvas } from '@/components/diagram/SolarDiagramCanvas';
import { DiagramComponentList } from '@/components/diagram/DiagramComponentList';
import { ConfigurationPanel } from '@/components/config/ConfigurationPanel';
import { PvSizingCard } from '@/components/results/PvSizingCard';
import { DcResultsCard } from '@/components/results/DcResultsCard';
import { AcResultsCard } from '@/components/results/AcResultsCard';
import { BatteryResultsCard } from '@/components/results/BatteryResultsCard';
import { MountingBomCard } from '@/components/results/MountingBomCard';
import { WarningsPanel } from '@/components/results/WarningsPanel';
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

        {/* Step 3: Equipment Configurator & Calculation Results (Widescreen 3-Column Studio) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1 (lg: 5 cols, xl: 4 cols): Configuration Workbench */}
          <section className="lg:col-span-5 xl:col-span-4 space-y-6" aria-label="Configuration Panel">
            <ConfigurationPanel />
          </section>

          {/* Column 2 (lg: 7 cols, xl: 4 cols): Electrical Protection & Schedules */}
          <section className="lg:col-span-7 xl:col-span-4 space-y-6" aria-label="Electrical Protection Schedules">
            <DcResultsCard />
            <AcResultsCard />
            <BatteryResultsCard />
          </section>

          {/* Column 3 (lg: 12 cols, xl: 4 cols): Compliance Warnings, PV Array Sizing & Mounting BOM */}
          <section className="lg:col-span-12 xl:col-span-4 space-y-6" aria-label="Array Sizing, Compliance and BOM">
            <WarningsPanel />
            <PvSizingCard />
            <MountingBomCard />
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
