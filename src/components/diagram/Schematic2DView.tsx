// src/components/diagram/Schematic2DView.tsx
import { useState, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import {
  Sun,
  Shield,
  Cpu,
  BatteryCharging,
  Network,
  Cable,
  Home,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

export interface Schematic2DViewProps {
  resetViewCount?: number;
}

interface ConduitProps {
  type?: 'dc' | 'ac' | 'battery' | 'grid';
  active?: boolean;
  reverse?: boolean;
  className?: string;
  speed?: string;
}

function HorizontalConduit({
  type = 'dc',
  active = true,
  reverse = false,
  className = '',
  speed = '1.8s',
}: ConduitProps) {
  const colors = {
    dc: {
      core: '#D97706',
      coreDark: '#F59E0B',
      bead: '#FEF08A',
      glow: 'rgba(245, 158, 11, 0.85)',
      pipeBg: 'rgba(245, 158, 11, 0.12)',
    },
    ac: {
      core: '#0284C7',
      coreDark: '#38BDF8',
      bead: '#E0F2FE',
      glow: 'rgba(2, 132, 199, 0.85)',
      pipeBg: 'rgba(2, 132, 199, 0.12)',
    },
    battery: {
      core: '#059669',
      coreDark: '#10B981',
      bead: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.85)',
      pipeBg: 'rgba(16, 185, 129, 0.12)',
    },
    grid: {
      core: '#059669',
      coreDark: '#10B981',
      bead: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.85)',
      pipeBg: 'rgba(16, 185, 129, 0.12)',
    },
  }[type];

  if (!active) {
    return (
      <div className={`h-6 flex items-center justify-center relative select-none ${className}`}>
        <svg
          className="w-full h-5 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 20"
        >
          {/* EMT Pipe casing */}
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800/80"
          />
          {/* Inactive dashed line */}
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-slate-400 dark:text-slate-600 opacity-60"
          />
        </svg>
      </div>
    );
  }

  const animValues = reverse ? '100;0' : '0;100';

  return (
    <div className={`h-6 flex items-center justify-center relative select-none ${className}`}>
      <svg
        className="w-full h-5 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 20"
      >
        {/* Outer EMT Conduit Pipe Sleeve */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          className="text-slate-200 dark:text-slate-800/90"
        />

        {/* Conduit Cavity Tint */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke={colors.pipeBg}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Inner Conductor Core */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke={colors.coreDark}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Directional Chevrons */}
        {reverse ? (
          <>
            <path d="M 52 7 L 47 10 L 52 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 30 7 L 25 10 L 30 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.4" />
            <path d="M 75 7 L 70 10 L 75 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.4" />
          </>
        ) : (
          <>
            <path d="M 48 7 L 53 10 L 48 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 25 7 L 30 10 L 25 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.4" />
            <path d="M 70 7 L 75 10 L 70 13" stroke={colors.coreDark} strokeWidth="1.2" fill="none" opacity="0.4" />
          </>
        )}

        {/* Flow Pulse Halo */}
        <circle cy="10" r="5" fill={colors.glow} opacity="0.35">
          <animate
            attributeName="cx"
            values={animValues}
            dur={speed}
            repeatCount="indefinite"
          />
        </circle>

        {/* Glowing Bead 1 */}
        <circle
          cy="10"
          r="3"
          fill={colors.bead}
          style={{ filter: `drop-shadow(0 0 3px ${colors.glow})` }}
        >
          <animate
            attributeName="cx"
            values={animValues}
            dur={speed}
            repeatCount="indefinite"
          />
        </circle>

        {/* Glowing Bead 2 (Offset) */}
        <circle
          cy="10"
          r="2.5"
          fill={colors.bead}
          style={{ filter: `drop-shadow(0 0 3px ${colors.glow})` }}
        >
          <animate
            attributeName="cx"
            values={animValues}
            dur={speed}
            begin="-0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

function VerticalConduit({
  type = 'battery',
  active = true,
  reverse = false,
  className = '',
  speed = '1.4s',
}: ConduitProps) {
  const colors = {
    dc: {
      core: '#F59E0B',
      bead: '#FEF08A',
      glow: 'rgba(245, 158, 11, 0.85)',
      pipeBg: 'rgba(245, 158, 11, 0.12)',
    },
    ac: {
      core: '#38BDF8',
      bead: '#E0F2FE',
      glow: 'rgba(2, 132, 199, 0.85)',
      pipeBg: 'rgba(2, 132, 199, 0.12)',
    },
    battery: {
      core: '#10B981',
      bead: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.85)',
      pipeBg: 'rgba(16, 185, 129, 0.12)',
    },
    grid: {
      core: '#10B981',
      bead: '#D1FAE5',
      glow: 'rgba(16, 185, 129, 0.85)',
      pipeBg: 'rgba(16, 185, 129, 0.12)',
    },
  }[type];

  if (!active) {
    return (
      <div className={`w-3 h-7 flex items-center justify-center relative select-none ${className}`}>
        <svg
          className="w-3 h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 12 100"
        >
          <line
            x1="6"
            y1="0"
            x2="6"
            y2="100"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800/80"
          />
          <line
            x1="6"
            y1="0"
            x2="6"
            y2="100"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-slate-400 dark:text-slate-600 opacity-60"
          />
        </svg>
      </div>
    );
  }

  const animValues = reverse ? '100;0' : '0;100';

  return (
    <div className={`w-3 h-7 flex items-center justify-center relative select-none ${className}`}>
      <svg
        className="w-3 h-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 12 100"
      >
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="100"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          className="text-slate-200 dark:text-slate-800"
        />
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="100"
          stroke={colors.pipeBg}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="100"
          stroke={colors.core}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="6"
          r="3"
          fill={colors.bead}
          style={{ filter: `drop-shadow(0 0 3px ${colors.glow})` }}
        >
          <animate
            attributeName="cy"
            values={animValues}
            dur={speed}
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

export function Schematic2DView({ resetViewCount }: Schematic2DViewProps) {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const toggleAtsSource = useCalculatorStore((s) => s.toggleAtsSource);

  // Pan and Zoom interactive state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasDraggedRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale((s) => Math.min(2.0, Number((s + 0.15).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))));

  // Synchronize reset when parent signals view reset
  useEffect(() => {
    if (resetViewCount !== undefined && resetViewCount > 0) {
      resetView();
    }
  }, [resetViewCount]);

  // Non-passive wheel event listener for fluid zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setScale((prev) => {
        const next = Math.min(2.2, Math.max(0.4, prev * zoomFactor));
        return Number(next.toFixed(3));
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-schematic-node]')) return;
    resetView();
  };

  // Touch gestures for mobile/tablet panning
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number; dist?: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.dist = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + dx,
        y: touchStartRef.current.panY + dy,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / touchStartRef.current.dist;
      touchStartRef.current.dist = newDist;
      setScale((s) => Math.min(2.2, Math.max(0.4, Number((s * factor).toFixed(3)))));
    }
  };

  const triggerSelect = (key: DiagramNodeKey) => {
    if (hasDraggedRef.current) return;
    setSelectedNodeKey(key);
  };

  const getNodeClasses = (key: DiagramNodeKey, baseColor = 'amber') => {
    const isSelected = selectedNodeKey === key;
    const isHovered = hoveredNodeKey === key;

    let borderRing = 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow';
    if (isSelected) {
      if (baseColor === 'amber') borderRing = 'border-amber-600 dark:border-amber-500 ring-4 ring-amber-500/25 shadow-lg scale-105';
      else if (baseColor === 'red') borderRing = 'border-red-600 dark:border-red-500 ring-4 ring-red-500/25 shadow-lg scale-105';
      else if (baseColor === 'emerald') borderRing = 'border-emerald-600 dark:border-emerald-500 ring-4 ring-emerald-500/25 shadow-lg scale-105';
      else if (baseColor === 'sky') borderRing = 'border-sky-600 dark:border-sky-500 ring-4 ring-sky-500/25 shadow-lg scale-105';
      else if (baseColor === 'purple') borderRing = 'border-purple-600 dark:border-purple-500 ring-4 ring-purple-500/25 shadow-lg scale-105';
      else borderRing = 'border-slate-800 dark:border-slate-400 ring-4 ring-slate-400/25 shadow-lg scale-105';
    } else if (isHovered) {
      borderRing = 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/30 shadow-md scale-[1.03]';
    }

    return `flex flex-col items-center p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all select-none ${borderRing}`;
  };

  return (
    <div
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`w-full h-full bg-slate-50 dark:bg-[#090D16] relative overflow-hidden select-none transition-colors duration-200 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Precision Blueprint Dot Grid (Stays fixed to create infinite canvas feel) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Floating Pan & Zoom HUD Controls */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg pointer-events-auto">
        <button
          onClick={zoomOut}
          title="Zoom Out (-)"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Zoom & Pan (Double-click canvas)"
          className="px-2 py-1 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={zoomIn}
          title="Zoom In (+)"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          onClick={resetView}
          title="Reset View"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zoom / Pan Navigation Hint */}
      <div className="absolute bottom-4 left-4 z-20 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 pointer-events-none backdrop-blur-sm">
        Drag to pan • Scroll to zoom • Double-click to reset
      </div>

      {/* Transformed Canvas Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-center origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.08s ease-out',
        }}
      >
        {/* Schematic Container with Spacious Layout Spine */}
        <div className="relative z-10 flex flex-col items-center min-w-[1580px] px-8 py-6">
          {/* Title & Sequence Breadcrumb */}
          <div className="w-full flex items-center justify-between px-4 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Single-Line Diagram (SLD)
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                NEC 690 / PEC / IEC 62548 Compliant Sequence
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)]" /> DC Bus (0-1000V)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" /> Battery Bus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-sky-500 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)]" /> AC Bus (230V)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-600 border border-emerald-400 border-dashed rounded-full" /> PE Ground
              </span>
            </div>
          </div>

          {/* Main Horizontal Single-Line Circuit Flow (All primary equipment on a unified centerline) */}
          <div className="flex items-center gap-2 w-full justify-between pt-28 pb-48">
            {/* Node 1: PV Array */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              <div
                onClick={() => triggerSelect('pv_array')}
                onMouseEnter={() => setHoveredNodeKey('pv_array')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('pv_array', 'sky')}
              >
                <div className="w-11 h-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1.5">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">GEN • 01</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">PV ARRAY</span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {calculationResult.summary.totalArrayPowerKw} kWp
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {calculationResult.summary.totalPanels} Modules
                </span>
              </div>
              {/* Grounding drop tap */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-0.5 h-16 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            </div>

            {/* DC Conduit 1: PV Array -> DC Isolator */}
            <HorizontalConduit
              type="dc"
              active={true}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 2: DC Rotary Isolator Switch (First in DC sequence per NEC 690) */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              <div
                onClick={() => triggerSelect('dc_isolator')}
                onMouseEnter={() => setHoveredNodeKey('dc_isolator')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('dc_isolator', 'amber')}
              >
                <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">DISC • Q1</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC ISOLATOR</span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {calculationResult.dc.isolatorRatingA} A
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  1000V DC 4-Pole
                </span>
              </div>
            </div>

            {/* DC Conduit 2: DC Isolator -> DC Breaker */}
            <HorizontalConduit
              type="dc"
              active={true}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 3: DC Protection Cluster (DC Breaker in Series + DC SPD hanging below) */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              {/* DC Circuit Breaker (Series path - connected directly to Inverter on horizontal spine) */}
              <div
                onClick={() => triggerSelect('dc_breaker')}
                onMouseEnter={() => setHoveredNodeKey('dc_breaker')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('dc_breaker', 'red')}
              >
                <div className="w-11 h-11 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-1.5">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">OCPD • CB1</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC BREAKER</span>
                <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                  {calculationResult.dc.breakerRatingA} A
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {calculationResult.dc.computedCurrentA} A Icont
                </span>
              </div>

              {/* Parallel Drop: DC SPD hanging below DC Breaker */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pt-2">
                <div className="w-0.5 h-3 bg-amber-500" />
                <div
                  onClick={() => triggerSelect('dc_spd')}
                  onMouseEnter={() => setHoveredNodeKey('dc_spd')}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  className={getNodeClasses('dc_spd', 'emerald')}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">DC SPD</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {calculationResult.dc.spdRating}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">Type 2 Arrester</span>
                </div>
                <div className="w-0.5 h-4 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            </div>

            {/* DC Conduit 3: DC Breaker -> Inverter (Direct horizontal connection to Inverter) */}
            <HorizontalConduit
              type="dc"
              active={true}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 4: Solar Inverter (Level with Breakers, with Battery Branch hanging below) */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              {/* Central Inverter Box */}
              <div
                onClick={() => triggerSelect('inverter')}
                onMouseEnter={() => setHoveredNodeKey('inverter')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={`flex flex-col items-center p-3.5 rounded-2xl border-2 bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-all ${
                  selectedNodeKey === 'inverter'
                    ? 'border-amber-600 dark:border-amber-500 ring-4 ring-amber-500/25 scale-105 shadow-xl'
                    : hoveredNodeKey === 'inverter'
                    ? 'border-amber-500 ring-2 ring-amber-400/30 scale-[1.02] shadow-md'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:shadow-lg'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm mb-1.5">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">INV • 01</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {calculationResult.summary.inverterModel}
                </span>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-black mt-0.5">
                  {calculationResult.summary.inverterPowerKw} kW AC
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {calculationResult.systemType} INVERTER
                </span>
              </div>

              {/* Hybrid Battery Dropdown Branch (Hangs purely downward, not shifting horizontal axis) */}
              {isHybrid ? (
                <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pt-1 z-20">
                  {/* Vertical Conduit to Battery MCCB */}
                  <VerticalConduit type="battery" speed="1.4s" />

                  {/* Node: Battery Breaker (MCCB) */}
                  <div
                    onClick={() => triggerSelect('battery_breaker')}
                    onMouseEnter={() => setHoveredNodeKey('battery_breaker')}
                    onMouseLeave={() => setHoveredNodeKey(null)}
                    className={getNodeClasses('battery_breaker', 'emerald')}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">BATTERY MCCB</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {calculationResult.battery.recommendedBreakerA} A
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">DC Molded Case</span>
                  </div>

                  {/* Vertical Conduit to Battery Bank */}
                  <VerticalConduit type="battery" speed="1.4s" />

                  {/* Node: Battery Storage Bank */}
                  <div
                    onClick={() => triggerSelect('battery')}
                    onMouseEnter={() => setHoveredNodeKey('battery')}
                    onMouseLeave={() => setHoveredNodeKey(null)}
                    className={getNodeClasses('battery', 'emerald')}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">
                      BATTERY BANK
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh
                    </span>
                    <span className="text-[8px] text-slate-400">
                      {calculationResult.battery.bankVoltageV}V Nominal
                    </span>
                  </div>

                  {/* Grounding tap from battery chassis */}
                  <div className="w-0.5 h-3 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
              ) : (
                <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0.5 h-20 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
              )}
            </div>

            {/* AC Conduit 4: Inverter -> AC Breaker (Direct horizontal connection from Inverter) */}
            <HorizontalConduit
              type="ac"
              active={atsSource === 'solar'}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 5: AC Protection Cluster (AC Breaker + AC SPD hanging below) */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              {/* AC Circuit Breaker (Series path - connected directly to Inverter on horizontal spine) */}
              <div
                onClick={() => triggerSelect('ac_breaker')}
                onMouseEnter={() => setHoveredNodeKey('ac_breaker')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('ac_breaker', 'sky')}
              >
                <div className="w-11 h-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1.5">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">OCPD • CB2</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC BREAKER</span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {calculationResult.ac.breakerRatingA} A
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {calculationResult.ac.computedCurrentA} A Icont
                </span>
              </div>

              {/* Parallel Drop: AC SPD hanging below AC Breaker */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pt-2">
                <div className="w-0.5 h-3 bg-sky-500" />
                <div
                  onClick={() => triggerSelect('ac_spd')}
                  onMouseEnter={() => setHoveredNodeKey('ac_spd')}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  className={getNodeClasses('ac_spd', 'emerald')}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">AC SPD</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {calculationResult.ac.spdRating}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">Type 2 Arrester</span>
                </div>
                <div className="w-0.5 h-4 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            </div>

            {/* AC Conduit 5: AC Breaker -> AC Isolator */}
            <HorizontalConduit
              type="ac"
              active={atsSource === 'solar'}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 6: AC Isolator Switch */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              <div
                onClick={() => triggerSelect('ac_isolator')}
                onMouseEnter={() => setHoveredNodeKey('ac_isolator')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('ac_isolator', 'amber')}
              >
                <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">DISC • Q2</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC ISOLATOR</span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {calculationResult.ac.isolatorRatingA} A
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Rotary Disconnect
                </span>
              </div>
            </div>

            {/* AC Conduit 6: AC Isolator -> Main Panel */}
            <HorizontalConduit
              type="ac"
              active={atsSource === 'solar'}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 7: Main Distribution Panel (MDB • 01) with Utility Grid Service Drop from above */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              {/* Utility Grid Service Entrance Drop connected directly to Main Panel from above */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pb-2 z-20">
                <div
                  onClick={() => triggerSelect('grid')}
                  onMouseEnter={() => setHoveredNodeKey('grid')}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all whitespace-nowrap ${
                    selectedNodeKey === 'grid'
                      ? 'border-slate-800 dark:border-slate-300 ring-2 ring-slate-400/30 scale-105'
                      : hoveredNodeKey === 'grid'
                      ? 'border-slate-400 scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Network className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">SRV • GRID</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">UTILITY GRID</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">230V Interconnect</span>
                  </div>
                </div>
                {/* Vertical Service Entrance Conduit dropping into Main Panel */}
                <VerticalConduit
                  type="grid"
                  active={atsSource === 'utility'}
                  speed="1.4s"
                />
              </div>

              {/* Main Service Panel Box */}
              <div
                onClick={() => triggerSelect('main_panel')}
                onMouseEnter={() => setHoveredNodeKey('main_panel')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('main_panel', 'slate')}
              >
                <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-1.5">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">MDB • 01</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">MAIN PANEL</span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                  230V AC
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribution
                </span>
              </div>

              {/* Ground bonding tap down */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-0.5 h-16 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            </div>

            {/* AC Conduit 7: Main Panel -> ATS Switch */}
            <HorizontalConduit
              type="ac"
              active={true}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 8: ATS Switch (XFER • ATS) - Swapping power feed to the building load */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              <div
                onClick={() => {
                  triggerSelect('ats');
                  toggleAtsSource();
                }}
                onMouseEnter={() => setHoveredNodeKey('ats')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('ats', atsSource === 'solar' ? 'amber' : 'emerald')}
                title="Click to toggle ATS Transfer Switch source"
              >
                <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-1.5">
                  <Cable className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">XFER • ATS</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">ATS SWITCH</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded mt-0.5 shadow-sm transition-colors ${
                    atsSource === 'solar'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  }`}
                >
                  {atsSource === 'solar' ? 'SOLAR (LEFT)' : 'UTILITY (FEED)'}
                </span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Click to switch
                </span>
              </div>
            </div>

            {/* AC Conduit 8: ATS Switch -> Building Load */}
            <HorizontalConduit
              type="ac"
              active={true}
              className="flex-1 min-w-[55px] max-w-[85px]"
            />

            {/* Node 9: Building Load */}
            <div className="flex flex-col items-center relative" data-schematic-node="true">
              <div
                onClick={() => triggerSelect('load')}
                onMouseEnter={() => setHoveredNodeKey('load')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={getNodeClasses('load', 'sky')}
              >
                <div className="w-11 h-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1.5">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">DEMAND • 01</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">BUILDING LOAD</span>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                  Facility Demand
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                  230V Demand
                </span>
              </div>
            </div>
          </div>

          {/* Continuous Equipment Grounding Busbar (PE / EGC) Along The Base */}
          <div
            onClick={() => triggerSelect('grounding')}
            onMouseEnter={() => setHoveredNodeKey('grounding')}
            onMouseLeave={() => setHoveredNodeKey(null)}
            data-schematic-node="true"
            className={`w-full rounded-xl border p-3 flex items-center justify-between cursor-pointer transition-all ${
              selectedNodeKey === 'grounding'
                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20 shadow-md scale-[1.01]'
                : hoveredNodeKey === 'grounding'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-400/20'
                : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                PE
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    EQUIPMENT GROUNDING BUSBAR (SOLID COPPER PE BUS)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {calculationResult.dc.groundConductorSpec} Conductor
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Continuous equipotential bond linking PV racking frame, DC SPD, Inverter chassis, BESS enclosure, AC SPD, and Main Panel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span>⏚ EARTH GROUND ROD</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(&lt; 5 Ω Resistance)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
