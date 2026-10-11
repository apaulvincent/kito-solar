// src/components/results/CalculationWorkbench.tsx
import { useState } from 'react';
import { useCalculatorStore, WorkbenchTabKey } from '@/store/useCalculatorStore';
import { Zap, Sun, Hammer, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { DcResultsCard } from './DcResultsCard';
import { AcResultsCard } from './AcResultsCard';
import { BatteryResultsCard } from './BatteryResultsCard';
import { PvSizingCard } from './PvSizingCard';
import { MountingBomCard } from './MountingBomCard';
import { WarningsPanel } from './WarningsPanel';
import { DownloadSizingButton } from '@/components/common/DownloadSizingButton';

interface TabItem {
  id: WorkbenchTabKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Zap;
}

const TABS: TabItem[] = [
  {
    id: 'electrical',
    label: 'Electrical Schedules',
    shortLabel: 'Electrical',
    description: 'DC, AC & Battery Storage',
    icon: Zap,
  },
  {
    id: 'pv_sizing',
    label: 'PV Array Sizing',
    shortLabel: 'PV Sizing',
    description: 'Capacity & String Topology',
    icon: Sun,
  },
  {
    id: 'mounting_bom',
    label: 'Mounting Hardware BOM',
    shortLabel: 'Mounting BOM',
    description: 'Mechanical Racking & Accessories',
    icon: Hammer,
  },
  {
    id: 'warnings',
    label: 'Code Warnings & Compliance',
    shortLabel: 'Warnings',
    description: 'Design Health & Safety Advisories',
    icon: AlertTriangle,
  },
];

export function CalculationWorkbench() {
  const activeTab = useCalculatorStore((s) => s.activeWorkbenchTab);
  const setActiveTab = useCalculatorStore((s) => s.setActiveWorkbenchTab);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const step2DetailMode = useCalculatorStore((s) => s.step2DetailMode);
  const setStep2DetailMode = useCalculatorStore((s) => s.setStep2DetailMode);
  const [viewAll, setViewAll] = useState(false);

  const warnings = calculationResult.warnings;
  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card dark:shadow-card-dark overflow-hidden transition-colors duration-200 flex flex-col lg:h-[calc(100vh-6rem)]">
      {/* Pinned Header (Stays Fixed at Top — Matching Step 1 Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
              STEP 2: CALCULATION RESULTS &amp; SCHEDULES
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Engineering Calculation Workbench
            </h2>
          </div>
        </div>

        {/* Right Header Controls: Download Button, Detail Mode & View Mode */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <DownloadSizingButton variant="compact" />

          {/* Detail Level Toggle: Min Detail vs Detailed */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep2DetailMode('min')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                step2DetailMode === 'min'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Min Detail
            </button>
            <button
              type="button"
              onClick={() => setStep2DetailMode('detailed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                step2DetailMode === 'detailed'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* View Mode Toggle: Tabbed vs Full Schedule */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewAll(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                !viewAll
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tabbed Studio
            </button>
            <button
              type="button"
              onClick={() => setViewAll(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewAll
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Schedules
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Tab Navigation Row (Never Scrolls Away) */}
      {!viewAll && (
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0 z-10">
          <nav
            role="tablist"
            aria-label="Engineering Workbench Disciplines"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;
              const isWarningsTab = tab.id === 'warnings';

              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600/50 shadow-sm ring-1 ring-amber-400/20'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isActive
                            ? 'text-amber-900 dark:text-amber-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {tab.shortLabel}
                      </span>

                      {/* Advisory badge for warnings tab */}
                      {isWarningsTab && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            errorCount > 0
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : warningCount > 0
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {warningCount > 0 ? (
                            warningCount
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug truncate">
                      {tab.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Calculation Content — Independently Scrollable */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto overscroll-auto space-y-6">
        {viewAll ? (
          /* Comprehensive Unified Schedule Mode */
          <div className="space-y-6">
            <WarningsPanel />
            <div className="space-y-6">
              <DcResultsCard />
              <AcResultsCard />
              <BatteryResultsCard />
            </div>
            <PvSizingCard />
            <MountingBomCard />
          </div>
        ) : (
          /* Focused Discipline Tab Panels */
          <div>
            {activeTab === 'electrical' && (
              <div
                id="tabpanel-electrical"
                role="tabpanel"
                aria-labelledby="tab-electrical"
                className="space-y-6 transition-opacity duration-150"
              >
                <DcResultsCard />
                <AcResultsCard />
                <BatteryResultsCard />
              </div>
            )}

            {activeTab === 'pv_sizing' && (
              <div
                id="tabpanel-pv_sizing"
                role="tabpanel"
                aria-labelledby="tab-pv_sizing"
                className="transition-opacity duration-150"
              >
                <PvSizingCard />
              </div>
            )}

            {activeTab === 'mounting_bom' && (
              <div
                id="tabpanel-mounting_bom"
                role="tabpanel"
                aria-labelledby="tab-mounting_bom"
                className="transition-opacity duration-150"
              >
                <MountingBomCard />
              </div>
            )}

            {activeTab === 'warnings' && (
              <div
                id="tabpanel-warnings"
                role="tabpanel"
                aria-labelledby="tab-warnings"
                className="transition-opacity duration-150"
              >
                <WarningsPanel />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalculationWorkbench;
