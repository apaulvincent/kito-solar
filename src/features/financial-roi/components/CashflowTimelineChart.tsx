// src/features/financial-roi/components/CashflowTimelineChart.tsx
import { useState, useRef } from 'react';
import { Layers, TrendingUp, Sparkles } from 'lucide-react';
import { useFinancialRoiStore, useFinancialRoiSimulation } from '../store/useFinancialRoiStore';
import { ExportStrategy, YearlyCashflowPoint } from '../types/financialRoi';

export function CashflowTimelineChart() {
  const showAllCurves = useFinancialRoiStore((s) => s.showAllCurvesOnTimeline);
  const setShowAllCurves = useFinancialRoiStore((s) => s.setShowAllCurvesOnTimeline);
  const { activeSim, allScenarios } = useFinancialRoiSimulation();

  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Coordinate Geometry
  const viewBoxWidth = 860;
  const viewBoxHeight = 370;
  const paddingLeft = 72;
  const paddingRight = 32;
  const paddingTop = 36;
  const paddingBottom = 44;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;

  // Find min and max cashflow across scenarios to scale Y-axis
  let minCashflow = 0;
  let maxCashflow = 100000;

  const seriesToConsider = showAllCurves
    ? [allScenarios.zero_export, allScenarios.net_metering, allScenarios.hybrid_battery]
    : [activeSim];

  seriesToConsider.forEach((sim) => {
    sim.cashflowSeries.forEach((pt) => {
      if (pt.cumulativeCashflowPhp < minCashflow) minCashflow = pt.cumulativeCashflowPhp;
      if (pt.cumulativeCashflowPhp > maxCashflow) maxCashflow = pt.cumulativeCashflowPhp;
    });
  });

  // Add 12% visual breathing room
  minCashflow = Math.min(minCashflow * 1.15, -60000);
  maxCashflow = Math.max(maxCashflow * 1.12, 500000);

  const getX = (year: number) => paddingLeft + (year / 10) * chartWidth;
  const getY = (cashflow: number) =>
    paddingTop + (1 - (cashflow - minCashflow) / (maxCashflow - minCashflow)) * chartHeight;

  const zeroY = getY(0);

  // SVG Path Generator
  const buildSvgPath = (points: YearlyCashflowPoint[]) => {
    return points
      .map((pt, idx) => {
        const x = getX(pt.year);
        const y = getY(pt.cumulativeCashflowPhp);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Closed Area Path to the Zero Axis for gradient fill
  const buildAreaPath = (points: YearlyCashflowPoint[]) => {
    if (points.length === 0) return '';
    const linePath = buildSvgPath(points);
    const firstX = getX(points[0].year).toFixed(1);
    const lastX = getX(points[points.length - 1].year).toFixed(1);
    return `${linePath} L ${lastX} ${zeroY.toFixed(1)} L ${firstX} ${zeroY.toFixed(1)} Z`;
  };

  const activePoints = activeSim.cashflowSeries;
  const activePathString = buildSvgPath(activePoints);
  const activeAreaString = buildAreaPath(activePoints);

  const curveStyles: Record<
    ExportStrategy,
    { stroke: string; strokeDasharray?: string; label: string; strokeWidth: number }
  > = {
    net_metering: { stroke: '#10b981', strokeWidth: 2.75, label: 'Grid-Tie Net Metering' },
    zero_export: { stroke: '#f59e0b', strokeDasharray: '5 4', strokeWidth: 2, label: 'Grid-Tie Zero-Export' },
    hybrid_battery: { stroke: '#3b82f6', strokeDasharray: '7 4', strokeWidth: 2, label: 'Hybrid + LiFePO4' },
    hybrid_plus_net_metering: { stroke: '#8b5cf6', strokeWidth: 2.25, label: 'Hybrid + Net Metering' },
  };

  const breakevenYear = activeSim.paybackYears;
  const hasBreakeven = breakevenYear !== null && breakevenYear <= 10;
  const breakevenX = hasBreakeven ? getX(breakevenYear!) : null;

  const activeHoverPoint =
    hoveredYear !== null ? activeSim.cashflowSeries.find((pt) => pt.year === hoveredYear) : null;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * viewBoxWidth;

    if (svgX < paddingLeft || svgX > viewBoxWidth - paddingRight) {
      setHoveredYear(null);
      return;
    }

    const yearFraction = ((svgX - paddingLeft) / chartWidth) * 10;
    const clampedYear = Math.max(0, Math.min(10, Math.round(yearFraction)));
    setHoveredYear(clampedYear);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-5 sm:p-8 shadow-sm transition-all duration-300 space-y-6">
        {/* Top Header & Multi-Line Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                Capital Recovery Horizon
              </span>
              <span className="text-xs font-mono text-slate-400">• {activeSim.label}</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              10-Year Cumulative Cashflow &amp; Breakeven Curve
            </h3>
          </div>

          {/* Island Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAllCurves(!showAllCurves)}
              className={`group inline-flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
                showAllCurves
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.1]'
              }`}
            >
              <span>{showAllCurves ? 'Overlaying All 3 Topologies' : 'Single Curve Isolation'}</span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${
                  showAllCurves
                    ? 'bg-white/15 dark:bg-slate-950/15'
                    : 'bg-slate-900/[0.06] dark:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* 4-Column Executive Financial Telemetry Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02]">
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-slate-400 block mb-1">
              Exact Breakeven
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
              {activeSim.paybackFormatted}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {activeSim.paybackMonthsTotal ? `Month ${activeSim.paybackMonthsTotal} crossover` : 'Beyond 10-yr horizon'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.05]">
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-400 block mb-1">
              10-Year Net Profit
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              +₱{activeSim.netProfit10YearsPhp.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Net of CAPEX &amp; renewals
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02]">
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-slate-400 block mb-1">
              Net Present Value (NPV)
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              ₱{activeSim.npv10YearsPhp.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Discounted cashflow valuation
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02]">
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-slate-400 block mb-1">
              Lifecycle Return (ROI)
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {activeSim.roiPercentage10Years > 0 ? '+' : ''}
              {activeSim.roiPercentage10Years}%
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              LCOE: ₱{activeSim.lcoePhpPerKwh.toFixed(2)}/kWh
            </span>
          </div>
        </div>

        {/* Recessed SVG Viewport */}
        <div
          ref={containerRef}
          className="relative w-full rounded-3xl bg-slate-50/70 dark:bg-[#070A10] p-3 sm:p-5 overflow-hidden select-none"
        >
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoveredYear(null)}
          >
            <defs>
              <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="75%" stopColor="#10b981" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="deficitZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Deficit Zone Below ₱0 */}
            <rect
              x={paddingLeft}
              y={zeroY}
              width={chartWidth}
              height={Math.max(0, getY(minCashflow) - zeroY)}
              fill="url(#deficitZoneGrad)"
              rx={6}
            />

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[-750000, -500000, -250000, 0, 250000, 500000, 750000, 1000000, 1500000, 2000000].map((val) => {
              if (val < minCashflow || val > maxCashflow) return null;
              const y = getY(val);
              const isZero = val === 0;
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={viewBoxWidth - paddingRight}
                    y2={y}
                    stroke={isZero ? '#64748b' : '#cbd5e1'}
                    strokeOpacity={isZero ? 0.55 : 0.35}
                    strokeDasharray={isZero ? undefined : '4 4'}
                    strokeWidth={isZero ? 1.5 : 1}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 3.5}
                    textAnchor="end"
                    className={`text-[10px] font-mono tabular-nums select-none ${
                      isZero
                        ? 'font-extrabold fill-slate-900 dark:fill-white'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {val === 0
                      ? '₱0'
                      : Math.abs(val) >= 1000000
                      ? `${val > 0 ? '+' : '-'}₱${(Math.abs(val) / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`
                      : `${val > 0 ? '+' : '-'}₱${Math.abs(val / 1000).toFixed(0)}k`}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Milestone Years */}
            {[0, 2, 4, 6, 8, 10].map((year) => {
              const x = getX(year);
              return (
                <g key={year}>
                  <line
                    x1={x}
                    y1={viewBoxHeight - paddingBottom}
                    x2={x}
                    y2={viewBoxHeight - paddingBottom + 6}
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={viewBoxHeight - paddingBottom + 20}
                    textAnchor="middle"
                    className="text-[10px] font-mono uppercase tracking-wider fill-slate-400 dark:fill-slate-500 select-none"
                  >
                    Yr {year}
                  </text>
                </g>
              );
            })}

            {/* Area Fill Under Active Curve */}
            <path d={activeAreaString} fill="url(#profitAreaGrad)" />

            {/* Background Comparison Curves */}
            {showAllCurves &&
              (['zero_export', 'net_metering', 'hybrid_battery'] as ExportStrategy[]).map((strat) => {
                if (strat === activeSim.strategy) return null;
                const sim = allScenarios[strat];
                const pathStr = buildSvgPath(sim.cashflowSeries);
                const style = curveStyles[strat];

                return (
                  <path
                    key={strat}
                    d={pathStr}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.strokeDasharray}
                    strokeOpacity={0.55}
                  />
                );
              })}

            {/* Active Primary Curve */}
            <path
              d={activePathString}
              fill="none"
              stroke={curveStyles[activeSim.strategy]?.stroke || '#10b981'}
              strokeWidth={3.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hardware Renewal Markers */}
            {activeSim.cashflowSeries.map((pt) => {
              if (pt.replacementCostPhp <= 0) return null;
              const x = getX(pt.year);
              const y = getY(pt.cumulativeCashflowPhp);

              return (
                <g key={pt.year}>
                  <circle cx={x} cy={y} r={5} fill="#f59e0b" stroke="#0B0F17" strokeWidth={2} />
                  <line
                    x1={x}
                    y1={y - 6}
                    x2={x}
                    y2={y - 24}
                    stroke="#f59e0b"
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                  />
                  <text
                    x={x}
                    y={y - 29}
                    textAnchor="middle"
                    className="text-[9.5px] font-mono font-bold fill-amber-600 dark:fill-amber-400 select-none"
                  >
                    Yr {pt.year} Renewal
                  </text>
                </g>
              );
            })}

            {/* Breakeven Intersection Pin */}
            {hasBreakeven && breakevenX !== null && (
              <g>
                <line
                  x1={breakevenX}
                  y1={zeroY - 40}
                  x2={breakevenX}
                  y2={zeroY + 32}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <circle cx={breakevenX} cy={zeroY} r={9} fill="#10b981" fillOpacity="0.2" />
                <circle cx={breakevenX} cy={zeroY} r={4.5} fill="#10b981" stroke="#ffffff" strokeWidth={2} />

                <g transform={`translate(${breakevenX}, ${zeroY - 48})`}>
                  <rect x={-66} y={0} width={132} height={24} rx={12} fill="#059669" />
                  <text
                    x={0}
                    y={15.5}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-white select-none"
                  >
                    Payback: {activeSim.paybackFormatted}
                  </text>
                </g>
              </g>
            )}

            {/* Interactive Scrubber Crosshair */}
            {hoveredYear !== null && (
              <g>
                <line
                  x1={getX(hoveredYear)}
                  y1={paddingTop}
                  x2={getX(hoveredYear)}
                  y2={viewBoxHeight - paddingBottom}
                  stroke="#94a3b8"
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                />
                {activeHoverPoint && (
                  <>
                    <circle
                      cx={getX(hoveredYear)}
                      cy={getY(activeHoverPoint.cumulativeCashflowPhp)}
                      r={9}
                      fill="#10b981"
                      fillOpacity="0.2"
                    />
                    <circle
                      cx={getX(hoveredYear)}
                      cy={getY(activeHoverPoint.cumulativeCashflowPhp)}
                      r={5}
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth={2.5}
                    />
                  </>
                )}
              </g>
            )}
          </svg>

          {/* Floating High-Contrast Telemetry HUD on Hover */}
          {activeHoverPoint && (
            <div
              className="absolute top-4 right-4 p-4 rounded-2xl bg-slate-950/95 text-white text-xs border border-white/10 shadow-2xl pointer-events-none space-y-2 font-sans z-20"
              style={{ minWidth: '215px' }}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400 font-bold">
                  Year {activeHoverPoint.year} Telemetry
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeHoverPoint.year === 0 ? 'Initial Outlay' : `Month ${activeHoverPoint.year * 12}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Inflated Grid Tariff</span>
                <span className="font-mono font-bold tabular-nums">
                  ₱{activeHoverPoint.inflatedRetailRatePhp.toFixed(2)}/kWh
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Annual Bill Savings</span>
                <span className="font-mono font-bold tabular-nums text-emerald-400">
                  +₱{activeHoverPoint.grossAnnualSavingsPhp.toLocaleString()}
                </span>
              </div>
              {activeHoverPoint.replacementCostPhp > 0 && (
                <div className="flex justify-between items-baseline text-amber-400">
                  <span>Equipment Renewal</span>
                  <span className="font-mono font-bold tabular-nums">
                    -₱{activeHoverPoint.replacementCostPhp.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="text-slate-300 font-semibold">Cumulative Net</span>
                <span
                  className={`font-mono text-sm font-black tabular-nums ${
                    activeHoverPoint.cumulativeCashflowPhp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeHoverPoint.cumulativeCashflowPhp >= 0 ? '+' : ''}₱
                  {activeHoverPoint.cumulativeCashflowPhp.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Legend Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-emerald-500 rounded-full" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {curveStyles[activeSim.strategy]?.label || activeSim.label} (Active)
              </span>
            </div>

            {showAllCurves && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-500" />
                  <span className="text-slate-500">Zero-Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-blue-500" />
                  <span className="text-slate-500">Hybrid + LiFePO4</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-500">Year 8/10 Hardware Renewal Dip</span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Hover or scrub across timeline to inspect annual compounding
          </span>
        </div>
      </div>
  );
}
