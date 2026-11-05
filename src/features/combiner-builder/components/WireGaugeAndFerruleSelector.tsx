// src/features/combiner-builder/components/WireGaugeAndFerruleSelector.tsx
import { FerruleColor, WireGaugeMm2 } from '../types';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';

const GAUGE_OPTIONS: { gauge: WireGaugeMm2; label: string; desc: string }[] = [
  { gauge: 1.5, label: '1.5 mm²', desc: 'ATS Sense & Control' },
  { gauge: 2.5, label: '2.5 mm²', desc: 'Aux Circuits' },
  { gauge: 4, label: '4.0 mm²', desc: 'PV DC String (Light)' },
  { gauge: 6, label: '6.0 mm²', desc: 'Standard PV & AC' },
  { gauge: 10, label: '10.0 mm²', desc: 'Main AC & Inverter' },
  { gauge: 16, label: '16.0 mm²', desc: 'Heavy AC Feeder' },
  { gauge: 25, label: '25.0 mm²', desc: 'Main Panel Feed' },
  { gauge: 35, label: '35.0 mm²', desc: '160A Battery MCCB' },
];

const FERRULE_OPTIONS: { color: FerruleColor; hex: string; label: string }[] = [
  { color: 'red', hex: '#ef4444', label: 'Red' },
  { color: 'blue', hex: '#3b82f6', label: 'Blue' },
  { color: 'black', hex: '#1e293b', label: 'Black' },
  { color: 'white', hex: '#f8fafc', label: 'White' },
  { color: 'yellow', hex: '#eab308', label: 'Yellow' },
  { color: 'green_yellow', hex: '#22c55e', label: 'Green/Yellow' },
];

export function WireGaugeAndFerruleSelector() {
  const selectedGaugeMm2 = useCombinerBoxStore((s) => s.selectedGaugeMm2);
  const setSelectedGauge = useCombinerBoxStore((s) => s.setSelectedGauge);
  const selectedFerruleColor = useCombinerBoxStore((s) => s.selectedFerruleColor);
  const setSelectedFerrule = useCombinerBoxStore((s) => s.setSelectedFerrule);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md select-none text-xs">
      {/* Gauge Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Gauge:</span>
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          {GAUGE_OPTIONS.map((opt) => (
            <button
              key={opt.gauge}
              type="button"
              onClick={() => setSelectedGauge(opt.gauge)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                selectedGaugeMm2 === opt.gauge
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-[1px] h-4 bg-slate-800 hidden sm:block" />

      {/* Ferrule Sleeve Color Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Ferrule:</span>
        <div className="flex items-center gap-1">
          {FERRULE_OPTIONS.map((f) => (
            <button
              key={f.color}
              type="button"
              onClick={() => setSelectedFerrule(f.color)}
              className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center ${
                selectedFerruleColor === f.color
                  ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30'
                  : 'border-slate-700 hover:scale-105'
              }`}
              style={{ backgroundColor: f.hex }}
              title={`Ferrule color: ${f.label}`}
            >
              {selectedFerruleColor === f.color && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
