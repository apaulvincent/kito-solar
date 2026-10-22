// src/features/solar-mapper/components/LocationSearchHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Globe,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { REGIONAL_PRESETS } from '../services/regionalPresets';
import { searchLocations, GeocodingResult } from '../services/geocodingService';
import { fetchNasaPowerIrradiance } from '../services/nasaPowerApi';

export const LocationSearchHeader: React.FC = () => {
  const {
    coordinates,
    setCoordinates,
    setIrradianceProfile,
    isLoadingIrradiance,
    setIsLoadingIrradiance,
    irradianceProfile,
  } = useSolarMapperStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchLocations(query);
        setResults(found);
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLocation = async (coords: { lat: number; lng: number }, name: string) => {
    setCoordinates(coords, name);
    setQuery('');
    setIsOpen(false);
    setIsLoadingIrradiance(true);

    try {
      const profile = await fetchNasaPowerIrradiance({
        lat: coords.lat,
        lng: coords.lng,
        locationName: name,
      });
      setIrradianceProfile(profile);
    } finally {
      setIsLoadingIrradiance(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const name = `My Current Location (${coords.lat.toFixed(3)}°N, ${coords.lng.toFixed(3)}°E)`;
        await handleSelectLocation(coords, name);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not retrieve GPS position. Please enter an address or choose a preset.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative z-30 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 shadow-xs p-3 sm:p-3.5 space-y-2.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Location Search Input & GPS */}
        <div className="flex-1 relative" ref={containerRef}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search municipality, city, or coordinates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0) setIsOpen(true);
                }}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-sans"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 shrink-0"
              title="Detect GPS location"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden sm:inline">Locate Me</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-1.5 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {results.map((res) => (
                  <button
                    key={res.placeId}
                    type="button"
                    onClick={() => handleSelectLocation(res.coordinates, res.shortName)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 flex items-start gap-2.5 transition-colors group"
                  >
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                        {res.shortName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {res.displayName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Active Location & Data Source Chip */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] sm:max-w-[220px]">
              {coordinates.locationName.split(',')[0]}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              ({coordinates.lat.toFixed(2)}°, {coordinates.lng.toFixed(2)}°)
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            {isLoadingIrradiance ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                <span>Pulling Climatology...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-amber-500" />
                <span>
                  {irradianceProfile?.source === 'nasa_power'
                    ? 'NASA POWER'
                    : 'Regional Model'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Regions Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Regions:
        </span>
        <div className="flex items-center gap-1.5">
          {REGIONAL_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(coordinates.lat - preset.coordinates.lat) < 0.05 &&
              Math.abs(coordinates.lng - preset.coordinates.lng) < 0.05;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  handleSelectLocation(
                    preset.coordinates,
                    `${preset.name}, ${preset.country}`
                  )
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
                }`}
              >
                {preset.name.split('/')[0].trim()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
