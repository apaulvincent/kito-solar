import React from 'react';

export const SatelliteCompassRose: React.FC = () => (
  <div className="absolute top-4 left-4 z-30 flex items-center gap-2 select-none group">
    <div
      className="w-11 h-11 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105"
      title="Map Orientation: True North (0°)"
    >
      <svg viewBox="0 0 44 44" className="w-full h-full">
        <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="22" cy="22" r="16.5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.75" />

        <line x1="22" y1="2" x2="22" y2="5.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="22" x2="38.5" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
        <line x1="22" y1="42" x2="22" y2="38.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
        <line x1="2" y1="22" x2="5.5" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />

        <text x="22" y="10" textAnchor="middle" fill="#f59e0b" fontSize="5.5" fontWeight="bold" fontFamily="system-ui, sans-serif">N</text>
        <text x="35.5" y="23.5" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">E</text>
        <text x="22" y="37" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">S</text>
        <text x="8.5" y="23.5" textAnchor="middle" fill="#64748b" fontSize="4" fontWeight="600" fontFamily="system-ui, sans-serif">W</text>

        <polygon points="22,11 24.5,21.5 22,20" fill="#f59e0b" />
        <polygon points="22,11 19.5,21.5 22,20" fill="#d97706" />
        <polygon points="22,33 24.5,22.5 22,24" fill="#475569" />
        <polygon points="22,33 19.5,22.5 22,24" fill="#334155" />

        <circle cx="22" cy="22" r="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
      </svg>
    </div>

    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-md opacity-90 transition-opacity">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      <span className="font-bold text-amber-400">North 0°</span>
      <span className="text-slate-500">•</span>
      <span className="text-slate-400">True North</span>
    </div>
  </div>
);
