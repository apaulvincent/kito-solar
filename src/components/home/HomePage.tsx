// src/components/home/HomePage.tsx
import {
  Box,
  Layers,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Cable,
  Activity,
  Shield,
  User,
  Zap,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';

export function HomePage() {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const setActiveWorkbenchTab = useCalculatorStore((s) => s.setActiveWorkbenchTab);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const user = useAuthStore((s) => s.user);

  const handleLaunchTool = (tab: 'electrical' | 'pv_sizing' | 'mounting_bom' | 'warnings') => {
    setActiveWorkbenchTab(tab);
    setActiveView('tool');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Hero Section (Matching PakiPrint Screenshot 1) */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Soft background radial glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-200/30 via-sky-200/30 to-indigo-200/30 dark:from-amber-600/10 dark:via-sky-600/10 dark:to-indigo-600/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline, Subtitle, CTAs & Badges */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Comprehensive Guide for Building Solar Systems</span>
              </div>

              {/* Bold Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Run your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600">
                  solar engineering
                </span>{' '}
                from one powerful platform.
              </h1>

              {/* Clear Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A comprehensive guide for building solar systems. KitoSolar helps solar installers, engineers, and homeowners explore 3D equipment placement, review recommended DC/AC protection sequences, estimate string voltage limits, and plan bills of materials.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('tool')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                >
                  <Box className="w-4 h-4 text-amber-300" />
                  <span>Open Solar Tool</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView(user ? 'account' : 'register')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {user ? <User className="w-4 h-4 text-indigo-500" /> : <Sparkles className="w-4 h-4 text-indigo-500" />}
                  <span>{user ? 'My Account' : 'Create Free Account'}</span>
                </button>
              </div>

              {/* Trust markers */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Free Registration</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                  <span>Cloud Sizing Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Standard DC Isolation Guide</span>
                </div>
              </div>
            </div>

            {/* Right Column: Layered 3D Studio Mockup & Telemetry Badges */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xl transition-all group">
                {/* Header of mock window */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      KitoSolar CAD Workbench
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    LIVE SIMULATION
                  </span>
                </div>

                {/* Simulated 3D Graphic Canvas */}
                <div
                  onClick={() => setActiveView('tool')}
                  className="mt-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white cursor-pointer relative overflow-hidden group-hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>SOLAR ARRAY OVERVIEW</span>
                      <span className="text-amber-400 font-bold">
                        {calculationResult.summary.totalArrayPowerKw} kWp DC Peak
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">PV Modules</div>
                        <div className="text-lg font-black text-sky-400 font-mono mt-0.5">
                          {calculationResult.summary.totalPanels} Panels
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">CS6R-585MS Modules</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">DC Protection</div>
                        <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                          {calculationResult.dc.isolatorRatingA}A Rotary
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Ahead of DC Breaker</div>
                      </div>
                    </div>

                    {/* Animated Conduit Sequence Diagram */}
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs font-mono flex items-center justify-between text-slate-300">
                      <span className="text-sky-300 font-bold">PV String</span>
                      <span>→</span>
                      <span className="text-amber-300 font-bold">DC Isolator</span>
                      <span>→</span>
                      <span className="text-rose-300 font-bold">DC MCB</span>
                      <span>→</span>
                      <span className="text-emerald-300 font-bold">Inverter</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Click to open full 3D viewport</span>
                      <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Launch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Telemetry Badge 1 (Top Right) */}
                <div className="absolute -top-5 -right-4 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">System Scope</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">Comprehensive Guide</div>
                  </div>
                </div>

                {/* Floating Telemetry Badge 2 (Bottom Left) */}
                <div className="absolute -bottom-5 -left-4 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Solar Design</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">Educational Tool</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Your tools, all in one place" (Matching PakiPrint Screenshot 2) */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>KitoSolar Engineering Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Your tools, all in one place.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Choose a specialized engineering tool below to simulate 3D placement, calculate string voltages, and size protection equipment.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tool Card 1: 3D CAD Studio */}
          <div
            onClick={() => setActiveView('tool')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-indigo-400/80 dark:hover:border-indigo-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                3D Solar CAD Studio
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Interact with wall-mounted inverters, battery banks, rotary DC isolators, and utility poles with realistic orthogonal conduit routing.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Open 3D Studio</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 2: String Sizing Calculator */}
          <div
            onClick={() => handleLaunchTool('pv_sizing')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-sky-400/80 dark:hover:border-sky-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                PV String & Voltage Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Derive cold-weather Voc limits and high-temperature Vmp voltage bounds against inverter MPPT windows with NEC 690.7 coefficients.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>Calculate String Limits</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 3: Protection Schedules */}
          <div
            onClick={() => handleLaunchTool('electrical')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Protection & Conduit Schedules
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Size DC rotary isolators, DC circuit breakers, Type II SPDs, battery bank MCCBs, and 40% EMT conduit raceway fill limits.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>View Protection Specs</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 4: Mounting Hardware BOM */}
          <div
            onClick={() => handleLaunchTool('mounting_bom')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-emerald-400/80 dark:hover:border-emerald-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Mounting Hardware BOM
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Generate quantified bills of materials for aluminum roof rails, rail splices, L-feet brackets, mid/end clamps, and bonding lugs.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Generate Hardware BOM</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 5: 2D Single-Line Schematic */}
          <div
            onClick={() => setActiveView('tool')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-purple-400/80 dark:hover:border-purple-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Cable className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                2D Single-Line Schematic
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Review synchronized 2D electrical schematics matching utility distribution interconnection requirements and IEEE 1547 standards.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>View Schematic</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 6: Account & Cloud Sync */}
          <div
            onClick={() => setActiveView(user ? 'account' : 'register')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-indigo-400/80 dark:hover:border-indigo-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {user ? 'Signed In' : 'Cloud Access'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Account & Project Profile
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Manage your credentials, Google OAuth connection, active equipment catalogs, and cloud-synchronized calculations.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>{user ? 'View Account' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Simple Clean Footer */}
      <footer className="pt-12 pb-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                KITO SOLAR
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 font-semibold">
              <button onClick={() => setActiveView('home')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Home
              </button>
              <button onClick={() => setActiveView('tool')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Solar Tool
              </button>
              <button onClick={() => setActiveView('login')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Login
              </button>
              <button onClick={() => setActiveView('register')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Register
              </button>
              <button onClick={() => setActiveView('account')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Account
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 KitoSolar. A comprehensive guide for building solar systems.</p>
            <p className="font-mono">Planning &amp; Educational Reference Guide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
