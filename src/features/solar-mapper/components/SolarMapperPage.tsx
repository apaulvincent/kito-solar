// src/features/solar-mapper/components/SolarMapperPage.tsx
import React, { useEffect } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { LocationSearchHeader } from './LocationSearchHeader';
import { SatelliteRoofCanvas } from './SatelliteRoofCanvas';
import { Roof3DPreviewCanvas } from './Roof3DPreviewCanvas';
import { RoofSectionInspector } from './RoofSectionInspector';
import { SeasonalIrradianceChart } from './SeasonalIrradianceChart';
import { RoofVsLoadComparisonCard } from './RoofVsLoadComparisonCard';

export const SolarMapperPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const { viewMode, coordinates } = useSolarMapperStore();

  useEffect(() => {
    if (!isLoading && !user) {
      setActiveView('login');
    }
  }, [isLoading, user, setActiveView]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Solar Irradiance & Roof Mapper
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 font-mono text-[11px]">
            <MapPin className="w-3 h-3 text-amber-500" />
            <span>{coordinates.locationName.split(',')[0]}</span>
            <span className="text-slate-400">({coordinates.lat.toFixed(2)}°, {coordinates.lng.toFixed(2)}°)</span>
          </span>
        </div>
      </div>

      <LocationSearchHeader />
      <RoofVsLoadComparisonCard />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 min-w-0">
          {viewMode === '2d_satellite' ? (
            <SatelliteRoofCanvas />
          ) : (
            <Roof3DPreviewCanvas />
          )}
        </div>

        <div className="lg:col-span-5 min-w-0">
          <RoofSectionInspector />
        </div>
      </div>

      <SeasonalIrradianceChart />
    </main>
  );
};
