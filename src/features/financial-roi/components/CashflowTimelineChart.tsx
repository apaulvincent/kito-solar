// src/features/financial-roi/components/CashflowTimelineChart.tsx
import { useState, useRef } from 'react';
import { Layers, Wrench, Zap, Info } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { ExportStrategy, YearlyCashflowPoint } from '../types/financialRoi';

export function CashflowTimelineChart() {
  const activeSim = useFinancialRoiStore((s) => s.getActiveSimulation());
  const allScenarios = useFinancialRoiStore((s) => s.getAllScenarioSimulations());
  const showAllCurves = useFinancialRoiStore((s) => s.showAllCurvesOnTimeline);
  const setShowAllCurves = useFinancialRoiStore((s) => s.setShowAllCurvesOnTimeline);
  const config = useFinancialRoiStore((s) => s.config);

  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Coordinate Geometry
  const viewBoxWidth = 800;
  const viewBoxHeight = 360;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

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

  // Add 10% headroom
  minCashflow = Math.min(minCashflow * 1.1, -50000);
  maxCashflow = Math.max(maxCashflow * 1.1, 500000);

  const getX = (year: number) => paddingLeft + (year / 25) * chartWidth;
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

  // Build Area Path for Deficit (below 0) and Profit (above 0) for active simulation
  const activePoints = activeSim.cashflowSeries;
  const activePathString = buildSvgPath(activePoints);

  // Colors & styles for multi-curve display
  const curveStyles: Record<
    ExportStrategy,
    { stroke: string; strokeDasharray?: string; label: string; strokeWidth: number }
  > = {
    net_metering: { stroke: '#059669', strokeWidth: 2.5, label: 'Net Metering (Green)' },
    zero_export: { stroke: '#f59e0b', strokeDasharray: '4 3', strokeWidth: 2, label: 'Zero-Export (Amber)' },
    hybrid_battery: { stroke: '#3b82f6', strokeDasharray: '6 3', strokeWidth: 2, label: 'Hybrid Battery (Blue)' },
    hybrid_plus_net_metering: { stroke: '#8b5cf6', strokeWidth: 2, label: 'Hybrid + Net Metering' },
  };

  // Breakeven Pin coordinates
  const breakevenYear = activeSim.paybackYears;
  const hasBreakeven = breakevenYear !== null && breakevenYear <= 25;
  const breakevenX = hasBreakeven ? getX(breakevenYear!) : null;

  // Hover scrubber details
  const activeHoverPoint =
    hoveredYear !== null ? activeSim.cashflowSeries.find((pt) => pt.year === hoveredYear) : null;

  // Handle pointer move across chart
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * viewBoxWidth;

    if (svgX < paddingLeft || svgX > viewBoxWidth - paddingRight) {
      setHoveredYear(null);
      return;
    }

    const yearFraction = ((svgX - paddingLeft) / chartWidth) * 25;
    const clampedYear = Math.max(0, Math.min(25, Math.round(yearFraction)));
    setHoveredYear(clampedYear);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4 transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>25-Year Cumulative Cashflow & Breakeven Curve</span>
          </h3>
          <p className="text-xs text-slate-500">
            Interactive timeline mapping capital recovery, replacement dips, and compounding inflation savings
          </p>
        </div>

        {/* Multi-Line Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAllCurves(!showAllCurves)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              showAllCurves
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAllCurves ? 'Comparing All 3 Architectures' : 'Single Strategy View'}</span>
          </button>
        </div>
      </div>

      {/* Main Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredYear(null)}
        >
          {/* Deficit Zone Tint (Below ₱0) */}
          <rect
            x={paddingLeft}
            y={zeroY}
            width={chartWidth}
            height={Math.max(0, getY(minCashflow) - zeroY)}
            fill="#f43f5e"
            fillOpacity="0.04"
          />

          {/* Profit Zone Tint (Above ₱0) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={Math.max(0, zeroY - paddingTop)}
            fill="#10b981"
            fillOpacity="0.04"
          />

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {[-500000, 0, 500000, 1000000, 2000000, 3000000].map((val) => {
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
                  stroke={isZero ? '#94a3b8' : '#e2e8f0'}
                  strokeDasharray={isZero ? undefined : '3 3'}
                  strokeWidth={isZero ? 1.5 : 0.8}
                  className="dark:stroke-slate-700"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[9.5px] font-mono select-none ${
                    isZero
                      ? 'font-bold fill-slate-800 dark:fill-slate-200'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {val === 0
                    ? '₱0'
                    : val > 0
                    ? `+₱${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`
                    : `-₱${Math.abs(val / 1000).toFixed(0)}k`}
                </text>
              </g>
            );
          })}

          {/* X-Axis Milestone Years */}
          {[0, 5, 10, 15, 20, 25].map((year) => {
            const x = getX(year);
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={viewBoxHeight - paddingBottom}
                  x2={x}
                  y2={viewBoxHeight - paddingBottom + 5}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  className="dark:stroke-slate-700"
                />
                <text
                  x={x}
                  y={viewBoxHeight - paddingBottom + 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500 select-none"
                >
                  Yr {year}
                </text>
              </g>
            );
          })}

          {/* Comparative Background Curves when showAllCurves is active */}
          {showAllCurves &&
            (['zero_export', 'net_metering', 'hybrid_battery'] as ExportStrategy[]).map((strat) => {
              if (strat === activeSim.strategy) return null; // Rendered on top
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
                  strokeOpacity={0.65}
                />
              );
            })}

          {/* Active Strategy Main Curve */}
          <path
            d={activePathString}
            fill="none"
            stroke={curveStyles[activeSim.strategy]?.stroke || '#059669'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Equipment Replacement Dips (Year 11 / Year 12) */}
          {activeSim.cashflowSeries.map((pt) => {
            if (pt.replacementCostPhp <= 0) return null;
            const x = getX(pt.year);
            const y = getY(pt.cumulativeCashflowPhp);

            return (
              <g key={pt.year} className="group">
                <circle cx={x} cy={y} r={4.5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.5} />
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y - 18}
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={y - 22}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold fill-amber-600 dark:fill-amber-400 select-none"
                >
                  Yr {pt.year} Renewal
                </text>
              </g>
            );
          })}

          {/* Glowing Breakeven Pin */}
          {hasBreakeven && breakevenX !== null && (
            <g>
              {/* Vertical Guide Line */}
              <line
                x1={breakevenX}
                y1={zeroY - 35}
                x2={breakevenX}
                y2={zeroY + 30}
                stroke="#059669"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* Pin Base Pulsing Ring */}
              <circle cx={breakevenX} cy={zeroY} r={7} fill="#10b981" fillOpacity="0.25" />
              <circle cx={breakevenX} cy={zeroY} r={4} fill="#059669" stroke="#ffffff" strokeWidth={1.5} />

              {/* Breakeven Tag Callout */}
              <g transform={`translate(${breakevenX}, ${zeroY - 42})`}>
                <rect
                  x={-60}
                  y={0}
                  width={120}
                  height={22}
                  rx={5}
                  fill="#059669"
                  className="shadow-sm"
                />
                <text
                  x={0}
                  y={14.5}
                  textAnchor="middle"
                  className="text-[9.5px] font-sans font-bold fill-white select-none"
                >
                  Payback: {activeSim.paybackFormatted}
                </text>
              </g>
            </g>
          )}

          {/* Interactive Pointer Scrubber Vertical Line & Dots */}
          {hoveredYear !== null && (
            <g>
              <line
                x1={getX(hoveredYear)}
                y1={paddingTop}
                x2={getX(hoveredYear)}
                y2={viewBoxHeight - paddingBottom}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              {activeHoverPoint && (
                <circle
                  cx={getX(hoveredYear)}
                  cy={getY(activeHoverPoint.cumulativeCashflowPhp)}
                  r={5}
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth={2}
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip during Hover */}
        {activeHoverPoint && (
          <div
            className="absolute top-3 right-4 p-3 rounded-lg bg-slate-900/95 text-white text-xs border border-slate-700 shadow-lg pointer-events-none space-y-1 font-sans z-20 backdrop-blur-xs"
            style={{ minWidth: '180px' }}
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-1">
              <span className="font-bold text-amber-400">Year {activeHoverPoint.year} Status</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeHoverPoint.year === 0 ? 'Day 0' : `Month ${activeHoverPoint.year * 12}`}
              </span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-400">Grid Utility Tariff:</span>
              <span className="font-mono font-bold">₱{activeHoverPoint.inflatedRetailRatePhp.toFixed(2)}/kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Annual Savings:</span>
              <span className="font-mono font-bold text-emerald-400">
                ₱{activeHoverPoint.grossAnnualSavingsPhp.toLocaleString()}
              </span>
            </div>
            {activeHoverPoint.replacementCostPhp > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Hardware Renewal:</span>
                <span className="font-mono font-bold">-₱{activeHoverPoint.replacementCostPhp.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Net Position:</span>
              <span
                className={`font-mono font-extrabold ${
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

      {/* Legend & Multi-Curve Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#059669] rounded-full" />
            <span className="text-slate-600 dark:text-slate-300">
              {curveStyles[activeSim.strategy]?.label || activeSim.label} (Active)
            </span>
          </div>

          {showAllCurves && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#f59e0b] border-dashed border-t border-b border-[#f59e0b]" />
                <span className="text-slate-500">Zero-Export Curve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#3b82f6] border-dotted border-t border-b border-[#3b82f6]" />
                <span className="text-slate-500">Hybrid Battery Curve</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-500">Year 11/12 Inverter & Battery Renewal</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          25-Yr Net Profit:{' '}
          <strong className="text-slate-900 dark:text-white font-bold">
            ₱{activeSim.netProfit25YearsPhp.toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
}
