// src/features/yield-simulator/components/BrownoutStressTestCard.tsx
import React from 'react';
import {
  ZapOff,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  BrownoutSchedule,
  DailySimulationSummary,
  DiagnosticInsight,
} from '../types/yieldSimulator';

interface BrownoutStressTestCardProps {
  brownoutSchedule: BrownoutSchedule;
  summary: DailySimulationSummary;
  diagnostics: DiagnosticInsight[];
  onBrownoutChange: (schedule: Partial<BrownoutSchedule>) => void;
  onApplyRecommendation: (insight: DiagnosticInsight) => void;
}

const OUTAGE_PRESETS = [
  { label: 'No Outage', enabled: false, startHour: 18, endHour: 22 },
  { label: 'Evening (6PM–10PM)', enabled: true, startHour: 18, endHour: 22 },
  { label: 'Late Night (8PM–11:30PM)', enabled: true, startHour: 20, endHour: 23.5 },
  { label: 'Midday (12PM–3PM)', enabled: true, startHour: 12, endHour: 15 },
];

export const BrownoutStressTestCard: React.FC<BrownoutStressTestCardProps> = ({
  brownoutSchedule,
  summary,
  diagnostics,
  onBrownoutChange,
  onApplyRecommendation,
}) => {
  const formatHour = (h: number) => {
    const wrapped = ((Math.floor(h) % 24) + 24) % 24;
    const mins = h % 1 >= 0.5 ? '30' : '00';
    const period = wrapped >= 12 ? 'PM' : 'AM';
    const h12 = wrapped % 12 === 0 ? 12 : wrapped % 12;
    return `${h12}:${mins} ${period}`;
  };

  const durationHours = Math.max(
    0.5,
    brownoutSchedule.endHour - brownoutSchedule.startHour
  );

  return (
    <section
      aria-label="Brownout Survival Test & Smart Recommendations"
      className="grid grid-cols-1 xl:grid-cols-12 gap-6"
    >
      {/* =====================================================================
          LEFT (5 cols): BROWNOUT SURVIVAL STRESS TESTER
         ===================================================================== */}
      <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)]">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                brownoutSchedule.enabled
                  ? 'bg-rose-500/15 text-rose-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <ZapOff className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Brownout Survival Stress Tester
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick a utility blackout window to see if your solar and battery keep the lights on
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {OUTAGE_PRESETS.map((preset) => {
              const isSelected =
                preset.enabled === brownoutSchedule.enabled &&
                (!preset.enabled ||
                  (Math.abs(brownoutSchedule.startHour - preset.startHour) < 0.1 &&
                    Math.abs(brownoutSchedule.endHour - preset.endHour) < 0.1));

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onBrownoutChange({
                      enabled: preset.enabled,
                      startHour: preset.startHour,
                      endHour: preset.endHour,
                    })
                  }
                  className={`p-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? preset.enabled
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {brownoutSchedule.enabled && (
            <div className="rounded-xl bg-slate-50 dark:bg-[#131B2B] p-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Blackout Starts At
                  </span>
                  <span className="font-mono font-bold tabular-nums text-rose-500">
                    {formatHour(brownoutSchedule.startHour)}
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={21}
                  step={0.5}
                  value={brownoutSchedule.startHour}
                  onChange={(e) => {
                    const nextStart = Number(e.target.value);
                    onBrownoutChange({
                      startHour: nextStart,
                      endHour: Math.max(nextStart + 1, brownoutSchedule.endHour),
                    });
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Blackout Ends At ({durationHours.toFixed(1)}h)
                  </span>
                  <span className="font-mono font-bold tabular-nums text-rose-500">
                    {formatHour(brownoutSchedule.endHour)}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.min(23.5, brownoutSchedule.startHour + 0.5)}
                  max={23.5}
                  step={0.5}
                  value={brownoutSchedule.endHour}
                  onChange={(e) =>
                    onBrownoutChange({ endHour: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Verdict Banner */}
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${
            !brownoutSchedule.enabled
              ? 'bg-slate-50 dark:bg-[#131B2B] text-slate-600 dark:text-slate-300'
              : summary.brownoutSurvived
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-500/10 text-rose-800 dark:text-rose-200'
          }`}
        >
          {!brownoutSchedule.enabled ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.75} />
          ) : summary.brownoutSurvived ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.75} />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" strokeWidth={1.75} />
          )}

          <div className="space-y-1 text-xs">
            <p className="font-bold text-sm">
              {!brownoutSchedule.enabled
                ? 'Utility Grid Normal (No Blackout Scheduled)'
                : summary.brownoutSurvived
                  ? `Passed: Home Survived Entire ${durationHours.toFixed(1)}h Outage`
                  : 'Outage Warning: Backup Reserve Depleted or Overloaded'}
            </p>
            <p className="opacity-85 leading-relaxed">
              {!brownoutSchedule.enabled
                ? 'Select one of the blackout buttons above to test how long your battery lasts when the street power goes out.'
                : summary.brownoutSurvived
                  ? `Your solar and battery kept active appliances running from ${formatHour(brownoutSchedule.startHour)} to ${formatHour(brownoutSchedule.endHour)} with ${summary.minBatterySocPercent.toFixed(0)}% minimum battery remaining.`
                  : `Your backup ran out of capacity (${summary.totalUnmetLoadKwh.toFixed(2)} kWh unserved${summary.batteryDepletedTimeLabel ? `, depleted at ${summary.batteryDepletedTimeLabel}` : ''}). Turn off heavy appliances or add a battery module below.`}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT (7 cols): SMART SYSTEM RECOMMENDATIONS
         ===================================================================== */}
      <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 space-y-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Smart System Recommendations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plain-English ways to get more free solar power or longer brownout backup
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {diagnostics.length === 0 ? (
            <div className="rounded-xl p-5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">System Operating Smoothly</h4>
                <p className="text-xs opacity-85 leading-relaxed">
                  Your solar array, inverter rating, and LiFePO4 battery reserve are well-balanced for today&apos;s load and weather profile.
                </p>
              </div>
            </div>
          ) : (
            diagnostics.map((item) => {
              const toneStyles =
                item.severity === 'critical'
                  ? 'bg-rose-500/10 text-rose-900 dark:text-rose-100'
                  : item.severity === 'warning'
                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-100'
                    : 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';

              const badgeStyles =
                item.severity === 'critical'
                  ? 'bg-rose-500 text-white'
                  : item.severity === 'warning'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500 text-slate-950';

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${toneStyles}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeStyles}`}
                      >
                        {item.severity === 'info' || item.severity === 'success'
                          ? 'Optimal'
                          : item.severity}
                      </span>
                      <h4 className="text-sm font-bold">{item.title}</h4>
                    </div>
                    <p className="text-xs opacity-85 leading-relaxed">{item.detail}</p>
                    <p className="text-xs font-semibold opacity-95">Tip: {item.recommendation}</p>
                  </div>

                  {item.actionType && (
                    <button
                      type="button"
                      onClick={() => onApplyRecommendation(item)}
                      className="group inline-flex items-center gap-2.5 rounded-full pl-4 pr-1.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shrink-0 self-start sm:self-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
                    >
                      <span>{item.actionLabel || 'Apply Fix'}</span>
                      <span className="w-6 h-6 rounded-full bg-white/15 dark:bg-slate-950/10 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
