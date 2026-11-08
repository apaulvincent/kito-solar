// src/components/home/HomePage.tsx
import { BillQuickStartBanner } from '@/components/ai/BillQuickStartBanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  ArrowUpRight,
  Box,
  Calculator,
  Compass,
  Lock,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';

export function HomePage() {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const setActiveWorkbenchTab = useCalculatorStore((s) => s.setActiveWorkbenchTab);
  const setIsCopilotOpen = useCalculatorStore((s) => s.setIsCopilotOpen);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const user = useAuthStore((s) => s.user);

  const handleLaunchTool = (tab: 'electrical' | 'pv_sizing' | 'mounting_bom' | 'warnings') => {
    setActiveWorkbenchTab(tab);
    setActiveView('tool');
  };

  // The 4 Primary Studios in the Command Deck
  const studioWorkspaces = [
    {
      index: '01',
      badge: 'Load & Surge',
      title: 'Appliance Load Studio',
      subtitle: 'Room-by-room wattages, motor surge multipliers & day/night split',
      metricLabel: 'Output',
      metricValue: 'kWp + LiFePO4 Sizing',
      icon: Calculator,
      requiresAuth: false,
      accentClass: 'text-amber-500 bg-amber-500/10 ring-amber-500/20',
      onLaunch: () => setActiveView('load-calculator'),
    },
    {
      index: '02',
      badge: 'Geodesic 3D',
      title: 'Roof & Sun Path Mapper',
      subtitle: 'Satellite polygon tracing, custom module dimensions & NASA PSH',
      metricLabel: 'Engine',
      metricValue: '2D Satellite + 3D Sun',
      icon: Compass,
      requiresAuth: true,
      accentClass: 'text-sky-500 bg-sky-500/10 ring-sky-500/20',
      onLaunch: () => setActiveView(user ? 'solar-mapper' : 'login'),
    },
    {
      index: '03',
      badge: 'PEC 6.90 CAD',
      title: '3D Electrical Workbench',
      subtitle: 'Wall-mounted 3D equipment layout, breaker schedules & string limits',
      metricLabel: 'Active Spec',
      metricValue: `${calculationResult.summary.totalArrayPowerKw} kWp • ${calculationResult.dc.breakerRatingA}A DC`,
      icon: Box,
      requiresAuth: false,
      accentClass: 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/20',
      onLaunch: () => setActiveView('tool'),
    },
    {
      index: '04',
      badge: '10-Yr Cashflow',
      title: 'Financial ROI Simulator',
      subtitle: 'ERC Net Metering vs. Zero-Export vs. Hybrid LiFePO4 payback curves',
      metricLabel: 'Tariffs',
      metricValue: 'Meralco • BATELEC • VECO',
      icon: TrendingUp,
      requiresAuth: true,
      accentClass: 'text-indigo-500 bg-indigo-500/10 ring-indigo-500/20',
      onLaunch: () => setActiveView(user ? 'financial-roi' : 'login'),
    },
  ];

  return (
    <div className="relative min-h-[100dvh] bg-[#F8FAFC] dark:bg-[#050505] text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-slate-950 transition-colors duration-500 overflow-x-hidden">
      {/* Fixed Pointer-Events-None Ambient Radial Mesh Lighting */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[760px] h-[420px] bg-gradient-to-tr from-amber-500/[0.08] via-orange-500/[0.04] to-transparent dark:from-amber-500/[0.07] dark:via-emerald-500/[0.03] dark:to-transparent blur-3xl rounded-full -z-10" />

      {/* =====================================================================
          SECTION 1: EDITORIAL SPLIT HERO & 4-STUDIO COMMAND DECK
         ===================================================================== */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-24 lg:pb-32 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Editorial Column (6 cols) */}
            <div className="lg:col-span-6 space-y-8 text-left">
                          {/* High-Contrast Bold Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4.15rem] font-black text-slate-900 dark:text-white tracking-[-0.035em] leading-[1.04]">
                Size your solar system,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 dark:from-amber-400 dark:via-amber-300 dark:to-orange-400">
                  breakers & wires
                </span>{' '}
                in seconds.
              </h1>

              {/* Clear Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-normal">
                Pick your inverter, solar panels, and battery. Get instant continuous-duty breaker sizes, DC/AC cable gauges, conduit sizing, and a 3D equipment placement guide ready for the job site.
              </p>

              {/* Primary Island CTAs (Button-in-Button Architecture) */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveView('tool')}
                  className="group inline-flex items-center gap-4 rounded-full pl-6 pr-2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-[0_16px_32px_-8px_rgba(245,158,11,0.45)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Launch 3D Electrical Studio</span>
                  <span className="w-9 h-9 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <ArrowUpRight className="w-4 h-4 text-slate-950" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="group inline-flex items-center gap-3.5 rounded-full pl-5 pr-2 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm ring-1 ring-slate-900/10 dark:ring-white/15 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                  <span>Ask Jenny AI Copilot</span>
                  <span className="w-9 h-9 rounded-full bg-white/15 dark:bg-slate-950/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {/* Fast Sub-Module Pill Strip */}
              <div className="pt-3 border-t border-slate-900/[0.06] dark:border-white/[0.06] space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold block">
                  Direct Workbench Shortcuts
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchTool('electrical')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/[0.04] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                  >
                    Breaker &amp; Wire Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchTool('pv_sizing')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/[0.04] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                  >
                    MPPT String Limits
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchTool('mounting_bom')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/[0.04] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                  >
                    Mounting Hardware BOM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView(user ? 'yield-simulator' : 'login')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/[0.04] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                  >
                    24h Yield &amp; Digital Twin
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView(user ? 'projects' : 'register')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/[0.04] hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                  >
                    {user ? 'Saved Cloud Projects' : 'Free Cloud Account'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Interactive Column (6 cols): 4-Studio Machined Command Deck */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)] space-y-5">
                {/* 2x2 Interactive Studio Navigator Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {studioWorkspaces.map((studio) => {
                    const Icon = studio.icon;
                    return (
                      <div
                        key={studio.index}
                        onClick={studio.onLaunch}
                        className="group relative p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] hover:border-amber-500/50 shadow-xs hover:shadow-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between gap-5"
                      >
                        <div className="space-y-3">
                          {/* Top Index & Icon */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500">
                                {studio.index}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                                {studio.badge}
                              </span>
                            </div>

                            <div
                              className={`w-9 h-9 rounded-2xl border border-current/20 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${studio.accentClass}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Studio Title & Description */}
                          <div className="space-y-1">
                            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              <span>{studio.title}</span>
                              {studio.requiresAuth && !user && (
                                <span title="Account required" className="inline-flex items-center">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                </span>
                              )}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {studio.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Telemetry & Button-in-Button Trigger */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-400 block">
                              {studio.metricLabel}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              {studio.metricValue}
                            </span>
                          </div>

                          <span className="w-8 h-8 rounded-full bg-slate-900/[0.06] dark:bg-white/[0.08] group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: ASYMMETRICAL BENTO ARCHITECTURE SHOWCASE (py-24)
         ===================================================================== */}
      <section className="py-20 sm:py-24 lg:py-28 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.22em] font-bold bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
            End-to-End Solar Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Every calculation wired into one continuous workflow.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            No disconnected spreadsheets. Sizing your appliances feeds directly into your 3D roof layout, electrical protection schedule, and 25-year utility tariff cashflow.
          </p>
        </div>

        {/* Asymmetrical Bento Row 1: 7 Columns + 5 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Flagship Bento 1 (7 Cols): 3D Wall-Mounted CAD & PEC Electrical Workbench */}
          <div
            onClick={() => setActiveView('tool')}
            className="lg:col-span-7 group rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-white/[0.08] p-6 sm:p-9 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <Box className="w-3 h-3" />
                  Studio 03 • 3D Wall CAD &amp; Schematics
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {calculationResult.systemType.toUpperCase()} TOPOLOGY
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Wall-Mounted 3D CAD &amp; Continuous-Duty Protection
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Inspect physical wall backboard placement for rotary DC isolators, molded-case battery breakers, hybrid inverters, and automatic transfer switches with synchronized 2D single-line schematics.
                </p>
              </div>

              {/* Live Recessed Electrical Spec Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    PV Array
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {calculationResult.summary.totalPanels} Panels
                  </span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block mt-0.5">
                    {calculationResult.summary.totalArrayPowerKw} kWp Total
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    DC Switchgear
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {calculationResult.dc.isolatorRatingA}A Isolator
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    +{calculationResult.dc.breakerRatingA}A Breaker
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    AC Protection
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    {calculationResult.ac.breakerRatingA}A Breaker
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5">
                    {calculationResult.ac.wireSpec.split(' ')[0]} THHN
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Mounting Rails
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {calculationResult.mounting.totalRails} Rails
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    {calculationResult.mounting.totalLFeet} L-Feet Brackets
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Island Action Bar */}
            <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchTool('electrical');
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Protection Schedule
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchTool('pv_sizing');
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  String Voltage
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchTool('mounting_bom');
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Hardware BOM
                </button>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold">
                <span>Open 3D Workbench</span>
                <span className="w-6 h-6 rounded-full bg-white/15 dark:bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Flagship Bento 2 (5 Cols): 3D Satellite Roof & NASA Irradiance Mapper */}
          <div
            onClick={() => setActiveView(user ? 'solar-mapper' : 'login')}
            className="lg:col-span-5 group rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-white/[0.08] p-6 sm:p-9 shadow-sm hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-400/40 transition-all duration-300 flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  <MapPin className="w-3 h-3" />
                  Studio 02 • Geodesic Roof &amp; Sun
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  NASA POWER Climatology
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                  Satellite Roof Tracer &amp; 3D Solar Path
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Draw multi-face roof polygons over satellite imagery, enter custom PV module dimensions (length, width, wattage), and scrub the 3D sun trajectory from 6 AM to 6 PM.
                </p>
              </div>

              {/* Feature Pill Stack */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Module Sizing
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    550W–600W + Custom
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    3D Tilt &amp; Hinge
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    0°–60° Pitch Gizmo
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {user ? 'Ready to trace roof faces' : 'Sign in required'}
              </span>
              <div className="inline-flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 bg-sky-500 text-slate-950 text-xs font-bold">
                <span>Open Roof Mapper</span>
                <span className="w-6 h-6 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetrical Bento Row 2: 5 Columns + 7 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Flagship Bento 3 (5 Cols): Appliance Load & Surge Calculator */}
          <div
            onClick={() => setActiveView('load-calculator')}
            className="lg:col-span-5 group rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-white/[0.08] p-6 sm:p-9 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Calculator className="w-3 h-3" />
                  Studio 01 • Load &amp; Surge Engine
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  18+ PH Presets
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Appliance Load &amp; Motor Surge Sizing
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Model split-type inverter aircons, deep well pumps, induction cooktops, and WFH workstations. Separates daytime (8 AM–4 PM) vs. nighttime consumption so battery banks are never undersized.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Surge Analysis
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    1.0x – 3.5x Inrush
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Starter Profiles
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                    WFH • Family • Farm
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                No login required
              </span>
              <div className="inline-flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold">
                <span>Open Load Calculator</span>
                <span className="w-6 h-6 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Flagship Bento 4 (7 Cols): 25-Year Financial ROI & ERC Net Metering Simulator */}
          <div
            onClick={() => setActiveView(user ? 'financial-roi' : 'login')}
            className="lg:col-span-7 group rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-white/[0.08] p-6 sm:p-9 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-300 flex flex-col justify-between space-y-8 cursor-pointer"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  <TrendingUp className="w-3 h-3" />
                  Studio 04 • 10-Year Financial ROI &amp; Tariffs
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  NEW • ERC NET METERING ENGINE
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                  Tariff Inflation, LCOE &amp; Breakeven Cashflow Simulator
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  See why daytime-only Zero-Export systems clip midday power when nobody is home, and compare exact breakeven months against ERC Net Metering generation credits and Hybrid LiFePO4 storage.
                </p>
              </div>

              {/* 3-Column Utility & Financial Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    PH Utility Presets
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    Meralco • BATELEC • VECO
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    + DLPC, CEPALCO &amp; Coops
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Real-World Variables
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    4.5%/yr Tariff Inflation
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    + Yr 11/12 Hardware Renewals
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Client Deliverable
                  </span>
                  <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                    PDF Financial Proposal
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    10-Yr Milestone Ledger
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {user ? 'Synced with your load & roof data' : 'Sign in required'}
              </span>
              <div className="inline-flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold">
                <span>Launch ROI Simulator</span>
                <span className="w-6 h-6 rounded-full bg-white/15 dark:bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: AI COPILOT QUICK-START BANNER
         ===================================================================== */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 pb-20">
        <BillQuickStartBanner />
      </div>

      {/* =====================================================================
          SECTION 4: MINIMAL ARCHITECTURAL FOOTER
         ===================================================================== */}
      <footer className="py-12 border-t border-slate-900/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-[#050505] text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
                KITO SOLAR
              </span>
              <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-[11px]">
                Philippine Solar PV Sizing, 3D CAD &amp; Financial Studio
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-semibold">
            <button
              type="button"
              onClick={() => setActiveView('load-calculator')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Load Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveView(user ? 'solar-mapper' : 'login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Roof Mapper
            </button>
            <button
              type="button"
              onClick={() => setActiveView('tool')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              3D Solar Tool
            </button>
            <button
              type="button"
              onClick={() => setActiveView(user ? 'financial-roi' : 'login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              ROI Simulator
            </button>
            <button
              type="button"
              onClick={() => setActiveView(user ? 'projects' : 'login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Saved Projects
            </button>
            <button
              type="button"
              onClick={() => setActiveView('contact')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-amber-600 dark:text-amber-400 font-bold"
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
