// src/components/home/HomePage.tsx
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { BillQuickStartBanner } from '@/components/ai/BillQuickStartBanner';
import {
  ArrowRight,
  Box,
  Cable,
  CheckCircle2,
  Cpu,
  Hammer,
  Layers,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
  Calculator,
} from 'lucide-react';

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
      {/* 1. Hero Section — Engineered for Solar Installers & Electricians */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-20 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Warm solar ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-amber-400/5 dark:from-amber-500/10 dark:via-orange-600/5 dark:to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline, Clear Subtitle, Big CTAs & Practical Badges */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Electrician/Installer Focus Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>Built for Solar Installers & Electricians</span>
              </div>

              {/* High-Contrast Bold Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Size your solar system,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 dark:from-amber-400 dark:via-amber-300 dark:to-orange-400">
                  breakers & wires
                </span>{' '}
                in seconds.
              </h1>

              {/* Clear, Plain-Language Subtitle for Tradespeople */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Pick your inverter, solar panels, and battery. Get instant continuous-duty breaker sizes, DC/AC cable gauges, conduit sizing, and a 3D equipment placement guide ready for the job site.
              </p>

              {/* High-Contrast Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('tool')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Box className="w-4 h-4 text-slate-950 fill-current opacity-80" />
                  <span>Open Solar Tool</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('load-calculator')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <span>Appliance Sizing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView(user ? 'projects' : 'register')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {user ? <User className="w-4 h-4 text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                  <span>{user ? 'My Saved Projects' : 'Create Free Account'}</span>
                </button>
              </div>

              {/* Practical Trade Trust Markers */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>Exact Wire & Breaker Specs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                  <span>3D Wall-Mount Layout</span>
                </div>
 
              </div>
            </div>

            {/* Right Column: Practical Quick Spec Job Sheet Preview */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div
                onClick={() => setActiveView('tool')}
                className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-amber-400/70 dark:hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                {/* Header of Job Spec Sheet */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Job Spec Sheet • 3D CAD
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/70 uppercase">
                    {calculationResult.systemType} TOPOLOGY
                  </span>
                </div>

                {/* Main Card Content */}
                <div className="mt-4 space-y-4">
                  {/* System Overview Bar */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold uppercase">
                        Selected Inverter
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {calculationResult.summary.inverterModel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold uppercase">
                        Array Peak
                      </div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                        {calculationResult.summary.totalArrayPowerKw} kWp
                      </div>
                    </div>
                  </div>

                  {/* 4 Essential Electrical Sizing Blocks */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        PV Modules
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                        {calculationResult.summary.totalPanels} Panels
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {calculationResult.stringSizing.recommendedStrings} Strings ({calculationResult.stringSizing.panelsPerString} per string)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        DC Disconnect
                      </div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                        {calculationResult.dc.isolatorRatingA}A Isolator
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        +{calculationResult.dc.breakerRatingA}A DC Breaker
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        AC Service
                      </div>
                      <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                        {calculationResult.ac.breakerRatingA}A Breaker
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {calculationResult.ac.wireSpec.split(' ')[0]} THHN Cable
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        Conduit &amp; ATS
                      </div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA}A ATS` : 'Standard Run'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Straight Conduit Run
                      </div>
                    </div>
                  </div>

                  {/* Physical Conduit Flow Order */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                    <span className="text-amber-400 font-bold">Array</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-300 font-semibold">DC Isolator</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-rose-300 font-semibold">DC Breaker</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-sky-300 font-semibold">Inverter</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-300 font-semibold">Main Panel</span>
                  </div>

                  {/* Click to Open Callout */}
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Click to open live 3D wall viewport</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Launch Solar Tool <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Solar Sizing Studio Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BillQuickStartBanner />
      </div>

      {/* 2. Three Simple Steps for Installers */}
      <section className="py-10 bg-white/60 dark:bg-slate-900/40 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-sm">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pick Equipment</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Select your inverter brand, solar panel model, and optional battery bank from the catalog.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-sm">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Get Code Sizing</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Immediate continuous-duty breaker ratings, cable gauges (AWG &amp; mm²), and conduit sizes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-sm">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Review 3D Wall Plan</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Inspect the physical wall mounting layout, straight conduit runs, and single-line schematics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Solar Design, Sizing & Layout Toolkit */}
      <section className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Solar Sizing &amp; Installation Toolkit</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything you need to size, wire, and lay out your solar install.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Calculate string voltages, size breakers and cable runs, generate hardware lists, and preview your equipment layout in 3D before starting work on site.
          </p>
        </div>

        {/* Tools Grid — 6 Dedicated Installer Utilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tool Card 1: 3D CAD Studio */}
          <div
            onClick={() => setActiveView('tool')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to Use
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                3D Solar CAD Studio
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                See physical wall mounting for inverters, battery banks, rotary isolators, and utility connections with clean straight conduit runs.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Open 3D Studio</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 2: String Sizing Calculator */}
          <div
            onClick={() => handleLaunchTool('pv_sizing')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to Use
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                PV String &amp; Voltage Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Calculate minimum and maximum panels per string so open-circuit voltage stays safely within your inverter&apos;s MPPT operating range.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Calculate String Limits</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 3: Protection Schedules */}
          <div
            onClick={() => handleLaunchTool('electrical')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to Use
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Protection &amp; Conduit Schedules
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Size DC rotary isolators, DC breakers, Type 2 SPDs, battery MCCBs, and check electrical conduit diameter ratings.
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
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Hammer className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to Use
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Mounting Hardware BOM
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Get exact piece counts for aluminum roof rails, rail splices, L-feet brackets, mid/end clamps, and MC4 connectors.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Generate Hardware BOM</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 5: 2D Single-Line Schematic */}
          <div
            onClick={() => setActiveView('tool')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Cable className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to Use
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                2D Single-Line Schematic
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Review clean single-line wiring diagrams showing direct utility connection, Main Panel feed, and ATS backup sequence.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>View Schematic</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* Tool Card 6: Account & Cloud Sync */}
          <div
            onClick={() => setActiveView(user ? 'projects' : 'register')}
            className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {user ? 'Signed In' : 'Free Sync'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Save &amp; Track Job Configs
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Save your client job configurations to your account to review specs and bills of materials on the job site.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>{user ? 'View Saved Jobs' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Simple Clean Trade Footer */}
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
              <button onClick={() => setActiveView('home')} className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer">
                Home
              </button>
              <button onClick={() => setActiveView('tool')} className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer">
                Solar Tool
              </button>
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 KitoSolar. Professional Solar PV Sizing &amp; Electrical Guide for Installers.</p>
            <p className="font-mono">Electrical Trade Reference &amp; 3D Placement</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
