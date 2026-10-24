// src/features/solar-mapper/components/LocationSearchHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Globe,
  Loader2,
  CheckCircle2,
  X,
  ArrowUpRight,
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
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
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

  // Debounced geocoding search prioritizing the Philippines
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchLocations(query);
        setResults(found);
        setSelectedIndex(found.length > 0 ? 0 : -1);
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLocation = async (coords: { lat: number; lng: number }, name: string) => {
    setCoordinates(coords, name);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
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

  // Keyboard navigation for accessible selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const item = results[selectedIndex];
          handleSelectLocation(item.coordinates, item.shortName);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
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
    <div
      className={`relative transition-all duration-300 p-1.5 sm:p-2 rounded-2xl sm:rounded-[1.75rem] bg-slate-900/[0.04] dark:bg-white/[0.03] ring-1 ring-slate-900/[0.07] dark:ring-white/[0.08] ${
        isOpen ? 'z-[100]' : 'z-30'
      }`}
    >
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-[#0B0F17] p-3 sm:p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.05] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Location Search Input & GPS */}
          <div className="flex-1 relative" ref={containerRef}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 group">
                {/* Fixed Non-Colliding Left Badge with Country Flag & Icon */}
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 pointer-events-none select-none z-10 transition-colors group-focus-within:border-amber-500/50">
                  <span className="text-xs" role="img" aria-label="Philippines">
                    🇵🇭
                  </span>
                  <Search className="w-3.5 h-3.5 text-amber-500" />
                </div>

                {/* Search Input with Guaranteed Horizontal Clearance (pl-[5rem] prevents text overlap) */}
                <input
                  type="text"
                  placeholder="Search Philippine city, municipality, barangay, or address..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (results.length > 0) setIsOpen(true);
                  }}
                  className="w-full pl-[5rem] pr-12 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-sans shadow-2xs"
                />

                {/* Right Interactive Controls */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                  {query.length > 0 && !isSearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                        setIsOpen(false);
                        setSelectedIndex(-1);
                      }}
                      className="w-6 h-6 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  )}
                </div>
              </div>

              {/* Island "Locate Me" Button (Button-in-Button Architecture) */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="group inline-flex items-center gap-2 rounded-full pl-3.5 pr-1.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 disabled:opacity-60 shrink-0 cursor-pointer"
                title="Detect GPS location"
              >
                <span className="hidden sm:inline">Locate Me</span>
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  {isLocating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3 fill-current" />
                  )}
                </span>
              </button>
            </div>

            {/* High-End Autocomplete Dropdown with Maximum Z-Index (Doppelrand Bezel) */}
            {isOpen && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 p-1.5 rounded-2xl bg-slate-900/10 dark:bg-white/[0.08] ring-1 ring-slate-900/15 dark:ring-white/15 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="rounded-[calc(1rem-2px)] bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-white/10 overflow-hidden">
                  {/* Dropdown Header Bar */}
                  <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/[0.025] border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <span className="text-xs">🇵🇭</span>
                      <span>Philippine Address Results</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {results.length} available
                    </span>
                  </div>

                  {/* Dropdown Results List */}
                  <div className="p-1.5 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
                    {results.map((res, idx) => {
                      const isHighlighted = idx === selectedIndex;
                      return (
                        <button
                          key={res.placeId}
                          type="button"
                          onClick={() => handleSelectLocation(res.coordinates, res.shortName)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group cursor-pointer ${
                            isHighlighted
                              ? 'bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-amber-500/30'
                              : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          {/* Pin Icon in concentric squircle badge */}
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                            <MapPin className="w-4 h-4" />
                          </div>

                          {/* Address Label & Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                {res.shortName}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {res.isPhilippine && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    PH
                                  </span>
                                )}
                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/[0.05] group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed truncate mt-0.5 font-normal">
                              {res.displayName}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Active Location & Data Source Chip */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">
                {coordinates.locationName.split(',')[0]}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                ({coordinates.lat.toFixed(2)}°, {coordinates.lng.toFixed(2)}°)
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-2xs">
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

        {/* Quick Regions Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-900/[0.04] dark:border-white/[0.05]">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
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
                      preset.defaultAddress ?? `${preset.name}, ${preset.country}`
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs ring-1 ring-amber-500'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 ring-1 ring-transparent'
                  }`}
                >
                  {preset.name.split('/')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
