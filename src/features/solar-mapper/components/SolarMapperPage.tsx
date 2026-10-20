// src/features/solar-mapper/components/SolarMapperPage.tsx
import React from 'react';
import {
  MapPin,
  ArrowLeft,
  Sun,
  Layers,
  Box,
  Compass,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { LocationSearchHeader } from './LocationSearchHeader';
import { SatelliteRoofCanvas } from './SatelliteRoofCanvas';
import { Roof3DPreviewCanvas } from './Roof3DPreviewCanvas';
import { RoofSectionInspector } from './RoofSectionInspector';
import { SeasonalIrradianceChart } from './SeasonalIrradianceChart';
import { RoofVsLoadComparisonCard } from './RoofVsLoadComparisonCard';

export const SolarMapperPage: React.FC = () => {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const { viewMode, setViewMode } = useSolarMapperStore();

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Location-Aware Irradiance & Polygon Roof Mapping
          </span>
        </div>
      </div>

      {/* Hero Headline & Value Proposition Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>NASA Climatology & Rooftop Geometry Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Solar Irradiance & Roof Mapper
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Eliminate flat-average solar guesswork. Pull 20-year NASA solar climatology for your exact coordinates and trace your physical roof polygon on high-resolution satellite imagery.
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('2d_satellite')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '2d_satellite'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Satellite Tracer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d_preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '3d_preview'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="w-4 h-4 text-amber-500" />
            <span>3D Roof & Sun</span>
          </button>
        </div>
      </div>

      {/* Step 1: Location & Climatology Search Bar */}
      <LocationSearchHeader />

      {/* Step 2: Roof Capacity vs Electrical Load Verification Alert */}
      <RoofVsLoadComparisonCard />

      {/* Step 3: Main Studio Deck (Left: Satellite/3D Viewport, Right: Section Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (lg: 7 cols): Canvas Viewport */}
        <div className="lg:col-span-7">
          {viewMode === '2d_satellite' ? (
            <SatelliteRoofCanvas />
          ) : (
            <Roof3DPreviewCanvas />
          )}
        </div>

        {/* Right (lg: 5 cols): Roof Section Geometry & Physics Inspector */}
        <div className="lg:col-span-5">
          <RoofSectionInspector />
        </div>
      </div>

      {/* Step 4: 12-Month Seasonal Irradiance & Thermal Derating Chart */}
      <SeasonalIrradianceChart />
    </main>
  );
};
